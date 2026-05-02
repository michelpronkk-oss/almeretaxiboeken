import { Resend } from "resend"
import { companyEmailHtml, customerEmailHtml } from "@/lib/email-templates"
import { mapMollieToBookingPaymentStatus } from "@/lib/mollie-status"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

interface MolliePayment {
  id: string
  status: string
  metadata?: {
    bookingId?: string
    bookingRef?: string
    origin?: string
    destination?: string
    date?: string
    time?: string
    vehicleType?: "taxi" | "taxibus"
    name?: string
    phone?: string
    email?: string
    price?: number
  }
}

function eventTypeFromStatus(status: string): string {
  if (status === "paid") return "mollie_paid"
  if (status === "failed") return "mollie_failed"
  if (status === "canceled") return "mollie_canceled"
  if (status === "expired") return "mollie_expired"
  return "mollie_status_updated"
}

function bookingStatusFromPayment(status: string): string {
  if (status === "paid") return "unassigned"
  if (status === "canceled") return "cancelled"
  return "pending_payment"
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const paymentId = String(formData.get("id") || "").trim()

  if (!paymentId) {
    return new Response("ok", { status: 200 })
  }

  const mollieApiKey = process.env.MOLLIE_API_KEY
  if (!mollieApiKey) {
    return new Response("ok", { status: 200 })
  }

  const paymentRes = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${mollieApiKey}` },
    cache: "no-store",
  })

  if (!paymentRes.ok) {
    return new Response("ok", { status: 200 })
  }

  const payment = (await paymentRes.json()) as MolliePayment
  const supabase = getSupabaseServiceClient()

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, reference, payment_status")
    .eq("mollie_payment_id", paymentId)
    .maybeSingle()

  if (!booking) {
    return new Response("ok", { status: 200 })
  }

  const nextPaymentStatus = mapMollieToBookingPaymentStatus(payment.status)
  const nextBookingStatus = bookingStatusFromPayment(payment.status)

  await supabase
    .from("bookings")
    .update({
      payment_status: nextPaymentStatus,
      booking_status: nextBookingStatus,
    })
    .eq("id", booking.id)

  await supabase.from("booking_events").insert({
    booking_id: booking.id,
    event_type: eventTypeFromStatus(payment.status),
    actor_type: "system",
    note: `Mollie status: ${payment.status}`,
  })

  if (payment.status !== "paid") {
    return new Response("ok", { status: 200 })
  }

  const d = payment.metadata
  if (!d?.bookingRef || !d?.email || !d?.name || !d?.origin || !d?.destination || !d?.date || !d?.time) {
    return new Response("ok", { status: 200 })
  }

  const voertuig = d.vehicleType === "taxibus" ? "Taxibus (5-8 personen)" : "Taxi (1-4 personen)"

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@almeretaxiboeken.nl"
  const companyEmail = process.env.COMPANY_EMAIL ?? "info@almeretaxiboeken.nl"
  if (!resendKey) {
    return new Response("ok", { status: 200 })
  }

  const resend = new Resend(resendKey)
  const emailData = {
    bookingRef: d.bookingRef,
    name: d.name,
    phone: d.phone ?? "",
    email: d.email,
    origin: d.origin,
    destination: d.destination,
    date: d.date,
    time: d.time,
    voertuig,
    price: Number(d.price ?? 0),
  }

  await Promise.allSettled([
    resend.emails.send({
      from: `AlmereTaxiBoeken <${fromEmail}>`,
      to: d.email,
      subject: `Boeking bevestigd ${d.bookingRef} - AlmereTaxiBoeken`,
      html: customerEmailHtml(emailData),
    }),
    resend.emails.send({
      from: `Boekingssysteem <${fromEmail}>`,
      to: companyEmail,
      subject: `Nieuwe betaalde boeking ${d.bookingRef} - ${d.name}`,
      html: companyEmailHtml(emailData),
    }),
  ])

  return new Response("ok", { status: 200 })
}
