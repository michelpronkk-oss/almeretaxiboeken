import { NextRequest } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { sendEmail } from "@/lib/email/send"
import { driverAssignedRideEmail } from "@/lib/email/templates"
import { computeBufferAfterMinutes, computeRideWindow, windowsOverlap } from "@/lib/operations"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

interface AssignDriverBody {
  bookingId?: string
  driverId?: string
  overrideConflict?: boolean
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ success: false, message: "Niet geautoriseerd." }, { status: 401 })
  }

  const body = (await request.json()) as AssignDriverBody
  const bookingId = String(body.bookingId || "").trim()
  const driverId = String(body.driverId || "").trim()
  const overrideConflict = Boolean(body.overrideConflict)

  if (!bookingId || !driverId) {
    return Response.json({ success: false, message: "bookingId en driverId zijn verplicht." }, { status: 400 })
  }

  const supabase = getSupabaseServiceClient()

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, reference, pickup_date, pickup_time, pickup_address, destination_address, duration_minutes, vehicle_type")
    .eq("id", bookingId)
    .maybeSingle()

  if (bookingError || !booking) {
    return Response.json({ success: false, message: "Rit niet gevonden." }, { status: 404 })
  }

  const newBuffer = computeBufferAfterMinutes({
    vehicleType: booking.vehicle_type,
    pickupAddress: booking.pickup_address,
    destinationAddress: booking.destination_address,
    durationMinutes: booking.duration_minutes,
  })

  const newWindow = computeRideWindow({
    pickupDate: booking.pickup_date,
    pickupTime: booking.pickup_time,
    durationMinutes: booking.duration_minutes,
    bufferAfterMinutes: newBuffer,
  })

  if (!newWindow) {
    return Response.json({ success: false, message: "Pickup datum/tijd ongeldig." }, { status: 400 })
  }

  const activeStatuses = ["assigned", "accepted", "on_the_way", "arrived", "in_progress"]

  const { data: existingRides } = await supabase
    .from("bookings")
    .select("id, reference, pickup_date, pickup_time, pickup_address, destination_address, duration_minutes, vehicle_type")
    .eq("assigned_driver_id", driverId)
    .eq("pickup_date", booking.pickup_date)
    .in("booking_status", activeStatuses)

  let conflict: null | {
    reference: string
    pickupTime: string
    route: string
    expectedAvailableTime: string
    summary: string
  } = null

  for (const existing of existingRides || []) {
    if (existing.id === booking.id) continue
    const existingBuffer = computeBufferAfterMinutes({
      vehicleType: existing.vehicle_type,
      pickupAddress: existing.pickup_address,
      destinationAddress: existing.destination_address,
      durationMinutes: existing.duration_minutes,
    })
    const existingWindow = computeRideWindow({
      pickupDate: existing.pickup_date,
      pickupTime: existing.pickup_time,
      durationMinutes: existing.duration_minutes,
      bufferAfterMinutes: existingBuffer,
    })

    if (!existingWindow) continue

    if (windowsOverlap(existingWindow, newWindow)) {
      const expectedAvailableTime = existingWindow.end.toISOString().slice(11, 16)
      conflict = {
        reference: existing.reference || "-",
        pickupTime: existing.pickup_time || "-",
        route: `${existing.pickup_address || "-"} -> ${existing.destination_address || "-"}`,
        expectedAvailableTime,
        summary: `Conflicteert met ${existing.reference || "onbekend"} om ${existing.pickup_time || "-"}. Beschikbaar rond ${expectedAvailableTime}.`,
      }
      break
    }
  }

  if (conflict && !overrideConflict) {
    return Response.json(
      {
        success: false,
        code: "DRIVER_CONFLICT",
        message: "Deze chauffeur heeft rond dit tijdstip al een rit of onvoldoende buffertijd.",
        conflict,
      },
      { status: 409 }
    )
  }

  const { error: assignError } = await supabase
    .from("bookings")
    .update({
      assigned_driver_id: driverId,
      booking_status: "assigned",
      buffer_after_minutes: newBuffer,
    })
    .eq("id", bookingId)

  if (assignError) {
    return Response.json({ success: false, message: "Toewijzen mislukt." }, { status: 500 })
  }

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "driver_assigned",
    actor_type: "admin",
    note: "Driver assigned via admin API",
  })

  if (conflict && overrideConflict) {
    await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "driver_assignment_override",
      actor_type: "admin",
      note: conflict.summary,
    })
  }

  const { data: driver } = await supabase.from("drivers").select("email").eq("id", driverId).maybeSingle()
  if (driver?.email) {
    const mail = driverAssignedRideEmail({
      reference: booking.reference || "-",
      origin: booking.pickup_address || "-",
      destination: booking.destination_address || "-",
      date: booking.pickup_date || "-",
      time: booking.pickup_time || "-",
      vehicleType: booking.vehicle_type || "taxi",
    })
    const sendResult = await sendEmail({
      to: driver.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      from: process.env.DRIVER_INVITE_FROM_EMAIL || process.env.RESEND_FROM_EMAIL,
    })

    await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: sendResult.sent ? "driver_notified" : "driver_notification_failed",
      actor_type: "system",
      note: sendResult.sent ? "Driver assignment email sent" : sendResult.error || sendResult.reason || "Driver assignment email failed",
    })
  }

  return Response.json({ success: true, warning: conflict ? "Toegewezen met override." : undefined })
}
