"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileText, ShieldCheck, Upload, User, CarFront } from "lucide-react"
import { useMemo, useRef, useState } from "react"

interface ChauffeurOnboardingWizardProps {
  token: string
  email: string
  error?: string
}

const STEPS = [
  "Persoonlijke gegevens",
  "Voertuiggegevens",
  "Documenten uploaden",
  "Controleren & verzenden",
]

type FileKey = "driver_license" | "taxi_pass" | "identity_document"

interface SubmitError {
  step?: string
  message: string
  details?: string
}

const STEP_LABELS: Record<string, string> = {
  parse_form_data: "verwerken aanvraag",
  token_validate: "valideren uitnodiging",
  invite_lookup: "ophalen uitnodiging",
  required_fields_validation: "verplichte velden",
  file_validation: "bestandsvalidatie",
  storage_bucket_check: "documentopslag",
  storage_upload_driver_license: "uploaden rijbewijs",
  storage_upload_taxi_pass: "uploaden chauffeurspas",
  storage_upload_identity_document: "uploaden ID document",
  driver_lookup: "ophalen chauffeursprofiel",
  driver_update: "opslaan chauffeursprofiel",
  invite_update: "bijwerken uitnodiging",
  unexpected: "onverwachte fout",
}

function stepLabel(step: string | undefined): string {
  if (!step) return ""
  return STEP_LABELS[step] ?? step.replace(/_/g, " ")
}

// --- compression constants ---
const MAX_DIM = 1600
const JPEG_QUALITY = 0.72
const MAX_TOTAL_BYTES = 4 * 1024 * 1024
const MAX_PDF_BYTES = 4 * 1024 * 1024
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024

