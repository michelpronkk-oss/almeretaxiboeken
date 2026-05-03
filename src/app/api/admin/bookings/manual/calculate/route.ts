import { NextRequest } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { computeRouteFare } from "@/lib/taxi/pricing"
import { matchFixedRoute } from "@/lib/taxi/fixed-routes"

interface ManualCalculateBody {
  pickupAddress?: string
  destinationAddress?: string
  pickup?: string | { address?: string; placeId?: string }
  destination?: string | { address?: string; placeId?: string }
  passengers?: number
  vehicleType?: "taxi" | "taxibus"
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ success: false, message: "Niet geautoriseerd." }, { status: 401 })
  }

  const body = (await request.json()) as ManualCalculateBody
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
  const passengers = Number(body.passengers || 1)
  const vehicleType = body.vehicleType

  if (!pickup || !destination) {
    return Response.json({ success: false, message: "Vertrekadres en bestemming zijn verplicht." }, { status: 400 })
  }

  try {
    const fare = await computeRouteFare({ origin: pickup, destination, passengers, vehicleType })

    const puStr = typeof pickup === "string" ? pickup : pickup.address || pickupAddress
    const dStr = typeof destination === "string" ? destination : destination.address || destinationAddress
    const fixedMatch = matchFixedRoute(puStr, dStr)

    const fixedFare = fixedMatch
      ? fare.vehicleType === "taxibus"
        ? fixedMatch.taxibusPrice
        : fixedMatch.taxiPrice
      : null

    const pricingMode = fixedMatch ? "fixed_route" : "metered"
    const finalFare = fixedFare ?? fare.estimatedFare

    return Response.json({
      ...fare,
      success: true,
      estimatedFare: finalFare,
      calculatedFare: fare.estimatedFare,
      pricingMode,
      matchedFixedRoute: fixedMatch?.routeLabel ?? null,
      fixedRouteTaxiPrice: fixedMatch?.taxiPrice ?? null,
      fixedRouteTaxibusPrice: fixedMatch?.taxibusPrice ?? null,
    })
  } catch (error) {
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : "Prijsberekening mislukt." },
      { status: 400 }
    )
  }
}
