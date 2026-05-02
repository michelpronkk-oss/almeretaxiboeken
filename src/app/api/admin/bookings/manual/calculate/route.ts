import { NextRequest } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { computeRouteFare } from "@/lib/taxi/pricing"

interface ManualCalculateBody {
  pickupAddress?: string
  destinationAddress?: string
  pickup?: string | { address?: string; placeId?: string }
  destination?: string | { address?: string; placeId?: string }
  passengers?: number
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

  if (!pickup || !destination) {
    return Response.json({ success: false, message: "Vertrekadres en bestemming zijn verplicht." }, { status: 400 })
  }

  try {
    const fare = await computeRouteFare({
      origin: pickup,
      destination,
      passengers,
    })

    return Response.json(fare)
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Prijsberekening mislukt.",
      },
      { status: 400 }
    )
  }
}
