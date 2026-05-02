import "server-only"
import { cookies } from "next/headers"

export const DRIVER_COOKIE_NAME = "atb_driver_id"

export async function setDriverAuthCookie(driverId: string) {
  const store = await cookies()
  store.set(DRIVER_COOKIE_NAME, driverId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  })
}

export async function clearDriverAuthCookie() {
  const store = await cookies()
  store.delete(DRIVER_COOKIE_NAME)
}

export async function getDriverSessionId() {
  const store = await cookies()
  return store.get(DRIVER_COOKIE_NAME)?.value || ""
}
