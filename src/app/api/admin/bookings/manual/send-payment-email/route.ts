import { NextRequest } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { sendEmail } from "@/lib/email/send"
import { manualPaymentLinkEmail } from "@/lib/email/templates"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

interface SendPaymentEmailBody {
  bookingId?: string
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ success: false, message: "Niet geautoriseerd." }, { status: 401 })
  }

  const body = (await request.json()) as SendPaymentEmailBody
  const bookingId = String(body.bookingId || "").trim()

  if (!bookingId) {
    return Response.json({ success: false, message: "bookingId ontbreekt." }, { status: 400 })
  }

  const supabase = getSupabaseServiceClient()
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, reference, customer_email, pickup_date, pickup_time, pickup_address, destination_address, passengers, vehicle_type, estimated_fare, mollie_checkout_url")
    .eq("id", bookingId)
    .maybeSingle()

  if (error || !booking) {
    return Response.json({ success: false, message: "Boeking niet gevonden." }, { status: 404 })
  }

  if (!booking.customer_email || !booking.mollie_checkout_url) {
    return Response.json({ success: false, message: "Klant e-mail of betaallink ontbreekt." }, { status: 400 })
  }

  const emailTemplate = manualPaymentLinkEmail({
    reference: booking.reference,
    date: booking.pickup_date || "-",
    time: booking.pickup_time || "-",
    origin: booking.pickup_address || "-",
    destination: booking.destination_address || "-",
    passengers: booking.passengers || 1,
    vehicleType: booking.vehicle_type || "taxi",
    price: Number(booking.estimated_fare || 0),
    paymentUrl: booking.mollie_checkout_url,
  })

  const sendResult = await sendEmail({
    to: booking.customer_email,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
  })

  if (!sendResult.sent) {
    await supabase.from("booking_events").insert({
      booking_id: booking.id,
      event_type: "payment_link_email_failed",
      actor_type: "system",
      note: sendResult.error || sendResult.reason || "Unknown send failure",
    })

    return Response.json({ success: false, message: "E-mail kon niet worden verzonden." }, { status: 502 })
  }

  await supabase
    .from("bookings")
    .update({ payment_link_sent_at: new Date().toISOString() })
    .eq("id", booking.id)

  await supabase.from("booking_events").insert({
    booking_id: booking.id,
    event_type: "payment_link_email_sent",
    actor_type: "system",
    note: `Mail resent to ${booking.customer_email}`,
  })

  return Response.json({ success: true })
}
