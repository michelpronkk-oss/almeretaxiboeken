import { NextRequest } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ success: false, message: "Niet geautoriseerd." }, { status: 401 })
  }

  const body = await request.json()
  const bookingId = String(body.bookingId || "").trim()
  const reason = String(body.reason || "").trim()

  if (!bookingId) {
    return Response.json({ success: false, message: "Rit ID ontbreekt." }, { status: 400 })
  }

  const supabase = getSupabaseServiceClient()

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, deleted_at")
    .eq("id", bookingId)
    .maybeSingle()

  if (!booking) {
    return Response.json({ success: false, message: "Rit niet gevonden." }, { status: 404 })
  }

  if (booking.deleted_at) {
    return Response.json({ success: false, message: "Rit is al verwijderd." }, { status: 400 })
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      deleted_at: new Date().toISOString(),
      booking_status: "deleted",
    })
    .eq("id", bookingId)

  if (error) {
    return Response.json({ success: false, message: "Verwijderen mislukt." }, { status: 500 })
  }

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "booking_deleted",
    actor_type: "admin",
    note: reason
      ? `Verwijderd door admin. Reden: ${reason}`
      : "Verwijderd door admin.",
  })

  return Response.json({ success: true })
}
