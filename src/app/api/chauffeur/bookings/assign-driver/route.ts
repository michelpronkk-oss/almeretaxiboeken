import { NextRequest } from "next/server"
import { getChauffeurSession } from "@/lib/chauffeur-auth"
import { sendEmail } from "@/lib/email/send"
import { driverAssignedRideEmail } from "@/lib/email/templates"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const driverId = await getChauffeurSession()
  if (!driverId) {
    return Response.json({ success: false, message: "Niet ingelogd." }, { status: 401 })
  }

  const supabase = getSupabaseServiceClient()

  const { data: currentDriver } = await supabase
    .from("drivers")
    .select("id, can_dispatch, active, approval_status, deleted_at, full_name, email")
    .eq("id", driverId)
    .maybeSingle()

  if (!currentDriver || !currentDriver.active || currentDriver.approval_status !== "approved" || currentDriver.deleted_at) {
    return Response.json({ success: false, message: "Geen toegang." }, { status: 403 })
  }

  if (!currentDriver.can_dispatch) {
    return Response.json({ success: false, message: "Geen planningsrechten." }, { status: 403 })
  }

  const body = await request.json()
  const bookingId = String(body.bookingId || "").trim()
  const targetDriverId = String(body.targetDriverId || "").trim()

  if (!bookingId || !targetDriverId) {
    return Response.json({ success: false, message: "bookingId en targetDriverId zijn verplicht." }, { status: 400 })
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, reference, pickup_date, pickup_time, pickup_address, destination_address, vehicle_type, booking_status, deleted_at, archived_at")
    .eq("id", bookingId)
    .maybeSingle()

  if (!booking) {
    return Response.json({ success: false, message: "Rit niet gevonden." }, { status: 404 })
  }

  if (booking.deleted_at || booking.archived_at) {
    return Response.json({ success: false, message: "Rit is verwijderd of gearchiveerd." }, { status: 400 })
  }

  const completedStatuses = ["completed", "cancelled", "canceled", "deleted"]
  if (completedStatuses.includes(booking.booking_status ?? "")) {
    return Response.json({ success: false, message: "Rit kan niet meer worden toegewezen." }, { status: 400 })
  }

  const { data: targetDriver } = await supabase
    .from("drivers")
    .select("id, full_name, email, active, approval_status, deleted_at, default_assign")
    .eq("id", targetDriverId)
    .maybeSingle()

  if (!targetDriver) {
    return Response.json({ success: false, message: "Chauffeur niet gevonden." }, { status: 404 })
  }

  if (!targetDriver.active || targetDriver.approval_status !== "approved" || targetDriver.deleted_at) {
    return Response.json({ success: false, message: "Chauffeur is niet beschikbaar." }, { status: 400 })
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      assigned_driver_id: targetDriverId,
      booking_status: "assigned",
      default_assigned: targetDriver.default_assign ?? false,
      assignment_source: "owner_dispatcher",
    })
    .eq("id", bookingId)

  if (error) {
    return Response.json({ success: false, message: "Toewijzen mislukt." }, { status: 500 })
  }

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "driver_reassigned_by_dispatcher",
    actor_type: "driver",
    actor_id: currentDriver.id,
    note: `Rit toegewezen aan ${targetDriver.full_name || targetDriver.email || targetDriverId} door planner ${currentDriver.full_name || currentDriver.email || driverId}.`,
  })

  if (targetDriver.email) {
    try {
      const mail = driverAssignedRideEmail({
        reference: booking.reference || "-",
        origin: booking.pickup_address || "-",
        destination: booking.destination_address || "-",
        date: booking.pickup_date || "-",
        time: booking.pickup_time || "-",
        vehicleType: booking.vehicle_type || "taxi",
      })
      const sendResult = await sendEmail({
        to: targetDriver.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        from: process.env.DRIVER_INVITE_FROM_EMAIL || process.env.RESEND_FROM_EMAIL,
      })
      await supabase.from("booking_events").insert({
        booking_id: bookingId,
        event_type: sendResult.sent ? "driver_notified" : "driver_notification_failed",
        actor_type: "system",
        note: sendResult.sent
          ? `Toewijzingsmail verstuurd naar ${targetDriver.email}`
          : `Toewijzingsmail mislukt: ${sendResult.error || sendResult.reason || "onbekend"}`,
      })
    } catch {
      // email is best-effort
    }
  }

  return Response.json({ success: true })
}
