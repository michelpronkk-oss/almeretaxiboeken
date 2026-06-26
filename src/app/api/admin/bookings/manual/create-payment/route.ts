import { NextRequest } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { sendEmail } from "@/lib/email/send"
import { manualPaymentLinkEmail, cashBookingRequestEmail } from "@/lib/email/templates"
import { getSupabaseServiceClient } from "@/lib/supabase/server"
import { computeRouteFare } from "@/lib/taxi/pricing"
import { matchFixedRoute } from "@/lib/taxi/fixed-routes"
import { findDefaultOwnerDriver, assignDefaultOwnerToBooking, preAssignDefaultOwnerOnline } from "@/lib/default-owner-assignment"

interface CreatePaymentBody {
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  pickupAddress?: string
  destinationAddress?: string
  pickup?: string | { address?: string; placeId?: string }
  destination?: string | { address?: string; placeId?: string }
  pickupDate?: string
  pickupTime?: string
  passengers?: number
  vehicleType?: "taxi" | "taxibus"
  adminVehicleOverride?: boolean
  notes?: string
  paymentMode?: "online" | "cash" | "manual_no_payment"
  sendEmail?: boolean
  priceOverrideEnabled?: boolean
  priceOverrideAmount?: number
  priceOverrideReason?: string
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
  const pickup =
    typeof body.pickup === "string"
      ? { address: body.pickup }
      : body.pickup && (body.pickup.address || body.pickup.placeId)
        ? body.pickup
        : pickupAddress
          ? { address: pickupAddress }
          : undefined
  const destination =
    typeof body.destination === "string"
      ? { address: body.destination }
      : body.destination && (body.destination.address || body.destination.placeId)
        ? body.destination
        : destinationAddress
          ? { address: destinationAddress }
          : undefined
  const pickupDate = String(body.pickupDate || "").trim()
  const pickupTime = String(body.pickupTime || "").trim()
  const notes = String(body.notes || "").trim()
  const passengers = Math.max(1, Math.min(8, Number(body.passengers || 1)))
  const vehicleType = body.vehicleType
  const adminVehicleOverride = Boolean(body.adminVehicleOverride)
  const paymentMode: "online" | "cash" | "manual_no_payment" =
    body.paymentMode === "cash" ? "cash"
    : body.paymentMode === "manual_no_payment" ? "manual_no_payment"
    : "online"
  const wantsEmail = Boolean(body.sendEmail)
  const priceOverrideEnabled = Boolean(body.priceOverrideEnabled)
  const priceOverrideAmount = priceOverrideEnabled ? Number(body.priceOverrideAmount || 0) : 0
  const priceOverrideReason = priceOverrideEnabled ? String(body.priceOverrideReason || "").trim() : ""

  if (!customerName || !customerPhone || !pickup || !destination || !pickupDate || !pickupTime) {
    return Response.json({ success: false, message: "Vul alle verplichte velden in." }, { status: 400 })
  }
  if (paymentMode === "online" && wantsEmail && !customerEmail) {
    return Response.json({ success: false, message: "E-mailadres is verplicht om een betaallink te mailen." }, { status: 400 })
  }
  if (priceOverrideEnabled && priceOverrideAmount <= 0) {
    return Response.json({ success: false, message: "Voer een geldige eindprijs in." }, { status: 400 })
  }
  if (priceOverrideEnabled && !priceOverrideReason) {
    return Response.json({ success: false, message: "Reden voor prijsaanpassing is verplicht." }, { status: 400 })
  }

  const pickupAddressForStorage = String(pickup?.address || pickupAddress).trim()
  const destinationAddressForStorage = String(destination?.address || destinationAddress).trim()

