"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatCurrencyEUR } from "@/lib/format"
import {
  MapPin,
  CalendarDays,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Users,
} from "lucide-react"

interface PriceResult {
  price: number
  starttarief: number
  kmTarief: number
  kmPrijs: number
  distanceKm: number
  durationMin: number
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "31612345678"

function makeWhatsappLink(params: {
  origin: string
  destination: string
  date: string
  time: string
  vehicleType: "taxi" | "taxibus"
  passengers: number
  name?: string
}): string {
  const voertuig = params.vehicleType === "taxibus" ? "Taxibus (5-8 personen)" : "Taxi (1-4 personen)"
  const text = [
    "Hallo AlmereTaxiBoeken! Ik wil een rit boeken:",
    `Van: ${params.origin}`,
    `Naar: ${params.destination}`,
    `Datum: ${params.date}`,
    `Tijd: ${params.time}`,
    `Passagiers: ${params.passengers}`,
    `Voertuig: ${voertuig}`,
    params.name ? `Naam: ${params.name}` : "",
  ]
    .filter(Boolean)
    .join("\n")
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

const inputBase =
  "w-full rounded-lg border border-white/[0.09] bg-white/[0.04] h-11 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#D4B896]/40 focus:bg-white/[0.07] transition-colors"

export function BookingWidget() {
  const [step, setStep] = useState<"form" | "price">("form")
  const [passengers, setPassengers] = useState(1)
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const originRef = useRef<HTMLInputElement>(null)
  const destRef = useRef<HTMLInputElement>(null)
  const acInitDone = useRef(false)

  const vehicleType: "taxi" | "taxibus" = passengers >= 5 ? "taxibus" : "taxi"

  const initAutocomplete = useCallback(() => {
    if (acInitDone.current) return
    if (typeof google === "undefined" || !google.maps?.places) return
    if (!originRef.current || !destRef.current) return

    acInitDone.current = true

    const opts: google.maps.places.AutocompleteOptions = {
      componentRestrictions: { country: "nl" },
      fields: ["formatted_address", "name"],
    }

    const originAC = new google.maps.places.Autocomplete(originRef.current, opts)
    originAC.addListener("place_changed", () => {
      const p = originAC.getPlace()
      setOrigin(p.formatted_address ?? p.name ?? originRef.current?.value ?? "")
    })

    const destAC = new google.maps.places.Autocomplete(destRef.current, opts)
    destAC.addListener("place_changed", () => {
      const p = destAC.getPlace()
      setDestination(p.formatted_address ?? p.name ?? destRef.current?.value ?? "")
    })
  }, [])

  useEffect(() => {
    let tries = 0
    const check = () => {
      if (typeof google !== "undefined" && google.maps?.places) {
        initAutocomplete()
        return
      }
      if (tries++ < 60) setTimeout(check, 300)
    }
    check()
  }, [initAutocomplete])

  async function handleCalculatePrice() {
    const originVal = originRef.current?.value.trim() ?? origin.trim()
    const destVal = destRef.current?.value.trim() ?? destination.trim()

    if (!originVal || !destVal || !date || !time) {
      setError("Vul alle velden in om een tarief te berekenen.")
      return
    }

    setOrigin(originVal)
    setDestination(destVal)
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/calculate-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: originVal,
          destination: destVal,
          date,
          time,
          vehicleType,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Fout bij tariefberekening.")
      setPriceResult(data as PriceResult)
      setStep("price")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tarief kon niet worden berekend. Probeer opnieuw.")
    } finally {
      setLoading(false)
    }
  }

  async function handleBook() {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError("Vul uw naam, telefoonnummer en e-mailadres in.")
      return
    }
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          date,
          time,
          vehicleType,
          passengers,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          price: priceResult?.price,
          distanceKm: priceResult?.distanceKm,
          durationMin: priceResult?.durationMin,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Boeking mislukt.")
      const checkoutUrl = data.checkoutUrl as string | undefined
      if (!checkoutUrl) throw new Error("Geen betaalpagina ontvangen.")
      window.location.href = checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Boeking mislukt. Gebruik WhatsApp als alternatief.")
    } finally {
      setLoading(false)
    }
  }

  if (step === "price" && priceResult) {
    return (
      <div className="rounded-2xl border border-white/[0.09] bg-[#111111] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Boeking bevestigen</p>
          <button
            onClick={() => {
              setStep("form")
              setError("")
            }}
            className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="size-3" /> Wijzigen
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5 text-xs">
          <div className="flex items-start gap-2 text-white/60">
            <MapPin className="mt-0.5 size-3 shrink-0 text-[#D4B896]/60" />
            <span className="truncate">{origin}</span>
          </div>
          <div className="ml-1.5 my-1 h-3 w-px border-l border-dashed border-white/[0.1]" />
          <div className="flex items-start gap-2 text-white/60">
            <MapPin className="mt-0.5 size-3 shrink-0 text-[#D4B896]" />
            <span className="truncate">{destination}</span>
          </div>
          <p className="mt-2.5 text-white/30">
            {priceResult.distanceKm} km · ca. {priceResult.durationMin} min · {passengers} {passengers === 1 ? "persoon" : "personen"}
          </p>
        </div>

        <div className="mb-4 rounded-xl border border-[#D4B896]/[0.15] bg-[#D4B896]/[0.05] p-4">
          <p className="mb-1 text-xs text-[#D4B896]/60">Vaste prijs</p>
          <p className="text-3xl font-black text-[#D4B896]">{formatCurrencyEUR(priceResult.price)}</p>
          <p className="mt-1 text-[10px] text-white/25">
            Starttarief {formatCurrencyEUR(priceResult.starttarief)} + {priceResult.distanceKm} km · {formatCurrencyEUR(priceResult.kmTarief)}
            {vehicleType === "taxibus" ? " (taxibus)" : " (taxi)"}
          </p>
        </div>

        <div className="mb-4 space-y-2">
          <input type="text" placeholder="Uw naam" value={name} onChange={(e) => setName(e.target.value)} className={cn(inputBase, "px-4")} />
          <input type="tel" placeholder="Telefoonnummer" value={phone} onChange={(e) => setPhone(e.target.value)} className={cn(inputBase, "px-4")} />
          <input type="email" placeholder="E-mailadres" value={email} onChange={(e) => setEmail(e.target.value)} className={cn(inputBase, "px-4")} />
        </div>

        {error && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

        <Button
          onClick={handleBook}
          disabled={loading}
          className="mb-2.5 w-full h-12 border border-[#D4B896]/40 bg-[#D4B896]/[0.08] text-[#D4B896] font-semibold text-[15px] hover:bg-[#D4B896]/[0.16] rounded-xl disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <>Boeking bevestigen & betalen <ArrowRight className="size-4" /></>}
        </Button>

        <a
          href={makeWhatsappLink({ origin, destination, date, time, vehicleType, passengers, name })}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366]/20 px-4 py-2.5 text-sm font-medium text-[#25D366]/70 hover:bg-[#25D366]/[0.07] hover:text-[#25D366] transition-colors"
        >
          <MessageCircle className="size-3.5" />
          Of boek direct via WhatsApp
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/[0.09] bg-[#111111] p-6 shadow-2xl">
      <p className="mb-5 text-sm font-semibold text-white">Rit reserveren</p>

      <div className="space-y-2.5">
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/25" />
          <input ref={originRef} type="text" placeholder="Uw vertrekpunt" defaultValue={origin} onChange={(e) => setOrigin(e.target.value)} className={cn(inputBase, "pl-10 pr-4")} />
        </div>

        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#D4B896]/50" />
          <input ref={destRef} type="text" placeholder="Uw bestemming" defaultValue={destination} onChange={(e) => setDestination(e.target.value)} className={cn(inputBase, "pl-10 pr-4")} />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/25" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className={cn(inputBase, "pl-10 pr-2 text-white/70", "[&::-webkit-calendar-picker-indicator]:opacity-30 [&::-webkit-calendar-picker-indicator]:invert")}
            />
          </div>
          <div className="relative">
            <Clock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/25" />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={cn(inputBase, "pl-10 pr-2 text-white/70", "[&::-webkit-calendar-picker-indicator]:opacity-30 [&::-webkit-calendar-picker-indicator]:invert")}
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
          <label className="mb-2 flex items-center gap-2 text-xs text-white/50">
            <Users className="size-3.5" />
            Aantal passagiers
          </label>
          <select
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="h-11 w-full rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-[#D4B896]/40"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
              <option key={p} value={p} className="bg-[#111111]">
                {p} {p === 1 ? "persoon" : "personen"}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-white/40">Voertuigtype: <span className="text-[#D4B896]">{vehicleType === "taxibus" ? "Taxibus" : "Taxi"}</span></p>
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

      <Button
        onClick={handleCalculatePrice}
        disabled={loading}
        className="mt-5 w-full h-12 border border-[#D4B896]/40 bg-[#D4B896]/[0.08] text-[#D4B896] font-semibold text-[15px] hover:bg-[#D4B896]/[0.16] rounded-xl disabled:opacity-50"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : "Tarief berekenen"}
      </Button>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-[#8F877D] tracking-wide">
        <span className="hidden sm:inline">4,9/5 beoordeling · Pin · Creditcard · Contant</span>
        <span className="sm:hidden">4,9/5 · Pin · Creditcard · Contant</span>
      </p>
    </div>
  )
}

