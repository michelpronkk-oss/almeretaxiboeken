import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { getValidDriverInviteByToken } from "@/lib/chauffeur/invites"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
])

function safeName(name: string) {
  const baseName = name.split(".")[0] || "foto"
  const cleanedBase = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "foto"
  const extRaw = name.includes(".") ? name.split(".").pop() : "jpg"
  const ext = String(extRaw || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6) || "jpg"
  return `${cleanedBase}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`
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

function fail(step: string, message: string, status = 400, details?: string) {
  if (status >= 500) {
    console.error("[chauffeur-onboarding-submit]", { step, errorMessage: message, details: details || "" })
  }
  return NextResponse.json({ success: false, step, message, details: details || undefined }, { status })
}

export async function POST(request: Request) {
  try {
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      return fail("parse_form_data", "Aanvraag kon niet worden verwerkt.", 400, error instanceof Error ? error.message : "Invalid form data")
    }

    const token = String(formData.get("token") || "")
    if (!token) {
      return fail("token_validation", "Uitnodiging verlopen of ongeldig")
    }

    let invite: Awaited<ReturnType<typeof getValidDriverInviteByToken>>
    try {
      invite = await getValidDriverInviteByToken(token)
    } catch (error) {
      return fail("driver_invite_lookup", "Uitnodiging kon niet worden gecontroleerd.", 500, error instanceof Error ? error.message : "Invite lookup failed")
    }

    if (!invite) {
      return fail("driver_invite_lookup", "Uitnodiging verlopen of ongeldig")
    }

    const firstName = String(formData.get("first_name") || "").trim()
    const lastName = String(formData.get("last_name") || "").trim()
    const phone = String(formData.get("phone") || "").trim()
    const address = String(formData.get("address") || "").trim()
    const vehicleType = String(formData.get("vehicle_type") || "").trim()
    const licensePlate = String(formData.get("license_plate") || "").trim()

    if (!firstName || !lastName || !phone || !address || !vehicleType || !licensePlate) {
      return fail("required_fields", "Vul alle verplichte velden in.")
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
      return fail("file_validation", String(fileErrors[0] || "Ongeldige bestanden."))
    }

    let supabase: ReturnType<typeof getSupabaseServiceClient>
    try {
      supabase = getSupabaseServiceClient()
    } catch (error) {
      return fail("supabase_client", "Serverconfiguratie onvolledig.", 500, error instanceof Error ? error.message : "Supabase client init failed")
    }

    const { data: driver, error: driverLookupError } = await supabase
      .from("drivers")
      .select("id")
      .eq("id", invite.driverId)
      .maybeSingle()

    if (driverLookupError) {
      return fail("driver_lookup", "Chauffeurgegevens konden niet worden geladen.", 500, driverLookupError.message)
    }

    if (!driver) {
      return fail("driver_lookup", "Chauffeur niet gevonden.")
    }

    const uploadFile = async (file: File | null, folder: string) => {
      if (!file || file.size === 0) return null

      const buffer = Buffer.from(await file.arrayBuffer())
      const path = `drivers/${invite.driverId}/${folder}/${safeName(file.name)}`

      const { error } = await supabase.storage.from("driver-documents").upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

      if (error) {
        const bucketMissing = /bucket|not found|does not exist|not_exist/i.test(error.message || "")
        const message = bucketMissing
          ? "Storage bucket 'driver-documents' ontbreekt of is niet toegankelijk."
          : `Upload mislukt voor ${folder}.`
        throw new Error(`${message} (${error.message})`)
      }

      return path
    }

    let driverLicensePath: string | null
    let taxiPassPath: string | null
    let identityPath: string | null

    try {
      [driverLicensePath, taxiPassPath, identityPath] = await Promise.all([
        uploadFile(driverLicense, "driver_license"),
        uploadFile(taxiPass, "taxi_pass"),
        uploadFile(identityDocument, "identity_document"),
      ])
    } catch (error) {
      return fail("storage_upload", "Document upload mislukt.", 500, error instanceof Error ? error.message : "Unknown upload error")
    }

    const { error: driverUpdateError } = await supabase
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
      .eq("id", invite.driverId)

    if (driverUpdateError) {
      return fail("driver_update", "Chauffeurprofiel kon niet worden opgeslagen.", 500, driverUpdateError.message)
    }

    const { error: inviteUpdateError } = await supabase
      .from("driver_invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id)

    if (inviteUpdateError) {
      return fail("driver_invite_update", "Uitnodigingsstatus kon niet worden bijgewerkt.", 500, inviteUpdateError.message)
    }

    revalidatePath("/admin/chauffeurs")

    return NextResponse.json({ success: true })
  } catch (error) {
    return fail("unexpected", "Opslaan mislukt. Probeer opnieuw.", 500, error instanceof Error ? error.message : "Unknown error")
  }
}
