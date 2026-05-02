"use client"

import { useState } from "react"

type Driver = { id: string; full_name: string }

type Conflict = {
  reference: string
  pickupTime: string
  route: string
  expectedAvailableTime: string
  summary: string
}

export default function AdminAssignDriverControl({
  bookingId,
  initialDriverId,
  drivers,
}: {
  bookingId: string
  initialDriverId?: string | null
  drivers: Driver[]
}) {
  const [driverId, setDriverId] = useState(initialDriverId || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [conflict, setConflict] = useState<Conflict | null>(null)

  async function assign(overrideConflict = false) {
    setLoading(true)
    setError("")
    setStatus("")

    try {
      const res = await fetch("/api/admin/bookings/assign-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, driverId, overrideConflict }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        if (data?.code === "DRIVER_CONFLICT") {
          setConflict(data.conflict)
          setError(data.message)
          return
        }
        throw new Error(data.message || "Toewijzen mislukt.")
      }

      setConflict(null)
      setStatus("Chauffeur toegewezen.")
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Toewijzen mislukt.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <select
        value={driverId}
        onChange={(e) => setDriverId(e.target.value)}
        className="h-9 w-full rounded-md border border-[#292520] bg-[#0D0C0B] px-2 text-sm"
      >
        <option value="">Selecteer chauffeur</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>{d.full_name}</option>
        ))}
      </select>

      <button
        type="button"
        disabled={loading || !driverId}
        onClick={() => assign(false)}
        className="w-full rounded-md border border-[#3A2D1F] px-3 py-1.5 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815] disabled:opacity-50"
      >
        {loading ? "Toewijzen..." : "Toewijzen"}
      </button>

      {conflict ? (
        <div className="rounded-md border border-[#D6B58A]/30 bg-[#D6B58A]/10 p-2 text-[11px] text-[#D6B58A]">
          <p>{conflict.summary}</p>
          <p className="mt-1 text-[#B7AEA2]">{conflict.route}</p>
          <button
            type="button"
            disabled={loading}
            onClick={() => assign(true)}
            className="mt-2 rounded-md border border-[#3A2D1F] px-2 py-1 font-semibold text-[#D6B58A] hover:bg-[#1B1815] disabled:opacity-50"
          >
            Toch toewijzen
          </button>
        </div>
      ) : null}

      {error ? <p className="text-[11px] text-[#D94A4A]">{error}</p> : null}
      {status ? <p className="text-[11px] text-[#22A06B]">{status}</p> : null}
    </div>
  )
}
