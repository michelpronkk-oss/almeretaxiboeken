import { Resend } from "resend"
import { companyEmailHtml, customerEmailHtml } from "@/lib/email-templates"

interface MolliePayment {
  id: string
  status: string
  metadata?: {
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

export async function POST(request: Request) {
  const formData = await request.formData()
  const paymentId = String(formData.get("id") || "").trim()

  if (!paymentId) {
    return new Response("Missing payment id", { status: 400 })
  }

  const mollieApiKey = process.env.MOLLIE_API_KEY
  if (!mollieApiKey) {
    return new Response("Mollie not configured", { status: 503 })
  }

  const paymentRes = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${mollieApiKey}` },
    cache: "no-store",
  })

  if (!paymentRes.ok) {
    return new Response("Payment lookup failed", { status: 502 })
  }

  const payment = (await paymentRes.json()) as MolliePayment
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
