"use client"

import { useState } from "react"

const ISSUE_REASONS = [
  "Klant niet bereikbaar",
  "Adres klopt niet",
  "Voertuigprobleem",
  "Vertraagd door vorige rit",
  "Verkeer / overmacht",
  "Anders",
]

export default function RideOpsControls({
  bookingId,
  currentStatus,
}: {
  bookingId: string
  currentStatus: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [showIssue, setShowIssue] = useState(false)
  const [showNoShow, setShowNoShow] = useState(false)
  const [issueReason, setIssueReason] = useState(ISSUE_REASONS[0])
  const [issueNote, setIssueNote] = useState("")
  const [noShowNote, setNoShowNote] = useState("")

  const nextTransition: Record<string, { next: string; label: string } | null> = {
    assigned: { next: "accepted", label: "Accepteren" },
    accepted: { next: "on_the_way", label: "Onderweg" },
    on_the_way: { next: "arrived", label: "Aangekomen" },
    arrived: { next: "in_progress", label: "Rit starten" },
    in_progress: { next: "completed", label: "Afronden" },
  }

  const transition = nextTransition[currentStatus] || null

  async function updateStatus(nextStatus: string) {
    setLoading(true)
    setError("")
    setStatus("")
    try {
      const res = await fetch("/api/chauffeur/bookings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, nextStatus }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "Status update mislukt.")
      setStatus("Status bijgewerkt.")
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status update mislukt.")
    } finally {
      setLoading(false)
    }
  }

  async function sendIssue() {
    if (!issueReason || !issueNote.trim()) {
      setError("Kies een reden en vul een notitie in.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/chauffeur/bookings/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reportType: "issue", reason: issueReason, note: issueNote }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "Probleem melden mislukt.")
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Probleem melden mislukt.")
    } finally {
      setLoading(false)
    }
  }

  async function sendNoShow() {
    if (!noShowNote.trim()) {
      setError("Beschrijf kort wat er is gebeurd.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/chauffeur/bookings/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reportType: "no_show", note: noShowNote }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "No-show melden mislukt.")
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No-show melden mislukt.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {transition ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => updateStatus(transition.next)}
            className="inline-flex items-center justify-center rounded-xl border border-[#D6B58A]/40 bg-[#D6B58A]/[0.08] px-4 py-2.5 text-sm font-semibold text-[#D6B58A] transition-colors hover:bg-[#D6B58A]/[0.16] disabled:opacity-50"
          >
            {loading ? "Even geduld..." : transition.label}
          </button>
        ) : null}

        <button type="button" onClick={() => setShowIssue((v) => !v)} className="rounded-xl border border-[#292520] px-3 py-2 text-xs text-[#B7AEA2] hover:bg-[#141210]">
          Probleem melden
        </button>

        {currentStatus === "arrived" ? (
          <button type="button" onClick={() => setShowNoShow((v) => !v)} className="rounded-xl border border-[#292520] px-3 py-2 text-xs text-[#B7AEA2] hover:bg-[#141210]">
            No-show melden
          </button>
        ) : null}
      </div>

      {showIssue ? (
        <div className="rounded-xl border border-[#292520] bg-[#080807] p-3">
          <select value={issueReason} onChange={(e) => setIssueReason(e.target.value)} className="h-9 w-full rounded-md border border-[#292520] bg-[#0D0C0B] px-2 text-sm text-[#F5F1E8]">
            {ISSUE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <textarea value={issueNote} onChange={(e) => setIssueNote(e.target.value)} placeholder="Notitie" className="mt-2 min-h-20 w-full rounded-md border border-[#292520] bg-[#0D0C0B] px-2 py-1.5 text-sm text-[#F5F1E8]" />
          <button type="button" disabled={loading} onClick={sendIssue} className="mt-2 rounded-md border border-[#3A2D1F] px-3 py-1.5 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815] disabled:opacity-50">Versturen</button>
        </div>
      ) : null}

      {showNoShow ? (
        <div className="rounded-xl border border-[#292520] bg-[#080807] p-3">
          <p className="text-xs text-[#8F877D]">No-show melden kan na 10 minuten wachttijd.</p>
          <textarea value={noShowNote} onChange={(e) => setNoShowNote(e.target.value)} placeholder="Beschrijf kort wat er is gebeurd." className="mt-2 min-h-20 w-full rounded-md border border-[#292520] bg-[#0D0C0B] px-2 py-1.5 text-sm text-[#F5F1E8]" />
          <button type="button" disabled={loading} onClick={sendNoShow} className="mt-2 rounded-md border border-[#3A2D1F] px-3 py-1.5 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815] disabled:opacity-50">No-show bevestigen</button>
        </div>
      ) : null}

      {status ? <p className="text-xs text-[#22A06B]">{status}</p> : null}
      {error ? <p className="text-xs text-[#D94A4A]">{error}</p> : null}
    </div>
  )
}
