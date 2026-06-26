import { getSupabaseServiceClient } from "@/lib/supabase/server"
import { isTooSoonForPublicBooking } from "@/lib/operations"
import { matchFixedRoute } from "@/lib/taxi/fixed-routes"
import { sendEmail } from "@/lib/email/send"
import { cashBookingRequestEmail, internalCashBookingEmail } from "@/lib/email/templates"
import { findDefaultOwnerDriver, assignDefaultOwnerToBooking, preAssignDefaultOwnerOnline } from "@/lib/default-owner-assignment"
import { getMollieRedirectUrl, getMollieWebhookUrl, getPublicSiteUrl } from "@/lib/site-url"

interface BookingBody {
  origin: string
  destination: string
  date: string
  time: string
  vehicleType: "taxi" | "taxibus"
  name: string
  phone: string
  email: string
  price: number
  distanceKm: number
  durationMin: number
  passengers?: number
  notes?: string
  paymentMethod?: "online" | "cash"
  pricingMode?: string
  calculatedFare?: number
  fixedRouteFare?: number | null
  matchedFixedRoute?: string | null
}

function generateRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let ref = "ATB-"
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)]
  return ref
}

export async function POST(request: Request) {
  const body = (await request.json()) as BookingBody
  const {
    origin,
    destination,
    date,
    time,
    vehicleType,
    name,
    phone,
    email,
    price,
  } = body
  const passengers = typeof body.passengers === "number" ? Math.max(1, Math.min(8, body.passengers)) : vehicleType === "taxibus" ? 5 : 1
  const normalizedVehicleType: "taxi" | "taxibus" = passengers >= 5 ? "taxibus" : "taxi"
  const paymentMethod: "online" | "cash" = body.paymentMethod === "cash" ? "cash" : "online"

  if (!origin || !destination || !date || !time || !name || !phone || !email || !price) {
    return Response.json({ error: "Verplichte velden ontbreken." }, { status: 400 })
  }

  if (isTooSoonForPublicBooking(date, time, 60)) {
    return Response.json(
      {
        success: false,
        code: "TOO_SOON",
        message: "Voor ritten binnen 60 minuten kunt u direct bellen of WhatsAppen.",
      },
      { status: 400 }
    )
  }

  const supabase = getSupabaseServiceClient()
  const bookingRef = generateRef()
  const siteUrl = getPublicSiteUrl()

  // ── Cash payment path ────────────────────────────────────────────────────────
  if (paymentMethod === "cash") {
    // Server-side price verification: fixed routes are authoritative
    const fixedMatch = matchFixedRoute(origin, destination)
    const cashFare = fixedMatch
      ? normalizedVehicleType === "taxibus"
        ? fixedMatch.taxibusPrice
        : fixedMatch.taxiPrice
      : Number(price)
    const cashPricingMode = fixedMatch ? "fixed_route" : (body.pricingMode ?? "metered")

    const { data: cashBooking, error: cashInsertError } = await supabase
      .from("bookings")
      .insert({
        reference: bookingRef,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        pickup_address: origin,
        destination_address: destination,
        pickup_date: date,
        pickup_time: time,
        passengers,
        vehicle_type: normalizedVehicleType,
        distance_km: Number(body.distanceKm ?? 0),
        duration_minutes: Number(body.durationMin ?? 0),
        estimated_fare: cashFare,
        currency: process.env.TAXI_CURRENCY || "EUR",
        payment_method: "cash",
        payment_status: "cash_pending",
        booking_status: "unassigned",
        cash_amount_due: cashFare,
        cash_collection_status: "pending",
        notes: body.notes ?? null,
        pricing_mode: cashPricingMode,
        calculated_fare: Number(body.calculatedFare ?? price),
        fixed_route_fare: fixedMatch ? cashFare : (body.fixedRouteFare ? Number(body.fixedRouteFare) : null),
        final_fare: cashFare,
        matched_fixed_route: fixedMatch?.routeLabel ?? body.matchedFixedRoute ?? null,
      })
      .select("id, reference")
      .single()

    if (cashInsertError || !cashBooking) {
      return Response.json({ error: "Boeking kon niet worden opgeslagen." }, { status: 500 })
    }

    await supabase.from("booking_events").insert({
      booking_id: cashBooking.id,
      event_type: "booking_created",
      actor_type: "customer",
      note: "Contante boeking aangemaakt via website.",
    })

    const defaultOwner = await findDefaultOwnerDriver()
    if (defaultOwner) {
      await assignDefaultOwnerToBooking(cashBooking.id, defaultOwner.id, "assigned")
    }

    // Customer confirmation email
    if (email) {
      const tmpl = cashBookingRequestEmail({
        reference: cashBooking.reference,
        date,
        time,
        origin,
        destination,
        passengers,
        vehicleType: normalizedVehicleType,
        price: cashFare,
        customerName: name,
      })
      await sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text })
    }

    // Admin notification email
    const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL
    if (adminEmail) {
      const adminTmpl = internalCashBookingEmail({
        reference: cashBooking.reference,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        origin,
        destination,
        date,
        time,
        vehicleType: normalizedVehicleType,
        passengers,
        price: cashFare,
        bookingUrl: `${siteUrl}/admin/ritten`,
        cashAmount: cashFare,
      })
      await sendEmail({ to: adminEmail, subject: adminTmpl.subject, html: adminTmpl.html, text: adminTmpl.text })
    }

    return Response.json({
      bookingId: cashBooking.id,
      bookingRef: cashBooking.reference,
      paymentMethod: "cash",
      redirectUrl: `${siteUrl}/boeking/bedankt?bookingId=${cashBooking.id}&reference=${cashBooking.reference}`,
    })
  }

  // ── Online payment path (Mollie) ─────────────────────────────────────────────
  const mollieApiKey = process.env.MOLLIE_API_KEY
  if (!mollieApiKey) {
    return Response.json({ error: "Betalen is tijdelijk niet beschikbaar." }, { status: 503 })
  }

  const { data: insertedBooking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      reference: bookingRef,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      pickup_address: origin,
      destination_address: destination,
      pickup_date: date,
      pickup_time: time,
      passengers,
      vehicle_type: normalizedVehicleType,
      distance_km: Number(body.distanceKm ?? 0),
      duration_minutes: Number(body.durationMin ?? 0),
      estimated_fare: Number(price),
      currency: process.env.TAXI_CURRENCY || "EUR",
      payment_method: "online",
      payment_status: "pending_payment",
      booking_status: "pending_payment",
      cash_collection_status: "not_applicable",
      notes: body.notes ?? null,
      pricing_mode: body.pricingMode ?? "metered",
      calculated_fare: Number(body.calculatedFare ?? price),
      fixed_route_fare: body.fixedRouteFare ? Number(body.fixedRouteFare) : null,
      final_fare: Number(price),
      matched_fixed_route: body.matchedFixedRoute ?? null,
    })
    .select("id, reference")
    .single()

  if (insertError || !insertedBooking) {
    return Response.json({ error: "Boeking kon niet worden opgeslagen." }, { status: 500 })
  }

  await supabase.from("booking_events").insert({
    booking_id: insertedBooking.id,
    event_type: "booking_created",
    actor_type: "customer",
    note: "Boeking aangemaakt, wacht op betaling.",
  })

  const redirectBase = getMollieRedirectUrl()
  const webhookUrl = getMollieWebhookUrl()

  const redirectUrl = new URL(redirectBase)
  redirectUrl.searchParams.set("bookingId", insertedBooking.id)
  redirectUrl.searchParams.set("reference", insertedBooking.reference)

  const mollieRes = await fetch("https://api.mollie.com/v2/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mollieApiKey}`,
    },
    body: JSON.stringify({
      amount: {
        currency: process.env.TAXI_CURRENCY || "EUR",
        value: Number(price).toFixed(2),
      },
      description: `AlmereTaxiBoeken rit ${bookingRef}`,
      redirectUrl: redirectUrl.toString(),
      webhookUrl,
      metadata: {
        bookingId: insertedBooking.id,
        bookingRef,
        origin,
        destination,
        date,
        time,
        vehicleType: normalizedVehicleType,
        name,
        phone,
        email,
        price: Number(price),
        distanceKm: Number(body.distanceKm ?? 0),
        durationMin: Number(body.durationMin ?? 0),
      },
    }),
  })

  if (!mollieRes.ok) {
    let message = "Kon betaling niet starten."
    try {
      const err = await mollieRes.json()
      message = err?.detail || err?.title || message
    } catch {
      // no-op
    }
    return Response.json({ error: message }, { status: 502 })
  }

  const molliePayment = await mollieRes.json()
  const checkoutUrl = molliePayment?._links?.checkout?.href as string | undefined
  const paymentId = molliePayment?.id as string | undefined

  if (!checkoutUrl || !paymentId) {
    return Response.json({ error: "Betaling kon niet worden voorbereid." }, { status: 502 })
  }

  redirectUrl.searchParams.set("payment_id", paymentId)

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      mollie_payment_id: paymentId,
      mollie_checkout_url: checkoutUrl,
    })
    .eq("id", insertedBooking.id)

  if (updateError) {
    return Response.json({ error: "Boeking is aangemaakt maar betaling niet gekoppeld." }, { status: 500 })
  }

  await supabase.from("booking_events").insert({
    booking_id: insertedBooking.id,
    event_type: "mollie_payment_created",
    actor_type: "system",
    note: `Mollie payment id: ${paymentId}`,
  })

  const defaultOwnerOnline = await findDefaultOwnerDriver()
  if (defaultOwnerOnline) {
    await preAssignDefaultOwnerOnline(insertedBooking.id, defaultOwnerOnline.id)
  }

  return Response.json({
    bookingId: insertedBooking.id,
    bookingRef: insertedBooking.reference,
    paymentId,
    checkoutUrl,
  })
}
