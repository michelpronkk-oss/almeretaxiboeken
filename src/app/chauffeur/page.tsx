import Link from "next/link"
import { redirect } from "next/navigation"
import { getAuthenticatedDriver } from "@/lib/driver-auth"
import { getSupabaseServiceClient } from "@/lib/supabase/server"
import { CONFIRMED_PAYMENT_STATUSES } from "@/lib/bookings"
import { getAmsterdamTodayString } from "@/lib/date"
import { ArrowRight, Car, CheckCircle2, Clock, MapPin } from "lucide-react"

export default async function ChauffeurPage() {
  const driver = await getAuthenticatedDriver()
  if (!driver) redirect("/chauffeur/login")

  const supabase = getSupabaseServiceClient()
  const today = getAmsterdamTodayString()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond"

  const isDispatcher = driver.can_dispatch

  const [
    { count: todayCount },
    { count: upcomingCount },
    { count: completedCount },
    { data: nextRides },
  ] = await Promise.all([
    isDispatcher
      ? supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .in("payment_status", CONFIRMED_PAYMENT_STATUSES)
          .eq("pickup_date", today)
          .is("deleted_at", null)
      : supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .in("payment_status", CONFIRMED_PAYMENT_STATUSES)
          .eq("assigned_driver_id", driver.id)
          .eq("pickup_date", today)
          .is("deleted_at", null),
    isDispatcher
      ? supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .in("payment_status", CONFIRMED_PAYMENT_STATUSES)
          .gt("pickup_date", today)
          .is("deleted_at", null)
      : supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .in("payment_status", CONFIRMED_PAYMENT_STATUSES)
          .eq("assigned_driver_id", driver.id)
          .gt("pickup_date", today)
          .is("deleted_at", null),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("payment_status", CONFIRMED_PAYMENT_STATUSES)
      .eq("assigned_driver_id", driver.id)
      .eq("booking_status", "completed"),
    isDispatcher
      ? supabase
          .from("bookings")
          .select("id, reference, pickup_time, pickup_address, destination_address, passengers, vehicle_type, booking_status")
          .in("payment_status", CONFIRMED_PAYMENT_STATUSES)
          .gte("pickup_date", today)
          .not("booking_status", "in", "(completed,cancelled,canceled,deleted)")
          .is("deleted_at", null)
          .order("pickup_date", { ascending: true })
          .order("pickup_time", { ascending: true })
          .limit(2)
      : supabase
          .from("bookings")
          .select("id, reference, pickup_time, pickup_address, destination_address, passengers, vehicle_type, booking_status")
          .in("payment_status", CONFIRMED_PAYMENT_STATUSES)
          .eq("assigned_driver_id", driver.id)
          .gte("pickup_date", today)
          .not("booking_status", "in", "(completed,cancelled,canceled,deleted)")
          .is("deleted_at", null)
          .order("pickup_date", { ascending: true })
          .order("pickup_time", { ascending: true })
          .limit(2),
  ])

  const firstName = driver.first_name ?? "Chauffeur"

  const stats = [
    { label: "Vandaag", value: todayCount ?? 0, icon: Clock },
    { label: "Komend", value: upcomingCount ?? 0, icon: Car },
    { label: "Afgerond", value: completedCount ?? 0, icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-[#F5F1E8]">
          {greeting}, {firstName}
        </h1>
        <p className="mt-0.5 text-xs text-[#7F776E]">
          Welkom terug in uw chauffeurportaal
          {driver.vehicle_type
            ? ` — ${driver.vehicle_type === "taxibus" ? "Taxibus" : "Taxi"}`
            : ""}
        </p>
        {isDispatcher && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {driver.is_owner && (
              <span className="inline-flex items-center rounded-full border border-[#D6B58A]/40 bg-[#D6B58A]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#D6B58A]">
                Eigenaar
              </span>
            )}
            <span className="inline-flex items-center rounded-full border border-[#22A06B]/30 bg-[#22A06B]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#22A06B]">
              Planning
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[#1F1C18] bg-[#0D0C0B] p-4"
          >
            <s.icon className="mb-2 size-4 text-[#7F776E]" />
            <p className="text-2xl font-bold text-[#D6B58A]">{s.value}</p>
            <p className="mt-0.5 text-[11px] text-[#7F776E]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Next rides */}
      {(nextRides ?? []).length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[#7F776E]">
            {isDispatcher ? "Volgende ritten (alle)" : "Volgende ritten"}
          </p>
          <div className="space-y-2">
            {(nextRides ?? []).map((ride) => (
              <div
                key={ride.id}
                className="rounded-xl border border-[#1F1C18] bg-[#0D0C0B] p-4"
              >
                <div className="flex items-center gap-2.5">
                  {ride.pickup_time && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-[#292520] bg-[#141210] px-2.5 py-1">
                      <Clock className="size-3 text-[#D6B58A]" />
                      <span className="text-sm font-bold tabular-nums text-[#D6B58A]">
                        {ride.pickup_time}
                      </span>
                    </div>
                  )}
                  <span className="text-xs font-semibold text-[#F5F1E8]">
                    {ride.reference ?? "—"}
                  </span>
                </div>
                <div className="mt-2.5 space-y-1">
                  <div className="flex items-start gap-2 text-xs text-[#B7AEA2]">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#D6B58A]/60" />
                    <span>{ride.pickup_address ?? "—"}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-[#B7AEA2]">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#D6B58A]" />
                    <span>{ride.destination_address ?? "—"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(nextRides ?? []).length === 0 && (
        <div className="rounded-xl border border-[#1F1C18] bg-[#0D0C0B] px-5 py-8 text-center">
          <p className="text-sm text-[#B7AEA2]">Geen openstaande ritten</p>
          <p className="mt-1 text-xs text-[#7F776E]">
            Nieuwe ritten verschijnen hier zodra ze zijn toegewezen.
          </p>
        </div>
      )}

      {/* CTA */}
      <Link
        href="/chauffeur/ritten"
        className="inline-flex items-center gap-2 rounded-xl border border-[#D6B58A]/30 bg-[#D6B58A]/[0.07] px-5 py-3 text-sm font-semibold text-[#D6B58A] transition-colors hover:bg-[#D6B58A]/[0.12]"
      >
        Alle ritten bekijken
        <ArrowRight className="size-4" />
      </Link>
    </div>
  )
}
