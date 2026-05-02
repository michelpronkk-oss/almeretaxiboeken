"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { formatCurrencyEUR } from "@/lib/format"

type FareResult = {
  distanceKm: number
  durationMinutes: number
  estimatedFare: number
  vehicleType: "taxi" | "taxibus"
  passengers: number
}

type CreateResponse = {
  success: boolean
  mode?: "saved_without_payment" | "payment_link_created"
  bookingId?: string
  reference?: string
  paymentUrl?: string
  fare?: FareResult
  emailSent?: boolean
  warning?: string
  message?: string
}

const passengerOptions = [1, 2, 3, 4, 5, 6, 7, 8]

export default function ManualRideForm() {
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [pickupAddress, setPickupAddress] = useState("")
  const [destinationAddress, setDestinationAddress] = useState("")
  const [pickupDate, setPickupDate] = useState("")
  const [pickupTime, setPickupTime] = useState("")
  const [passengers, setPassengers] = useState(1)
  const [notes, setNotes] = useState("")
  const [sendEmailToCustomer, setSendEmailToCustomer] = useState(true)
  const [saveWithoutPayment, setSaveWithoutPayment] = useState(false)

  const [calculating, setCalculating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [emailSending, setEmailSending] = useState(false)

  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [warning, setWarning] = useState("")

  const [fare, setFare] = useState<FareResult | null>(null)
  const [result, setResult] = useState<CreateResponse | null>(null)

  const derivedVehicle = passengers >= 5 ? "Taxibus" : "Taxi"

  const whatsappText = useMemo(() => {
    if (!result?.paymentUrl) return ""
    return `Beste ${customerName || "klant"}, hierbij de betaallink voor uw rit met AlmereTaxiBoeken. Na betaling is uw rit definitief gereserveerd: ${result.paymentUrl}`
  }, [result?.paymentUrl, customerName])

  async function calculatePrice() {
    setError("")
    setStatus("")
    setWarning("")

    if (!pickupAddress.trim() || !destinationAddress.trim()) {
      setError("Vul vertrekadres en bestemming in.")
      return
    }

    setCalculating(true)
    try {
      const res = await fetch("/api/admin/bookings/manual/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupAddress, destinationAddress, passengers }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Prijsberekening mislukt.")
      }
      setFare({
        distanceKm: data.distanceKm,
        durationMinutes: data.durationMinutes,
        estimatedFare: data.estimatedFare,
        vehicleType: data.vehicleType,
        passengers: data.passengers,
      })
      setStatus("Prijs berekend.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prijsberekening mislukt.")
    } finally {
      setCalculating(false)
    }
  }

  async function createBookingAndPayment() {
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

    if (!saveWithoutPayment && sendEmailToCustomer && !customerEmail.trim()) {
      setError("E-mailadres is verplicht als u de betaallink per e-mail wilt versturen.")
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
          pickupAddress,
          destinationAddress,
          pickupDate,
          pickupTime,
          passengers,
          notes,
          sendEmail: !saveWithoutPayment && sendEmailToCustomer,
          saveWithoutPayment,
        }),
      })

      const data = (await res.json()) as CreateResponse
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Aanmaken mislukt.")
      }

      setResult(data)
      if (data.mode === "saved_without_payment") {
        setStatus("Rit opgeslagen zonder betaling.")
      } else {
        setStatus("Betaallink aangemaakt.")
      }
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
      if (!res.ok || !data.success) {
        throw new Error(data.message || "E-mail kon niet worden verzonden.")
      }
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
          <p className="mt-2 text-sm text-[#B7AEA2]">Maak handmatig een rit aan en verstuur een betaallink naar de klant.</p>
        </div>
        <Link href="/admin/ritten" className="rounded-lg border border-[#3A2D1F] px-3 py-2 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815]">
          Terug naar ritten
        </Link>
      </div>

      {status ? <p className="rounded-md border border-[#22A06B]/30 bg-[#22A06B]/10 px-3 py-2 text-xs text-[#9de2c5]">{status}</p> : null}
      {warning ? <p className="rounded-md border border-[#D6B58A]/30 bg-[#D6B58A]/10 px-3 py-2 text-xs text-[#D6B58A]">{warning}</p> : null}
      {error ? <p className="rounded-md border border-[#D94A4A]/30 bg-[#D94A4A]/10 px-3 py-2 text-xs text-[#ffb4b4]">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-[#292520] bg-[#141210] p-4">
          <h2 className="text-sm font-semibold text-[#F5F1E8]">1. Klantgegevens</h2>
          <div className="mt-3 space-y-3">
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Klantnaam" className="h-10 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8]" />
            <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="E-mail klant (optioneel)" className="h-10 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8]" />
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Telefoon klant" className="h-10 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8]" />
          </div>
        </article>

        <article className="rounded-2xl border border-[#292520] bg-[#141210] p-4">
          <h2 className="text-sm font-semibold text-[#F5F1E8]">2. Ritgegevens</h2>
          <div className="mt-3 space-y-3">
            <input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="Vertrekadres" className="h-10 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8]" />
            <input value={destinationAddress} onChange={(e) => setDestinationAddress(e.target.value)} placeholder="Bestemming" className="h-10 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8]" />
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
              <div className="flex h-10 items-center rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#D6B58A]">Voertuig: {derivedVehicle}</div>
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opmerkingen (optioneel)" className="min-h-20 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 py-2 text-sm text-[#F5F1E8]" />
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-[#292520] bg-[#141210] p-4">
        <h2 className="text-sm font-semibold text-[#F5F1E8]">3. Prijsberekening</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={calculatePrice} disabled={calculating} className="rounded-lg border border-[#3A2D1F] px-4 py-2 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815] disabled:opacity-50">
            {calculating ? "Prijs berekenen..." : "Prijs berekenen"}
          </button>
        </div>

        {fare ? (
          <div className="mt-4 grid gap-3 rounded-xl border border-[#292520] bg-[#0D0C0B] p-4 sm:grid-cols-2 lg:grid-cols-4">
            <p className="text-sm text-[#B7AEA2]">Afstand: <span className="text-[#F5F1E8]">{fare.distanceKm} km</span></p>
            <p className="text-sm text-[#B7AEA2]">Reistijd: <span className="text-[#F5F1E8]">{fare.durationMinutes} min</span></p>
            <p className="text-sm text-[#B7AEA2]">Voertuig: <span className="text-[#F5F1E8]">{fare.vehicleType === "taxibus" ? "Taxibus" : "Taxi"}</span></p>
            <p className="text-sm text-[#B7AEA2]">Ritprijs: <span className="text-[#D6B58A] font-semibold">{formatCurrencyEUR(fare.estimatedFare)}</span></p>
          </div>
        ) : null}
      </article>

      <article className="rounded-2xl border border-[#292520] bg-[#141210] p-4">
        <h2 className="text-sm font-semibold text-[#F5F1E8]">4. Betaling</h2>
        <div className="mt-3 space-y-2 text-sm text-[#B7AEA2]">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={sendEmailToCustomer} onChange={(e) => setSendEmailToCustomer(e.target.checked)} className="size-4" disabled={saveWithoutPayment} />
            Betaallink direct per e-mail versturen
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={saveWithoutPayment} onChange={(e) => setSaveWithoutPayment(e.target.checked)} className="size-4" />
            Opslaan zonder betaling (interne uitzondering)
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={createBookingAndPayment} disabled={creating || !fare} className="rounded-lg border border-[#3A2D1F] px-4 py-2 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815] disabled:opacity-50">
            {creating ? (saveWithoutPayment ? "Opslaan..." : "Betaallink aanmaken...") : (saveWithoutPayment ? "Opslaan zonder betaling" : "Betaallink aanmaken")}
          </button>
        </div>
      </article>

      {result?.success ? (
        <article className="rounded-2xl border border-[#22A06B]/30 bg-[#22A06B]/10 p-4">
          <h3 className="text-sm font-semibold text-[#d9ffef]">{result.mode === "saved_without_payment" ? "Rit opgeslagen" : "Betaallink aangemaakt"}</h3>
          <div className="mt-3 space-y-2 text-sm text-[#B7AEA2]">
            <p>Referentie: <span className="text-[#F5F1E8]">{result.reference}</span></p>
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
