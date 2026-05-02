import { redirect } from "next/navigation"
import { getAuthenticatedDriverId } from "@/lib/driver-auth"
import { getSupabaseServiceClient } from "@/lib/supabase/server"
import { RideActionButton } from "@/components/chauffeur/ride-action-button"
import { Clock, MapPin, Phone, Users } from "lucide-react"

// ── Server action ─────────────────────────────────────────────────────────────

async function updateRideStatusAction(formData: FormData) {
  "use server"

  const bookingId = String(formData.get("bookingId") || "")
  const nextStatus = String(formData.get("nextStatus") || "")

  const driverId = await getAuthenticatedDriverId()
  if (!driverId) redirect("/chauffeur/login")

  if (!bookingId || !nextStatus) return

  const allowed = new Set(["accepted", "on_the_way", "completed"])
  if (!allowed.has(nextStatus)) return

  const supabase = getSupabaseServiceClient()

  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("id", bookingId)
    .eq("assigned_driver_id", driverId)
    .maybeSingle()

  if (!booking) return

  await supabase
    .from("bookings")
    .update({ booking_status: nextStatus })
    .eq("id", bookingId)

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: `driver_${nextStatus}`,
    actor_type: "driver",
    actor_id: driverId,
    note: `Status set to ${nextStatus} by driver`,
  })

  redirect("/chauffeur/ritten")
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_INFO: Record<string, { label: string; style: string }> = {
  assigned:   { label: "Toegewezen",   style: "bg-[#D6B58A]/10 text-[#D6B58A] border-[#D6B58A]/20" },
  confirmed:  { label: "Bevestigd",    style: "bg-[#D6B58A]/10 text-[#D6B58A] border-[#D6B58A]/20" },
  accepted:   { label: "Geaccepteerd", style: "bg-[#22A06B]/10 text-[#22A06B] border-[#22A06B]/20" },
  on_the_way: { label: "Onderweg",     style: "bg-[#22A06B]/10 text-[#22A06B] border-[#22A06B]/20" },
  completed:  { label: "Afgerond",     style: "bg-white/5 text-[#B7AEA2] border-white/10" },
  cancelled:  { label: "Geannuleerd",  style: "bg-[#D94A4A]/10 text-[#D94A4A] border-[#D94A4A]/20" },
  canceled:   { label: "Geannuleerd",  style: "bg-[#D94A4A]/10 text-[#D94A4A] border-[#D94A4A]/20" },
}

function statusInfo(s: string | null) {
  return STATUS_INFO[s ?? ""] ?? { label: s ?? "Onbekend", style: "bg-white/5 text-[#7F776E] border-white/10" }
}

// One step at a time — show only the next logical action
function nextAction(status: string | null): { nextStatus: string; label: string } | null {
  switch (status) {
    case "assigned":
    case "confirmed":
    case "unassigned":
      return { nextStatus: "accepted", label: "Accepteren" }
    case "accepted":
      return { nextStatus: "on_the_way", label: "Ik ga erheen" }
    case "on_the_way":
      return { nextStatus: "completed", label: "Rit afronden" }
    default:
      return null
  }
}

