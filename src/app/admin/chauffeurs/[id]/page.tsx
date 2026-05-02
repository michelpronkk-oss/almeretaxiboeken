import Link from "next/link"
import { revalidatePath } from "next/cache"
import { notFound, redirect } from "next/navigation"
import PendingSubmitButton from "@/components/internal/pending-submit-button"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { createDriverAccessToken } from "@/lib/driver-access"
import { sendDriverApprovedEmail } from "@/lib/driver-access-email"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

type SearchParams = Promise<{ actionStatus?: string; actionError?: string }>

async function approveDriverAction(formData: FormData) {
  "use server"

  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const driverId = String(formData.get("driverId") || "")
  if (!driverId) return

  try {
    const supabase = getSupabaseServiceClient()
    const { data: driver } = await supabase
      .from("drivers")
      .select("id, email")
      .eq("id", driverId)
      .maybeSingle()

    if (!driver) redirect(`/admin/chauffeurs/${driverId}?actionError=${encodeURIComponent("Chauffeur niet gevonden")}`)

    await supabase
      .from("drivers")
      .update({
        approval_status: "approved",
        onboarding_status: "approved",
        active: true,
        status: "available",
        approved_at: new Date().toISOString(),
        approved_by: "admin",
      })
      .eq("id", driverId)

    const accessToken = await createDriverAccessToken(driver.id, 60 * 24 * 7)
    const mail = await sendDriverApprovedEmail(driver.email, accessToken)

    revalidatePath(`/admin/chauffeurs/${driverId}`)
    revalidatePath("/admin/chauffeurs")

    if (!mail.sent) {
      redirect(`/admin/chauffeurs/${driverId}?actionStatus=${encodeURIComponent("Goedgekeurd. E-mail niet verzonden (Resend ontbreekt).")}`)
    }

    redirect(`/admin/chauffeurs/${driverId}?actionStatus=${encodeURIComponent("Goedgekeurd en e-mail verzonden.")}`)
  } catch {
    redirect(`/admin/chauffeurs/${driverId}?actionError=${encodeURIComponent("Goedkeuren mislukt.")}`)
  }
}

async function rejectDriverAction(formData: FormData) {
  "use server"

  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const driverId = String(formData.get("driverId") || "")
  if (!driverId) return

  const supabase = getSupabaseServiceClient()
  await supabase
    .from("drivers")
    .update({
      approval_status: "rejected",
      active: false,
      status: "rejected",
    })
    .eq("id", driverId)

  revalidatePath(`/admin/chauffeurs/${driverId}`)
  revalidatePath("/admin/chauffeurs")
  redirect(`/admin/chauffeurs/${driverId}?actionStatus=${encodeURIComponent("Chauffeur afgewezen.")}`)
}

async function deactivateDriverAction(formData: FormData) {
  "use server"

  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const driverId = String(formData.get("driverId") || "")
  if (!driverId) return

  const supabase = getSupabaseServiceClient()
  await supabase
    .from("drivers")
    .update({ active: false, status: "inactive" })
    .eq("id", driverId)

  revalidatePath(`/admin/chauffeurs/${driverId}`)
  revalidatePath("/admin/chauffeurs")
  redirect(`/admin/chauffeurs/${driverId}?actionStatus=${encodeURIComponent("Chauffeur gedeactiveerd.")}`)
}

