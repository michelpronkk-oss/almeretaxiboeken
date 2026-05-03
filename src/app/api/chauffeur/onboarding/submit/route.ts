import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/send"
import { chauffeurOnboardingSubmittedAdminEmail } from "@/lib/email/templates"
import { getValidDriverInviteByToken } from "@/lib/chauffeur/invites"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

const MAX_FILE_BYTES = 12 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "application/pdf",
])

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif", "pdf"])

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/heic-sequence": "heic",
  "image/heif-sequence": "heif",
  "application/pdf": "pdf",
}

function getExt(filename: string): string {
  const parts = filename.toLowerCase().split(".")
  return parts.length > 1 ? (parts[parts.length - 1] ?? "") : ""
}

function resolveContentType(file: File): string {
  if (file.type && ALLOWED_MIME_TYPES.has(file.type)) return file.type
  const ext = getExt(file.name)
  if (ext === "pdf") return "application/pdf"
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  if (ext === "heic") return "image/heic"
  if (ext === "heif") return "image/heif"
  return "image/jpeg"
}

function safeName(name: string, contentType: string): string {
  const rawExt = getExt(name)
  const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : (MIME_TO_EXT[contentType] ?? "jpg")
  const base = (name.replace(/\.[^.]+$/, "") || "document")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "document"
  return `${base}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`
}

function validateFile(file: File | null, required: boolean, label: string): string | null {
  if (!file || file.size === 0) {
    if (required) return `${label} is verplicht.`
    return null
  }
  const mimeOk = ALLOWED_MIME_TYPES.has(file.type)
  const extOk = ALLOWED_EXTENSIONS.has(getExt(file.name))
  if (!mimeOk && !extOk) {
    return `${label}: ongeldig bestandstype. Gebruik JPG, PNG, WEBP, HEIC, HEIF of PDF.`
  }
  if (file.size > MAX_FILE_BYTES) {
    return `${label}: bestand is te groot. Maximaal 12MB per document.`
  }
  return null
}

function fail(step: string, message: string, status = 400, details?: string) {
  if (status >= 500) {
    console.error("[chauffeur-onboarding-submit]", { step, message, details: details ?? "" })
  }
  return NextResponse.json(
    { success: false, step, message, ...(details ? { details } : {}) },
    { status },
  )
}

