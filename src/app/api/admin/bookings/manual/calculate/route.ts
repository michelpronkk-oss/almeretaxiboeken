import { NextRequest } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { computeRouteFare } from "@/lib/taxi/pricing"

interface ManualCalculateBody {
  pickupAddress?: string
  destinationAddress?: string
  passengers?: number
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ success: false, message: "Niet geautoriseerd." }, { status: 401 })
  }

  const body = (await request.json()) as ManualCalculateBody
  const pickupAddress = String(body.pickupAddress || "").trim()
  const destinationAddress = String(body.destinationAddress || "").trim()
  const passengers = Number(body.passengers || 1)

  if (!pickupAddress || !destinationAddress) {
    return Response.json({ success: false, message: "Vertrekadres en bestemming zijn verplicht." }, { status: 400 })
  }

  try {
    const fare = await computeRouteFare({
      origin: { address: pickupAddress },
      destination: { address: destinationAddress },
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