export default async function AdminDriverDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: SearchParams
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const { id } = await params
  const qp = await searchParams
  const supabase = getSupabaseServiceClient()

  const { data: driver } = await supabase
    .from("drivers")
    .select(
      "id, first_name, last_name, full_name, email, phone, address, vehicle_type, license_plate, active, status, onboarding_status, approval_status, driver_license_path, taxi_pass_path, identity_document_path, approved_at, onboarded_at",
    )
    .eq("id", id)
    .maybeSingle()

  if (!driver) notFound()

  async function signed(path: string | null) {
    if (!path) return null
    const { data } = await supabase.storage.from("driver-documents").createSignedUrl(path, 60 * 10)
    return data?.signedUrl || null
  }

  const [driverLicenseUrl, taxiPassUrl, identityUrl] = await Promise.all([
    signed(driver.driver_license_path),
    signed(driver.taxi_pass_path),
    signed(driver.identity_document_path),
  ])

  const name = [driver.first_name, driver.last_name].filter(Boolean).join(" ") || driver.full_name || driver.email

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{name}</h1>
          <p className="mt-2 text-sm text-[#B7AEA2]">Chauffeur controleren</p>
        </div>
        <Link href="/admin/chauffeurs" className="rounded-md border border-[#292520] px-3 py-2 text-sm text-[#B7AEA2] hover:text-[#F5F1E8]">
          Terug
        </Link>
      </div>

      {qp.actionStatus ? <p className="rounded-md border border-[#22A06B]/30 bg-[#22A06B]/10 px-3 py-2 text-xs text-[#9de2c5]">{qp.actionStatus}</p> : null}
      {qp.actionError ? <p className="rounded-md border border-[#D94A4A]/30 bg-[#D94A4A]/10 px-3 py-2 text-xs text-[#ffb4b4]">{qp.actionError}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#292520] bg-[#141210] p-5">
          <h2 className="text-lg font-semibold">Status</h2>
          <p className="mt-3 text-sm text-[#B7AEA2]">Onboarding: {driver.onboarding_status}</p>
          <p className="mt-1 text-sm text-[#B7AEA2]">Controle: {driver.approval_status}</p>
          <p className="mt-1 text-sm text-[#B7AEA2]">Actief: {driver.active ? "Ja" : "Nee"}</p>
          <p className="mt-1 text-sm text-[#B7AEA2]">Status: {driver.status}</p>
          <p className="mt-1 text-sm text-[#8F877D]">Ingediend: {driver.onboarded_at || "-"}</p>
          <p className="mt-1 text-sm text-[#8F877D]">Goedgekeurd: {driver.approved_at || "-"}</p>
        </article>

        <article className="rounded-2xl border border-[#292520] bg-[#141210] p-5">
          <h2 className="text-lg font-semibold">Persoonsgegevens</h2>
          <p className="mt-3 text-sm text-[#B7AEA2]">Naam: {name}</p>
          <p className="mt-1 text-sm text-[#B7AEA2]">E-mail: {driver.email}</p>
          <p className="mt-1 text-sm text-[#B7AEA2]">Telefoon: {driver.phone || "-"}</p>
          <p className="mt-1 text-sm text-[#B7AEA2]">Adres: {driver.address || "-"}</p>
        </article>

        <article className="rounded-2xl border border-[#292520] bg-[#141210] p-5">
          <h2 className="text-lg font-semibold">Voertuiggegevens</h2>
          <p className="mt-3 text-sm text-[#B7AEA2]">Voertuigtype: {driver.vehicle_type || "-"}</p>
          <p className="mt-1 text-sm text-[#B7AEA2]">Kenteken: {driver.license_plate || "-"}</p>
        </article>

        <article className="rounded-2xl border border-[#292520] bg-[#141210] p-5">
          <h2 className="text-lg font-semibold">Documenten</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-[#B7AEA2]">Rijbewijs: {driverLicenseUrl ? <a className="text-[#D6B58A] hover:text-[#E4C69E]" href={driverLicenseUrl} target="_blank" rel="noreferrer">Bekijken</a> : "Niet geupload"}</p>
            <p className="text-[#B7AEA2]">Chauffeurspas: {taxiPassUrl ? <a className="text-[#D6B58A] hover:text-[#E4C69E]" href={taxiPassUrl} target="_blank" rel="noreferrer">Bekijken</a> : "Niet geupload"}</p>
            <p className="text-[#B7AEA2]">ID document: {identityUrl ? <a className="text-[#D6B58A] hover:text-[#E4C69E]" href={identityUrl} target="_blank" rel="noreferrer">Bekijken</a> : "Niet geupload"}</p>
          </div>
        </article>
      </div>

      <div className="rounded-2xl border border-[#292520] bg-[#141210] p-5">
        <h2 className="text-lg font-semibold">Acties</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={approveDriverAction}>
            <input type="hidden" name="driverId" value={driver.id} />
            <PendingSubmitButton
              idleLabel="Goedkeuren"
              pendingLabel="Goedkeuren..."
              className="rounded-md border border-[#22A06B]/40 px-3 py-2 text-sm text-[#9de2c5] hover:bg-[#22A06B]/10"
            />
          </form>
          <form action={rejectDriverAction}>
            <input type="hidden" name="driverId" value={driver.id} />
            <PendingSubmitButton
              idleLabel="Afwijzen"
              pendingLabel="Afwijzen..."
              className="rounded-md border border-[#D94A4A]/40 px-3 py-2 text-sm text-[#ffb4b4] hover:bg-[#D94A4A]/10"
            />
          </form>
          <form action={deactivateDriverAction}>
            <input type="hidden" name="driverId" value={driver.id} />
            <PendingSubmitButton
              idleLabel="Deactiveren"
              pendingLabel="Deactiveren..."
              className="rounded-md border border-[#292520] px-3 py-2 text-sm text-[#B7AEA2] hover:text-[#F5F1E8]"
            />
          </form>
        </div>
      </div>
    </section>
  )
}
