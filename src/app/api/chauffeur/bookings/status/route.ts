import { NextRequest } from "next/server"
import { getAuthenticatedDriverId } from "@/lib/driver-auth"
import { canTransition } from "@/lib/operations"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

interface StatusBody {
  bookingId?: string
  nextStatus?: string
}

export async function POST(request: NextRequest) {
  const driverId = await getAuthenticatedDriverId()
  if (!driverId) return Response.json({ success: false, message: "Niet geautoriseerd." }, { status: 401 })

  const body = (await request.json()) as StatusBody
  const bookingId = String(body.bookingId || "").trim()
  const nextStatus = String(body.nextStatus || "").trim()

  if (!bookingId || !nextStatus) {
    return Response.json({ success: false, message: "bookingId en nextStatus zijn verplicht." }, { status: 400 })
  }

  const supabase = getSupabaseServiceClient()
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, booking_status")
    .eq("id", bookingId)
    .eq("assigned_driver_id", driverId)
    .maybeSingle()

  if (!booking) {
    return Response.json({ success: false, message: "Rit niet gevonden." }, { status: 404 })
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
    actor_id: driverId,
    note: `Status gezet naar ${nextStatus}`,
  })

  return Response.json({ success: true })
}
