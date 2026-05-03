export type LocationInput = {
  address?: string
  placeId?: string
}

export interface ComputeFareInput {
  origin: string | LocationInput
  destination: string | LocationInput
  passengers?: number
  vehicleType?: "taxi" | "taxibus"
}

export interface ComputeFareResult {
  success: true
  distanceKm: number
  durationMinutes: number
  estimatedFare: number
  currency: string
  tariffType: "car" | "van"
  price: number
  starttarief: number
  kmTarief: number
  kmPrijs: number
  durationMin: number
  vehicleType: "taxi" | "taxibus"
  passengers: number
}

export function parseLocation(input: string | LocationInput | undefined): LocationInput | null {
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

export async function computeRouteFare(input: ComputeFareInput): Promise<ComputeFareResult> {
  const origin = parseLocation(input.origin)
  const destination = parseLocation(input.destination)

  if (!origin || !destination) {
    throw new Error("Pickup/origin en destination zijn verplicht.")
  }

  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!apiKey) {
    throw new Error("Server key ontbreekt: GOOGLE_MAPS_SERVER_KEY niet ingesteld.")
  }

  const passengers =
    typeof input.passengers === "number" && Number.isFinite(input.passengers)
      ? Math.max(1, Math.min(8, Math.round(input.passengers)))
      : input.vehicleType === "taxibus"
        ? 5
        : 1

  // Explicit vehicleType override takes precedence over passenger-derived vehicle
  const isVan = input.vehicleType
    ? input.vehicleType === "taxibus"
    : passengers >= 5

  const baseFare = envNumber("TAXI_BASE_FARE", 4.31)
  const kmRate = envNumber("TAXI_PRICE_PER_KM", 3.17)
  const minuteRate = envNumber("TAXI_PRICE_PER_MINUTE", 0.52)
  const vanBaseFare = envNumber("TAXI_VAN_BASE_FARE", 8.77)
  const vanKmRate = envNumber("TAXI_VAN_PRICE_PER_KM", 4.0)
  const vanMinuteRate = envNumber("TAXI_VAN_PRICE_PER_MINUTE", 0.59)
  const minimumFare = envNumber("TAXI_MINIMUM_FARE", 12.5)
  const currency = process.env.TAXI_CURRENCY || "EUR"

  const routeRes = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
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
  })

  if (!routeRes.ok) {
    let providerMessage = "Onbekende fout van Google Routes API."
    try {
      const errJson = await routeRes.json()
      providerMessage = errJson?.error?.message || providerMessage
    } catch {
      const errText = await routeRes.text()
      providerMessage = errText || providerMessage
    }

    throw new Error(`Google Routes API fout (${routeRes.status}): ${providerMessage}`)
  }

  const routeData = await routeRes.json()
  const route = routeData.routes?.[0]

  if (!route) {
    throw new Error("Geen route gevonden tussen deze adressen.")
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

  return {
    success: true,
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMinutes: Math.round(durationMinutes),
    estimatedFare,
    currency,
    tariffType: isVan ? "van" : "car",
    price: estimatedFare,
    starttarief: selectedBase,
    kmTarief: selectedKm,
    kmPrijs: Math.round(distanceKm * selectedKm * 100) / 100,
    durationMin: Math.round(durationMinutes),
    vehicleType: isVan ? "taxibus" : "taxi",
    passengers,
  }
}
