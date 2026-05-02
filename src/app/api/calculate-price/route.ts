import { type NextRequest } from "next/server"

type LocationInput = {
  address?: string
  placeId?: string
}

interface RouteRequestBody {
  origin?: string | LocationInput
  destination?: string | LocationInput
  pickup?: string | LocationInput
  passengers?: number
  vehicleType?: "taxi" | "taxibus"
}

function parseLocation(input: string | LocationInput | undefined): LocationInput | null {
  if (!input) return null
  if (typeof input === "string") {
    const address = input.trim()
    return address ? { address } : null
  }

  const placeId = input.placeId?.trim()
  if (placeId) return { placeId }

  const address = input.address?.trim()
  if (address) return { address }

  return null
}

function parseDurationSeconds(duration: unknown): number {
  if (typeof duration !== "string") return 0
  const match = duration.match(/^(\d+(?:\.\d+)?)s$/)
  if (!match) return 0
  return Number.parseFloat(match[1])
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RouteRequestBody
  const origin = parseLocation(body.origin ?? body.pickup)
  const destination = parseLocation(body.destination)

  if (!origin || !destination) {
    return Response.json(
      { error: "Pickup/origin en destination zijn verplicht." },
      { status: 400 }
    )
  }

  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!apiKey) {
    return Response.json(
      { error: "Server key ontbreekt: GOOGLE_MAPS_SERVER_KEY niet ingesteld." },
      { status: 503 }
    )
  }

  const passengers =
    typeof body.passengers === "number" && Number.isFinite(body.passengers)
      ? body.passengers
      : body.vehicleType === "taxibus"
        ? 5
        : 1
  const isVan = passengers >= 5

  const baseFare = envNumber("TAXI_BASE_FARE", 4.31)
  const kmRate = envNumber("TAXI_PRICE_PER_KM", 3.17)
  const minuteRate = envNumber("TAXI_PRICE_PER_MINUTE", 0.52)
  const vanBaseFare = envNumber("TAXI_VAN_BASE_FARE", 8.77)
  const vanKmRate = envNumber("TAXI_VAN_PRICE_PER_KM", 4.0)
  const vanMinuteRate = envNumber("TAXI_VAN_PRICE_PER_MINUTE", 0.59)
  const minimumFare = envNumber("TAXI_MINIMUM_FARE", 12.5)
  const currency = process.env.TAXI_CURRENCY || "EUR"

  if (process.env.NODE_ENV === "development") {
    console.info("[Fare API] server key exists:", Boolean(apiKey))
    console.info("[Fare API] origin type:", origin.placeId ? "placeId" : "address")
    console.info(
      "[Fare API] destination type:",
      destination.placeId ? "placeId" : "address"
    )
  }

  const routeRes = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
      },
      body: JSON.stringify({
        origin,
        destination,
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
      }),
    }
  )

  if (process.env.NODE_ENV === "development") {
    console.info("[Fare API] routes API status:", routeRes.status)
  }

  if (!routeRes.ok) {
    let providerMessage = "Onbekende fout van Google Routes API."
    try {
      const errJson = await routeRes.json()
      providerMessage = errJson?.error?.message || providerMessage
    } catch {
      const errText = await routeRes.text()
      providerMessage = errText || providerMessage
    }

    return Response.json(
      {
        error: "Google Routes API fout.",
        googleStatus: routeRes.status,
        googleMessage: providerMessage,
      },
      { status: 502 }
    )
  }

  const routeData = await routeRes.json()
  const route = routeData.routes?.[0]

  if (!route) {
    return Response.json(
      { error: "Geen route gevonden tussen deze adressen." },
      { status: 400 }
    )
  }

  const distanceMeters = Number(route.distanceMeters ?? 0)
  const durationSeconds = parseDurationSeconds(route.duration)
  const distanceKm = distanceMeters / 1000
  const durationMinutes = durationSeconds / 60

  const selectedBase = isVan ? vanBaseFare : baseFare
  const selectedKm = isVan ? vanKmRate : kmRate
  const selectedMinute = isVan ? vanMinuteRate : minuteRate
  const rawFare = selectedBase + distanceKm * selectedKm + durationMinutes * selectedMinute
  const estimatedFare = Math.max(minimumFare, Math.round(rawFare))

  return Response.json({
    success: true,
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMinutes: Math.round(durationMinutes),
    estimatedFare,
    currency,
    tariffType: isVan ? "van" : "car",
    // Backwards compatibility for current frontend widget:
    price: estimatedFare,
    starttarief: selectedBase,
    kmTarief: selectedKm,
    kmPrijs: Math.round(distanceKm * selectedKm * 100) / 100,
    durationMin: Math.round(durationMinutes),
  })
}
