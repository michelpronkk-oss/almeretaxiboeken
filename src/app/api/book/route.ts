import { getSupabaseServiceClient } from "@/lib/supabase/server"

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

  if (!origin || !destination || !date || !time || !name || !phone || !email || !price) {
    return Response.json({ error: "Verplichte velden ontbreken." }, { status: 400 })
  }

  const mollieApiKey = process.env.MOLLIE_API_KEY
  if (!mollieApiKey) {
    return Response.json({ error: "Betalen is tijdelijk niet beschikbaar." }, { status: 503 })
  }

  const supabase = getSupabaseServiceClient()
  const bookingRef = generateRef()

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
      payment_status: "pending_payment",
      booking_status: "pending_payment",
      notes: body.notes ?? null,
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

  const redirectBase = process.env.MOLLIE_REDIRECT_URL ?? "https://almeretaxiboeken.nl/boeking/bedankt"
  const webhookUrl = process.env.MOLLIE_WEBHOOK_URL ?? "https://almeretaxiboeken.nl/api/mollie/webhook"

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

  return Response.json({
    bookingId: insertedBooking.id,
    bookingRef: insertedBooking.reference,
    paymentId,
    checkoutUrl,
  })
}
