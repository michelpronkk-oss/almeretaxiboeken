import "server-only"
import { getChauffeurSession } from "@/lib/chauffeur-auth"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

export interface CurrentDriver {
  id: string
  email: string | null
  full_name: string | null
  first_name: string | null
  last_name: string | null
  active: boolean
  approval_status: string
  is_owner: boolean
  can_dispatch: boolean
  default_assign: boolean
}

/**
 * Reads the session cookie and fetches the driver fresh from DB.
 * Never calls clearChauffeurSession — side-effect free.
 * Returns null if session is missing, DB fails, or driver is invalid.
 */
export async function getCurrentDriver(): Promise<CurrentDriver | null> {
  const sessionId = await getChauffeurSession()
  if (!sessionId) return null

  const supabase = getSupabaseServiceClient()
  const { data: driver, error } = await supabase
    .from("drivers")
    .select(
      "id, email, full_name, first_name, last_name, active, approval_status, is_owner, can_dispatch, default_assign, deleted_at",
    )
    .eq("id", sessionId)
    .maybeSingle()

  if (error || !driver) return null
  if (!driver.active || driver.approval_status !== "approved") return null
  if (driver.deleted_at) return null

  return {
    id: driver.id,
    email: driver.email ?? null,
    full_name: driver.full_name ?? null,
    first_name: driver.first_name ?? null,
    last_name: driver.last_name ?? null,
    active: driver.active,
    approval_status: driver.approval_status,
    is_owner: driver.is_owner ?? false,
    can_dispatch: driver.can_dispatch ?? false,
    default_assign: driver.default_assign ?? false,
  }
}

export function driverHasDispatchRights(driver: Pick<CurrentDriver, "is_owner" | "can_dispatch">): boolean {
  return driver.is_owner === true || driver.can_dispatch === true
}
