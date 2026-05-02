"use client"

import { useState } from "react"

export default function AdminExceptionActions({ bookingId }: { bookingId: string }) {
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")

  async function run(action: "admin_note" | "mark_completed" | "cancel" | "reschedule") {
    setLoading(true)
    setStatus("")
    setError("")
    try {
      const res = await fetch("/api/admin/bookings/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action, note }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "Actie mislukt.")
      setStatus("Wijziging opgeslagen.")
      setNote("")
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Actie mislukt.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-[#292520] bg-[#0D0C0B] p-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Notitie toevoegen"
        className="min-h-16 w-full rounded-md border border-[#292520] bg-[#080807] px-2 py-1 text-xs text-[#F5F1E8]"
      />
      <div className="flex flex-wrap gap-2">
        <button disabled={loading} onClick={() => run("admin_note")} className="rounded border border-[#292520] px-2 py-1 text-[11px] text-[#B7AEA2]">Notitie toevoegen</button>
        <button disabled={loading} onClick={() => run("mark_completed")} className="rounded border border-[#292520] px-2 py-1 text-[11px] text-[#B7AEA2]">Markeer afgerond</button>
        <button disabled={loading} onClick={() => run("cancel")} className="rounded border border-[#292520] px-2 py-1 text-[11px] text-[#B7AEA2]">Annuleren</button>
        <button disabled={loading} onClick={() => run("reschedule")} className="rounded border border-[#292520] px-2 py-1 text-[11px] text-[#B7AEA2]">Opnieuw toewijzen</button>
      </div>
      <p className="text-[11px] text-[#8F877D]">Refunds worden niet automatisch verwerkt. Controleer Mollie handmatig indien nodig.</p>
      {status ? <p className="text-[11px] text-[#22A06B]">{status}</p> : null}
      {error ? <p className="text-[11px] text-[#D94A4A]">{error}</p> : null}
    </div>
  )
}
