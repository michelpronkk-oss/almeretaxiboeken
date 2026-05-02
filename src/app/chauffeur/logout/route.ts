import { NextResponse } from "next/server"
import { DRIVER_COOKIE_NAME } from "@/lib/driver-auth"

export async function GET(request: Request) {
  const url = new URL("/chauffeur/login", request.url)
  const res = NextResponse.redirect(url)
  res.cookies.delete(DRIVER_COOKIE_NAME)
  return res
}
