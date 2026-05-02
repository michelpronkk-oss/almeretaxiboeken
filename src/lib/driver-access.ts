import "server-only"
import crypto from "crypto"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

function tokenExpiry(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

export async function createDriverAccessToken(driverId: string, minutes: number) {
  const token = crypto.randomBytes(32).toString("base64url")
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

  if (error || !row) return { ok: false as const, reason: "invalid" as const }
  if (row.used_at) return { ok: false as const, reason: "used" as const }
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false as const, reason: "expired" as const }

  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .select("id, active, approval_status")
    .eq("id", row.driver_id)
    .maybeSingle()

  if (driverError || !driver) return { ok: false as const, reason: "invalid" as const }
  if (!driver.active || driver.approval_status !== "approved") return { ok: false as const, reason: "not_approved" as const }

  const now = new Date().toISOString()

  const [{ error: markTokenError }, { error: loginAtError }] = await Promise.all([
    supabase.from("driver_login_tokens").update({ used_at: now }).eq("id", row.id),
    supabase.from("drivers").update({ last_login_at: now }).eq("id", driver.id),
  ])

  if (markTokenError || loginAtError) {
    return { ok: false as const, reason: "invalid" as const }
  }

  return { ok: true as const, driverId: driver.id }
}
