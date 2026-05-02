import { redirect } from "next/navigation"
import { getDriverSessionId } from "@/lib/driver-auth"
import { createDriverAccessToken } from "@/lib/driver-access"
import { sendDriverLoginLinkEmail } from "@/lib/driver-access-email"
import { getSupabaseServiceClient } from "@/lib/supabase/server"
import PendingSubmitButton from "@/components/internal/pending-submit-button"

type SearchParams = Promise<{ sent?: string }>

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

  if (driver && driver.active && driver.approval_status === "approved") {
    const token = await createDriverAccessToken(driver.id, 30)
    await sendDriverLoginLinkEmail(driver.email, token)
  }

  redirect("/chauffeur/login?sent=1")
}

export default async function ChauffeurLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const existing = await getDriverSessionId()
  if (existing) redirect("/chauffeur")

  const params = await searchParams

  return (
    <section className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <div className="w-full rounded-2xl border border-[#292520] bg-[#141210] p-6">
        <h1 className="text-2xl font-semibold">Chauffeur login</h1>
        <p className="mt-2 text-sm text-[#B7AEA2]">Vul uw e-mailadres in. Als uw profiel is goedgekeurd, ontvangt u een beveiligde inloglink.</p>

        {params.sent === "1" ? (
          <div className="mt-3 rounded-md border border-[#22A06B]/30 bg-[#22A06B]/10 px-3 py-2 text-xs text-[#9de2c5]">
            <p className="font-semibold">Controleer uw inbox</p>
            <p className="mt-1">Als dit e-mailadres is goedgekeurd, ontvangt u binnen enkele minuten een inloglink.</p>
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
