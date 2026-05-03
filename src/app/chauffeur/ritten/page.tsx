import { redirect } from "next/navigation"
import { getAuthenticatedDriver } from "@/lib/driver-auth"
import { getSupabaseServiceClient } from "@/lib/supabase/server"
import RideOpsControls from "@/components/chauffeur/ride-ops-controls"
import CashCollectButton from "@/components/chauffeur/cash-collect-button"
import DispatcherAssignControl from "@/components/chauffeur/dispatcher-assign-control"
import { formatCurrencyEUR } from "@/lib/format"
import { Clock, MapPin, Phone, Users } from "lucide-react"

const STATUS_INFO: Record<string, { label: string; style: string }> = {
  assigned: { label: "Toegewezen", style: "bg-[#D6B58A]/10 text-[#D6B58A] border-[#D6B58A]/20" },
  accepted: { label: "Geaccepteerd", style: "bg-[#22A06B]/10 text-[#22A06B] border-[#22A06B]/20" },
  on_the_way: { label: "Onderweg", style: "bg-[#22A06B]/10 text-[#22A06B] border-[#22A06B]/20" },
  arrived: { label: "Aangekomen", style: "bg-[#22A06B]/10 text-[#22A06B] border-[#22A06B]/20" },
  in_progress: { label: "Rit bezig", style: "bg-[#22A06B]/10 text-[#22A06B] border-[#22A06B]/20" },
  completed: { label: "Afgerond", style: "bg-white/5 text-[#B7AEA2] border-white/10" },
  no_show_reported: { label: "No-show gemeld", style: "bg-[#D6B58A]/10 text-[#D6B58A] border-[#D6B58A]/20" },
  issue_reported: { label: "Probleem gemeld", style: "bg-[#D6B58A]/10 text-[#D6B58A] border-[#D6B58A]/20" },
  cancelled: { label: "Geannuleerd", style: "bg-[#D94A4A]/10 text-[#D94A4A] border-[#D94A4A]/20" },
  unassigned: { label: "Niet toegewezen", style: "bg-white/5 text-[#7F776E] border-white/10" },
}

function statusInfo(s: string | null) {
  return STATUS_INFO[s ?? ""] ?? { label: s ?? "Onbekend", style: "bg-white/5 text-[#7F776E] border-white/10" }
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
  payment_method: string | null
  cash_amount_due: number | null
  cash_collection_status: string | null
  assigned_driver_id: string | null
}

type DriverOption = { id: string; name: string }

