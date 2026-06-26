import { internalPaidBookingEmail, customerBookingConfirmedEmail } from "@/lib/email/templates"
import { mapMollieToBookingPaymentStatus } from "@/lib/mollie-status"
import { sendEmail } from "@/lib/email/send"
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
    passengers?: number
  }
}

function eventTypeFromStatus(status: string): string {
  if (status === "paid") return "mollie_paid"
  if (status === "failed") return "mollie_failed"
  if (status === "canceled") return "mollie_canceled"
  if (status === "expired") return "mollie_expired"
  return "mollie_status_updated"
}

function bookingStatusFromPayment(status: string, hasAssignedDriver: boolean): string {
  if (status === "paid") return hasAssignedDriver ? "assigned" : "unassigned"
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
    .select("id, reference, payment_status, assigned_driver_id")
    .eq("mollie_payment_id", paymentId)
    .maybeSingle()

  if (!booking) {
    return new Response("ok", { status: 200 })
  }

  const nextPaymentStatus = mapMollieToBookingPaymentStatus(payment.status)
  const nextBookingStatus = bookingStatusFromPayment(payment.status, !!booking.assigned_driver_id)

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
  if (!d?.bookingRef || !d?.email || !d?.origin || !d?.destination || !d?.date || !d?.time) {
    return new Response("ok", { status: 200 })
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.almeretaxiboeken.nl").replace(/\/$/, "")
  const bookingUrl = `${siteUrl}/boeking/bedankt?reference=${encodeURIComponent(d.bookingRef)}`

  const customerMail = customerBookingConfirmedEmail({
    reference: d.bookingRef,
    customerName: d.name,
    customerEmail: d.email,
    customerPhone: d.phone,
    origin: d.origin,
    destination: d.destination,
    date: d.date,
    time: d.time,
    vehicleType: d.vehicleType,
    passengers: d.passengers,
    price: Number(d.price ?? 0),
    bookingUrl,
  })

  const internalMail = internalPaidBookingEmail({
    reference: d.bookingRef,
    customerName: d.name,
    customerEmail: d.email,
    customerPhone: d.phone,
    origin: d.origin,
    destination: d.destination,
    date: d.date,
    time: d.time,
    vehicleType: d.vehicleType,
    passengers: d.passengers,
    price: Number(d.price ?? 0),
  })

  const internalTo = process.env.BOOKING_NOTIFICATION_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL

  await Promise.allSettled([
    sendEmail({
      to: d.email,
      subject: customerMail.subject,
      html: customerMail.html,
      text: customerMail.text,
    }),
    internalTo
      ? sendEmail({
          to: internalTo,
          subject: internalMail.subject,
          html: internalMail.html,
          text: internalMail.text,
        })
      : Promise.resolve({ sent: false as const }),
  ])

  return new Response("ok", { status: 200 })
}
