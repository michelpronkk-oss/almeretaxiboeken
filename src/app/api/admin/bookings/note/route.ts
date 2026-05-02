import { NextRequest } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

interface NoteBody {
  bookingId?: string
  note?: string
  action?: "admin_note" | "mark_completed" | "cancel" | "reschedule"
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ success: false, message: "Niet geautoriseerd." }, { status: 401 })
  }

  const body = (await request.json()) as NoteBody
  const bookingId = String(body.bookingId || "").trim()
  const note = String(body.note || "").trim()
  const action = body.action || "admin_note"

  if (!bookingId) {
    return Response.json({ success: false, message: "bookingId is verplicht." }, { status: 400 })
  }

  const supabase = getSupabaseServiceClient()

  let nextStatus: string | null = null
  if (action === "mark_completed") nextStatus = "completed"
  if (action === "cancel") nextStatus = "cancelled"
  if (action === "reschedule") nextStatus = "rescheduled"

  if (nextStatus) {
    await supabase.from("bookings").update({ booking_status: nextStatus }).eq("id", bookingId)
  }

  if (note) {
    await supabase.from("bookings").update({ admin_note: note }).eq("id", bookingId)
  }

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: action === "admin_note" ? "admin_note" : `admin_${action}`,
    actor_type: "admin",
    note: note || `Admin action: ${action}`,
  })

  return Response.json({ success: true })
}
