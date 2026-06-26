import "server-only"
import crypto from "crypto"

const SIGNED_COOKIE_VERSION = "v1"

function getCookieSecret() {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_ACCESS_PASSWORD ||
    ""

  if (!secret) {
    throw new Error("Missing AUTH_SECRET or fallback secret for signed cookies")
  }

  return secret
}

function sign(value: string) {
  return crypto.createHmac("sha256", getCookieSecret()).update(value).digest("base64url")
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

export function createSignedCookieValue(payload: unknown) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")
  return `${SIGNED_COOKIE_VERSION}.${body}.${sign(body)}`
}

export function readSignedCookieValue<T>(value: string): T | null {
  const [version, body, signature] = value.split(".")
  if (version !== SIGNED_COOKIE_VERSION || !body || !signature) return null
  if (!safeEqual(sign(body), signature)) return null

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T
  } catch {
    return null
  }
}
