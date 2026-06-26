import Link from "next/link"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import PendingSubmitButton from "@/components/internal/pending-submit-button"
import DeleteDriverButton from "@/components/internal/delete-driver-button"
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
  deleted?: string
}>

type DriverRow = {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
  phone: string | null
  vehicle_type: string | null
  license_plate: string | null
  onboarding_status: string | null
  approval_status: string | null
  active: boolean | null
  is_owner: boolean | null
  default_assign: boolean | null
  can_dispatch: boolean | null
  deleted_at?: string | null
}

const DRIVER_COLS =
  "id, first_name, last_name, full_name, email, phone, vehicle_type, license_plate, onboarding_status, approval_status, active, is_owner, default_assign, can_dispatch, deleted_at"

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
    .select("id, active, approval_status, onboarding_status")
    .ilike("email", email)
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
    if (existingDriver?.active && existingDriver.approval_status === "approved") {
      return { ok: false as const, error: "Deze chauffeur is al actief. Verstuur een inloglink via de chauffeur login." }
    }

    if (existingDriver?.onboarding_status === "submitted") {
      return { ok: false as const, error: "Deze chauffeur heeft het profiel al ingediend. Controleer en keur goed of wijs af." }
    }

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
    redirect(
      `/admin/chauffeurs?actionStatus=${encodeURIComponent("Uitnodiging aangemaakt. Kopieer de link handmatig.")}&inviteLink=${encodeURIComponent(result.onboardingUrl)}`,
    )
  }

  redirect(`/admin/chauffeurs?actionStatus=${encodeURIComponent("Uitnodiging verstuurd.")}`)
}

async function approveDriverAction(formData: FormData) {
  "use server"

  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const driverId = String(formData.get("driverId") || "")
  if (!driverId) return

  // NOTE: redirect() throws a NEXT_REDIRECT error internally.
  // Never place redirect() inside a try/catch — it will be swallowed by the catch block
  // and re-directed to the error path even when the operation succeeded.
  // All redirect() calls are outside try/catch here.

  const supabase = getSupabaseServiceClient()

  const { data: driver, error: findError } = await supabase
    .from("drivers")
    .select("id, email")
    .eq("id", driverId)
    .maybeSingle()

  if (findError || !driver) {
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
      deleted_at: null,
      archived_at: null,
    })
    .eq("id", driverId)

  if (approveError) {
    console.error("[admin-driver-approve] updateSuccess: false, error:", approveError.message)
    redirect(`/admin/chauffeurs?actionError=${encodeURIComponent("Goedkeuren mislukt.")}`)
  }

  revalidatePath("/admin/chauffeurs")
  revalidatePath(`/admin/chauffeurs/${driverId}`)
  revalidatePath("/admin")

  // Email is best-effort — wrap only this in try/catch, never the redirect calls
  let emailSent = false
  let emailWarning = ""
  try {
    const accessToken = await createDriverAccessToken(driver!.id, 60 * 24 * 7)
    const mail = await sendDriverApprovedEmail(driver!.email, accessToken)
    emailSent = mail.sent
    if (!emailSent) emailWarning = "E-mail niet verzonden (Resend ontbreekt)."
  } catch {
    emailWarning = "E-mail kon niet worden verzonden."
  }

  console.log("[admin-driver-approve]", {
    driverId,
    email: driver!.email,
    updateSuccess: true,
    emailAttempted: true,
    emailSent,
    returnedSuccess: true,
  })

  if (emailWarning) {
    redirect(`/admin/chauffeurs?actionStatus=${encodeURIComponent(`Chauffeur goedgekeurd. ${emailWarning}`)}`)
  }

  redirect(`/admin/chauffeurs?actionStatus=${encodeURIComponent("Chauffeur goedgekeurd en e-mail verzonden.")}`)
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

async function restoreDriverAction(formData: FormData) {
  "use server"

  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const driverId = String(formData.get("driverId") || "")
  if (!driverId) return

  const supabase = getSupabaseServiceClient()
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, approval_status, active")
    .eq("id", driverId)
    .maybeSingle()

  if (!driver) {
    redirect(`/admin/chauffeurs?deleted=1&actionError=${encodeURIComponent("Chauffeur niet gevonden.")}`)
  }

  const approved = driver.approval_status === "approved"
  const { error } = await supabase
    .from("drivers")
    .update({
      deleted_at: null,
      status: approved && driver.active ? "available" : approved ? "inactive" : "invited",
    })
    .eq("id", driverId)

  if (error) {
    redirect(`/admin/chauffeurs?deleted=1&actionError=${encodeURIComponent("Herstellen mislukt.")}`)
  }

  revalidatePath("/admin/chauffeurs")
  revalidatePath("/admin")
  redirect(`/admin/chauffeurs?actionStatus=${encodeURIComponent("Chauffeur hersteld.")}`)
}

