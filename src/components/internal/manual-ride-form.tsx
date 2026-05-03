"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import AddressAutocomplete from "@/components/address-autocomplete"
import { formatCurrencyEUR } from "@/lib/format"

type FareResult = {
  distanceKm: number
  durationMinutes: number
  estimatedFare: number
  vehicleType: "taxi" | "taxibus"
  passengers: number
  pricingMode?: "metered" | "fixed_route"
  matchedFixedRoute?: string | null
  calculatedFare?: number
}

type LocationValue = {
  address: string
  placeId?: string
}

type PaymentMode = "online" | "cash" | "manual_no_payment"

type CreateResponse = {
  success: boolean
  mode?: "payment_link_created" | "cash" | "manual_no_payment"
  bookingId?: string
  reference?: string
  paymentUrl?: string
  cashAmountDue?: number
  fare?: FareResult
  emailSent?: boolean
  warning?: string
  message?: string
}

const passengerOptions = [1, 2, 3, 4, 5, 6, 7, 8]

const OVERRIDE_REASONS = [
  "Vaste Schipholprijs",
  "Telefonische afspraak",
  "Korting",
  "Routecorrectie",
  "Wacht-/extra kosten",
  "Anders",
]

const PAYMENT_OPTIONS: { mode: PaymentMode; label: string; desc: string }[] = [
  { mode: "online", label: "Online betaallink", desc: "Maak een Mollie-betaallink en verstuur deze naar de klant." },
  { mode: "cash", label: "Contant bij chauffeur", desc: "Rit wordt ingepland. Chauffeur int het bedrag contant." },
  { mode: "manual_no_payment", label: "Zonder betaling", desc: "Alleen gebruiken als interne uitzondering." },
]

