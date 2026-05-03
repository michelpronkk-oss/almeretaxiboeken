import { NextRequest } from "next/server"
import { getCurrentChauffeurDriver } from "@/lib/chauffeur/current-driver"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const authResult = await getCurrentChauffeurDriver()
  if (!authResult.ok) {
    return Response.json(
      { success: false, code: "NOT_AUTHORIZED", message: "Niet geautoriseerd." },
      { status: 401 },
    )
  }
  const currentDriver = authResult.driver

  const body = (await request.json()) as { bookingId?: string }
  const bookingId = String(body.bookingId || "").trim()

  if (!bookingId) {
    return Response.json({ success: false, message: "Booking ID ontbreekt." }, { status: 400 })
  }

  const supabase = getSupabaseServiceClient()
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, payment_method, payment_status, cash_collection_status, assigned_driver_id")
    .eq("id", bookingId)
    .maybeSingle()

  if (fetchError || !booking) {
    return Response.json({ success: false, message: "Rit niet gevonden." }, { status: 404 })
  }

  // Cash collection is restricted to the assigned driver only —
  // not even dispatchers can mark cash as collected on behalf of someone else.
  if (String(booking.assigned_driver_id ?? "") !== String(currentDriver.id)) {
    return Response.json(
      { success: false, message: "Deze rit is niet aan u toegewezen." },
      { status: 403 },
    )
  }

  if (booking.payment_method !== "cash") {
    return Response.json({ success: false, message: "Dit is geen contante rit." }, { status: 400 })
  }

  if (booking.cash_collection_status === "collected") {
    return Response.json({ success: true, message: "Al gemarkeerd als ontvangen." })
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      payment_status: "cash_collected",
      cash_collection_status: "collected",
      cash_collected_at: new Date().toISOString(),
      cash_collected_by: currentDriver.id,
    })
    .eq("id", bookingId)

  if (updateError) {
    return Response.json({ success: false, message: "Bijwerken mislukt." }, { status: 500 })
  }

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "cash_collected",
    actor_type: "driver",
    note: `Contant ontvangen door chauffeur ${currentDriver.id}.`,
  })

  return Response.json({ success: true })
}
