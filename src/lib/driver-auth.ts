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

export interface AuthenticatedDriver {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
  vehicle_type: string | null
  is_owner: boolean
  can_dispatch: boolean
  default_assign: boolean
}

export async function getAuthenticatedDriver(): Promise<AuthenticatedDriver | null> {
  const driverId = await getChauffeurSession()
  if (!driverId) return null

  const supabase = getSupabaseServiceClient()
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, first_name, last_name, full_name, email, vehicle_type, active, approval_status, is_owner, can_dispatch, default_assign")
    .eq("id", driverId)
    .maybeSingle()

  if (!driver || !driver.active || driver.approval_status !== "approved") {
    await clearChauffeurSession()
    return null
  }

  return {
    id: driver.id,
    first_name: driver.first_name ?? null,
    last_name: driver.last_name ?? null,
    full_name: driver.full_name ?? null,
    email: driver.email ?? null,
    vehicle_type: driver.vehicle_type ?? null,
    is_owner: driver.is_owner ?? false,
    can_dispatch: driver.can_dispatch ?? false,
    default_assign: driver.default_assign ?? false,
  }
}
