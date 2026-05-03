import "server-only"
import { cookies } from "next/headers"

export const CHAUFFEUR_SESSION_COOKIE = "chauffeur_session"

export async function setChauffeurSession(driverId: string) {
  const store = await cookies()
  // path "/" so the cookie is included in API route requests (/api/chauffeur/...)
  store.set(CHAUFFEUR_SESSION_COOKIE, driverId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function getChauffeurSession() {
  const store = await cookies()
  return store.get(CHAUFFEUR_SESSION_COOKIE)?.value || ""
}

export async function clearChauffeurSession() {
  const store = await cookies()
  // Clear both path variants: legacy sessions used path=/chauffeur, current sessions use path=/
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

// TODO: replace raw driverId cookie value with signed session or Supabase Auth before broad rollout.
