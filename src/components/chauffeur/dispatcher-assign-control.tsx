"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Driver {
  id: string
  name: string
}

interface Props {
  bookingId: string
  currentDriverId: string | null
  drivers: Driver[]
}

export default function DispatcherAssignControl({ bookingId, currentDriverId, drivers }: Props) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState(currentDriverId ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  const isDifferent = selectedId !== (currentDriverId ?? "")

  async function handleAssign() {
    if (!selectedId || !isDifferent) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/chauffeur/bookings/assign-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, targetDriverId: selectedId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || "Toewijzen mislukt.")
      } else {
        setDone(true)
        router.refresh()
      }
    } catch {
      setError("Netwerkfout. Probeer opnieuw.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[#7F776E]">Toewijzen</p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setDone(false); setError("") }}
          disabled={loading}
          className="h-8 flex-1 min-w-0 rounded-lg border border-[#292520] bg-[#0D0C0B] px-2 text-xs text-[#F5F1E8] focus:outline-none disabled:opacity-50"
        >
          <option value="">— Selecteer chauffeur —</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          disabled={loading || !selectedId || !isDifferent}
          className="h-8 shrink-0 rounded-lg border border-[#3A2D1F] px-3 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading
            ? "Bezig..."
            : currentDriverId
            ? "Opnieuw toewijzen"
            : "Toewijzen"}
        </button>
      </div>
      {done && (
        <p className="text-[11px] font-medium text-[#22A06B]">Toegewezen ✓</p>
      )}
      {error && (
        <p className="text-[11px] text-[#ffb4b4]">{error}</p>
      )}
    </div>
  )
}
