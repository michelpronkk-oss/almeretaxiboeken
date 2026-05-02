import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { hashInviteToken } from "@/lib/driver-invite"
import { getSupabaseServiceClient } from "@/lib/supabase/server"
import OnboardingWizard, { OnboardingInvalidCard, OnboardingSuccessCard } from "./onboarding-wizard"

type SearchParams = Promise<{ token?: string; success?: string; error?: string }>

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])

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
  if (file.size > 8 * 1024 * 1024) return `${label}: bestand is groter dan 8MB.`
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
    return <OnboardingSuccessCard />
  }

  const token = String(params.token || "").trim()
  if (!token) {
    return <OnboardingInvalidCard />
  }

  const tokenHash = hashInviteToken(token)
  const supabase = getSupabaseServiceClient()
  const { data: invite } = await supabase
    .from("driver_invites")
    .select("id, email")
    .eq("token_hash", tokenHash)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()

  if (!invite) {
    return <OnboardingInvalidCard />
  }

  return <OnboardingWizard token={token} email={invite.email} error={params.error} submitAction={submitOnboardingAction} />
}
