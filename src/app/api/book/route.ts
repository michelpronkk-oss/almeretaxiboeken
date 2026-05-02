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

  if (!origin || !destination || !date || !time || !name || !phone || !email || !price) {
    return Response.json({ error: "Verplichte velden ontbreken." }, { status: 400 })
  }

  const mollieApiKey = process.env.MOLLIE_API_KEY
  if (!mollieApiKey) {
    return Response.json({ error: "Betalen is tijdelijk niet beschikbaar." }, { status: 503 })
  }

  const bookingRef = generateRef()
  const redirectBase = process.env.MOLLIE_REDIRECT_URL ?? "https://almeretaxiboeken.nl/boeking/bedankt"
  const webhookUrl = process.env.MOLLIE_WEBHOOK_URL ?? "https://almeretaxiboeken.nl/api/mollie/webhook"

  const redirectUrl = new URL(redirectBase)
  redirectUrl.searchParams.set("booking_ref", bookingRef)

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
        bookingRef,
        origin,
        destination,
        date,
        time,
        vehicleType,
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

  return Response.json({ bookingRef, paymentId, checkoutUrl })
}
