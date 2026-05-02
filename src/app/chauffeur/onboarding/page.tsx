import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { hashInviteToken } from "@/lib/driver-invite"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

type SearchParams = Promise<{ token?: string; success?: string; error?: string }>

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])

const maxFileSize = 8 * 1024 * 1024

function safeName(name: string) {
  const ext = name.includes(".") ? name.split(".").pop() : "bin"
  return `${crypto.randomUUID()}.${String(ext || "bin").toLowerCase()}`
}

function validateFile(file: File | null, required: boolean, label: string) {
  if (!file || file.size === 0) {
    if (required) return `${label} is verplicht.`
    return null
  }
  if (!allowedMimeTypes.has(file.type)) return `${label}: ongeldig bestandstype.`
  if (file.size > maxFileSize) return `${label}: bestand is groter dan 8MB.`
  return null
}

async function submitOnboardingAction(formData: FormData) {
  "use server"

  const token = String(formData.get("token") || "")
  if (!token) redirect("/chauffeur/onboarding?error=Uitnodiging%20verlopen%20of%20ongeldig")

  const tokenHash = hashInviteToken(token)
  const supabase = getSupabaseServiceClient()

  const { data: invite } = await supabase
    .from("driver_invites")
    .select("id, driver_id, email, status, expires_at")
    .eq("token_hash", tokenHash)
    .eq("status", "pending")
    .maybeSingle()

  if (!invite || new Date(invite.expires_at).getTime() < Date.now()) {
    redirect("/chauffeur/onboarding?error=Uitnodiging%20verlopen%20of%20ongeldig")
  }

  const firstName = String(formData.get("first_name") || "").trim()
  const lastName = String(formData.get("last_name") || "").trim()
  const phone = String(formData.get("phone") || "").trim()
  const address = String(formData.get("address") || "").trim()
  const vehicleType = String(formData.get("vehicle_type") || "").trim()
  const licensePlate = String(formData.get("license_plate") || "").trim()

  if (!firstName || !lastName || !phone || !address || !vehicleType || !licensePlate) {
    redirect("/chauffeur/onboarding?token=" + encodeURIComponent(token) + "&error=Vul%20alle%20verplichte%20velden%20in")
  }

  const driverLicense = formData.get("driver_license") as File | null
  const taxiPass = formData.get("taxi_pass") as File | null
  const identityDocument = formData.get("identity_document") as File | null

  const fileErrors = [
    validateFile(driverLicense, true, "Rijbewijs"),
    validateFile(taxiPass, true, "Chauffeurspas"),
    validateFile(identityDocument, false, "ID document"),
  ].filter(Boolean)

  if (fileErrors.length) {
    redirect(`/chauffeur/onboarding?token=${encodeURIComponent(token)}&error=${encodeURIComponent(fileErrors[0] || "Uploadfout")}`)
  }

  const uploadFile = async (file: File | null, folder: string) => {
    if (!file || file.size === 0) return null

    const buffer = Buffer.from(await file.arrayBuffer())
    const path = `drivers/${invite.driver_id}/${folder}/${safeName(file.name)}`

    const { error } = await supabase.storage.from("driver-documents").upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

    if (error) {
      throw new Error(`Upload mislukt: ${folder}`)
    }

    return path
  }

  try {
    const [driverLicensePath, taxiPassPath, identityPath] = await Promise.all([
      uploadFile(driverLicense, "driver_license"),
      uploadFile(taxiPass, "taxi_pass"),
      uploadFile(identityDocument, "identity_document"),
    ])

    await supabase
      .from("drivers")
      .update({
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        phone,
        address,
        vehicle_type: vehicleType,
        license_plate: licensePlate,
        driver_license_path: driverLicensePath,
        taxi_pass_path: taxiPassPath,
        identity_document_path: identityPath,
        onboarding_status: "submitted",
        approval_status: "pending",
        active: false,
        status: "pending_review",
        onboarded_at: new Date().toISOString(),
      })
      .eq("id", invite.driver_id)

    await supabase
      .from("driver_invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id)

    revalidatePath("/admin/chauffeurs")
    redirect("/chauffeur/onboarding?success=1")
  } catch {
    redirect(`/chauffeur/onboarding?token=${encodeURIComponent(token)}&error=${encodeURIComponent("Opslaan mislukt. Probeer opnieuw.")}`)
  }
}

export default async function ChauffeurOnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  if (params.success === "1") {
    return (
      <section className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
        <div className="w-full rounded-2xl border border-[#292520] bg-[#141210] p-6">
          <h1 className="text-3xl font-semibold">Gegevens ontvangen</h1>
          <p className="mt-3 text-sm text-[#B7AEA2]">
            Uw profiel is verzonden ter controle. U ontvangt toegang zodra uw profiel is goedgekeurd.
          </p>
        </div>
      </section>
    )
  }

  const token = String(params.token || "").trim()
  if (!token) {
    return (
      <section className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
        <div className="w-full rounded-2xl border border-[#D94A4A]/30 bg-[#141210] p-6">
          <h1 className="text-2xl font-semibold">Uitnodiging verlopen of ongeldig</h1>
        </div>
      </section>
    )
  }

  const tokenHash = hashInviteToken(token)
  const supabase = getSupabaseServiceClient()
  const { data: invite } = await supabase
    .from("driver_invites")
    .select("id, email, expires_at, status")
    .eq("token_hash", tokenHash)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()

  const expired = !invite

  if (expired) {
    return (
      <section className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
        <div className="w-full rounded-2xl border border-[#D94A4A]/30 bg-[#141210] p-6">
          <h1 className="text-2xl font-semibold">Uitnodiging verlopen of ongeldig</h1>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <div className="rounded-2xl border border-[#292520] bg-[#141210] p-6">
        <h1 className="text-2xl font-semibold">Chauffeurprofiel aanmaken</h1>
        <p className="mt-2 text-sm text-[#B7AEA2]">Vul uw gegevens aan zodat AlmereTaxiBoeken uw profiel kan controleren.</p>

        {params.error ? (
          <p className="mt-3 rounded-md border border-[#D94A4A]/30 bg-[#D94A4A]/10 px-3 py-2 text-xs text-[#ffb4b4]">{params.error}</p>
        ) : null}

        <form action={submitOnboardingAction} className="mt-5 space-y-5">
          <input type="hidden" name="token" value={token} />

          <div className="grid gap-3 sm:grid-cols-2">
            <input name="first_name" required placeholder="Voornaam" className="h-11 rounded-md border border-[#292520] bg-[#0D0C0B] px-3 text-sm" />
            <input name="last_name" required placeholder="Achternaam" className="h-11 rounded-md border border-[#292520] bg-[#0D0C0B] px-3 text-sm" />
            <input value={invite.email} disabled className="h-11 rounded-md border border-[#292520] bg-[#0B0A09] px-3 text-sm text-[#8F877D] sm:col-span-2" />
            <input name="phone" required placeholder="Telefoonnummer" className="h-11 rounded-md border border-[#292520] bg-[#0D0C0B] px-3 text-sm" />
            <input name="address" required placeholder="Adres" className="h-11 rounded-md border border-[#292520] bg-[#0D0C0B] px-3 text-sm" />
            <select name="vehicle_type" required className="h-11 rounded-md border border-[#292520] bg-[#0D0C0B] px-3 text-sm">
              <option value="">Voertuigtype kiezen</option>
              <option value="taxi">taxi</option>
              <option value="taxibus">taxibus</option>
            </select>
            <input name="license_plate" required placeholder="Kenteken" className="h-11 rounded-md border border-[#292520] bg-[#0D0C0B] px-3 text-sm" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-[#B7AEA2]">
              Rijbewijs (pdf/jpg/png/webp, max 8MB)
              <input name="driver_license" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp" className="mt-1 block w-full text-xs" />
            </label>

            <label className="text-sm text-[#B7AEA2]">
              Chauffeurspas / taxipas (pdf/jpg/png/webp, max 8MB)
              <input name="taxi_pass" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp" className="mt-1 block w-full text-xs" />
            </label>

            <label className="text-sm text-[#B7AEA2] sm:col-span-2">
              ID document (optioneel)
              <input name="identity_document" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="mt-1 block w-full text-xs" />
            </label>
          </div>

          <button className="rounded-md border border-[#3A2D1F] px-4 py-2 text-sm font-semibold text-[#D6B58A] hover:bg-[#1B1815]">
            Gegevens verzenden
          </button>
        </form>
      </div>
    </section>
  )
}
