import "server-only"
import { getSupabaseServiceClient } from "@/lib/supabase/server"
import { createRawToken, hashToken } from "@/lib/chauffeur/tokens"

function tokenExpiry(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

export async function createDriverAccessToken(driverId: string, minutes: number) {
  const token = createRawToken()
  const tokenHash = hashToken(token)
  const supabase = getSupabaseServiceClient()

  const { error } = await supabase.from("driver_login_tokens").insert({
    driver_id: driverId,
    token_hash: tokenHash,
    expires_at: tokenExpiry(minutes),
  })

  if (error) {
    throw new Error(`driver_login_tokens insert failed: ${error.message}`)
  }

  return token
}

export async function consumeDriverAccessToken(token: string) {
  const tokenHash = hashToken(token)
  const supabase = getSupabaseServiceClient()

  const { data: row, error } = await supabase
    .from("driver_login_tokens")
    .select("id, driver_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle()

  const tokenFound = Boolean(row) && !error
  const isUsed = Boolean(row?.used_at)
  const isExpired = row ? new Date(row.expires_at).getTime() < Date.now() : false

  if (error || !row) return { ok: false as const, reason: "invalid" as const, tokenFound: false, isUsed: false, isExpired: false }
  if (isUsed) return { ok: false as const, reason: "used" as const, tokenFound, isUsed, isExpired: false }
  if (isExpired) return { ok: false as const, reason: "expired" as const, tokenFound, isUsed: false, isExpired }

  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .select("id, active, approval_status")
    .eq("id", row.driver_id)
    .maybeSingle()

  const driverFound = Boolean(driver) && !driverError
  const driverApproved = Boolean(driver?.active && driver?.approval_status === "approved")

  if (driverError || !driver) return { ok: false as const, reason: "invalid" as const, tokenFound, isUsed: false, isExpired: false, driverFound: false, driverApproved: false }
  if (!driverApproved) return { ok: false as const, reason: "not_approved" as const, tokenFound, isUsed: false, isExpired: false, driverFound, driverApproved }

  const now = new Date().toISOString()

  const [{ error: markTokenError }, { error: loginAtError }] = await Promise.all([
    supabase.from("driver_login_tokens").update({ used_at: now }).eq("id", row.id),
    supabase.from("drivers").update({ last_login_at: now }).eq("id", driver.id),
  ])

  if (markTokenError || loginAtError) {
    return { ok: false as const, reason: "invalid" as const, tokenFound, isUsed: false, isExpired: false, driverFound, driverApproved }
  }

  return { ok: true as const, driverId: driver.id, tokenFound: true, isUsed: false, isExpired: false, driverFound: true, driverApproved: true }
}
