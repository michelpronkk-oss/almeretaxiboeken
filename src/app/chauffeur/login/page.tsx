import { redirect } from "next/navigation"
import { getDriverSessionId, setDriverAuthCookie } from "@/lib/driver-auth"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

type SearchParams = Promise<{ error?: string }>

async function loginAction(formData: FormData) {
  "use server"

  const driverId = String(formData.get("driverId") || "").trim()
  const submittedCode = String(formData.get("accessCode") || "").trim()
  const requiredCode = (process.env.DRIVER_ACCESS_PASSWORD || "").trim()

  if (!driverId) redirect("/chauffeur/login?error=1")
  if (requiredCode && submittedCode !== requiredCode) redirect("/chauffeur/login?error=1")

  const supabase = getSupabaseServiceClient()
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, active")
    .eq("id", driverId)
    .maybeSingle()

  if (!driver || !driver.active) redirect("/chauffeur/login?error=1")

  await setDriverAuthCookie(driverId)
  redirect("/chauffeur")
}

export default async function ChauffeurLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const existing = await getDriverSessionId()
  if (existing) redirect("/chauffeur")

  const params = await searchParams

  return (
    <section className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <div className="w-full rounded-2xl border border-[#292520] bg-[#141210] p-6">
        <h1 className="text-2xl font-semibold">Chauffeur login</h1>
        <p className="mt-2 text-sm text-[#B7AEA2]">Log in om uw toegewezen ritten te bekijken.</p>

        {params.error ? (
          <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300">Inloggen mislukt. Controleer uw gegevens.</p>
        ) : null}

        <form action={loginAction} className="mt-5 space-y-3">
          <input
            type="text"
            name="driverId"
            required
            className="h-11 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8] outline-none focus:border-[#D6B58A]"
            placeholder="Driver ID"
          />
          <input
            type="password"
            name="accessCode"
            className="h-11 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8] outline-none focus:border-[#D6B58A]"
            placeholder="Toegangscode (optioneel)"
          />
          <button className="rounded-lg border border-[#3A2D1F] px-4 py-2 text-sm font-semibold text-[#D6B58A] hover:bg-[#1B1815]">
            Inloggen
          </button>
        </form>

        <p className="mt-4 text-xs text-[#7F776E]">
          TODO: vervang deze interne v1 login met Supabase Auth magic-link login voor bredere uitrol.
        </p>
      </div>
    </section>
  )
}
