import { NextResponse } from "next/server"
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth"

export async function GET(request: Request) {
  const url = new URL("/admin/login", request.url)
  const res = NextResponse.redirect(url)
  res.cookies.delete(ADMIN_COOKIE_NAME)
  return res
}
