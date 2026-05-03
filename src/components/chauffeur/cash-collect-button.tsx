"use client"

import { useState } from "react"

export default function CashCollectButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  async function handleCollect() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/chauffeur/bookings/cash-collected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "Mislukt.")
      setDone(true)
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mislukt.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return <p className="text-xs font-medium text-[#22A06B]">Contant ontvangen ✓</p>
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={loading}
        onClick={handleCollect}
        className="inline-flex items-center justify-center rounded-xl border border-[#22A06B]/40 bg-[#22A06B]/[0.08] px-4 py-2.5 text-sm font-semibold text-[#22A06B] transition-colors hover:bg-[#22A06B]/[0.16] disabled:opacity-50"
      >
        {loading ? "Even geduld..." : "Contant ontvangen"}
      </button>
      {error ? <p className="text-xs text-[#D94A4A]">{error}</p> : null}
    </div>
  )
}
