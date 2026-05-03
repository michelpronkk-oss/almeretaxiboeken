import { NextRequest } from "next/server"
import { getCurrentChauffeurDriver } from "@/lib/chauffeur/current-driver"
import { canManageBooking } from "@/lib/chauffeur/permissions"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

interface ReportBody {
  bookingId?: string
  reportType?: "issue" | "no_show"
  reason?: string
  note?: string
}

export async function POST(request: NextRequest) {
  const authResult = await getCurrentChauffeurDriver()
  if (!authResult.ok) {
    return Response.json(
      { success: false, code: "NOT_AUTHORIZED", message: "Niet geautoriseerd." },
      { status: 401 },
    )
  }
  const currentDriver = authResult.driver

  const body = (await request.json()) as ReportBody
  const bookingId = String(body.bookingId || "").trim()
  const reportType = body.reportType
  const reason = String(body.reason || "").trim()
  const note = String(body.note || "").trim()

  if (!bookingId || !reportType) {
    return Response.json(
      { success: false, message: "bookingId en reportType zijn verplicht." },
      { status: 400 },
    )
  }

  const supabase = getSupabaseServiceClient()
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, reference, booking_status, arrived_at, assigned_driver_id, deleted_at")
    .eq("id", bookingId)
    .maybeSingle()

  if (!booking || booking.deleted_at) {
    return Response.json({ success: false, message: "Rit niet gevonden." }, { status: 404 })
  }

  if (!canManageBooking(currentDriver, booking)) {
    console.error("[chauffeur-authz]", {
      route: "report",
      reference: booking.reference,
      currentDriverId: currentDriver.id,
      currentDriverEmail: currentDriver.email,
      assignedDriverId: booking.assigned_driver_id,
      assignedEqualsCurrent: String(booking.assigned_driver_id ?? "") === String(currentDriver.id),
      isOwner: currentDriver.is_owner,
      canDispatch: currentDriver.can_dispatch,
      failureCode: "BOOKING_NOT_ASSIGNED",
    })
    return Response.json(
      {
        success: false,
        code: "NOT_AUTHORIZED",
        message: "Deze rit is niet gekoppeld aan uw chauffeuraccount.",
      },
      { status: 403 },
    )
  }

  if (reportType === "issue") {
    if (!reason || !note) {
      return Response.json(
        { success: false, message: "Kies reden en voeg notitie toe." },
        { status: 400 },
      )
    }

    const { error } = await supabase
      .from("bookings")
      .update({ booking_status: "issue_reported", issue_reason: reason, issue_note: note })
      .eq("id", bookingId)

    if (error) {
      return Response.json({ success: false, message: "Probleem melden mislukt." }, { status: 500 })
    }

    await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "driver_issue_reported",
      actor_type: "driver",
      actor_id: currentDriver.id,
      note: `Reason: ${reason}. Note: ${note}`,
    })

    return Response.json({ success: true })
  }

  if (!note) {
    return Response.json(
      { success: false, message: "No-show notitie is verplicht." },
      { status: 400 },
    )
  }

  if (booking.booking_status !== "arrived") {
    return Response.json(
      { success: false, message: "No-show melden kan alleen na aankomst." },
      { status: 400 },
    )
  }

  if (!booking.arrived_at) {
    return Response.json({ success: false, message: "Aankomsttijd ontbreekt." }, { status: 400 })
  }

  const arrivedAt = new Date(booking.arrived_at)
  const minNoShowAt = new Date(arrivedAt.getTime() + 10 * 60_000)
  if (Date.now() < minNoShowAt.getTime()) {
    return Response.json(
      {
        success: false,
        code: "TOO_EARLY_FOR_NO_SHOW",
        message: "No-show melden kan na 10 minuten wachttijd.",
      },
      { status: 400 },
    )
  }

  const { error } = await supabase
    .from("bookings")
    .update({ booking_status: "no_show_reported", no_show_note: note })
    .eq("id", bookingId)

  if (error) {
    return Response.json({ success: false, message: "No-show melden mislukt." }, { status: 500 })
  }

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "driver_no_show_reported",
    actor_type: "driver",
    actor_id: currentDriver.id,
    note,
  })

  return Response.json({ success: true })
}
