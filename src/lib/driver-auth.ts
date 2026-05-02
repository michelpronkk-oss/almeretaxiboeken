import "server-only"
import { getSupabaseServiceClient } from "@/lib/supabase/server"
import { clearChauffeurSession, getChauffeurSession } from "@/lib/chauffeur-auth"

export const DRIVER_COOKIE_NAME = "chauffeur_session"

export async function setDriverAuthCookie(_driverId: string) {
  throw new Error("Deprecated: use setChauffeurSession from src/lib/chauffeur-auth.ts")
}

export async function clearDriverAuthCookie() {
  await clearChauffeurSession()
}

export async function getDriverSessionId() {
  return getChauffeurSession()
}

export async function getAuthenticatedDriverId() {
  const driverId = await getChauffeurSession()
  if (!driverId) return ""

  const supabase = getSupabaseServiceClient()
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, active, approval_status")
    .eq("id", driverId)
    .maybeSingle()

  if (!driver || !driver.active || driver.approval_status !== "approved") {
    await clearChauffeurSession()
    return ""
  }

  return driver.id
}