export default async function ChauffeurRittenPage() {
  const driver = await getAuthenticatedDriver()
  if (!driver) redirect("/chauffeur/login")

  const supabase = getSupabaseServiceClient()
  const today = new Date().toISOString().slice(0, 10)
  const isDispatcher = driver.can_dispatch

  const ridesQuery = isDispatcher
    ? supabase
        .from("bookings")
        .select("id, reference, pickup_date, pickup_time, pickup_address, destination_address, customer_name, customer_phone, passengers, vehicle_type, booking_status, payment_method, cash_amount_due, cash_collection_status, assigned_driver_id")
        .gte("pickup_date", today)
        .is("deleted_at", null)
        .order("pickup_date", { ascending: true })
        .order("pickup_time", { ascending: true })
        .limit(200)
    : supabase
        .from("bookings")
        .select("id, reference, pickup_date, pickup_time, pickup_address, destination_address, customer_name, customer_phone, passengers, vehicle_type, booking_status, payment_method, cash_amount_due, cash_collection_status, assigned_driver_id")
        .eq("assigned_driver_id", driver.id)
        .gte("pickup_date", today)
        .is("deleted_at", null)
        .order("pickup_date", { ascending: true })
        .order("pickup_time", { ascending: true })
        .limit(100)

  const [{ data: rides }, { data: allDrivers }] = await Promise.all([
    ridesQuery,
    isDispatcher
      ? supabase
          .from("drivers")
          .select("id, full_name, first_name, last_name")
          .eq("active", true)
          .eq("approval_status", "approved")
          .is("deleted_at", null)
          .order("full_name", { ascending: true })
      : Promise.resolve({ data: null }),
  ])

  const driverOptions: DriverOption[] = (allDrivers ?? []).map((d) => ({
    id: d.id,
    name: [d.first_name, d.last_name].filter(Boolean).join(" ") || d.full_name || d.id,
  }))

  const all = rides ?? []
  const todayRides = all.filter((r) => r.pickup_date === today)
  const upcomingRides = all.filter((r) => (r.pickup_date ?? "") > today)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-[#F5F1E8]">
          {isDispatcher ? "Alle ritten" : "Mijn ritten"}
        </h1>
        <p className="mt-0.5 text-xs text-[#7F776E]">
          {isDispatcher ? "Alle actieve ritten — planningsoverzicht" : "Toegewezen ritten vanaf vandaag"}
        </p>
      </div>

      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[#7F776E]">Vandaag - {fmtDate(today)}</p>
        {todayRides.length === 0 ? (
          <EmptyState label="Geen ritten gepland voor vandaag." />
        ) : (
          <div className="space-y-3">
            {todayRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                highlight
                currentDriverId={driver.id}
                isDispatcher={isDispatcher}
                driverOptions={driverOptions}
              />
            ))}
          </div>
        )}
      </div>

      {upcomingRides.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[#7F776E]">Komende ritten</p>
          <div className="space-y-3">
            {upcomingRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                currentDriverId={driver.id}
                isDispatcher={isDispatcher}
                driverOptions={driverOptions}
              />
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

function EmptyState({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[#1F1C18] bg-[#0D0C0B] px-5 py-10 text-center">
      <p className="text-sm text-[#B7AEA2]">{label}</p>
      {sub && <p className="mt-1.5 text-xs leading-relaxed text-[#7F776E]">{sub}</p>}
    </div>
  )
}

function RideCard({
  ride,
  highlight,
  currentDriverId,
  isDispatcher,
  driverOptions,
}: {
  ride: Ride
  highlight?: boolean
  currentDriverId: string
  isDispatcher: boolean
  driverOptions: DriverOption[]
}) {
  const info = statusInfo(ride.booking_status)
  const nav = mapsUrl(ride.pickup_address, ride.destination_address)
  const done = ["completed", "cancelled", "canceled", "deleted"].includes(ride.booking_status ?? "")
  const isOwnRide = ride.assigned_driver_id === currentDriverId
  const assignedDriverName = isDispatcher && ride.assigned_driver_id
    ? driverOptions.find((d) => d.id === ride.assigned_driver_id)?.name ?? ride.assigned_driver_id
    : null

  return (
    <article className={`rounded-xl border p-4 ${highlight ? "border-[#D6B58A]/15 bg-[#0D0C0B]" : "border-[#1F1C18] bg-[#0D0C0B]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {ride.pickup_time && (
            <div className="flex items-center gap-1.5 rounded-lg border border-[#292520] bg-[#141210] px-2.5 py-1.5">
              <Clock className="size-3 text-[#D6B58A]" />
              <span className="text-sm font-bold tabular-nums text-[#D6B58A]">{ride.pickup_time}</span>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[#F5F1E8]">{ride.reference ?? "-"}</p>
            {ride.pickup_date && <p className="text-[11px] text-[#7F776E]">{fmtDate(ride.pickup_date)}</p>}
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${info.style}`}>{info.label}</span>
      </div>

      {isDispatcher && (
        <p className="mt-1.5 text-[11px] text-[#7F776E]">
          Chauffeur: <span className={assignedDriverName ? "text-[#D6B58A]" : "italic text-[#8F877D]"}>
            {assignedDriverName ?? "Niet toegewezen"}
          </span>
        </p>
      )}

      <div className="mt-3 space-y-1.5 rounded-xl border border-[#1F1C18] bg-[#080807] p-3">
        <div className="flex items-start gap-2 text-xs"><MapPin className="mt-0.5 size-3.5 shrink-0 text-[#D6B58A]/60" /><span className="text-[#B7AEA2]">{ride.pickup_address ?? "-"}</span></div>
        <div className="ml-1.5 h-3 w-px border-l border-dashed border-[#292520]" />
        <div className="flex items-start gap-2 text-xs"><MapPin className="mt-0.5 size-3.5 shrink-0 text-[#D6B58A]" /><span className="text-[#B7AEA2]">{ride.destination_address ?? "-"}</span></div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#7F776E]">
        {ride.customer_name && <span className="text-[#B7AEA2]">{ride.customer_name}</span>}
        {ride.customer_phone && <a href={`tel:${ride.customer_phone}`} className="flex items-center gap-1 font-medium text-[#D6B58A] hover:text-[#E4C69E]"><Phone className="size-3" />{ride.customer_phone}</a>}
        {(ride.passengers || ride.vehicle_type) && <span className="flex items-center gap-1"><Users className="size-3" />{ride.passengers ?? "-"} pers. · {ride.vehicle_type === "taxibus" ? "Taxibus" : "Taxi"}</span>}
      </div>

      {ride.payment_method === "cash" ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#22A06B]/20 bg-[#22A06B]/[0.06] px-3 py-2">
          <span className="text-xs font-medium text-[#22A06B]">Contant innen</span>
          {ride.cash_amount_due ? (
            <span className="ml-auto text-sm font-bold text-[#22A06B]">
              Te innen: {formatCurrencyEUR(ride.cash_amount_due)}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Dispatcher assignment control */}
      {isDispatcher && !done && (
        <DispatcherAssignControl
          bookingId={ride.id}
          currentDriverId={ride.assigned_driver_id}
          drivers={driverOptions}
        />
      )}

      {/* Ride operations (status updates, cash, navigation) — shown for own assigned rides */}
      {!done && isOwnRide && (
        <div className="mt-4 space-y-2">
          <RideOpsControls bookingId={ride.id} currentStatus={ride.booking_status || ""} />
          {ride.payment_method === "cash" && ride.cash_collection_status !== "collected" ? (
            <CashCollectButton bookingId={ride.id} />
          ) : null}
          {ride.payment_method === "cash" && ride.cash_collection_status === "collected" ? (
            <p className="text-xs font-medium text-[#22A06B]">Contant ontvangen ✓</p>
          ) : null}
          {nav ? <a href={nav} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl border border-[#292520] px-4 py-2.5 text-sm font-semibold text-[#B7AEA2] transition-colors hover:bg-[#141210]">Navigeer</a> : null}
        </div>
      )}
    </article>
  )
}
