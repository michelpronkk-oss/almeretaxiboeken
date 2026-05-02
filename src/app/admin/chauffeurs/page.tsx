import Link from "next/link"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import PendingSubmitButton from "@/components/internal/pending-submit-button"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { createDriverAccessToken } from "@/lib/driver-access"
import { sendDriverApprovedEmail } from "@/lib/driver-access-email"
import { sendDriverInviteEmail } from "@/lib/driver-invite-email"
import { generateInviteToken, hashInviteToken, inviteExpiresAt } from "@/lib/driver-invite"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

type SearchParams = Promise<{
  sent?: string
  email?: string
  inviteLink?: string
  error?: string
  actionStatus?: string
  actionError?: string
}>

function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) return configured.replace(/\/$/, "")
  return "http://localhost:3000"
}

async function createInvite(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase()
  if (!email || !email.includes("@")) {
    return { ok: false as const, error: "Voer een geldig e-mailadres in." }
  }

  const supabase = getSupabaseServiceClient()

  const { data: existingDriver } = await supabase
    .from("drivers")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  let driverId = existingDriver?.id

  if (!driverId) {
    const { data: createdDriver, error: createDriverError } = await supabase
      .from("drivers")
      .insert({
        email,
        active: false,
        status: "invited",
        onboarding_status: "invited",
        approval_status: "pending",
        invited_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (createDriverError || !createdDriver) {
      return { ok: false as const, error: "Chauffeur kon niet worden aangemaakt." }
    }

    driverId = createdDriver.id
  } else {
    await supabase
      .from("drivers")
      .update({
        invited_at: new Date().toISOString(),
        onboarding_status: "invited",
        approval_status: "pending",
        active: false,
        status: "invited",
      })
      .eq("id", driverId)
  }

  const token = generateInviteToken()
  const tokenHash = hashInviteToken(token)

  const { error: inviteError } = await supabase.from("driver_invites").insert({
    driver_id: driverId,
    email,
    token_hash: tokenHash,
    status: "pending",
    expires_at: inviteExpiresAt(7),
  })

  if (inviteError) {
    return { ok: false as const, error: "Uitnodiging kon niet worden opgeslagen." }
  }

  const onboardingUrl = `${getSiteUrl()}/chauffeur/onboarding?token=${token}`
  const mail = await sendDriverInviteEmail({ to: email, onboardingUrl })

  return { ok: true as const, email, onboardingUrl, sent: mail.sent }
}

async function inviteDriverAction(formData: FormData) {
  "use server"

  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const email = String(formData.get("email") || "")
  const result = await createInvite(email)

  if (!result.ok) {
    redirect(`/admin/chauffeurs?error=${encodeURIComponent(result.error)}`)
  }

  revalidatePath("/admin/chauffeurs")

  if (!result.sent) {
    redirect(
      `/admin/chauffeurs?sent=1&email=${encodeURIComponent(result.email)}&inviteLink=${encodeURIComponent(result.onboardingUrl)}`,
    )
  }

  redirect(`/admin/chauffeurs?sent=1&email=${encodeURIComponent(result.email)}`)
}

async function resendInviteAction(formData: FormData) {
  "use server"

  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const email = String(formData.get("email") || "")
  const result = await createInvite(email)

  if (!result.ok) {
    redirect(`/admin/chauffeurs?actionError=${encodeURIComponent(result.error)}`)
  }

  revalidatePath("/admin/chauffeurs")

  if (!result.sent) {
    redirect(`/admin/chauffeurs?actionStatus=${encodeURIComponent("Uitnodiging aangemaakt. Resend is niet ingesteld.")}`)
  }

  redirect(`/admin/chauffeurs?actionStatus=${encodeURIComponent("Uitnodiging verstuurd.")}`)
}

async function approveDriverAction(formData: FormData) {
  "use server"

  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const driverId = String(formData.get("driverId") || "")
  if (!driverId) return

  try {
    const supabase = getSupabaseServiceClient()

    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id, email")
      .eq("id", driverId)
      .maybeSingle()

    if (driverError || !driver) {
      redirect(`/admin/chauffeurs?actionError=${encodeURIComponent("Chauffeur niet gevonden.")}`)
    }

    const { error: approveError } = await supabase
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

    if (approveError) {
      redirect(`/admin/chauffeurs?actionError=${encodeURIComponent("Goedkeuren mislukt.")}`)
    }

    const accessToken = await createDriverAccessToken(driver.id, 60 * 24 * 7)
    const emailResult = await sendDriverApprovedEmail(driver.email, accessToken)

    revalidatePath("/admin/chauffeurs")

    if (!emailResult.sent) {
      redirect(`/admin/chauffeurs?actionStatus=${encodeURIComponent("Chauffeur goedgekeurd. E-mail niet verzonden (Resend ontbreekt).")}`)
    }

    redirect(`/admin/chauffeurs?actionStatus=${encodeURIComponent("Chauffeur goedgekeurd en e-mail verzonden.")}`)
  } catch {
    redirect(`/admin/chauffeurs?actionError=${encodeURIComponent("Goedkeuren mislukt.")}`)
  }
}

async function deactivateDriverAction(formData: FormData) {
  "use server"

  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const driverId = String(formData.get("driverId") || "")
  if (!driverId) return

  const supabase = getSupabaseServiceClient()
  await supabase
    .from("drivers")
    .update({
      active: false,
      status: "inactive",
    })
    .eq("id", driverId)

  revalidatePath("/admin/chauffeurs")
  redirect(`/admin/chauffeurs?actionStatus=${encodeURIComponent("Chauffeur gedeactiveerd.")}`)
}

export default async function AdminChauffeursPage({ searchParams }: { searchParams: SearchParams }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const params = await searchParams
  const supabase = getSupabaseServiceClient()
  const { data: drivers } = await supabase
    .from("drivers")
    .select(
      "id, first_name, last_name, full_name, email, phone, vehicle_type, license_plate, onboarding_status, approval_status, active",
    )
    .order("created_at", { ascending: false })

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chauffeurs</h1>
        <p className="mt-2 text-sm text-[#B7AEA2]">Beheer chauffeurs, voertuigen en beschikbaarheid.</p>
      </div>

      <div className="rounded-2xl border border-[#292520] bg-[#141210] p-5">
        <h2 className="text-lg font-semibold">Chauffeur uitnodigen</h2>
        <p className="mt-1 text-sm text-[#B7AEA2]">
          Vul alleen het e-mailadres in. De chauffeur ontvangt een beveiligde link om het profiel compleet te maken.
        </p>

        <form action={inviteDriverAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            name="email"
            required
            placeholder="naam@voorbeeld.nl"
            className="h-11 flex-1 rounded-md border border-[#292520] bg-[#0D0C0B] px-3 text-sm"
          />
          <PendingSubmitButton
            idleLabel="Uitnodiging versturen"
            pendingLabel="Uitnodiging versturen..."
            className="rounded-md border border-[#3A2D1F] px-4 py-2 text-sm font-semibold text-[#D6B58A] hover:bg-[#1B1815]"
          />
        </form>

        {params.sent === "1" && params.email ? (
          <p className="mt-3 rounded-md border border-[#22A06B]/30 bg-[#22A06B]/10 px-3 py-2 text-xs text-[#9de2c5]">
            Uitnodiging verstuurd naar {params.email}.
          </p>
        ) : null}

        {params.error ? (
          <p className="mt-3 rounded-md border border-[#D94A4A]/30 bg-[#D94A4A]/10 px-3 py-2 text-xs text-[#ffb4b4]">
            {params.error}
          </p>
        ) : null}

        {params.actionStatus ? (
          <p className="mt-3 rounded-md border border-[#22A06B]/30 bg-[#22A06B]/10 px-3 py-2 text-xs text-[#9de2c5]">{params.actionStatus}</p>
        ) : null}

        {params.actionError ? (
          <p className="mt-3 rounded-md border border-[#D94A4A]/30 bg-[#D94A4A]/10 px-3 py-2 text-xs text-[#ffb4b4]">{params.actionError}</p>
        ) : null}

        {params.inviteLink ? (
          <div className="mt-3 rounded-md border border-[#D6B58A]/30 bg-[#3A2D1F]/20 p-3">
            <p className="text-xs text-[#D6B58A]">Resend is niet ingesteld. Kopieer deze uitnodigingslink handmatig.</p>
            <input
              readOnly
              value={params.inviteLink}
              className="mt-2 h-10 w-full rounded-md border border-[#292520] bg-[#0D0C0B] px-3 text-xs text-[#B7AEA2]"
            />
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#292520] bg-[#141210]">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[#292520] bg-[#0D0C0B] text-left text-xs text-[#8F877D]">
            <tr>
              <th className="px-3 py-2">Naam</th>
              <th className="px-3 py-2">E-mail</th>
              <th className="px-3 py-2">Telefoon</th>
              <th className="px-3 py-2">Voertuig</th>
              <th className="px-3 py-2">Kenteken</th>
              <th className="px-3 py-2">Onboarding</th>
              <th className="px-3 py-2">Controle</th>
              <th className="px-3 py-2">Actief</th>
              <th className="px-3 py-2">Acties</th>
            </tr>
          </thead>
          <tbody>
            {drivers?.map((driver) => {
              const firstLast = [driver.first_name, driver.last_name].filter(Boolean).join(" ")
              const name = firstLast || driver.full_name || "Nog niet ingevuld"

              return (
                <tr key={driver.id} className="border-b border-[#292520]/60 align-top">
                  <td className="px-3 py-3">{name}</td>
                  <td className="px-3 py-3 text-[#B7AEA2]">{driver.email}</td>
                  <td className="px-3 py-3 text-[#B7AEA2]">{driver.phone || "-"}</td>
                  <td className="px-3 py-3 text-[#B7AEA2]">{driver.vehicle_type || "-"}</td>
                  <td className="px-3 py-3 text-[#B7AEA2]">{driver.license_plate || "-"}</td>
                  <td className="px-3 py-3 text-[#B7AEA2]">{driver.onboarding_status}</td>
                  <td className="px-3 py-3 text-[#B7AEA2]">{driver.approval_status === "pending" ? "Wacht op controle" : driver.approval_status}</td>
                  <td className="px-3 py-3 text-[#B7AEA2]">{driver.active ? "Ja" : "Nee"}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/chauffeurs/${driver.id}`}
                        className="rounded-md border border-[#292520] px-2 py-1 text-xs text-[#B7AEA2] hover:text-[#F5F1E8]"
                      >
                        Bekijken
                      </Link>

                      <form action={resendInviteAction}>
                        <input type="hidden" name="email" value={driver.email || ""} />
                        <PendingSubmitButton
                          idleLabel="Opnieuw uitnodigen"
                          pendingLabel="Uitnodiging versturen..."
                          className="rounded-md border border-[#3A2D1F] px-2 py-1 text-xs text-[#D6B58A] hover:bg-[#1B1815]"
                        />
                      </form>

                      {driver.onboarding_status === "submitted" ? (
                        <form action={approveDriverAction}>
                          <input type="hidden" name="driverId" value={driver.id} />
                          <PendingSubmitButton
                            idleLabel="Goedkeuren"
                            pendingLabel="Goedkeuren..."
                            className="rounded-md border border-[#22A06B]/40 px-2 py-1 text-xs text-[#9de2c5] hover:bg-[#22A06B]/10"
                          />
                        </form>
                      ) : null}

                      <form action={deactivateDriverAction}>
                        <input type="hidden" name="driverId" value={driver.id} />
                        <PendingSubmitButton
                          idleLabel="Deactiveren"
                          pendingLabel="Deactiveren..."
                          className="rounded-md border border-[#D94A4A]/40 px-2 py-1 text-xs text-[#ffb4b4] hover:bg-[#D94A4A]/10"
                        />
                      </form>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
