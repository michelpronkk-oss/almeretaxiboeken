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
  console.info("[chauffeur-login-link] email received", Boolean(email))

  if (!email || !email.includes("@")) {
    redirect("/chauffeur/login?sent=1")
  }

  const supabase = getSupabaseServiceClient()
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, email, active, approval_status")
    .eq("email", email)
    .maybeSingle()

  const driverFound = Boolean(driver)
  const driverActive = Boolean(driver?.active)
  const approvalStatus = driver?.approval_status || "none"
  const resendConfigured = Boolean(process.env.RESEND_API_KEY && (process.env.DRIVER_INVITE_FROM_EMAIL || process.env.RESEND_FROM_EMAIL))
  const canSend = Boolean(driver && driver.active && driver.approval_status === "approved")

  console.info("[chauffeur-login-link] driver found", driverFound)
  console.info("[chauffeur-login-link] driver active", driverActive)
  console.info("[chauffeur-login-link] approval_status", approvalStatus)
  console.info("[chauffeur-login-link] resend env exists", resendConfigured)
  console.info("[chauffeur-login-link] send attempted", canSend)

  if (canSend && driver) {
    try {
      const token = await createDriverAccessToken(driver.id, 30)
      console.info("[chauffeur-login-link] token stored", true)

      const sendResult = await sendDriverLoginLinkEmail(driver.email, token)
      if (sendResult.sent) {
        console.info("[chauffeur-login-link] resend sent", true)
        console.info("[chauffeur-login-link] resend id", sendResult.id || "no-id")
      } else {
        console.info("[chauffeur-login-link] resend sent", false)
        console.error("[chauffeur-login-link] resend error", sendResult.error || sendResult.reason || "unknown")
        if (process.env.NODE_ENV !== "production") {
          redirect(`/chauffeur/login?sent=1&debug=${encodeURIComponent(sendResult.error || sendResult.reason || "send_failed")}`)
        }
      }
    } catch (error) {
      console.info("[chauffeur-login-link] token stored", false)
      console.error("[chauffeur-login-link] resend error", error instanceof Error ? error.message : "unknown")
      if (process.env.NODE_ENV !== "production") {
        redirect(`/chauffeur/login?sent=1&debug=${encodeURIComponent(error instanceof Error ? error.message : "send_failed")}`)
      }
    }
  }

  redirect("/chauffeur/login?sent=1")
}

export default async function ChauffeurLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const existing = await getChauffeurSession()
  if (existing) redirect("/chauffeur")

  const params = await searchParams

  return (
    <section className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <div className="w-full rounded-2xl border border-[#292520] bg-[#141210] p-6">
        <h1 className="text-2xl font-semibold">Chauffeur login</h1>
        <p className="mt-2 text-sm text-[#B7AEA2]">Vul uw e-mailadres in. Als uw profiel is goedgekeurd, ontvangt u een beveiligde inloglink.</p>

        {params.error ? (
          <p className="mt-3 rounded-md border border-[#D94A4A]/30 bg-[#D94A4A]/10 px-3 py-2 text-xs text-[#ffb4b4]">
            De inloglink is ongeldig of verlopen. Vraag een nieuwe inloglink aan.
          </p>
        ) : null}

        {params.sent === "1" ? (
          <div className="mt-3 rounded-md border border-[#22A06B]/30 bg-[#22A06B]/10 px-3 py-2 text-xs text-[#9de2c5]">
            <p className="font-semibold">Controleer uw inbox</p>
            <p className="mt-1">Als dit e-mailadres is goedgekeurd, ontvangt u binnen enkele minuten een inloglink.</p>
            {process.env.NODE_ENV !== "production" && params.debug ? (
              <p className="mt-2 text-[#B7AEA2]">Dev debug: {params.debug}</p>
            ) : null}
          </div>
        ) : null}

        <form action={requestLoginLinkAction} className="mt-5 space-y-3">
          <input
            type="email"
            name="email"
            required
            className="h-11 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-base text-[#F5F1E8] outline-none focus:border-[#D6B58A]"
            placeholder="naam@voorbeeld.nl"
          />
          <PendingSubmitButton
            idleLabel="Inloglink versturen"
            pendingLabel="Versturen..."
            className="rounded-lg border border-[#3A2D1F] px-4 py-2 text-sm font-semibold text-[#D6B58A] hover:bg-[#1B1815]"
          />
        </form>
      </div>
    </section>
  )
}
