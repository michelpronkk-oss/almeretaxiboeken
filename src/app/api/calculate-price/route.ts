import { type NextRequest } from "next/server"
import { computeRouteFare, parseLocation } from "@/lib/taxi/pricing"
import { matchFixedRoute } from "@/lib/taxi/fixed-routes"

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

function extractAddress(input: string | LocationInput | undefined): string {
  if (!input) return ""
  if (typeof input === "string") return input
  return input.address || ""
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

  try {
    const result = await computeRouteFare({
      origin,
      destination,
      passengers: body.passengers,
      vehicleType: body.vehicleType,
    })

    const pickupStr = extractAddress(body.origin ?? body.pickup)
    const destStr = extractAddress(body.destination)
    const fixedMatch = matchFixedRoute(pickupStr, destStr)

    const fixedFare = fixedMatch
      ? result.vehicleType === "taxibus"
        ? fixedMatch.taxibusPrice
        : fixedMatch.taxiPrice
      : null

    const pricingMode = fixedMatch ? "fixed_route" : "metered"
    const finalFare = fixedFare ?? result.estimatedFare

    return Response.json({
      ...result,
      price: finalFare,
      estimatedFare: finalFare,
      calculatedFare: result.estimatedFare,
      pricingMode,
      fixedRouteTaxiPrice: fixedMatch?.taxiPrice ?? null,
      fixedRouteTaxibusPrice: fixedMatch?.taxibusPrice ?? null,
      matchedFixedRoute: fixedMatch?.routeLabel ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tarief kon niet worden berekend."

    if (message.includes("Google Routes API fout")) {
      return Response.json({ error: "Google Routes API fout.", googleMessage: message }, { status: 502 })
    }
    if (message.includes("Server key ontbreekt")) {
      return Response.json({ error: message }, { status: 503 })
    }
    if (message.includes("Geen route gevonden")) {
      return Response.json({ error: message }, { status: 400 })
    }

    return Response.json({ error: message }, { status: 500 })
  }
}