export default async function AdminChauffeursPage({ searchParams }: { searchParams: SearchParams }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const params = await searchParams
  const supabase = getSupabaseServiceClient()
  const showDeleted = params.deleted === "1"

  const [visibleRes, deletedRes] = await Promise.all([
    supabase
      .from("drivers")
      .select(DRIVER_COLS)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("drivers")
      .select(DRIVER_COLS)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(25),
  ])

  // If the filtered query failed (e.g. deleted_at column not yet migrated), fall back
  // to the unfiltered list so approved drivers are never invisible due to a schema gap.
  let drivers = (visibleRes.data ?? []) as DriverRow[]
  let deletedDrivers = (deletedRes.data ?? []) as DriverRow[]
  if (visibleRes.error) {
    console.error("[admin-drivers-list] primary query error:", visibleRes.error.message, "falling back to unfiltered query")
    const { data: fallback } = await supabase
      .from("drivers")
      .select("id, first_name, last_name, full_name, email, phone, vehicle_type, license_plate, onboarding_status, approval_status, active, is_owner, default_assign, can_dispatch")
      .order("created_at", { ascending: false })
    drivers = (fallback ?? []).map((d) => ({ ...d, deleted_at: null }))
    deletedDrivers = []
  }

  console.log("[admin-drivers-list] active count:", drivers.length, "deleted count:", deletedDrivers.length)

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Chauffeurs</h1>
        <p className="mt-2 text-sm text-[#B7AEA2]">Beheer chauffeurs, voertuigen en beschikbaarheid.</p>
      </div>

      {deletedDrivers.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#3A2D1F] bg-[#141210] p-4">
          <div>
            <p className="text-sm font-semibold text-[#F5F1E8]">
              {deletedDrivers.length} verwijderde chauffeur{deletedDrivers.length !== 1 ? "s" : ""} gevonden
            </p>
            <p className="mt-1 text-xs text-[#8F877D]">
              Ze zijn niet weg uit de database, maar verborgen door soft-delete.
            </p>
          </div>
          <Link
            href={showDeleted ? "/admin/chauffeurs" : "/admin/chauffeurs?deleted=1"}
            className="rounded-lg border border-[#3A2D1F] px-3 py-2 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815]"
          >
            {showDeleted ? "Verberg verwijderde" : "Toon verwijderde"}
          </Link>
        </div>
      ) : null}

      {/* Invite card */}
      <div className="rounded-2xl border border-[#292520] bg-[#141210] p-5">
        <h2 className="text-base font-semibold sm:text-lg">Chauffeur uitnodigen</h2>
        <p className="mt-1 text-sm text-[#B7AEA2]">
          Vul het e-mailadres in. De chauffeur ontvangt een beveiligde link om het profiel compleet te maken.
        </p>

        <form action={inviteDriverAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            name="email"
            required
            placeholder="naam@voorbeeld.nl"
            className="h-11 min-w-0 flex-1 rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-base text-[#F5F1E8] placeholder:text-[#8F877D] sm:text-sm"
          />
          <PendingSubmitButton
            idleLabel="Uitnodiging versturen"
            pendingLabel="Versturen..."
            className="h-11 shrink-0 rounded-lg border border-[#3A2D1F] px-5 text-sm font-semibold text-[#D6B58A] hover:bg-[#1B1815]"
          />
        </form>

        {params.sent === "1" && params.email ? (
          <p className="mt-3 rounded-lg border border-[#22A06B]/30 bg-[#22A06B]/10 px-3 py-2 text-xs text-[#9de2c5]">
            Uitnodiging verstuurd naar <span className="break-all">{params.email}</span>.
          </p>
        ) : null}
        {params.error ? (
          <p className="mt-3 rounded-lg border border-[#D94A4A]/30 bg-[#D94A4A]/10 px-3 py-2 text-xs text-[#ffb4b4]">{params.error}</p>
        ) : null}
        {params.actionStatus ? (
          <p className="mt-3 rounded-lg border border-[#22A06B]/30 bg-[#22A06B]/10 px-3 py-2 text-xs text-[#9de2c5]">{params.actionStatus}</p>
        ) : null}
        {params.actionError ? (
          <p className="mt-3 rounded-lg border border-[#D94A4A]/30 bg-[#D94A4A]/10 px-3 py-2 text-xs text-[#ffb4b4]">{params.actionError}</p>
        ) : null}
        {params.inviteLink ? (
          <div className="mt-3 rounded-lg border border-[#D6B58A]/30 bg-[#3A2D1F]/20 p-3">
            <p className="text-xs text-[#D6B58A]">E-mail niet verzonden. Kopieer de link handmatig.</p>
            <input
              readOnly
              value={params.inviteLink}
              className="mt-2 h-10 w-full min-w-0 rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-xs text-[#B7AEA2]"
            />
          </div>
        ) : null}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {!drivers?.length ? (
          <p className="text-sm text-[#8F877D]">
            Geen actieve chauffeurs gevonden.{deletedDrivers.length > 0 ? " Bekijk verwijderde chauffeurs om ze te herstellen." : ""}
          </p>
        ) : null}
        {drivers?.map((driver) => {
          const firstLast = [driver.first_name, driver.last_name].filter(Boolean).join(" ")
          const name = firstLast || driver.full_name || "Nog niet ingevuld"
              const isOwner = Boolean(driver.is_owner || driver.default_assign)
              const canResendInvite = !driver.active && driver.approval_status !== "approved" && driver.onboarding_status !== "submitted"
              const statusLabel =
                driver.active ? "Actief"
            : driver.approval_status === "approved" ? "Goedgekeurd"
            : driver.onboarding_status === "submitted" ? "Voor controle"
            : "Uitgenodigd"
          const statusStyle =
            driver.active ? "border-[#22A06B]/30 bg-[#22A06B]/10 text-[#22A06B]"
            : driver.onboarding_status === "submitted" ? "border-[#D6B58A]/30 bg-[#D6B58A]/10 text-[#D6B58A]"
            : "border-[#292520] bg-[#0D0C0B] text-[#B7AEA2]"

          return (
            <article key={driver.id} className="rounded-2xl border border-[#292520] bg-[#141210] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-semibold text-[#F5F1E8]">{name}</p>
                    {driver.is_owner && (
                      <span className="rounded-full border border-[#D6B58A]/40 bg-[#D6B58A]/10 px-2 py-0.5 text-[9px] font-semibold text-[#D6B58A]">Eigenaar</span>
                    )}
                    {driver.default_assign && !driver.is_owner && (
                      <span className="rounded-full border border-[#D6B58A]/30 bg-[#D6B58A]/5 px-2 py-0.5 text-[9px] text-[#D6B58A]">Standaard</span>
                    )}
                    {driver.can_dispatch && (
                      <span className="rounded-full border border-[#22A06B]/30 bg-[#22A06B]/5 px-2 py-0.5 text-[9px] text-[#22A06B]">Planning</span>
                    )}
                  </div>
                  <p className="mt-0.5 break-all text-xs text-[#B7AEA2]">{driver.email}</p>
                  {driver.phone ? <p className="mt-0.5 text-xs text-[#8F877D]">{driver.phone}</p> : null}
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusStyle}`}>
                  {statusLabel}
                </span>
              </div>
              {(driver.vehicle_type || driver.license_plate) ? (
                <p className="mt-2 text-xs text-[#8F877D]">
                  {[driver.vehicle_type, driver.license_plate].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/admin/chauffeurs/${driver.id}`}
                  className="rounded-lg border border-[#292520] px-3 py-2 text-xs text-[#B7AEA2] hover:bg-[#141210] hover:text-[#F5F1E8]"
                >
                  Bekijken
                </Link>
                {canResendInvite ? (
                  <form action={resendInviteAction}>
                    <input type="hidden" name="email" value={driver.email || ""} />
                    <PendingSubmitButton
                      idleLabel="Opnieuw uitnodigen"
                      pendingLabel="Versturen..."
                      className="rounded-lg border border-[#3A2D1F] px-3 py-2 text-xs text-[#D6B58A] hover:bg-[#1B1815]"
                    />
                  </form>
                ) : null}
                {driver.onboarding_status === "submitted" ? (
                  <form action={approveDriverAction}>
                    <input type="hidden" name="driverId" value={driver.id} />
                    <PendingSubmitButton
                      idleLabel="Goedkeuren"
                      pendingLabel="Goedkeuren..."
                      className="rounded-lg border border-[#22A06B]/40 px-3 py-2 text-xs text-[#9de2c5] hover:bg-[#22A06B]/10"
                    />
                  </form>
                ) : null}
                <form action={deactivateDriverAction}>
                  <input type="hidden" name="driverId" value={driver.id} />
                  <PendingSubmitButton
                    idleLabel="Deactiveren"
                    pendingLabel="Deactiveren..."
                    className="rounded-lg border border-[#D94A4A]/40 px-3 py-2 text-xs text-[#ffb4b4] hover:bg-[#D94A4A]/10"
                  />
                </form>
                <DeleteDriverButton
                  driverId={driver.id}
                  driverName={name}
                  isOwner={isOwner}
                />
              </div>
            </article>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-[#292520] bg-[#141210] lg:block">
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
              const isOwner = Boolean(driver.is_owner || driver.default_assign)
              const canResendInvite = !driver.active && driver.approval_status !== "approved" && driver.onboarding_status !== "submitted"
              return (
                <tr key={driver.id} className="border-b border-[#292520]/60 align-top">
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>{name}</span>
                      {driver.is_owner && (
                        <span className="rounded-full border border-[#D6B58A]/40 bg-[#D6B58A]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#D6B58A]">Eigenaar</span>
                      )}
                      {driver.default_assign && !driver.is_owner && (
                        <span className="rounded-full border border-[#D6B58A]/30 bg-[#D6B58A]/5 px-1.5 py-0.5 text-[9px] text-[#D6B58A]">Standaard</span>
                      )}
                      {driver.can_dispatch && (
                        <span className="rounded-full border border-[#22A06B]/30 bg-[#22A06B]/5 px-1.5 py-0.5 text-[9px] text-[#22A06B]">Planning</span>
                      )}
                    </div>
                  </td>
                  <td className="max-w-[180px] break-all px-3 py-3 text-[#B7AEA2]">{driver.email}</td>
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
                      {canResendInvite ? (
                        <form action={resendInviteAction}>
                          <input type="hidden" name="email" value={driver.email || ""} />
                          <PendingSubmitButton
                            idleLabel="Opnieuw uitnodigen"
                            pendingLabel="Uitnodiging versturen..."
                            className="rounded-md border border-[#3A2D1F] px-2 py-1 text-xs text-[#D6B58A] hover:bg-[#1B1815]"
                          />
                        </form>
                      ) : null}
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
                      <DeleteDriverButton
                        driverId={driver.id}
                        driverName={name}
                        isOwner={isOwner}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showDeleted && deletedDrivers.length > 0 ? (
        <section className="space-y-3 rounded-2xl border border-[#3A2D1F] bg-[#141210] p-4">
          <div>
            <h2 className="text-lg font-semibold text-[#F5F1E8]">Verwijderde chauffeurs</h2>
            <p className="mt-1 text-xs text-[#8F877D]">Herstel een chauffeur om deze weer in de normale lijst te tonen.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {deletedDrivers.map((driver) => {
              const firstLast = [driver.first_name, driver.last_name].filter(Boolean).join(" ")
              const name = firstLast || driver.full_name || "Nog niet ingevuld"
              return (
                <article key={driver.id} className="rounded-xl border border-[#292520] bg-[#0D0C0B] p-4">
                  <p className="font-semibold text-[#F5F1E8]">{name}</p>
                  <p className="mt-1 break-all text-xs text-[#B7AEA2]">{driver.email || "-"}</p>
                  <p className="mt-1 text-xs text-[#8F877D]">
                    Verwijderd: {driver.deleted_at ? new Date(driver.deleted_at).toLocaleString("nl-NL") : "-"}
                  </p>
                  <form action={restoreDriverAction} className="mt-3">
                    <input type="hidden" name="driverId" value={driver.id} />
                    <PendingSubmitButton
                      idleLabel="Herstellen"
                      pendingLabel="Herstellen..."
                      className="rounded-lg border border-[#22A06B]/40 px-3 py-2 text-xs font-semibold text-[#9de2c5] hover:bg-[#22A06B]/10"
                    />
                  </form>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}
    </section>
  )
}

