import "server-only"
import { getSupabaseServiceClient } from "@/lib/supabase/server"
import { clearChauffeurSession, getChauffeurSession } from "@/lib/chauffeur-auth"
import { getCurrentChauffeurDriver } from "@/lib/chauffeur/current-driver"

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

/**
 * Returns the authenticated driver's public.drivers.id or "" if not logged in.
 * Uses the shared session-parsing + DB-fallback logic from getCurrentChauffeurDriver.
 * Never calls clearChauffeurSession — no destructive side-effects.
 */
export async function getAuthenticatedDriverId(): Promise<string> {
  const result = await getCurrentChauffeurDriver()
  return result.ok ? result.driver.id : ""
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

/**
 * Returns the full authenticated driver object for page-level server components.
 * Handles JSON sessions, legacy plain-UUID sessions, missing columns (pre-migration),
 * and auth_user_id fallback — via getCurrentChauffeurDriver.
 */
export async function getAuthenticatedDriver(): Promise<AuthenticatedDriver | null> {
  const result = await getCurrentChauffeurDriver()
  if (!result.ok) return null

  const d = result.driver
  const supabase = getSupabaseServiceClient()

  // vehicle_type is not included in CurrentDriver (it's portal-display-only).
  // Fetch it separately with a minimal query so it doesn't affect auth logic.
  const { data: extra } = await supabase
    .from("drivers")
    .select("vehicle_type")
    .eq("id", d.id)
    .maybeSingle()

  return {
    id: d.id,
    first_name: d.first_name,
    last_name: d.last_name,
    full_name: d.full_name,
    email: d.email,
    vehicle_type: extra?.vehicle_type ?? null,
    is_owner: d.is_owner,
    can_dispatch: d.can_dispatch,
    default_assign: d.default_assign,
  }
}
