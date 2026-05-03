import { NextRequest } from "next/server"
import { getCurrentDriver, driverHasDispatchRights } from "@/lib/chauffeur/current-driver"
import { canTransition } from "@/lib/operations"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

interface StatusBody {
  bookingId?: string
  nextStatus?: string
}

export async function POST(request: NextRequest) {
  const currentDriver = await getCurrentDriver()
  if (!currentDriver) {
    return Response.json({ success: false, code: "NOT_AUTHORIZED", message: "Niet geautoriseerd." }, { status: 401 })
  }

  const body = (await request.json()) as StatusBody
  const bookingId = String(body.bookingId || "").trim()
  const nextStatus = String(body.nextStatus || "").trim()

  if (!bookingId || !nextStatus) {
    return Response.json({ success: false, message: "bookingId en nextStatus zijn verplicht." }, { status: 400 })
  }

  const supabase = getSupabaseServiceClient()
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, booking_status, assigned_driver_id, deleted_at")
    .eq("id", bookingId)
    .maybeSingle()

  if (!booking || booking.deleted_at) {
    return Response.json({ success: false, message: "Rit niet gevonden." }, { status: 404 })
  }

  const isOwnRide = String(booking.assigned_driver_id ?? "") === String(currentDriver.id)
  const hasDispatch = driverHasDispatchRights(currentDriver)

  if (!isOwnRide && !hasDispatch) {
    console.error("[chauffeur-authz-failed]", {
      route: "status",
      bookingId,
      currentDriverId: currentDriver.id,
      currentDriverEmail: currentDriver.email,
      isOwner: currentDriver.is_owner,
      canDispatch: currentDriver.can_dispatch,
      active: currentDriver.active,
      approvalStatus: currentDriver.approval_status,
      assignedDriverId: booking.assigned_driver_id,
      assignedEqualsCurrent: isOwnRide,
    })
    return Response.json({ success: false, code: "NOT_AUTHORIZED", message: "Niet geautoriseerd." }, { status: 403 })
  }

  if (!canTransition(booking.booking_status, nextStatus)) {
    return Response.json({ success: false, code: "INVALID_TRANSITION", message: "Ongeldige statusovergang." }, { status: 400 })
  }

  const patch: Record<string, unknown> = { booking_status: nextStatus }
  if (nextStatus === "arrived") patch.arrived_at = new Date().toISOString()
  if (nextStatus === "in_progress") patch.started_at = new Date().toISOString()
  if (nextStatus === "completed") patch.completed_at = new Date().toISOString()

  const { error } = await supabase
    .from("bookings")
    .update(patch)
    .eq("id", bookingId)

  if (error) {
    return Response.json({ success: false, message: "Status bijwerken mislukt." }, { status: 500 })
  }

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: nextStatus === "completed" ? "ride_completed" : `driver_${nextStatus}`,
    actor_type: "driver",
    actor_id: currentDriver.id,
    note: `Status gezet naar ${nextStatus}`,
  })

  return Response.json({ success: true })
}
