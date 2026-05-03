import "server-only"
import { cookies } from "next/headers"

export const CHAUFFEUR_SESSION_COOKIE = "chauffeur_session"

export async function setChauffeurSession(driverId: string) {
  const store = await cookies()
  // Store as JSON so future formats (signed, extra claims) are backward-compatible.
  // Readers must parse JSON first and fall back to treating the raw value as a plain UUID.
  const value = JSON.stringify({ driverId })
  store.set(CHAUFFEUR_SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function getChauffeurSession(): Promise<string> {
  const store = await cookies()
  return store.get(CHAUFFEUR_SESSION_COOKIE)?.value ?? ""
}

export async function clearChauffeurSession() {
  const store = await cookies()
  // Clear both path variants: legacy sessions used path=/chauffeur, current use path=/
  store.set(CHAUFFEUR_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
  store.set(CHAUFFEUR_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/chauffeur",
    maxAge: 0,
  })
}
