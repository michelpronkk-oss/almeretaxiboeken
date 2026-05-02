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

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const token = String(formData.get("token") || "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Uitnodiging verlopen of ongeldig" }, { status: 400 })
    }

    const invite = await getValidDriverInviteByToken(token)
    if (!invite) {
      return NextResponse.json({ success: false, error: "Uitnodiging verlopen of ongeldig" }, { status: 400 })
    }

    const firstName = String(formData.get("first_name") || "").trim()
    const lastName = String(formData.get("last_name") || "").trim()
    const phone = String(formData.get("phone") || "").trim()
    const address = String(formData.get("address") || "").trim()
    const vehicleType = String(formData.get("vehicle_type") || "").trim()
    const licensePlate = String(formData.get("license_plate") || "").trim()

    if (!firstName || !lastName || !phone || !address || !vehicleType || !licensePlate) {
      return NextResponse.json({ success: false, error: "Vul alle verplichte velden in." }, { status: 400 })
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
      return NextResponse.json({ success: false, error: fileErrors[0] }, { status: 400 })
    }

    const supabase = getSupabaseServiceClient()

    const uploadFile = async (file: File | null, folder: string) => {
      if (!file || file.size === 0) return null

      const buffer = Buffer.from(await file.arrayBuffer())
      const path = `drivers/${invite.driverId}/${folder}/${safeName(file.name)}`

      const { error } = await supabase.storage.from("driver-documents").upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

      if (error) {
        throw new Error(`Upload mislukt: ${folder}`)
      }

      return path
    }

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
      .eq("id", invite.driverId)

    await supabase
      .from("driver_invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id)

    revalidatePath("/admin/chauffeurs")

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: "Opslaan mislukt. Probeer opnieuw." }, { status: 500 })
  }
}