function mapsUrl(from: string | null, to: string | null) {
  if (!from || !to) return null
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`
}

function fmtDate(date: string | null): string {
  if (!date) return "-"
  const [y, m, d] = date.split("-")
  return `${d}-${m}-${y}`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ChauffeurRittenPage() {
  const driverId = await getAuthenticatedDriverId()
  if (!driverId) redirect("/chauffeur/login")

  const supabase = getSupabaseServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: rides } = await supabase
    .from("bookings")
    .select(
      "id, reference, pickup_date, pickup_time, pickup_address, destination_address, customer_name, customer_phone, passengers, vehicle_type, booking_status, estimated_fare"
    )
    .eq("assigned_driver_id", driverId)
    .gte("pickup_date", today)
    .order("pickup_date", { ascending: true })
    .order("pickup_time", { ascending: true })
    .limit(100)

  const all = rides ?? []
  const todayRides = all.filter((r) => r.pickup_date === today)
  const upcomingRides = all.filter((r) => (r.pickup_date ?? "") > today)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-[#F5F1E8]">Mijn ritten</h1>
        <p className="mt-0.5 text-xs text-[#7F776E]">Toegewezen ritten vanaf vandaag</p>
      </div>

      {/* Today */}
      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[#7F776E]">
          Vandaag — {fmtDate(today)}
        </p>
        {todayRides.length === 0 ? (
          <EmptyState label="Geen ritten gepland voor vandaag." />
        ) : (
          <div className="space-y-3">
            {todayRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} action={updateRideStatusAction} highlight />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      {upcomingRides.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[#7F776E]">
            Komende ritten
          </p>
          <div className="space-y-3">
            {upcomingRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} action={updateRideStatusAction} />
            ))}
          </div>
        </div>
      )}

      {all.length === 0 && (
        <EmptyState
          label="Geen toegewezen ritten gevonden."
          sub="Nieuwe ritten verschijnen hier zodra de planner een rit aan u toewijst."
        />
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyState({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[#1F1C18] bg-[#0D0C0B] px-5 py-10 text-center">
      <p className="text-sm text-[#B7AEA2]">{label}</p>
      {sub && <p className="mt-1.5 text-xs leading-relaxed text-[#7F776E]">{sub}</p>}
    </div>
  )
}

type Ride = {
  id: string
  reference: string | null
  pickup_date: string | null
  pickup_time: string | null
  pickup_address: string | null
  destination_address: string | null
  customer_name: string | null
  customer_phone: string | null
  passengers: number | null
  vehicle_type: string | null
  booking_status: string | null
  estimated_fare: number | null
}

function RideCard({
  ride,
  action,
  highlight,
}: {
  ride: Ride
  action: (formData: FormData) => Promise<void>
  highlight?: boolean
}) {
  const info = statusInfo(ride.booking_status)
  const next = nextAction(ride.booking_status)
  const nav = mapsUrl(ride.pickup_address, ride.destination_address)
  const done = ["completed", "cancelled", "canceled"].includes(ride.booking_status ?? "")

  return (
    <article
      className={`rounded-xl border p-4 ${
        highlight ? "border-[#D6B58A]/15 bg-[#0D0C0B]" : "border-[#1F1C18] bg-[#0D0C0B]"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {ride.pickup_time && (
            <div className="flex items-center gap-1.5 rounded-lg border border-[#292520] bg-[#141210] px-2.5 py-1.5">
              <Clock className="size-3 text-[#D6B58A]" />
              <span className="text-sm font-bold tabular-nums text-[#D6B58A]">
                {ride.pickup_time}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[#F5F1E8]">{ride.reference ?? "—"}</p>
            {ride.pickup_date && (
              <p className="text-[11px] text-[#7F776E]">{fmtDate(ride.pickup_date)}</p>
            )}
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${info.style}`}
        >
          {info.label}
        </span>
      </div>

      {/* Route */}
      <div className="mt-3 space-y-1.5 rounded-xl border border-[#1F1C18] bg-[#080807] p-3">
        <div className="flex items-start gap-2 text-xs">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#D6B58A]/60" />
          <span className="text-[#B7AEA2]">{ride.pickup_address ?? "—"}</span>
        </div>
        <div className="ml-1.5 h-3 w-px border-l border-dashed border-[#292520]" />
        <div className="flex items-start gap-2 text-xs">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#D6B58A]" />
          <span className="text-[#B7AEA2]">{ride.destination_address ?? "—"}</span>
        </div>
      </div>

      {/* Details */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#7F776E]">
        {ride.customer_name && (
          <span className="text-[#B7AEA2]">{ride.customer_name}</span>
        )}
        {ride.customer_phone && (
          <a
            href={`tel:${ride.customer_phone}`}
            className="flex items-center gap-1 font-medium text-[#D6B58A] hover:text-[#E4C69E]"
          >
            <Phone className="size-3" />
            {ride.customer_phone}
          </a>
        )}
        {(ride.passengers || ride.vehicle_type) && (
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {ride.passengers ?? "-"} pers. ·{" "}
            {ride.vehicle_type === "taxibus" ? "Taxibus" : "Taxi"}
          </span>
        )}
      </div>

      {/* Actions */}
      {!done && (
        <div className="mt-4 flex gap-2">
          {next && (
            <div className="flex-1">
              <RideActionButton
                action={action}
                bookingId={ride.id}
                nextStatus={next.nextStatus}
                label={next.label}
                variant="primary"
              />
            </div>
          )}
          {nav && (
            <a
              href={nav}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-[#292520] px-4 py-2.5 text-sm font-semibold text-[#B7AEA2] transition-colors hover:bg-[#141210]"
            >
              Navigeer
            </a>
          )}
        </div>
      )}

      {done && ride.booking_status === "completed" && (
        <p className="mt-3 rounded-lg border border-[#22A06B]/10 bg-[#22A06B]/[0.04] px-3 py-2 text-xs font-medium text-[#22A06B]">
          Rit succesvol afgerond
        </p>
      )}
    </article>
  )
}
