import Link from "next/link"
import { redirect } from "next/navigation"
import { getAuthenticatedDriverId } from "@/lib/driver-auth"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

export default async function ChauffeurPage() {
  const driverId = await getAuthenticatedDriverId()
  if (!driverId) {
    redirect("/chauffeur/login")
  }

  const supabase = getSupabaseServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const [{ count: todayCount }, { count: upcomingCount }, { count: completedCount }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("assigned_driver_id", driverId)
      .eq("pickup_date", today),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("assigned_driver_id", driverId)
      .gt("pickup_date", today),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("assigned_driver_id", driverId)
      .eq("booking_status", "completed"),
  ])

  const cards = [
    { label: "Vandaag", value: todayCount ?? 0 },
    { label: "Komende ritten", value: upcomingCount ?? 0 },
    { label: "Afgerond", value: completedCount ?? 0 },
  ]

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mijn ritten</h1>
        <p className="mt-2 text-sm text-[#B7AEA2]">Bekijk uw toegewezen ritten.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-[#292520] bg-[#141210] p-4">
            <p className="text-xs text-[#8F877D]">{card.label}</p>
            <p className="mt-1 text-3xl font-bold text-[#D6B58A]">{card.value}</p>
          </article>
        ))}
      </div>

      <Link href="/chauffeur/ritten" className="inline-flex rounded-lg border border-[#3A2D1F] px-4 py-2 text-sm font-semibold text-[#D6B58A] hover:bg-[#1B1815]">
        Naar rittenoverzicht
      </Link>
    </section>
  )
}
