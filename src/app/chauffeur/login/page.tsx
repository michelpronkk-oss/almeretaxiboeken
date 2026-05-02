import { redirect } from "next/navigation"
import { getChauffeurSession } from "@/lib/chauffeur-auth"
import { createDriverAccessToken } from "@/lib/driver-access"
import { sendDriverLoginLinkEmail } from "@/lib/driver-access-email"
import { getSupabaseServiceClient } from "@/lib/supabase/server"
import PendingSubmitButton from "@/components/internal/pending-submit-button"

type SearchParams = Promise<{ sent?: string; debug?: string; error?: string }>

async function requestLoginLinkAction(formData: FormData) {
  "use server"

  const email = String(formData.get("email") || "").trim().toLowerCase()

  if (!email || !email.includes("@")) {
    redirect("/chauffeur/login?sent=1")
  }

  const supabase = getSupabaseServiceClient()
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, email, active, approval_status")
    .eq("email", email)
    .maybeSingle()

  const canSend = Boolean(
    driver && driver.active && driver.approval_status === "approved"
  )

  if (canSend && driver) {
    try {
      const token = await createDriverAccessToken(driver.id, 30)
      const sendResult = await sendDriverLoginLinkEmail(driver.email, token)

      if (!sendResult.sent && process.env.NODE_ENV !== "production") {
        redirect(
          `/chauffeur/login?sent=1&debug=${encodeURIComponent(
            sendResult.error || sendResult.reason || "send_failed"
          )}`
        )
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        redirect(
          `/chauffeur/login?sent=1&debug=${encodeURIComponent(
            error instanceof Error ? error.message : "send_failed"
          )}`
        )
      }
    }
  }

  redirect("/chauffeur/login?sent=1")
}

export default async function ChauffeurLoginPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const existing = await getChauffeurSession()
  if (existing) redirect("/chauffeur")

  const params = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <p className="text-base font-semibold text-[#F5F1E8]">
            AlmereTaxi<span className="text-[#D6B58A]">Boeken</span>
          </p>
          <p className="mt-1 text-xs text-[#7F776E]">Chauffeurportaal</p>
        </div>

        <div className="rounded-2xl border border-[#292520] bg-[#0D0C0B] p-6">
          <h1 className="text-lg font-bold text-[#F5F1E8]">Inloggen</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-[#7F776E]">
            Vul uw e-mailadres in. Als uw profiel is goedgekeurd, ontvangt u een
            beveiligde inloglink.
          </p>

          {/* Error state */}
          {params.error && (
            <div className="mt-4 rounded-lg border border-[#D94A4A]/20 bg-[#D94A4A]/[0.06] px-3 py-3">
              <p className="text-xs font-medium text-[#D94A4A]">Inloglink ongeldig</p>
              <p className="mt-0.5 text-xs text-[#D94A4A]/70">
                De link is verlopen of al gebruikt. Vraag hieronder een nieuwe aan.
              </p>
            </div>
          )}

          {/* Sent confirmation */}
          {params.sent === "1" ? (
            <div className="mt-4 rounded-lg border border-[#22A06B]/20 bg-[#22A06B]/[0.06] px-3 py-3">
              <p className="text-xs font-semibold text-[#22A06B]">Controleer uw inbox</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#22A06B]/70">
                Als dit e-mailadres is goedgekeurd, ontvangt u binnen enkele minuten een
                inloglink.
              </p>
              {process.env.NODE_ENV !== "production" && params.debug && (
                <p className="mt-2 text-[11px] text-[#7F776E]">Dev: {params.debug}</p>
              )}
            </div>
          ) : (
            <form action={requestLoginLinkAction} className="mt-5 space-y-3">
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="naam@voorbeeld.nl"
                className="h-11 w-full rounded-xl border border-[#292520] bg-[#141210] px-3 text-sm text-[#F5F1E8] outline-none placeholder:text-[#7F776E] focus:border-[#D6B58A]/50 focus:bg-[#1B1815]"
              />
              <PendingSubmitButton
                idleLabel="Inloglink versturen"
                pendingLabel="Versturen…"
                className="h-11 w-full rounded-xl border border-[#D6B58A]/40 bg-[#D6B58A]/[0.08] text-sm font-semibold text-[#D6B58A] hover:bg-[#D6B58A]/[0.15]"
              />
            </form>
          )}

          {params.sent === "1" && (
            <form action={requestLoginLinkAction} className="mt-4 space-y-3">
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="naam@voorbeeld.nl"
                className="h-11 w-full rounded-xl border border-[#292520] bg-[#141210] px-3 text-sm text-[#F5F1E8] outline-none placeholder:text-[#7F776E] focus:border-[#D6B58A]/50 focus:bg-[#1B1815]"
              />
              <PendingSubmitButton
                idleLabel="Opnieuw versturen"
                pendingLabel="Versturen…"
                className="h-11 w-full rounded-xl border border-[#292520] bg-transparent text-sm font-semibold text-[#B7AEA2] hover:bg-[#141210]"
              />
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
