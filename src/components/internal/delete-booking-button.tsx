"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  bookingId: string
  reference: string
}

export default function DeleteBookingButton({ bookingId, reference }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<"idle" | "confirm" | "loading">("idle")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  if (phase === "idle") {
    return (
      <button
        onClick={() => setPhase("confirm")}
        className="rounded-md border border-[#D94A4A]/40 px-2 py-1 text-xs text-[#ffb4b4] hover:bg-[#D94A4A]/10"
      >
        Rit verwijderen
      </button>
    )
  }

  if (phase === "confirm") {
    return (
      <div className="mt-2 space-y-2 rounded-lg border border-[#D94A4A]/20 bg-[#D94A4A]/5 p-3">
        <p className="text-xs text-[#ffb4b4]">
          Weet u zeker dat u rit <span className="font-semibold">{reference}</span> wilt verwijderen?
        </p>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reden (optioneel)"
          className="h-8 w-full rounded-md border border-[#292520] bg-[#0D0C0B] px-2 text-xs text-[#F5F1E8] placeholder:text-[#8F877D] focus:outline-none"
        />
        {error && <p className="text-[11px] text-[#ffb4b4]">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={async () => {
              setPhase("loading")
              setError("")
              try {
                const res = await fetch("/api/admin/bookings/delete", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ bookingId, reason }),
                })
                const data = await res.json()
                if (!res.ok || !data.success) {
                  setError(data.message || "Verwijderen mislukt.")
                  setPhase("confirm")
                } else {
                  router.refresh()
                }
              } catch {
                setError("Netwerkfout. Probeer opnieuw.")
                setPhase("confirm")
              }
            }}
            className="rounded-md border border-[#D94A4A]/40 px-3 py-1 text-xs font-semibold text-[#ffb4b4] hover:bg-[#D94A4A]/10"
          >
            Ja, verwijderen
          </button>
          <button
            onClick={() => { setPhase("idle"); setReason(""); setError("") }}
            className="rounded-md border border-[#292520] px-3 py-1 text-xs text-[#B7AEA2] hover:bg-[#141210]"
          >
            Annuleren
          </button>
        </div>
      </div>
    )
  }

  return (
    <span className="rounded-md border border-[#292520] px-2 py-1 text-xs text-[#8F877D]">
      Verwijderen...
    </span>
  )
}
