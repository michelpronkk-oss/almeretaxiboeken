import { NextRequest } from "next/server"
import { getCurrentChauffeurDriver } from "@/lib/chauffeur/current-driver"
import { canDispatch } from "@/lib/chauffeur/permissions"
import { CONFIRMED_PAYMENT_STATUSES } from "@/lib/bookings"
import { sendEmail } from "@/lib/email/send"
import { driverAssignedRideEmail } from "@/lib/email/templates"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const authResult = await getCurrentChauffeurDriver()

  console.log("[chauffeur-assign] currentDriverId exists:", !!authResult.ok)
  if (authResult.ok) {
    console.log("[chauffeur-assign] currentDriverEmail:", authResult.driver.email ?? "(none)")
    console.log("[chauffeur-assign] isOwner:", authResult.driver.is_owner)
    console.log("[chauffeur-assign] canDispatch:", authResult.driver.can_dispatch)
    console.log("[chauffeur-assign] active:", authResult.driver.active)
    console.log("[chauffeur-assign] approvalStatus:", authResult.driver.approval_status)
  } else {
    console.log("[chauffeur-assign] auth failed:", authResult.code)
  }

  if (!authResult.ok) {
    return Response.json(
      { success: false, code: "NOT_AUTHORIZED", message: "Niet ingelogd als chauffeur." },
      { status: 401 },
    )
  }
  const currentDriver = authResult.driver

  if (!canDispatch(currentDriver)) {
    console.error("[chauffeur-authz]", {
      route: "assign-driver",
      currentDriverId: currentDriver.id,
      currentDriverEmail: currentDriver.email,
      isOwner: currentDriver.is_owner,
      canDispatch: currentDriver.can_dispatch,
      failureCode: "NO_DISPATCH_RIGHTS",
    })
    return Response.json(
      {
        success: false,
        code: "NOT_AUTHORIZED",
        message: "U heeft geen rechten om ritten toe te wijzen.",
      },
      { status: 403 },
    )
  }

  const body = await request.json()
  const bookingId = String(body.bookingId || "").trim()
  const targetDriverId = String(body.targetDriverId || "").trim()

  if (!bookingId || !targetDriverId) {
    return Response.json(
      { success: false, message: "bookingId en targetDriverId zijn verplicht." },
      { status: 400 },
    )
  }

  const supabase = getSupabaseServiceClient()

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, reference, pickup_date, pickup_time, pickup_address, destination_address, vehicle_type, booking_status, payment_status, deleted_at, archived_at",
    )
    .eq("id", bookingId)
    .maybeSingle()

  if (!booking) {
    return Response.json({ success: false, message: "Rit niet gevonden." }, { status: 404 })
  }

  if (booking.deleted_at || booking.archived_at) {
    return Response.json(
      { success: false, message: "Rit is verwijderd of gearchiveerd." },
      { status: 400 },
    )
  }

  if (!CONFIRMED_PAYMENT_STATUSES.includes(booking.payment_status ?? "")) {
    return Response.json(
      { success: false, message: "Deze rit is nog niet bevestigd of betaald." },
      { status: 400 },
    )
  }

  const completedStatuses = ["completed", "cancelled", "canceled", "deleted"]
  if (completedStatuses.includes(booking.booking_status ?? "")) {
    return Response.json(
      { success: false, message: "Rit kan niet meer worden toegewezen." },
      { status: 400 },
    )
  }

  const { data: targetDriver } = await supabase
    .from("drivers")
    .select("id, full_name, first_name, last_name, email, active, approval_status, deleted_at, default_assign")
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

  const targetName =
    [targetDriver.first_name, targetDriver.last_name].filter(Boolean).join(" ").trim() ||
    targetDriver.full_name ||
    targetDriver.email ||
    targetDriverId

  const dispatcherName =
    [currentDriver.first_name, currentDriver.last_name].filter(Boolean).join(" ").trim() ||
    currentDriver.full_name ||
    currentDriver.email ||
    currentDriver.id

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "driver_reassigned_by_dispatcher",
    actor_type: "driver",
    actor_id: currentDriver.id,
    note: `Rit toegewezen aan ${targetName} door planner ${dispatcherName}.`,
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

  return Response.json({ success: true, assignedTo: targetName })
}
