import { NextResponse } from "next/server"
import { clearChauffeurSession } from "@/lib/chauffeur-auth"

export async function GET(request: Request) {
  await clearChauffeurSession()
  return NextResponse.redirect(new URL("/chauffeur/login", request.url))
}
