import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { sendEmail } from "@/lib/email/send"
import { driverAssignedRideEmail } from "@/lib/email/templates"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

type SearchParams = Promise<{ filter?: string }>

async function assignDriverAction(formData: FormData) {
  "use server"

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login")
  }

  const bookingId = String(formData.get("bookingId") || "")
  const driverId = String(formData.get("driverId") || "")

  if (!bookingId || !driverId) return

  const supabase = getSupabaseServiceClient()

  const { data: booking } = await supabase
    .from("bookings")
    .select("reference, pickup_address, destination_address, pickup_date, pickup_time, vehicle_type, passengers")
    .eq("id", bookingId)
    .maybeSingle()

  const { data: driver } = await supabase
    .from("drivers")
    .select("email")
    .eq("id", driverId)
    .maybeSingle()

  await supabase
    .from("bookings")
    .update({ assigned_driver_id: driverId, booking_status: "assigned" })
    .eq("id", bookingId)

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "driver_assigned",
    actor_type: "admin",
    actor_id: null,
    note: `Driver assigned: ${driverId}`,
  })

  if (booking?.reference && driver?.email) {
    const mail = driverAssignedRideEmail({
      reference: booking.reference,
      origin: booking.pickup_address || "-",
      destination: booking.destination_address || "-",
      date: booking.pickup_date || "-",
      time: booking.pickup_time || "-",
      vehicleType: booking.vehicle_type || "taxi",
      passengers: booking.passengers ?? undefined,
    })

    await sendEmail({
      to: driver.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      from: process.env.DRIVER_INVITE_FROM_EMAIL || process.env.RESEND_FROM_EMAIL,
    })
  }
}

export default async function AdminRittenPage({ searchParams }: { searchParams: SearchParams }) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login")
  }

  const params = await searchParams
  const filter = params.filter || "alle"
  const today = new Date().toISOString().slice(0, 10)

  const supabase = getSupabaseServiceClient()
  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, full_name, active")
    .eq("active", true)
    .order("full_name", { ascending: true })

  let query = supabase
    .from("bookings")
    .select("id, reference, pickup_date, pickup_time, pickup_address, destination_address, customer_name, customer_phone, passengers, vehicle_type, estimated_fare, payment_status, booking_status, assigned_driver_id")
    .order("created_at", { ascending: false })

  if (filter === "niet-toegewezen") query = query.eq("booking_status", "unassigned")
  if (filter === "toegewezen") query = query.eq("booking_status", "assigned")
  if (filter === "afgerond") query = query.eq("booking_status", "completed")
  if (filter === "vandaag") query = query.eq("pickup_date", today)

  const { data: bookings } = await query.limit(200)

  const filters = [
    { id: "alle", label: "Alle" },
    { id: "niet-toegewezen", label: "Niet toegewezen" },
    { id: "toegewezen", label: "Toegewezen" },
    { id: "vandaag", label: "Vandaag" },
    { id: "afgerond", label: "Afgerond" },
  ]

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Ritten</h1>
        <p className="mt-2 text-sm text-[#B7AEA2]">Bekijk betaalde boekingen en wijs chauffeurs toe.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link key={f.id} href={`/admin/ritten?filter=${f.id}`} className={`rounded-lg border px-3 py-1.5 text-xs ${filter === f.id ? "border-[#D6B58A] text-[#D6B58A]" : "border-[#292520] text-[#B7AEA2]"}`}>
            {f.label}
          </Link>
        ))}
      </div>

      <div className="space-y-3 lg:hidden">
        {bookings?.map((booking) => (
          <article key={booking.id} className="rounded-2xl border border-[#292520] bg-[#141210] p-4">
            <p className="font-semibold">{booking.reference}</p>
            <p className="text-sm text-[#B7AEA2]">{booking.pickup_date || "-"} {booking.pickup_time || ""}</p>
            <p className="mt-2 text-sm text-[#B7AEA2]">{booking.pickup_address} {"->"} {booking.destination_address}</p>
            <p className="mt-1 text-sm text-[#8F877D]">{booking.customer_name || "-"} | {booking.customer_phone || "-"}</p>
            <p className="mt-1 text-sm text-[#8F877D]">�{Number(booking.estimated_fare ?? 0).toFixed(2)} | {booking.booking_status}</p>

            <form action={assignDriverAction} className="mt-3 space-y-2">
              <input type="hidden" name="bookingId" value={booking.id} />
              <select name="driverId" defaultValue={booking.assigned_driver_id ?? ""} className="h-9 w-full rounded-md border border-[#292520] bg-[#0D0C0B] px-2 text-sm">
                <option value="">Selecteer chauffeur</option>
                {drivers?.map((d) => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </select>
              <button className="w-full rounded-md border border-[#3A2D1F] px-3 py-1.5 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815]">Chauffeur toewijzen</button>
            </form>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-[#292520] bg-[#141210] lg:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[#292520] bg-[#0D0C0B] text-left text-xs text-[#8F877D]">
            <tr>
              <th className="px-3 py-2">Referentie</th>
              <th className="px-3 py-2">Datum/tijd</th>
              <th className="px-3 py-2">Route</th>
              <th className="px-3 py-2">Klant</th>
              <th className="px-3 py-2">Rit</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Toewijzen</th>
            </tr>
          </thead>
          <tbody>
            {bookings?.map((booking) => (
              <tr key={booking.id} className="border-b border-[#292520]/60 align-top">
                <td className="px-3 py-3 font-semibold">{booking.reference}</td>
                <td className="px-3 py-3 text-[#B7AEA2]">{booking.pickup_date || "-"} {booking.pickup_time || ""}</td>
                <td className="px-3 py-3 text-[#B7AEA2]"><div>{booking.pickup_address}</div><div className="text-[#8F877D]">{booking.destination_address}</div></td>
                <td className="px-3 py-3 text-[#B7AEA2]"><div>{booking.customer_name || "-"}</div><div className="text-[#8F877D]">{booking.customer_phone || "-"}</div></td>
                <td className="px-3 py-3 text-[#B7AEA2]">{booking.passengers ?? "-"}p - {booking.vehicle_type || "-"}<br />�{Number(booking.estimated_fare ?? 0).toFixed(2)}</td>
                <td className="px-3 py-3 text-[#B7AEA2]">{booking.payment_status}<br />{booking.booking_status}</td>
                <td className="px-3 py-3">
                  <form action={assignDriverAction} className="space-y-2">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <select name="driverId" defaultValue={booking.assigned_driver_id ?? ""} className="h-9 w-44 rounded-md border border-[#292520] bg-[#0D0C0B] px-2 text-sm">
                      <option value="">Selecteer chauffeur</option>
                      {drivers?.map((d) => (
                        <option key={d.id} value={d.id}>{d.full_name}</option>
                      ))}
                    </select>
                    <button className="w-full rounded-md border border-[#3A2D1F] px-3 py-1.5 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815]">Toewijzen</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!bookings?.length ? <p className="text-sm text-[#8F877D]">Geen ritten gevonden voor deze filter.</p> : null}
    </section>
  )
}
