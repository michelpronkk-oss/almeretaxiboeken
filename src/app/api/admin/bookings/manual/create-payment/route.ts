import { NextRequest } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { sendEmail } from "@/lib/email/send"
import { manualPaymentLinkEmail } from "@/lib/email/templates"
import { getSupabaseServiceClient } from "@/lib/supabase/server"
import { computeRouteFare } from "@/lib/taxi/pricing"

interface CreatePaymentBody {
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  pickupAddress?: string
  destinationAddress?: string
  pickupDate?: string
  pickupTime?: string
  passengers?: number
  notes?: string
  sendEmail?: boolean
  saveWithoutPayment?: boolean
}

function generateRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let ref = "ATB-"
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)]
  return ref
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ success: false, message: "Niet geautoriseerd." }, { status: 401 })
  }

  const body = (await request.json()) as CreatePaymentBody

  const customerName = String(body.customerName || "").trim()
  const customerEmail = String(body.customerEmail || "").trim()
  const customerPhone = String(body.customerPhone || "").trim()
  const pickupAddress = String(body.pickupAddress || "").trim()
  const destinationAddress = String(body.destinationAddress || "").trim()
  const pickupDate = String(body.pickupDate || "").trim()
  const pickupTime = String(body.pickupTime || "").trim()
  const notes = String(body.notes || "").trim()
  const passengers = Math.max(1, Math.min(8, Number(body.passengers || 1)))
  const saveWithoutPayment = Boolean(body.saveWithoutPayment)
  const wantsEmail = Boolean(body.sendEmail)

  if (!customerName || !customerPhone || !pickupAddress || !destinationAddress || !pickupDate || !pickupTime) {
    return Response.json({ success: false, message: "Vul alle verplichte velden in." }, { status: 400 })
  }

  if (wantsEmail && !customerEmail) {
    return Response.json({ success: false, message: "E-mailadres is verplicht om een betaallink te mailen." }, { status: 400 })
  }

  let fare
  try {
    fare = await computeRouteFare({
      origin: { address: pickupAddress },
      destination: { address: destinationAddress },
      passengers,
    })
  } catch (error) {
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : "Prijsberekening mislukt." },
      { status: 400 }
    )
  }

  const supabase = getSupabaseServiceClient()
  const bookingRef = generateRef()

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      reference: bookingRef,
      customer_name: customerName,
      customer_email: customerEmail || null,
      customer_phone: customerPhone,
      pickup_address: pickupAddress,
      destination_address: destinationAddress,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      passengers: fare.passengers,
      vehicle_type: fare.vehicleType,
      distance_km: fare.distanceKm,
      duration_minutes: fare.durationMinutes,
      estimated_fare: fare.estimatedFare,
      currency: fare.currency,
      payment_status: "pending_payment",
      booking_status: "pending_payment",
      notes: notes || null,
      source: "admin_manual",
      created_by: "admin",
      manual_created: true,
      price_calculated_at: new Date().toISOString(),
    })
    .select("id, reference")
    .single()

  if (insertError || !booking) {
    return Response.json({ success: false, message: "Rit kon niet worden opgeslagen." }, { status: 500 })
  }

  await supabase.from("booking_events").insert({
    booking_id: booking.id,
    event_type: "manual_booking_created",
    actor_type: "admin",
    note: "Handmatige rit aangemaakt via admin.",
  })

  if (saveWithoutPayment) {
    return Response.json({
      success: true,
      mode: "saved_without_payment",
      bookingId: booking.id,
      reference: booking.reference,
      fare,
    })
  }

  const mollieApiKey = process.env.MOLLIE_API_KEY
  if (!mollieApiKey) {
    return Response.json({ success: false, message: "MOLLIE_API_KEY ontbreekt." }, { status: 503 })
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://almeretaxiboeken.nl").replace(/\/$/, "")
  const webhookUrl = process.env.MOLLIE_WEBHOOK_URL || `${siteUrl}/api/mollie/webhook`
  const redirectUrl = new URL(`${siteUrl}/boeking/bedankt`)
  redirectUrl.searchParams.set("bookingId", booking.id)
  redirectUrl.searchParams.set("reference", booking.reference)

  const mollieRes = await fetch("https://api.mollie.com/v2/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mollieApiKey}`,
    },
    body: JSON.stringify({
      amount: {
        currency: fare.currency,
        value: Number(fare.estimatedFare).toFixed(2),
      },
      description: `AlmereTaxiBoeken rit ${booking.reference}`,
      redirectUrl: redirectUrl.toString(),
      webhookUrl,
      metadata: {
        bookingId: booking.id,
        bookingRef: booking.reference,
        origin: pickupAddress,
        destination: destinationAddress,
        date: pickupDate,
        time: pickupTime,
        vehicleType: fare.vehicleType,
        name: customerName,
        phone: customerPhone,
        email: customerEmail || undefined,
        price: fare.estimatedFare,
        distanceKm: fare.distanceKm,
        durationMin: fare.durationMinutes,
        passengers: fare.passengers,
      },
    }),
  })

  if (!mollieRes.ok) {
    let providerMessage = "Betaallink kon niet worden aangemaakt."
    try {
      const err = await mollieRes.json()
      providerMessage = err?.detail || err?.title || providerMessage
    } catch {
      // no-op
    }

    return Response.json({ success: false, message: providerMessage }, { status: 502 })
  }

  const molliePayment = await mollieRes.json()
  const paymentId = String(molliePayment?.id || "")
  const paymentUrl = String(molliePayment?._links?.checkout?.href || "")

  if (!paymentId || !paymentUrl) {
    return Response.json({ success: false, message: "Mollie respons onvolledig." }, { status: 502 })
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      mollie_payment_id: paymentId,
      mollie_checkout_url: paymentUrl,
      customer_payment_link: paymentUrl,
    })
    .eq("id", booking.id)

  if (updateError) {
    return Response.json({ success: false, message: "Rit is gemaakt, maar betaallink kon niet gekoppeld worden." }, { status: 500 })
  }

  await supabase.from("booking_events").insert({
    booking_id: booking.id,
    event_type: "payment_link_created",
    actor_type: "admin",
    note: `Mollie payment id: ${paymentId}`,
  })

  let emailSent = false
  let emailWarning = ""

  if (wantsEmail && customerEmail) {
    const emailTemplate = manualPaymentLinkEmail({
      reference: booking.reference,
      date: pickupDate,
      time: pickupTime,
      origin: pickupAddress,
      destination: destinationAddress,
      passengers: fare.passengers,
      vehicleType: fare.vehicleType,
      price: fare.estimatedFare,
      paymentUrl,
    })

    const sendResult = await sendEmail({
      to: customerEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    })

    if (sendResult.sent) {
      emailSent = true
      await supabase
        .from("bookings")
        .update({ payment_link_sent_at: new Date().toISOString() })
        .eq("id", booking.id)

      await supabase.from("booking_events").insert({
        booking_id: booking.id,
        event_type: "payment_link_email_sent",
        actor_type: "system",
        note: `Mail sent to ${customerEmail}`,
      })
    } else {
      emailWarning = "Betaallink aangemaakt, maar e-mail kon niet worden verzonden."
      await supabase.from("booking_events").insert({
        booking_id: booking.id,
        event_type: "payment_link_email_failed",
        actor_type: "system",
        note: sendResult.error || sendResult.reason || "Unknown send failure",
      })
    }
  }

  return Response.json({
    success: true,
    mode: "payment_link_created",
    bookingId: booking.id,
    reference: booking.reference,
    paymentUrl,
    fare,
    emailSent,
    warning: emailWarning || undefined,
  })
}
