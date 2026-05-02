import "server-only"
import { cookies } from "next/headers"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

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

export async function getAuthenticatedDriverId() {
  const driverId = await getDriverSessionId()
  if (!driverId) return ""

  const supabase = getSupabaseServiceClient()
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, active, approval_status")
    .eq("id", driverId)
    .maybeSingle()

  if (!driver || !driver.active || driver.approval_status !== "approved") {
    await clearDriverAuthCookie()
    return ""
  }

  return driver.id
}