async function compressImage(file: File): Promise<File> {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name)
  // HEIC/HEIF cannot be decoded by canvas in browsers — pass through unchanged
  const isHeic = /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
  const isImage =
    file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(file.name)

  if (isPdf || isHeic || !isImage) return file

  try {
    const bitmap = await createImageBitmap(file)
    let { width, height } = bitmap

    if (width > MAX_DIM || height > MAX_DIM) {
      const ratio = Math.min(MAX_DIM / width, MAX_DIM / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    return new Promise<File>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          const baseName = file.name.replace(/\.[^.]+$/, "") || "document"
          resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }))
        },
        "image/jpeg",
        JPEG_QUALITY,
      )
    })
  } catch {
    return file
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`
  return `${(bytes / (1024 * 1024)).toLocaleString("nl-NL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} MB`
}

function validatePayload(files: Record<FileKey, File | null>): string | null {
  let total = 0
  for (const file of Object.values(files)) {
    if (!file) continue
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name)
    if (isPdf && file.size > MAX_PDF_BYTES) {
      return "De documenten zijn samen te groot om te verzenden. Maak een nieuwe foto of kies een kleiner bestand."
    }
    if (!isPdf && file.size > MAX_IMAGE_BYTES) {
      return "De documenten zijn samen te groot om te verzenden. Maak een nieuwe foto of kies een kleiner bestand."
    }
    total += file.size
  }
  if (total > MAX_TOTAL_BYTES) {
    return "De documenten zijn samen te groot om te verzenden. Maak een nieuwe foto of kies een kleiner bestand."
  }
  return null
}

function UploadCard({
  label,
  required,
  hasFile,
  processing,
  sizeBytes,
  onPick,
  onClear,
  inputRef,
  name,
}: {
  label: string
  required?: boolean
  hasFile: boolean
  processing: boolean
  sizeBytes: number | null
  onPick: (file: File | null) => void
  onClear: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
  name: FileKey
}) {
  const actionLabel = hasFile ? "Ander bestand kiezen" : `${label} uploaden`

  return (
    <div className="rounded-xl border border-[#292520] bg-[#0D0C0B] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#F5F1E8]">{label}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] ${required ? "border border-[#D6B58A]/40 text-[#D6B58A]" : "border border-[#292520] text-[#7F776E]"}`}
        >
          {required ? "Verplicht" : "Optioneel"}
        </span>
      </div>
      <p className="mt-1 text-xs text-[#7F776E]">
        Maak een duidelijke foto of upload een bestand. Zorg dat alle gegevens goed leesbaar zijn.
      </p>
      <p className="mt-1 text-xs text-[#7F776E]">JPG, PNG, WEBP, HEIC/HEIF, PDF</p>

      {/* No capture attribute — lets the user choose camera OR photo library OR file picker */}
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*,application/pdf,.heic,.heif,.pdf"
        required={required}
        className="sr-only"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-[#3A2D1F] px-4 py-2 text-sm font-semibold text-[#D6B58A] hover:bg-[#1B1815] disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {actionLabel}
        </button>

        {hasFile && !processing ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-[#292520] px-3 py-1.5 text-xs text-[#B7AEA2] hover:text-[#F5F1E8]"
          >
            Verwijderen
          </button>
        ) : null}
      </div>

      <p
        className={`mt-2 text-xs ${processing ? "text-[#D6B58A]" : hasFile ? "text-[#22A06B]" : "text-[#7F776E]"}`}
      >
        {processing
          ? "Document verwerken..."
          : hasFile && sizeBytes !== null
            ? `${label} geselecteerd · ${formatBytes(sizeBytes)}`
            : hasFile
              ? `${label} geselecteerd`
              : "Nog geen bestand geselecteerd"}
      </p>
    </div>
  )
}

function ErrorBlock({ err }: { err: SubmitError }) {
  return (
    <div className="mt-3 rounded-md border border-[#D94A4A]/30 bg-[#D94A4A]/10 px-3 py-2.5">
      {err.step ? (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#D94A4A]/70">
          Mislukt bij: {stepLabel(err.step)}
        </p>
      ) : null}
      <p className="mt-0.5 text-xs text-[#ffb4b4]">{err.message}</p>
      {err.details ? (
        <p className="mt-1 break-words text-[11px] text-[#D94A4A]/60">{err.details}</p>
      ) : null}
    </div>
  )
}

export default function ChauffeurOnboardingWizard({
  token,
  email,
  error,
}: ChauffeurOnboardingWizardProps) {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [submitError, setSubmitError] = useState<SubmitError | null>(null)
  const [localError, setLocalError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [vehicleType, setVehicleType] = useState("")
  const [licensePlate, setLicensePlate] = useState("")
  const [confirmed, setConfirmed] = useState(false)

  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    driver_license: null,
    taxi_pass: null,
    identity_document: null,
  })

  // Generation counter per key — lets handleFilePick detect stale results after a clear
  const processingGenRef = useRef<Record<FileKey, number>>({
    driver_license: 0,
    taxi_pass: 0,
    identity_document: 0,
  })
  const [processingKeys, setProcessingKeys] = useState<Set<FileKey>>(new Set())
  const isProcessing = processingKeys.size > 0

  const driverLicenseRef = useRef<HTMLInputElement>(null)
  const taxiPassRef = useRef<HTMLInputElement>(null)
  const identityRef = useRef<HTMLInputElement>(null)

  const progress = useMemo(() => `${Math.round((step / 4) * 100)}%`, [step])

  const missingFields = useMemo(() => {
    const missing: string[] = []
    if (!firstName.trim()) missing.push("Voornaam")
    if (!lastName.trim()) missing.push("Achternaam")
    if (!phone.trim()) missing.push("Telefoonnummer")
    if (!address.trim()) missing.push("Adres")
    if (!vehicleType.trim()) missing.push("Voertuigtype")
    if (!licensePlate.trim()) missing.push("Kenteken")
    if (!files.driver_license) missing.push("Rijbewijs")
    if (!files.taxi_pass) missing.push("Chauffeurspas / taxipas")
    if (!confirmed) missing.push("Bevestiging checkbox")
    return missing
  }, [
    address,
    confirmed,
    files.driver_license,
    files.taxi_pass,
    firstName,
    lastName,
    licensePlate,
    phone,
    vehicleType,
  ])

  async function handleFilePick(key: FileKey, rawFile: File | null) {
    if (!rawFile) {
      setFiles((prev) => ({ ...prev, [key]: null }))
      return
    }

    const gen = ++processingGenRef.current[key]
    setProcessingKeys((prev) => new Set([...prev, key]))

    try {
      const compressed = await compressImage(rawFile)
      if (processingGenRef.current[key] !== gen) return
      setFiles((prev) => ({ ...prev, [key]: compressed }))
    } catch {
      if (processingGenRef.current[key] !== gen) return
      setFiles((prev) => ({ ...prev, [key]: rawFile }))
    } finally {
      if (processingGenRef.current[key] === gen) {
        setProcessingKeys((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }
    }
  }

  function clearFile(key: FileKey, ref: React.RefObject<HTMLInputElement | null>) {
    processingGenRef.current[key]++ // invalidate any in-flight compression
    setFiles((prev) => ({ ...prev, [key]: null }))
    setProcessingKeys((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
    if (ref.current) ref.current.value = ""
  }

  function validateStep(current: number) {
    if (
      current === 1 &&
      (!firstName.trim() || !lastName.trim() || !phone.trim() || !address.trim())
    ) {
      return "Vul alle verplichte persoonlijke gegevens in."
    }
    if (current === 2 && (!vehicleType || !licensePlate.trim())) {
      return "Vul voertuigtype en kenteken in."
    }
    if (current === 3 && (!files.driver_license || !files.taxi_pass)) {
      return "Upload zowel rijbewijs als chauffeurspas/taxipas."
    }
    if (current === 4 && !confirmed) {
      return "Bevestig dat de ingevulde gegevens correct zijn."
    }
    return ""
  }

  function nextStep() {
    if (isProcessing) return
    const message = validateStep(step)
    if (message) {
      setLocalError(message)
      return
    }
    setLocalError("")
    setSubmitError(null)
    setStep((prev) => Math.min(4, prev + 1))
  }

  function prevStep() {
    setLocalError("")
    setSubmitError(null)
    setStep((prev) => Math.max(1, prev - 1))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (step !== 4) {
      setLocalError("Ga naar stap 4 om uw profiel te verzenden.")
      return
    }

    if (missingFields.length > 0) {
      setLocalError(`Ontbrekend: ${missingFields.join(", ")}.`)
      return
    }

    if (isProcessing) return

    const payloadError = validatePayload(files)
    if (payloadError) {
      setLocalError(payloadError)
      return
    }

    if (isSubmitting) return

    setLocalError("")
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const form = new FormData()
      form.set("token", token)
      form.set("first_name", firstName)
      form.set("last_name", lastName)
      form.set("phone", phone)
      form.set("address", address)
      form.set("vehicle_type", vehicleType)
      form.set("license_plate", licensePlate)
      if (files.driver_license) form.set("driver_license", files.driver_license)
      if (files.taxi_pass) form.set("taxi_pass", files.taxi_pass)
      if (files.identity_document) form.set("identity_document", files.identity_document)

      const res = await fetch("/api/chauffeur/onboarding/submit", {
        method: "POST",
        body: form,
      })

      let json: {
        success?: boolean
        error?: string
        message?: string
        step?: string
        details?: string
      } = {}
      try {
        json = await res.json()
      } catch {
        setSubmitError({
          message:
            "Server reageerde onverwacht. Controleer uw internetverbinding en probeer opnieuw.",
          details: `HTTP ${res.status}`,
        })
        setIsSubmitting(false)
        return
      }

      if (!res.ok || !json.success) {
        setSubmitError({
          step: json.step,
          message: json.message ?? json.error ?? "Opslaan mislukt. Probeer opnieuw.",
          details: json.details,
        })
        setIsSubmitting(false)
        return
      }

      router.replace("/chauffeur/onboarding?success=1")
    } catch (networkError) {
      setSubmitError({
        message: "Verbinding mislukt. Controleer uw internet en probeer opnieuw.",
        details: networkError instanceof Error ? networkError.message : undefined,
      })
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-[720px] px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
      <div className="rounded-[22px] border border-[#292520] bg-[#151311] p-4 sm:p-6">
        <span className="inline-flex rounded-full border border-[#3A2D1F] bg-[#0F0D0B] px-2.5 py-1 text-[11px] text-[#D6B58A]">
          Chauffeur onboarding
        </span>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-[#F5F1E8] sm:text-[30px]">
          Chauffeurprofiel aanmaken
        </h1>
        <p className="mt-2 text-sm text-[#B7AEA2]">
          Vul uw gegevens aan. Na controle kan AlmereTaxiBoeken u ritten toewijzen.
        </p>

        <div className="mt-4 rounded-xl border border-[#292520] bg-[#11100E] p-3">
          <p className="text-xs text-[#7F776E]">Stap {step} van 4</p>
          <p className="mt-0.5 text-sm font-medium text-[#F5F1E8]">{STEPS[step - 1]}</p>
          <div className="mt-2 h-1.5 rounded-full bg-[#292520]">
            <div
              className="h-1.5 rounded-full bg-[#D6B58A] transition-all"
              style={{ width: progress }}
            />
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {STEPS.map((label, idx) => (
              <div
                key={label}
                className={`h-1 rounded-full ${idx + 1 <= step ? "bg-[#D6B58A]" : "bg-[#292520]"}`}
              />
            ))}
          </div>
        </div>

        {error ? (
          <p className="mt-3 rounded-md border border-[#D94A4A]/30 bg-[#D94A4A]/10 px-3 py-2 text-xs text-[#ffb4b4]">
            {error}
          </p>
        ) : null}
        {localError ? (
          <p className="mt-3 rounded-md border border-[#D94A4A]/30 bg-[#D94A4A]/10 px-3 py-2 text-xs text-[#ffb4b4]">
            {localError}
          </p>
        ) : null}
        {submitError ? <ErrorBlock err={submitError} /> : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className={step === 1 ? "block" : "hidden"}>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#F5F1E8]">
              <User className="h-4 w-4 text-[#D6B58A]" /> Persoonlijke gegevens
            </div>
            <p className="mb-3 text-xs text-[#7F776E]">
              Deze gegevens worden gebruikt voor interne planning en contact over ritten.
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Voornaam"
                className="h-11 rounded-md border border-[#292520] bg-[#0D0C0B] px-3 text-base outline-none focus:border-[#D6B58A]"
              />
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Achternaam"
                className="h-11 rounded-md border border-[#292520] bg-[#0D0C0B] px-3 text-base outline-none focus:border-[#D6B58A]"
              />
              <input
                value={email}
                readOnly
                className="h-11 rounded-md border border-[#292520] bg-[#0B0A09] px-3 text-base text-[#8F877D] sm:col-span-2"
              />
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefoonnummer"
                className="h-11 rounded-md border border-[#292520] bg-[#0D0C0B] px-3 text-base outline-none focus:border-[#D6B58A]"
              />
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adres"
                className="h-11 rounded-md border border-[#292520] bg-[#0D0C0B] px-3 text-base outline-none focus:border-[#D6B58A]"
              />
            </div>
          </div>

          <div className={step === 2 ? "block" : "hidden"}>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#F5F1E8]">
              <CarFront className="h-4 w-4 text-[#D6B58A]" /> Voertuiggegevens
            </div>
            <p className="mb-3 text-xs text-[#7F776E]">
              Selecteer taxibus alleen als u ritten voor 5 tot 8 personen kunt uitvoeren.
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <select
                required
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="h-11 rounded-md border border-[#292520] bg-[#0D0C0B] px-3 text-base outline-none focus:border-[#D6B58A]"
              >
                <option value="">Voertuigtype kiezen</option>
                <option value="taxi">taxi</option>
                <option value="taxibus">taxibus</option>
              </select>
              <input
                required
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="Kenteken"
                className="h-11 rounded-md border border-[#292520] bg-[#0D0C0B] px-3 text-base outline-none focus:border-[#D6B58A]"
              />
            </div>
          </div>

          <div className={step === 3 ? "block" : "hidden"}>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#F5F1E8]">
              <FileText className="h-4 w-4 text-[#D6B58A]" /> Documenten uploaden
            </div>
            <div className="space-y-3">
              <UploadCard
                label="Rijbewijs"
                required
                name="driver_license"
                hasFile={Boolean(files.driver_license)}
                processing={processingKeys.has("driver_license")}
                sizeBytes={files.driver_license?.size ?? null}
                inputRef={driverLicenseRef}
                onPick={(file) => handleFilePick("driver_license", file)}
                onClear={() => clearFile("driver_license", driverLicenseRef)}
              />
              <UploadCard
                label="Chauffeurspas / taxipas"
                required
                name="taxi_pass"
                hasFile={Boolean(files.taxi_pass)}
                processing={processingKeys.has("taxi_pass")}
                sizeBytes={files.taxi_pass?.size ?? null}
                inputRef={taxiPassRef}
                onPick={(file) => handleFilePick("taxi_pass", file)}
                onClear={() => clearFile("taxi_pass", taxiPassRef)}
              />
              <UploadCard
                label="ID document"
                name="identity_document"
                hasFile={Boolean(files.identity_document)}
                processing={processingKeys.has("identity_document")}
                sizeBytes={files.identity_document?.size ?? null}
                inputRef={identityRef}
                onPick={(file) => handleFilePick("identity_document", file)}
                onClear={() => clearFile("identity_document", identityRef)}
              />
            </div>
          </div>

          <div className={step === 4 ? "block" : "hidden"}>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#F5F1E8]">
              <ShieldCheck className="h-4 w-4 text-[#D6B58A]" /> Controleren &amp; verzenden
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-[#292520] bg-[#0D0C0B] p-3 text-sm text-[#B7AEA2]">
                <p className="mb-1 text-xs uppercase tracking-wide text-[#7F776E]">
                  Persoonlijke gegevens
                </p>
                <p>
                  {firstName} {lastName}
                </p>
                <p>{email}</p>
                <p>{phone}</p>
                <p>{address}</p>
              </div>
              <div className="rounded-xl border border-[#292520] bg-[#0D0C0B] p-3 text-sm text-[#B7AEA2]">
                <p className="mb-1 text-xs uppercase tracking-wide text-[#7F776E]">Voertuig</p>
                <p>Type: {vehicleType || "-"}</p>
                <p>Kenteken: {licensePlate || "-"}</p>
              </div>
              <div className="rounded-xl border border-[#292520] bg-[#0D0C0B] p-3 text-sm text-[#B7AEA2]">
                <p className="mb-1 text-xs uppercase tracking-wide text-[#7F776E]">Documenten</p>
                <p>
                  Rijbewijs:{" "}
                  {files.driver_license
                    ? `Rijbewijs geselecteerd · ${formatBytes(files.driver_license.size)}`
                    : "niet geselecteerd"}
                </p>
                <p>
                  Chauffeurspas:{" "}
                  {files.taxi_pass
                    ? `Chauffeurspas geselecteerd · ${formatBytes(files.taxi_pass.size)}`
                    : "niet geselecteerd"}
                </p>
                <p>
                  ID:{" "}
                  {files.identity_document
                    ? `ID document geselecteerd · ${formatBytes(files.identity_document.size)}`
                    : "optioneel — niet geselecteerd"}
                </p>
              </div>
              <label className="flex items-start gap-2 rounded-lg border border-[#292520] bg-[#0D0C0B] p-3 text-sm text-[#B7AEA2]">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5"
                />
                Ik bevestig dat de ingevulde gegevens correct zijn.
              </label>
              {missingFields.length > 0 ? (
                <div className="rounded-lg border border-[#D94A4A]/30 bg-[#D94A4A]/10 p-3 text-xs text-[#ffb4b4]">
                  <p className="font-medium">Controleer de ontbrekende velden:</p>
                  <p className="mt-1">{missingFields.join(", ")}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="sticky bottom-0 z-10 -mx-4 mt-3 flex items-center justify-between gap-2 border-t border-[#292520] bg-[#151311]/95 px-4 pb-1 pt-3 backdrop-blur sm:-mx-6 sm:px-6">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1 || isSubmitting}
              className="rounded-md border border-[#292520] px-3 py-2 text-sm text-[#B7AEA2] disabled:opacity-40"
            >
              Terug
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={isSubmitting || isProcessing}
                className="rounded-md border border-[#3A2D1F] px-4 py-2 text-sm font-semibold text-[#D6B58A] hover:bg-[#1B1815] disabled:opacity-40"
              >
                {isProcessing ? "Documenten verwerken..." : "Volgende"}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || isProcessing || missingFields.length > 0}
                className="rounded-md border border-[#3A2D1F] px-4 py-2 text-sm font-semibold text-[#D6B58A] hover:bg-[#1B1815] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting
                  ? "Verzenden..."
                  : isProcessing
                    ? "Documenten verwerken..."
                    : "Profiel verzenden"}
              </button>
            )}
          </div>

          {step === 4 && missingFields.length > 0 ? (
            <p className="text-right text-xs text-[#7F776E]">
              Controleer de ontbrekende velden hierboven voordat u verzendt.
            </p>
          ) : null}
        </form>
      </div>

      <p className="px-1 pt-4 text-center text-xs text-[#7F776E]">
        Hulp nodig? Neem contact op met planning van AlmereTaxiBoeken.
      </p>
    </section>
  )
}

export function OnboardingSuccessCard() {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-[720px] items-center px-4 py-8 sm:px-6">
      <div className="w-full rounded-[22px] border border-[#292520] bg-[#151311] p-6">
        <p className="inline-flex rounded-full border border-[#22A06B]/30 bg-[#22A06B]/10 px-2.5 py-1 text-[11px] text-[#9de2c5]">
          Ingediend
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-[#F5F1E8]">Gegevens ontvangen</h1>
        <p className="mt-2 text-sm text-[#B7AEA2]">
          Uw profiel is verzonden ter controle. U ontvangt toegang zodra uw profiel is goedgekeurd.
        </p>
        <Link
          href="/chauffeur/login"
          className="mt-5 inline-flex rounded-md border border-[#3A2D1F] px-4 py-2 text-sm font-semibold text-[#D6B58A] hover:bg-[#1B1815]"
        >
          Terug naar chauffeur login
        </Link>
      </div>
    </section>
  )
}

export function OnboardingInvalidCard() {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-[720px] items-center px-4 py-8 sm:px-6">
      <div className="w-full rounded-[22px] border border-[#D94A4A]/30 bg-[#151311] p-6">
        <h1 className="text-2xl font-semibold text-[#F5F1E8]">
          Uitnodiging verlopen of ongeldig
        </h1>
        <p className="mt-2 text-sm text-[#B7AEA2]">
          Neem contact op met AlmereTaxiBoeken om een nieuwe uitnodiging te ontvangen.
        </p>
      </div>
    </section>
  )
}