export async function POST(request: Request) {
  let driverId = ""
  let inviteId = ""
  let inviteEmail = ""

  try {
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      return fail(
        "parse_form_data",
        "Aanvraag kon niet worden verwerkt.",
        400,
        error instanceof Error ? error.message : "Invalid form data",
      )
    }

    const token = String(formData.get("token") ?? "").trim()
    if (!token) {
      return fail("token_validate", "Uitnodiging verlopen of ongeldig.")
    }

    let invite: Awaited<ReturnType<typeof getValidDriverInviteByToken>>
    try {
      invite = await getValidDriverInviteByToken(token)
    } catch (error) {
      return fail(
        "invite_lookup",
        "Uitnodiging kon niet worden gecontroleerd.",
        500,
        error instanceof Error ? error.message : "Invite lookup failed",
      )
    }

    if (!invite) {
      return fail("invite_lookup", "Deze uitnodiging is ongeldig of verlopen.")
    }

    driverId = invite.driverId
    inviteId = invite.id
    inviteEmail = invite.email

    const firstName = String(formData.get("first_name") ?? "").trim()
    const lastName = String(formData.get("last_name") ?? "").trim()
    const phone = String(formData.get("phone") ?? "").trim()
    const address = String(formData.get("address") ?? "").trim()
    const vehicleType = String(formData.get("vehicle_type") ?? "").trim()
    const licensePlate = String(formData.get("license_plate") ?? "").trim()

    if (!firstName || !lastName || !phone || !address || !vehicleType || !licensePlate) {
      return fail("required_fields_validation", "Vul alle verplichte velden in.")
    }

    const driverLicense = formData.get("driver_license") as File | null
    const taxiPass = formData.get("taxi_pass") as File | null
    const identityDocument = formData.get("identity_document") as File | null

    if (!driverLicense || driverLicense.size === 0 || !taxiPass || taxiPass.size === 0) {
      return fail(
        "required_fields_validation",
        "Upload uw rijbewijs en chauffeurspas voordat u verzendt.",
      )
    }

    const fileErrors = [
      validateFile(driverLicense, true, "Rijbewijs"),
      validateFile(taxiPass, true, "Chauffeurspas"),
      validateFile(identityDocument, false, "ID document"),
    ].filter(Boolean)

    if (fileErrors.length) {
      return fail(
        "file_validation",
        String(fileErrors[0]),
        400,
        "Maximaal 12MB per document. Ondersteunde formaten: JPG, PNG, WEBP, HEIC, HEIF, PDF.",
      )
    }

    let supabase: ReturnType<typeof getSupabaseServiceClient>
    try {
      supabase = getSupabaseServiceClient()
    } catch (error) {
      return fail(
        "storage_bucket_check",
        "Serverconfiguratie onvolledig.",
        500,
        error instanceof Error ? error.message : "Supabase client init failed",
      )
    }

    // Verify the storage bucket is reachable before attempting uploads
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(
      "driver-documents",
    )
    if (bucketError ?? !bucketData) {
      console.error("[chauffeur-onboarding-submit]", {
        step: "storage_bucket_check",
        driverId,
        inviteId,
        email: inviteEmail,
        errorMessage: bucketError?.message ?? "Bucket not found",
      })
      return fail(
        "storage_bucket_check",
        "Documentopslag is niet goed ingesteld.",
        500,
        "Supabase Storage bucket driver-documents ontbreekt of is niet toegankelijk.",
      )
    }

    const { data: driver, error: driverLookupError } = await supabase
      .from("drivers")
      .select("id")
      .eq("id", invite.driverId)
      .maybeSingle()

    if (driverLookupError) {
      return fail(
        "driver_lookup",
        "Chauffeurgegevens konden niet worden geladen.",
        500,
        driverLookupError.message,
      )
    }

    if (!driver) {
      return fail("driver_lookup", "Chauffeur niet gevonden.")
    }

    const fileNames = [driverLicense.name, taxiPass.name, identityDocument?.name].filter(Boolean)
    const fileTypes = [driverLicense.type, taxiPass.type, identityDocument?.type].filter(Boolean)
    const fileSizes = [driverLicense.size, taxiPass.size, identityDocument?.size].filter(
      (s) => s !== undefined,
    )

    type UploadError = Error & { step?: string }

    async function uploadFile(file: File, folder: string, uploadStep: string): Promise<string> {
      const contentType = resolveContentType(file)
      const filename = safeName(file.name, contentType)
      const path = `drivers/${invite!.driverId}/${folder}/${filename}`
      const buffer = Buffer.from(await file.arrayBuffer())

      const { error } = await supabase.storage.from("driver-documents").upload(path, buffer, {
        contentType,
        upsert: true,
      })

      if (error) {
        const bucketMissing = /bucket|not found|does not exist|not_exist/i.test(
          error.message ?? "",
        )
        const err: UploadError = new Error(
          bucketMissing
            ? `Documentopslag is niet goed ingesteld. (${error.message})`
            : `Upload mislukt voor ${folder}. (${error.message})`,
        )
        err.step = bucketMissing ? "storage_bucket_check" : uploadStep
        throw err
      }

      return path
    }

    let driverLicensePath: string
    let taxiPassPath: string
    let identityPath: string | null = null

    try {
      driverLicensePath = await uploadFile(
        driverLicense,
        "driver-license",
        "storage_upload_driver_license",
      )
    } catch (error) {
      const err = error as UploadError
      console.error("[chauffeur-onboarding-submit]", {
        step: err.step ?? "storage_upload_driver_license",
        driverId,
        inviteId,
        email: inviteEmail,
        fileNames,
        fileTypes,
        fileSizes,
        errorMessage: err.message,
      })
      return fail(
        err.step ?? "storage_upload_driver_license",
        "Upload van rijbewijs mislukt. Controleer of het bestand kleiner is dan 12MB en probeer opnieuw.",
        500,
        err.message,
      )
    }

    try {
      taxiPassPath = await uploadFile(taxiPass, "taxi-pass", "storage_upload_taxi_pass")
    } catch (error) {
      const err = error as UploadError
      console.error("[chauffeur-onboarding-submit]", {
        step: err.step ?? "storage_upload_taxi_pass",
        driverId,
        inviteId,
        email: inviteEmail,
        fileNames,
        fileTypes,
        fileSizes,
        errorMessage: err.message,
      })
      return fail(
        err.step ?? "storage_upload_taxi_pass",
        "Upload van chauffeurspas mislukt. Controleer of het bestand kleiner is dan 12MB en probeer opnieuw.",
        500,
        err.message,
      )
    }

    if (identityDocument && identityDocument.size > 0) {
      try {
        identityPath = await uploadFile(
          identityDocument,
          "identity-document",
          "storage_upload_identity_document",
        )
      } catch (error) {
        const err = error as UploadError
        console.error("[chauffeur-onboarding-submit]", {
          step: err.step ?? "storage_upload_identity_document",
          driverId,
          inviteId,
          email: inviteEmail,
          fileNames,
          fileTypes,
          fileSizes,
          errorMessage: err.message,
        })
        return fail(
          err.step ?? "storage_upload_identity_document",
          "Upload van ID document mislukt. Controleer of het bestand kleiner is dan 12MB en probeer opnieuw.",
          500,
          err.message,
        )
      }
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
        deleted_at: null,
        archived_at: null,
      })
      .eq("id", invite.driverId)

    if (driverUpdateError) {
      console.error("[chauffeur-onboarding-submit]", {
        step: "driver_update",
        driverId,
        inviteId,
        email: inviteEmail,
        errorMessage: driverUpdateError.message,
      })
      return fail(
        "driver_update",
        "Chauffeurprofiel kon niet worden opgeslagen.",
        500,
        driverUpdateError.message,
      )
    }

    const { error: inviteUpdateError } = await supabase
      .from("driver_invites")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", invite.id)

    if (inviteUpdateError) {
      console.error("[chauffeur-onboarding-submit]", {
        step: "invite_update",
        driverId,
        inviteId,
        email: inviteEmail,
        errorMessage: inviteUpdateError.message,
      })
      return fail(
        "invite_update",
        "Uitnodigingsstatus kon niet worden bijgewerkt.",
        500,
        inviteUpdateError.message,
      )
    }

    const adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL
    if (adminNotificationEmail) {
      try {
        const mail = chauffeurOnboardingSubmittedAdminEmail({
          driverId: invite.driverId,
          name: `${firstName} ${lastName}`.trim(),
          email: invite.email,
          phone,
          vehicleType,
          licensePlate,
        })
        await sendEmail({
          to: adminNotificationEmail,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        })
      } catch (emailError) {
        // Email is best-effort — never block the success response
        console.error("[chauffeur-onboarding-submit] admin email failed", {
          driverId,
          errorMessage: emailError instanceof Error ? emailError.message : "email error",
        })
      }
    }

    revalidatePath("/admin/chauffeurs")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[chauffeur-onboarding-submit]", {
      step: "unexpected",
      driverId,
      inviteId,
      email: inviteEmail,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    })
    return fail(
      "unexpected",
      "Opslaan mislukt. Probeer opnieuw.",
      500,
      error instanceof Error ? error.message : "Unknown error",
    )
  }
}
