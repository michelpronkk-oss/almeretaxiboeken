import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Admin | AlmereTaxiBoeken",
  description: "Interne dashboard voor ritten en chauffeurs.",
}

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated()
  if (!authenticated) redirect("/admin/login")

  const supabase = getSupabaseServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const [{ count: paidCount }, { count: unassignedCount }, { count: todayCount }, { count: activeDriversCount }, { data: recentRides }, { data: todayRides }] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("payment_status", "paid"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("booking_status", "unassigned"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("pickup_date", today),
    supabase.from("drivers").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("bookings").select("reference, pickup_date, pickup_time, pickup_address, destination_address, payment_status").order("created_at", { ascending: false }).limit(5),
    supabase.from("bookings").select("reference, pickup_time, pickup_address, destination_address, booking_status").eq("pickup_date", today).order("pickup_time", { ascending: true }).limit(5),
  ])

  const cards = [
    { label: "Nieuwe betaalde ritten", value: paidCount ?? 0 },
    { label: "Niet toegewezen", value: unassignedCount ?? 0 },
    { label: "Ritten vandaag", value: todayCount ?? 0 },
    { label: "Actieve chauffeurs", value: activeDriversCount ?? 0 },
  ]

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Interne planning</h1>
        <p className="mt-2 text-sm text-[#B7AEA2]">Beheer ritten, betalingen en chauffeurs.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-[#292520] bg-[#141210] p-4">
            <p className="text-xs text-[#8F877D]">{card.label}</p>
            <p className="mt-1 text-3xl font-bold text-[#D6B58A]">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/ritten" className="rounded-lg border border-[#3A2D1F] px-4 py-2 text-sm font-semibold text-[#D6B58A] hover:bg-[#1B1815]">Ritten bekijken</Link>
        <Link href="/admin/chauffeurs" className="rounded-lg border border-[#3A2D1F] px-4 py-2 text-sm font-semibold text-[#D6B58A] hover:bg-[#1B1815]">Chauffeur toevoegen</Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#292520] bg-[#141210] p-4">
          <h2 className="text-lg font-semibold">Laatste ritten</h2>
          {recentRides?.length ? (
            <div className="mt-3 space-y-2 text-sm text-[#B7AEA2]">
              {recentRides.map((ride) => (
                <div key={ride.reference} className="rounded-lg border border-[#292520] bg-[#0D0C0B] p-3">
                  <p className="font-semibold text-[#F5F1E8]">{ride.reference}</p>
                  <p>{ride.pickup_date || "-"} {ride.pickup_time || ""}</p>
                  <p className="text-[#8F877D]">{ride.pickup_address} {"->"} {ride.destination_address}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-[#292520] bg-[#0D0C0B] p-4">
              <p className="text-sm text-[#B7AEA2]">Nog geen ritten gevonden</p>
              <p className="mt-1 text-xs text-[#8F877D]">Betaalde boekingen verschijnen hier automatisch na betaling.</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#292520] bg-[#141210] p-4">
          <h2 className="text-lg font-semibold">Planning vandaag</h2>
          {todayRides?.length ? (
            <div className="mt-3 space-y-2 text-sm text-[#B7AEA2]">
              {todayRides.map((ride) => (
                <div key={`${ride.reference}-${ride.pickup_time}`} className="rounded-lg border border-[#292520] bg-[#0D0C0B] p-3">
                  <p className="font-semibold text-[#F5F1E8]">{ride.reference}</p>
                  <p>{ride.pickup_time || "-"}</p>
                  <p className="text-[#8F877D]">{ride.pickup_address} {"->"} {ride.destination_address}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-[#292520] bg-[#0D0C0B] p-4">
              <p className="text-sm text-[#B7AEA2]">Nog geen ritten gepland voor vandaag.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