  let fare
  try {
    fare = await computeRouteFare({ origin: pickup, destination, passengers, vehicleType })
  } catch (error) {
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : "Prijsberekening mislukt." },
      { status: 400 }
    )
  }

  // Fixed route matching
  const fixedMatch = matchFixedRoute(pickupAddressForStorage, destinationAddressForStorage)
  const fixedFare = fixedMatch
    ? fare.vehicleType === "taxibus" ? fixedMatch.taxibusPrice : fixedMatch.taxiPrice
    : null

  const meteredFare = fare.estimatedFare
  const routeFare = fixedFare ?? meteredFare
  const finalFare = priceOverrideEnabled ? priceOverrideAmount : routeFare

  const pricingMode = priceOverrideEnabled
    ? "manual_override"
    : fixedMatch ? "fixed_route" : "metered"

  const supabase = getSupabaseServiceClient()
  const bookingRef = generateRef()

  // ── Shared audit fields ──────────────────────────────────────────────────────
  const pricingFields = {
    pricing_mode: pricingMode,
    calculated_fare: meteredFare,
    fixed_route_fare: fixedFare ?? null,
    final_fare: finalFare,
    matched_fixed_route: fixedMatch?.routeLabel ?? null,
    price_override_enabled: priceOverrideEnabled,
    price_override_reason: priceOverrideReason || null,
    admin_vehicle_override: adminVehicleOverride,
  }

  const baseFields = {
    reference: bookingRef,
    customer_name: customerName,
    customer_email: customerEmail || null,
    customer_phone: customerPhone,
    pickup_address: pickupAddressForStorage,
    destination_address: destinationAddressForStorage,
    pickup_date: pickupDate,
    pickup_time: pickupTime,
    passengers: fare.passengers,
    vehicle_type: fare.vehicleType,
    distance_km: fare.distanceKm,
    duration_minutes: fare.durationMinutes,
    estimated_fare: finalFare,
    currency: fare.currency,
    notes: notes || null,
    source: "admin_manual",
    created_by: "admin",
    manual_created: true,
    price_calculated_at: new Date().toISOString(),
    ...pricingFields,
  }

  const noteBase = [
    "Handmatige rit aangemaakt via admin.",
    `Prijsmodus: ${pricingMode}.`,
    fixedMatch ? `Vaste route: ${fixedMatch.routeLabel}.` : null,
    priceOverrideEnabled ? `Prijsoverschrijving: ${priceOverrideReason}.` : null,
  ].filter(Boolean).join(" ")

  // ── A. Cash payment ──────────────────────────────────────────────────────────
  if (paymentMode === "cash") {
    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        ...baseFields,
        payment_method: "cash",
        payment_status: "cash_pending",
        booking_status: "unassigned",
        cash_amount_due: finalFare,
        cash_collection_status: "pending",
      })
      .select("id, reference")
      .single()

    if (insertError || !booking) {
      return Response.json({ success: false, message: "Rit kon niet worden opgeslagen." }, { status: 500 })
    }

    await supabase.from("booking_events").insert({
      booking_id: booking.id,
      event_type: "manual_cash_booking_created",
      actor_type: "admin",
      note: `${noteBase} Betaalmethode: contant. Te innen: €${finalFare.toFixed(2)}.`,
    })

    const defaultOwnerCash = await findDefaultOwnerDriver()
    if (defaultOwnerCash) {
      await assignDefaultOwnerToBooking(booking.id, defaultOwnerCash.id, "assigned")
    }

    let emailSent = false
    if (wantsEmail && customerEmail) {
      const tmpl = cashBookingRequestEmail({
        reference: booking.reference,
        date: pickupDate,
        time: pickupTime,
        origin: pickupAddressForStorage,
        destination: destinationAddressForStorage,
        passengers: fare.passengers,
        vehicleType: fare.vehicleType,
        price: finalFare,
        customerName,
      })
      const sendResult = await sendEmail({ to: customerEmail, subject: tmpl.subject, html: tmpl.html, text: tmpl.text })
      if (sendResult.sent) {
        emailSent = true
        await supabase.from("booking_events").insert({
          booking_id: booking.id,
          event_type: "cash_booking_email_sent",
          actor_type: "system",
          note: `Bevestigingsmail verstuurd naar ${customerEmail}`,
        })
      }
    }

    return Response.json({
      success: true,
      mode: "cash",
      bookingId: booking.id,
      reference: booking.reference,
      cashAmountDue: finalFare,
      emailSent,
    })
  }

  // ── B. No payment ────────────────────────────────────────────────────────────
  if (paymentMode === "manual_no_payment") {
    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        ...baseFields,
        payment_method: "manual",
        payment_status: "not_required",
        booking_status: "unassigned",
        cash_collection_status: "not_applicable",
      })
      .select("id, reference")
      .single()

    if (insertError || !booking) {
      return Response.json({ success: false, message: "Rit kon niet worden opgeslagen." }, { status: 500 })
    }

    await supabase.from("booking_events").insert({
      booking_id: booking.id,
      event_type: "manual_booking_without_payment",
      actor_type: "admin",
      note: `${noteBase} Opgeslagen zonder betaling (interne uitzondering).`,
    })

    const defaultOwnerNoPayment = await findDefaultOwnerDriver()
    if (defaultOwnerNoPayment) {
      await assignDefaultOwnerToBooking(booking.id, defaultOwnerNoPayment.id, "assigned")
    }

    return Response.json({
      success: true,
      mode: "manual_no_payment",
      bookingId: booking.id,
      reference: booking.reference,
    })
  }

  // ── C. Online payment (Mollie) ───────────────────────────────────────────────
  const mollieApiKey = process.env.MOLLIE_API_KEY
  if (!mollieApiKey) {
    return Response.json({ success: false, message: "MOLLIE_API_KEY ontbreekt." }, { status: 503 })
  }

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      ...baseFields,
      payment_method: "online",
      payment_status: "pending_payment",
      booking_status: "pending_payment",
      cash_collection_status: "not_applicable",
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
    note: noteBase,
  })

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.almeretaxiboeken.nl").replace(/\/$/, "")
  const webhookUrl = process.env.MOLLIE_WEBHOOK_URL || `${siteUrl}/api/mollie/webhook`
  const redirectUrl = new URL(`${siteUrl}/boeking/bedankt`)
  redirectUrl.searchParams.set("bookingId", booking.id)
  redirectUrl.searchParams.set("reference", booking.reference)

  const mollieRes = await fetch("https://api.mollie.com/v2/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${mollieApiKey}` },
    body: JSON.stringify({
      amount: { currency: fare.currency, value: Number(finalFare).toFixed(2) },
      description: `AlmereTaxiBoeken rit ${booking.reference}`,
      redirectUrl: redirectUrl.toString(),
      webhookUrl,
      metadata: {
        bookingId: booking.id,
        bookingRef: booking.reference,
        origin: pickupAddressForStorage,
        destination: destinationAddressForStorage,
        date: pickupDate,
        time: pickupTime,
        vehicleType: fare.vehicleType,
        name: customerName,
        phone: customerPhone,
        email: customerEmail || undefined,
        price: finalFare,
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
    } catch { /* no-op */ }
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
    .update({ mollie_payment_id: paymentId, mollie_checkout_url: paymentUrl, customer_payment_link: paymentUrl })
    .eq("id", booking.id)

  if (updateError) {
    return Response.json({ success: false, message: "Rit is gemaakt, maar betaallink kon niet gekoppeld worden." }, { status: 500 })
  }

  await supabase.from("booking_events").insert({
    booking_id: booking.id,
    event_type: "manual_payment_link_created",
    actor_type: "admin",
    note: `Mollie payment id: ${paymentId}. Eindprijs: €${finalFare.toFixed(2)}.`,
  })

  const defaultOwnerOnline = await findDefaultOwnerDriver()
  if (defaultOwnerOnline) {
    await preAssignDefaultOwnerOnline(booking.id, defaultOwnerOnline.id)
  }

  let emailSent = false
  let emailWarning = ""

  if (wantsEmail && customerEmail) {
    const emailTemplate = manualPaymentLinkEmail({
      reference: booking.reference,
      date: pickupDate,
      time: pickupTime,
      origin: pickupAddressForStorage,
      destination: destinationAddressForStorage,
      passengers: fare.passengers,
      vehicleType: fare.vehicleType,
      price: finalFare,
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
      await supabase.from("bookings").update({ payment_link_sent_at: new Date().toISOString() }).eq("id", booking.id)
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
    fare: { ...fare, estimatedFare: finalFare, pricingMode, matchedFixedRoute: fixedMatch?.routeLabel },
    emailSent,
    warning: emailWarning || undefined,
  })
}
