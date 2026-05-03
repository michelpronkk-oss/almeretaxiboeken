import "server-only"
import { getChauffeurSession } from "@/lib/chauffeur-auth"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

// ── Types ─────────────────────────────────────────────────────────────────────

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

export type DriverAuthResult =
  | { ok: true; driver: CurrentDriver }
  | { ok: false; code: "NOT_LOGGED_IN" | "DRIVER_NOT_FOUND" | "DRIVER_NOT_APPROVED" }

// Columns that require the owner/dispatcher migration to be applied
const FULL_COLS =
  "id, email, full_name, first_name, last_name, active, approval_status, onboarding_status, is_owner, can_dispatch, default_assign, deleted_at"

// Columns guaranteed to exist on every deployment (pre-migration safe)
const MINIMAL_COLS =
  "id, email, full_name, first_name, last_name, active, approval_status, onboarding_status"

// ── Session parsing ───────────────────────────────────────────────────────────

type SessionPayload =
  | { type: "id"; value: string }
  | { type: "auth_user_id"; value: string }
  | { type: "email"; value: string }

/**
 * Parses the raw cookie value into a typed lookup descriptor.
 *
 * Supported formats (newest first):
 *   JSON {"driverId":"uuid"}      — current format set by setChauffeurSession
 *   JSON {"id":"uuid"}            — alternative JSON variant
 *   JSON {"auth_user_id":"uuid"}  — legacy Supabase Auth path
 *   JSON {"email":"…"}            — email-based session
 *   raw UUID string               — legacy plain-text format
 *   raw email string              — legacy plain-text email format
 */
function parseSession(raw: string): SessionPayload | null {
  if (!raw.trim()) return null

  try {
    const p = JSON.parse(raw) as Record<string, unknown>
    if (p && typeof p === "object") {
      const id = p.driverId ?? p.id
      if (typeof id === "string" && id) return { type: "id", value: id }

      const authId = p.auth_user_id
      if (typeof authId === "string" && authId) return { type: "auth_user_id", value: authId }

      const email = p.email
      if (typeof email === "string" && email) return { type: "email", value: email.toLowerCase().trim() }
    }
  } catch {
    // Not JSON — treat as a plain string
  }

  const plain = raw.trim()
  if (plain.includes("@")) return { type: "email", value: plain.toLowerCase() }
  if (plain.length > 0) return { type: "id", value: plain } // UUID or auth_user_id
  return null
}

// ── DB helpers ────────────────────────────────────────────────────────────────

type RawRow = {
  id: string
  email?: string | null
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  active: boolean
  approval_status: string
  is_owner?: boolean | null
  can_dispatch?: boolean | null
  default_assign?: boolean | null
  deleted_at?: string | null
}

function toCurrentDriver(row: RawRow): CurrentDriver {
  return {
    id: row.id,
    email: row.email ?? null,
    full_name: row.full_name ?? null,
    first_name: row.first_name ?? null,
    last_name: row.last_name ?? null,
    active: Boolean(row.active),
    approval_status: String(row.approval_status ?? ""),
    is_owner: Boolean(row.is_owner),
    can_dispatch: Boolean(row.can_dispatch),
    default_assign: Boolean(row.default_assign),
  }
}

function isValid(row: RawRow): boolean {
  if (!row.active || row.approval_status !== "approved") return false
  if (row.deleted_at) return false
  return true
}

/**
 * Fetch a single driver row by a column value.
 * Tries the full column set first; if that query errors (columns not migrated
 * yet), falls back to the minimal guaranteed set with owner flags defaulted to
 * false.  This means the portal still works before the migration is applied —
 * the driver simply won't have dispatcher rights.
 */
async function fetchOneBy(col: "id" | "auth_user_id", value: string): Promise<RawRow | null> {
  const supabase = getSupabaseServiceClient()

  const { data, error } = await supabase
    .from("drivers")
    .select(FULL_COLS)
    .eq(col, value)
    .maybeSingle()

  if (data) return data as RawRow

  if (error) {
    // Schema gap: new columns don't exist yet — fall back to minimal select
    const { data: minimal } = await supabase
      .from("drivers")
      .select(MINIMAL_COLS)
      .eq(col, value)
      .maybeSingle()

    if (minimal) {
      return {
        ...(minimal as RawRow),
        is_owner: false,
        can_dispatch: false,
        default_assign: false,
        deleted_at: null,
      }
    }
  }

  return null
}

/**
 * Fetch best driver row by email.  Prefers active + approved + not-deleted.
 * Falls back to minimal column set if full select errors.
 */
async function fetchBestByEmail(email: string): Promise<RawRow | null> {
  const supabase = getSupabaseServiceClient()

  const trySelect = async (cols: string) => {
    const { data } = await supabase
      .from("drivers")
      .select(cols)
      .eq("email", email)
      .order("created_at", { ascending: false })
    return (data ?? []) as unknown as RawRow[]
  }

  let rows = await trySelect(FULL_COLS)

  // If full select returned nothing (possible error or genuinely empty), try minimal
  if (!rows.length) {
    const minRows = await trySelect(MINIMAL_COLS)
    rows = minRows.map((r) => ({
      ...r,
      is_owner: false,
      can_dispatch: false,
      default_assign: false,
      deleted_at: null,
    }))
  }

  if (!rows.length) return null

  // Pick best: active + approved + not-deleted first
  return (
    rows.find((r) => r.active && r.approval_status === "approved" && !r.deleted_at) ??
    rows.find((r) => r.active && !r.deleted_at) ??
    rows[0]
  )
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Resolves the logged-in chauffeur from the session cookie.
 *
 * Resolution order:
 *  1. Parse session (JSON or legacy plain-UUID)
 *  2. Look up by drivers.id
 *  3. Fallback: look up by auth_user_id  (handles sessions created before the
 *     access route was standardised on drivers.id)
 *  4. Fallback: look up by email
 *
 * Returns a structured failure code — never calls clearChauffeurSession.
 */
export async function getCurrentChauffeurDriver(): Promise<DriverAuthResult> {
  const raw = await getChauffeurSession()
  const payload = parseSession(raw)
  if (!payload) return { ok: false, code: "NOT_LOGGED_IN" }

  let row: RawRow | null = null

  if (payload.type === "id") {
    // Primary: session value should be drivers.id
    row = await fetchOneBy("id", payload.value)

    // Secondary fallback: session might contain auth_user_id instead of drivers.id
    if (!row) row = await fetchOneBy("auth_user_id", payload.value)
  } else if (payload.type === "auth_user_id") {
    row = await fetchOneBy("auth_user_id", payload.value)
  } else if (payload.type === "email") {
    row = await fetchBestByEmail(payload.value)
  }

  if (!row) return { ok: false, code: "DRIVER_NOT_FOUND" }
  if (!isValid(row)) return { ok: false, code: "DRIVER_NOT_APPROVED" }

  return { ok: true, driver: toCurrentDriver(row) }
}

// Backward-compat alias used by existing route files
export async function getCurrentDriver(): Promise<CurrentDriver | null> {
  const result = await getCurrentChauffeurDriver()
  return result.ok ? result.driver : null
}

export function driverHasDispatchRights(driver: Pick<CurrentDriver, "is_owner" | "can_dispatch">): boolean {
  return driver.is_owner === true || driver.can_dispatch === true
}
