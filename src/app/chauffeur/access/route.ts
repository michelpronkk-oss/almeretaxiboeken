import { NextResponse } from "next/server"
import { consumeDriverAccessToken } from "@/lib/driver-access"
import { setChauffeurSession } from "@/lib/chauffeur-auth"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = String(url.searchParams.get("token") || "").trim()

  console.info("[chauffeur-access] token present", Boolean(token))

  if (!token) {
    return NextResponse.redirect(new URL("/chauffeur/login?error=missing_token", request.url))
  }

  const result = await consumeDriverAccessToken(token)

  console.info("[chauffeur-access] token found", Boolean((result as { tokenFound?: boolean }).tokenFound))
  console.info("[chauffeur-access] expired", Boolean((result as { isExpired?: boolean }).isExpired))
  console.info("[chauffeur-access] used", Boolean((result as { isUsed?: boolean }).isUsed))
  console.info("[chauffeur-access] driver found", Boolean((result as { driverFound?: boolean }).driverFound))
  console.info("[chauffeur-access] driver approved", Boolean((result as { driverApproved?: boolean }).driverApproved))

  if (!result.ok) {
    return NextResponse.redirect(new URL("/chauffeur/login?error=invalid_link", request.url))
  }

  await setChauffeurSession(result.driverId)
  console.info("[chauffeur-access] session set", true)

  return NextResponse.redirect(new URL("/chauffeur", request.url))
}
