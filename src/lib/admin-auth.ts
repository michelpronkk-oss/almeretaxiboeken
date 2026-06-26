import "server-only"
import { cookies } from "next/headers"
import { createSignedCookieValue, readSignedCookieValue } from "@/lib/signed-cookie"

export const ADMIN_COOKIE_NAME = "atb_admin_auth"

type AdminSession = {
  role: "admin"
  iat: number
}

export async function setAdminAuthCookie() {
  const store = await cookies()
  store.set(ADMIN_COOKIE_NAME, createSignedCookieValue({ role: "admin", iat: Date.now() } satisfies AdminSession), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  })
}

export async function clearAdminAuthCookie() {
  const store = await cookies()
  store.delete(ADMIN_COOKIE_NAME)
}

export async function isAdminAuthenticated() {
  if (!process.env.ADMIN_ACCESS_PASSWORD) return false
  const store = await cookies()
  const session = readSignedCookieValue<AdminSession>(store.get(ADMIN_COOKIE_NAME)?.value ?? "")
  return session?.role === "admin"
}
