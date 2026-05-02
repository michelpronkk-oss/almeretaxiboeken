import "server-only"
import { hashInviteToken } from "@/lib/driver-invite"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

export interface ValidInvite {
  id: string
  email: string
  driverId: string
}

export async function getValidDriverInviteByToken(token: string): Promise<ValidInvite | null> {
  const trimmedToken = token.trim()
  if (!trimmedToken) return null

  const tokenHash = hashInviteToken(trimmedToken)
  const supabase = getSupabaseServiceClient()

  const { data } = await supabase
    .from("driver_invites")
    .select("id, email, driver_id")
    .eq("token_hash", tokenHash)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()

  if (!data) return null

  return {
    id: data.id,
    email: data.email,
    driverId: data.driver_id,
  }
}
