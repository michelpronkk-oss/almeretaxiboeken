import { type NextRequest } from "next/server"
import { computeRouteFare, parseLocation } from "@/lib/taxi/pricing"

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

  if (process.env.NODE_ENV === "development") {
    console.info("[Fare API] server key exists:", Boolean(process.env.GOOGLE_MAPS_SERVER_KEY))
    console.info("[Fare API] origin type:", origin.placeId ? "placeId" : "address")
    console.info("[Fare API] destination type:", destination.placeId ? "placeId" : "address")
  }

  try {
    const result = await computeRouteFare({
      origin,
      destination,
      passengers: body.passengers,
      vehicleType: body.vehicleType,
    })

    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tarief kon niet worden berekend."

    if (message.includes("Google Routes API fout")) {
      return Response.json(
        {
          error: "Google Routes API fout.",
          googleMessage: message,
        },
        { status: 502 }
      )
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
