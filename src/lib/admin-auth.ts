import "server-only"
import { cookies } from "next/headers"

export const ADMIN_COOKIE_NAME = "atb_admin_auth"

export async function setAdminAuthCookie(value: string) {
  const store = await cookies()
  store.set(ADMIN_COOKIE_NAME, value, {
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
  const password = process.env.ADMIN_ACCESS_PASSWORD
  if (!password) return false
  const store = await cookies()
  return store.get(ADMIN_COOKIE_NAME)?.value === password
}
