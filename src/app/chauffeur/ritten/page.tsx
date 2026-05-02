import { redirect } from "next/navigation"
import { getDriverSessionId } from "@/lib/driver-auth"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

async function updateRideStatusAction(formData: FormData) {
  "use server"

  const bookingId = String(formData.get("bookingId") || "")
  const nextStatus = String(formData.get("nextStatus") || "")

  const driverId = await getDriverSessionId()
  if (!driverId) {
    redirect("/chauffeur/login")
  }

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

  await supabase.from("bookings").update({ booking_status: nextStatus }).eq("id", bookingId)

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: `driver_${nextStatus}`,
    actor_type: "driver",
    actor_id: driverId,
    note: `Status set to ${nextStatus}`,
  })

  redirect("/chauffeur/ritten")
}

export default async function ChauffeurRittenPage() {
  const driverId = await getDriverSessionId()
  if (!driverId) {
    redirect("/chauffeur/login")
  }

  const supabase = getSupabaseServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: rides } = await supabase
    .from("bookings")
    .select("id, reference, pickup_date, pickup_time, pickup_address, destination_address, customer_phone, passengers, vehicle_type, booking_status")
    .eq("assigned_driver_id", driverId)
    .gte("pickup_date", today)
    .order("pickup_date", { ascending: true })
    .order("pickup_time", { ascending: true })
    .limit(100)

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Mijn ritten</h1>
        <p className="mt-2 text-sm text-[#B7AEA2]">Bekijk en beheer uw toegewezen ritten.</p>
      </div>

      <div className="space-y-3">
        {rides?.map((ride) => (
          <article key={ride.id} className="rounded-2xl border border-[#292520] bg-[#141210] p-4">
            <div className="grid gap-3 lg:grid-cols-[1.3fr_1.8fr_1fr]">
              <div className="text-sm text-[#B7AEA2]">
                <p className="font-semibold text-[#F5F1E8]">{ride.reference}</p>
                <p>{ride.pickup_date || "-"} {ride.pickup_time || ""}</p>
                <p>Tel: {ride.customer_phone || "-"}</p>
              </div>

              <div className="text-sm text-[#B7AEA2]">
                <p><span className="text-[#7F776E]">Van:</span> {ride.pickup_address}</p>
                <p><span className="text-[#7F776E]">Naar:</span> {ride.destination_address}</p>
                <p>{ride.passengers ?? "-"} passagiers - {ride.vehicle_type || "-"}</p>
              </div>

              <div>
                <p className="mb-2 text-xs text-[#7F776E]">Status: {ride.booking_status}</p>
                <div className="space-y-2">
                  {[
                    { id: "accepted", label: "Accepteren" },
                    { id: "on_the_way", label: "Onderweg" },
                    { id: "completed", label: "Afronden" },
                  ].map((s) => (
                    <form key={s.id} action={updateRideStatusAction}>
                      <input type="hidden" name="bookingId" value={ride.id} />
                      <input type="hidden" name="nextStatus" value={s.id} />
                      <button className="w-full rounded-md border border-[#3A2D1F] px-3 py-1.5 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815]">
                        {s.label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}

        {!rides?.length ? <p className="text-sm text-[#7F776E]">Geen toegewezen ritten gevonden.</p> : null}
      </div>

      <p className="mt-4 text-xs text-[#7F776E]">
        TODO: vervang deze interne v1 cookie-login met Supabase Auth voor productiebrede uitrol.
      </p>
    </section>
  )
}