export default function ManualRideForm() {
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [pickupAddress, setPickupAddress] = useState("")
  const [destinationAddress, setDestinationAddress] = useState("")
  const [pickupLocation, setPickupLocation] = useState<LocationValue>({ address: "" })
  const [destinationLocation, setDestinationLocation] = useState<LocationValue>({ address: "" })
  const [pickupDate, setPickupDate] = useState("")
  const [pickupTime, setPickupTime] = useState("")
  const [passengers, setPassengers] = useState(1)
  const [vehicleType, setVehicleType] = useState<"taxi" | "taxibus">("taxi")
  const [adminVehicleOverride, setAdminVehicleOverride] = useState(false)
  const [notes, setNotes] = useState("")
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("online")
  const [sendEmailToCustomer, setSendEmailToCustomer] = useState(true)

  // Price override
  const [overrideEnabled, setOverrideEnabled] = useState(false)
  const [overrideAmount, setOverrideAmount] = useState("")
  const [overrideReason, setOverrideReason] = useState("")

  const [calculating, setCalculating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [emailSending, setEmailSending] = useState(false)

  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [warning, setWarning] = useState("")

  const [fare, setFare] = useState<FareResult | null>(null)
  const [result, setResult] = useState<CreateResponse | null>(null)

  useEffect(() => {
    if (!adminVehicleOverride) {
      setVehicleType(passengers >= 5 ? "taxibus" : "taxi")
    }
  }, [passengers, adminVehicleOverride])

  const vehicleWarning =
    passengers >= 5 && vehicleType === "taxi"
      ? "Let op: 5 of meer passagiers — overweeg Taxibus."
      : passengers <= 4 && vehicleType === "taxibus" && adminVehicleOverride
        ? "Taxibus geselecteerd voor 1-4 passagiers."
        : ""

  const displayedFare = useMemo(() => {
    if (!fare) return null
    if (overrideEnabled && Number(overrideAmount) > 0) return Number(overrideAmount)
    return fare.estimatedFare
  }, [fare, overrideEnabled, overrideAmount])

  const whatsappText = useMemo(() => {
    if (!result?.paymentUrl) return ""
    return `Beste ${customerName || "klant"}, hierbij de betaallink voor uw rit met AlmereTaxiBoeken. Na betaling is uw rit definitief gereserveerd: ${result.paymentUrl}`
  }, [result?.paymentUrl, customerName])

  const submitLabel = creating
    ? paymentMode === "online" ? "Betaallink aanmaken..." : paymentMode === "cash" ? "Contante rit aanmaken..." : "Rit opslaan..."
    : paymentMode === "online" ? "Betaallink aanmaken" : paymentMode === "cash" ? "Contante rit aanmaken" : "Rit opslaan"

  async function calculatePrice() {
    setError("")
    setStatus("")
    setWarning("")
    setFare(null)

    if (!pickupAddress.trim() || !destinationAddress.trim()) {
      setError("Vul vertrekadres en bestemming in.")
      return
    }

    setCalculating(true)
    try {
      const res = await fetch("/api/admin/bookings/manual/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupAddress,
          destinationAddress,
          pickup: pickupLocation,
          destination: destinationLocation,
          passengers,
          vehicleType,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "Prijsberekening mislukt.")
      setFare({
        distanceKm: data.distanceKm,
        durationMinutes: data.durationMinutes,
        estimatedFare: data.estimatedFare,
        vehicleType: data.vehicleType,
        passengers: data.passengers,
        pricingMode: data.pricingMode,
        matchedFixedRoute: data.matchedFixedRoute,
        calculatedFare: data.calculatedFare,
      })
      setStatus(data.pricingMode === "fixed_route" ? `Vaste routeprijs toegepast: ${data.matchedFixedRoute}.` : "Prijs berekend.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prijsberekening mislukt.")
    } finally {
      setCalculating(false)
    }
  }

  async function createBooking() {
    setError("")
    setStatus("")
    setWarning("")

    if (!customerName.trim() || !customerPhone.trim() || !pickupAddress.trim() || !destinationAddress.trim() || !pickupDate || !pickupTime) {
      setError("Vul alle verplichte velden in.")
      return
    }
    if (!fare) {
      setError("Bereken eerst de prijs.")
      return
    }
    if (paymentMode === "online" && sendEmailToCustomer && !customerEmail.trim()) {
      setError("E-mailadres is verplicht als u de betaallink per e-mail wilt versturen.")
      return
    }
    if (overrideEnabled && Number(overrideAmount) <= 0) {
      setError("Voer een geldige eindprijs in.")
      return
    }
    if (overrideEnabled && !overrideReason) {
      setError("Selecteer een reden voor de prijsaanpassing.")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/admin/bookings/manual/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          pickupAddress: pickupLocation.address || pickupAddress,
          destinationAddress: destinationLocation.address || destinationAddress,
          pickup: pickupLocation,
          destination: destinationLocation,
          pickupDate,
          pickupTime,
          passengers,
          vehicleType,
          adminVehicleOverride,
          notes,
          paymentMode,
          sendEmail: paymentMode !== "manual_no_payment" && sendEmailToCustomer,
          priceOverrideEnabled: overrideEnabled,
          priceOverrideAmount: overrideEnabled ? Number(overrideAmount) : undefined,
          priceOverrideReason: overrideEnabled ? overrideReason : undefined,
        }),
      })

      const data = (await res.json()) as CreateResponse
      if (!res.ok || !data.success) throw new Error(data.message || "Aanmaken mislukt.")

      setResult(data)
      const statusMsg =
        data.mode === "cash" ? "Contante rit aangemaakt."
        : data.mode === "manual_no_payment" ? "Rit opgeslagen zonder betaling."
        : "Betaallink aangemaakt."
      setStatus(statusMsg)
      if (data.warning) setWarning(data.warning)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Aanmaken mislukt.")
    } finally {
      setCreating(false)
    }
  }

  async function sendPaymentEmailAgain() {
    if (!result?.bookingId) return
    setEmailSending(true)
    setError("")
    setWarning("")
    try {
      const res = await fetch("/api/admin/bookings/manual/send-payment-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: result.bookingId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "E-mail kon niet worden verzonden.")
      setStatus("E-mail naar klant verstuurd.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "E-mail kon niet worden verzonden.")
    } finally {
      setEmailSending(false)
    }
  }

  async function copyText(value: string, okText: string) {
    try {
      await navigator.clipboard.writeText(value)
      setStatus(okText)
    } catch {
      setError("Kopieren mislukt. Probeer opnieuw.")
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F1E8]">Nieuwe rit invoeren</h1>
          <p className="mt-2 text-sm text-[#B7AEA2]">Maak handmatig een rit aan voor een klant.</p>
        </div>
        <Link href="/admin/ritten" className="rounded-lg border border-[#3A2D1F] px-3 py-2 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815]">
          Terug naar ritten
        </Link>
      </div>

      {status ? <p className="rounded-md border border-[#22A06B]/30 bg-[#22A06B]/10 px-3 py-2 text-xs text-[#9de2c5]">{status}</p> : null}
      {warning ? <p className="rounded-md border border-[#D6B58A]/30 bg-[#D6B58A]/10 px-3 py-2 text-xs text-[#D6B58A]">{warning}</p> : null}
      {error ? <p className="rounded-md border border-[#D94A4A]/30 bg-[#D94A4A]/10 px-3 py-2 text-xs text-[#ffb4b4]">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {/* 1. Klantgegevens */}
        <article className="rounded-2xl border border-[#292520] bg-[#141210] p-4">
          <h2 className="text-sm font-semibold text-[#F5F1E8]">1. Klantgegevens</h2>
          <div className="mt-3 space-y-3">
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Klantnaam" className="h-10 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8]" />
            <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="E-mail klant (optioneel)" className="h-10 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8]" />
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Telefoon klant" className="h-10 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8]" />
          </div>
        </article>

        {/* 2. Ritgegevens */}
        <article className="rounded-2xl border border-[#292520] bg-[#141210] p-4">
          <h2 className="text-sm font-semibold text-[#F5F1E8]">2. Ritgegevens</h2>
          <div className="mt-3 space-y-3">
            <AddressAutocomplete
              label="Vertrekadres"
              value={pickupAddress}
              onChange={(value) => { setPickupAddress(value); setPickupLocation({ address: value, placeId: undefined }) }}
              onPlaceSelect={(place) => setPickupLocation(place)}
              placeholder="Vertrekadres"
              inputClassName="h-10 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8] placeholder:text-[#8F877D] outline-none focus:border-[#D6B58A]/50"
            />
            <AddressAutocomplete
              label="Bestemmingsadres"
              value={destinationAddress}
              onChange={(value) => { setDestinationAddress(value); setDestinationLocation({ address: value, placeId: undefined }) }}
              onPlaceSelect={(place) => setDestinationLocation(place)}
              placeholder="Bestemmingsadres"
              inputClassName="h-10 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8] placeholder:text-[#8F877D] outline-none focus:border-[#D6B58A]/50"
            />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="h-10 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8]" />
              <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="h-10 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={passengers} onChange={(e) => setPassengers(Number(e.target.value))} className="h-10 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8]">
                {passengerOptions.map((p) => (
                  <option key={p} value={p}>{p} {p === 1 ? "persoon" : "personen"}</option>
                ))}
              </select>
              <select
                value={vehicleType}
                onChange={(e) => { setVehicleType(e.target.value as "taxi" | "taxibus"); setAdminVehicleOverride(true) }}
                className="h-10 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#D6B58A]"
              >
                <option value="taxi">Taxi</option>
                <option value="taxibus">Taxibus</option>
              </select>
            </div>
            {vehicleWarning ? <p className="text-xs text-[#D6B58A]">{vehicleWarning}</p> : null}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opmerkingen (optioneel)" className="min-h-20 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 py-2 text-sm text-[#F5F1E8]" />
          </div>
        </article>
      </div>

      {/* 3. Prijsberekening */}
      <article className="rounded-2xl border border-[#292520] bg-[#141210] p-4">
        <h2 className="text-sm font-semibold text-[#F5F1E8]">3. Prijsberekening</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={calculatePrice} disabled={calculating} className="rounded-lg border border-[#3A2D1F] px-4 py-2 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815] disabled:opacity-50">
            {calculating ? "Prijs berekenen..." : "Prijs berekenen"}
          </button>
        </div>

        {fare ? (
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 rounded-xl border border-[#292520] bg-[#0D0C0B] p-4 sm:grid-cols-2 lg:grid-cols-4">
              <p className="text-sm text-[#B7AEA2]">Afstand: <span className="text-[#F5F1E8]">{fare.distanceKm} km</span></p>
              <p className="text-sm text-[#B7AEA2]">Reistijd: <span className="text-[#F5F1E8]">{fare.durationMinutes} min</span></p>
              <p className="text-sm text-[#B7AEA2]">Voertuig: <span className="text-[#F5F1E8]">{fare.vehicleType === "taxibus" ? "Taxibus" : "Taxi"}</span></p>
              <p className="text-sm text-[#B7AEA2]">
                {fare.pricingMode === "fixed_route" ? "Vaste prijs" : "Berekende prijs"}:{" "}
                <span className="font-semibold text-[#D6B58A]">{formatCurrencyEUR(fare.estimatedFare)}</span>
              </p>
            </div>
            {fare.pricingMode === "fixed_route" && fare.matchedFixedRoute ? (
              <p className="text-xs text-[#D6B58A]">
                Vaste routeprijs toegepast: {fare.matchedFixedRoute}
                {fare.calculatedFare && fare.calculatedFare !== fare.estimatedFare ? ` (berekend: ${formatCurrencyEUR(fare.calculatedFare)})` : ""}
              </p>
            ) : null}

            {/* Price override */}
            <div className="rounded-xl border border-[#292520] bg-[#0D0C0B] p-4 space-y-3">
              <label className="flex items-center gap-2 text-sm text-[#B7AEA2]">
                <input type="checkbox" checked={overrideEnabled} onChange={(e) => setOverrideEnabled(e.target.checked)} className="size-4" />
                Prijs handmatig aanpassen
              </label>
              {overrideEnabled ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#B7AEA2]">€</span>
                    <input
                      type="number" min="1" step="0.01"
                      value={overrideAmount} onChange={(e) => setOverrideAmount(e.target.value)}
                      placeholder="Eindprijs"
                      className="h-10 w-36 rounded-lg border border-[#292520] bg-[#141210] px-3 text-sm text-[#F5F1E8]"
                    />
                    {Number(overrideAmount) > 0 ? <span className="text-sm font-semibold text-[#D6B58A]">{formatCurrencyEUR(Number(overrideAmount))}</span> : null}
                  </div>
                  <select value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} className="h-10 w-full rounded-lg border border-[#292520] bg-[#141210] px-3 text-sm text-[#F5F1E8]">
                    <option value="">Selecteer reden prijsaanpassing</option>
                    {OVERRIDE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              ) : null}
            </div>

            {displayedFare !== null && overrideEnabled && Number(overrideAmount) > 0 ? (
              <p className="text-sm text-[#B7AEA2]">
                Eindprijs: <span className="font-semibold text-[#D6B58A]">{formatCurrencyEUR(displayedFare)}</span>
                {overrideReason ? <span className="ml-2 text-xs text-[#8F877D]">— {overrideReason}</span> : null}
              </p>
            ) : null}
          </div>
        ) : null}
      </article>

      {/* 4. Betaling */}
      <article className="rounded-2xl border border-[#292520] bg-[#141210] p-4">
        <h2 className="text-sm font-semibold text-[#F5F1E8]">4. Betaling</h2>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {PAYMENT_OPTIONS.map((opt) => {
            const active = paymentMode === opt.mode
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setPaymentMode(opt.mode)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  active
                    ? "border-[#D6B58A]/50 bg-[#D6B58A]/[0.08]"
                    : "border-[#292520] bg-[#0D0C0B] hover:bg-[#141210]"
                }`}
              >
                <p className={`text-sm font-semibold ${active ? "text-[#D6B58A]" : "text-[#B7AEA2]"}`}>{opt.label}</p>
                <p className="mt-0.5 text-[11px] text-[#8F877D] leading-snug">{opt.desc}</p>
              </button>
            )
          })}
        </div>

        {/* Email option — shown for online and cash */}
        {paymentMode !== "manual_no_payment" ? (
          <label className="mt-4 flex items-center gap-2 text-sm text-[#B7AEA2]">
            <input type="checkbox" checked={sendEmailToCustomer} onChange={(e) => setSendEmailToCustomer(e.target.checked)} className="size-4" />
            {paymentMode === "online" ? "Betaallink direct per e-mail versturen" : "Bevestigingsmail naar klant versturen"}
          </label>
        ) : null}

        <div className="mt-4">
          <button
            type="button"
            onClick={createBooking}
            disabled={creating || !fare}
            className="rounded-lg border border-[#3A2D1F] px-4 py-2 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815] disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </div>
      </article>

      {/* Result */}
      {result?.success ? (
        <article className="rounded-2xl border border-[#22A06B]/30 bg-[#22A06B]/10 p-4">
          <h3 className="text-sm font-semibold text-[#d9ffef]">
            {result.mode === "cash" ? "Contante rit aangemaakt"
              : result.mode === "manual_no_payment" ? "Rit opgeslagen"
              : "Betaallink aangemaakt"}
          </h3>
          <div className="mt-3 space-y-2 text-sm text-[#B7AEA2]">
            <p>Referentie: <span className="text-[#F5F1E8]">{result.reference}</span></p>

            {result.mode === "cash" && result.cashAmountDue ? (
              <p>Te innen door chauffeur: <span className="font-semibold text-[#22A06B]">{formatCurrencyEUR(result.cashAmountDue)}</span></p>
            ) : null}

            {result.mode === "manual_no_payment" ? (
              <p className="text-xs text-[#8F877D]">Opgeslagen als interne uitzondering — geen betaling vereist.</p>
            ) : null}

            {result.paymentUrl ? (
              <>
                <p className="break-all">Betaallink: <span className="text-[#F5F1E8]">{result.paymentUrl}</span></p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => copyText(result.paymentUrl || "", "Betaallink gekopieerd.")} className="rounded-lg border border-[#3A2D1F] px-3 py-2 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815]">Betaallink kopieren</button>
                  <button type="button" onClick={sendPaymentEmailAgain} disabled={emailSending || !customerEmail} className="rounded-lg border border-[#3A2D1F] px-3 py-2 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815] disabled:opacity-50">{emailSending ? "E-mail versturen..." : "E-mail naar klant versturen"}</button>
                  <button type="button" onClick={() => copyText(whatsappText, "WhatsApp tekst gekopieerd.")} className="rounded-lg border border-[#3A2D1F] px-3 py-2 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815]">WhatsApp tekst kopieren</button>
                </div>
              </>
            ) : null}
          </div>
        </article>
      ) : null}
    </section>
  )
}
