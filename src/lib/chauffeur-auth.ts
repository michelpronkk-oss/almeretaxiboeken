import "server-only"
import { cookies } from "next/headers"
import { createSignedCookieValue, readSignedCookieValue } from "@/lib/signed-cookie"

export const CHAUFFEUR_SESSION_COOKIE = "chauffeur_session"

type ChauffeurSession = {
  driverId: string
  iat: number
}

export async function setChauffeurSession(driverId: string) {
  const store = await cookies()
  const value = createSignedCookieValue({ driverId, iat: Date.now() } satisfies ChauffeurSession)
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
  const session = readSignedCookieValue<ChauffeurSession>(store.get(CHAUFFEUR_SESSION_COOKIE)?.value ?? "")
  return session?.driverId ? JSON.stringify({ driverId: session.driverId }) : ""
}

export async function clearChauffeurSession() {
  const store = await cookies()
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
