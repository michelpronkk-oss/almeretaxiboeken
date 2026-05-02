import Link from "next/link"
import { redirect } from "next/navigation"
import PendingSubmitButton from "@/components/internal/pending-submit-button"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { sendEmail } from "@/lib/email/send"
import { driverAssignedRideEmail } from "@/lib/email/templates"
import { formatCurrencyEUR, formatPassengerVehicle } from "@/lib/format"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

type SearchParams = Promise<{ filter?: string; status?: string; error?: string; warning?: string }>

async function assignDriverAction(formData: FormData) {
  "use server"

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login")
  }

  const bookingId = String(formData.get("bookingId") || "")
  const driverId = String(formData.get("driverId") || "")

  if (!bookingId || !driverId) {
    redirect("/admin/ritten?error=Selecteer%20een%20chauffeur%20en%20rit")
  }

  const supabase = getSupabaseServiceClient()

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, reference, pickup_address, destination_address, pickup_date, pickup_time, vehicle_type, passengers, estimated_fare, notes, customer_name, customer_phone")
    .eq("id", bookingId)
    .maybeSingle()

  if (bookingError || !booking) {
    redirect("/admin/ritten?error=Rit%20niet%20gevonden")
  }

  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .select("id, email")
    .eq("id", driverId)
    .maybeSingle()

  if (driverError || !driver) {
    redirect("/admin/ritten?error=Chauffeur%20niet%20gevonden")
  }

  const { error: assignError } = await supabase
    .from("bookings")
    .update({ assigned_driver_id: driverId, booking_status: "assigned" })
    .eq("id", bookingId)

  if (assignError) {
    redirect("/admin/ritten?error=Chauffeur%20toewijzen%20mislukt")
  }

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "driver_assigned",
    actor_type: "admin",
    actor_id: null,
    note: "Driver assigned by admin",
  })

  let warning = ""

  if (driver.email) {
    const mail = driverAssignedRideEmail({
      reference: booking.reference,
      origin: booking.pickup_address || "-",
      destination: booking.destination_address || "-",
      date: booking.pickup_date || "-",
      time: booking.pickup_time || "-",
      customerName: booking.customer_name || "-",
      customerPhone: booking.customer_phone || "-",
      vehicleType: booking.vehicle_type || "taxi",
      passengers: booking.passengers ?? undefined,
      price: typeof booking.estimated_fare === "number" ? booking.estimated_fare : Number(booking.estimated_fare ?? 0),
      notes: booking.notes || undefined,
    })

    const sendResult = await sendEmail({
      to: driver.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      from: process.env.DRIVER_INVITE_FROM_EMAIL || process.env.RESEND_FROM_EMAIL,
    })

    if (sendResult.sent) {
      await supabase.from("booking_events").insert({
        booking_id: bookingId,
        event_type: "driver_notified",
        actor_type: "system",
        note: "Driver assignment email sent",
      })
    } else {
      await supabase.from("booking_events").insert({
        booking_id: bookingId,
        event_type: "driver_notification_failed",
        actor_type: "system",
        note: sendResult.error || sendResult.reason || "Driver assignment email failed",
      })
      console.error("[admin-assign-driver] email failed", sendResult.error || sendResult.reason || "unknown")
      warning = "Chauffeur toegewezen, maar e-mailnotificatie is niet verzonden."
    }
  }

  const qs = warning ? `?status=${encodeURIComponent("Chauffeur toegewezen.")}&warning=${encodeURIComponent(warning)}` : "?status=Chauffeur%20toegewezen."
  redirect(`/admin/ritten${qs}`)
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

      {params.status ? <p className="rounded-md border border-[#22A06B]/30 bg-[#22A06B]/10 px-3 py-2 text-xs text-[#9de2c5]">{params.status}</p> : null}
      {params.warning ? <p className="rounded-md border border-[#D6B58A]/30 bg-[#D6B58A]/10 px-3 py-2 text-xs text-[#D6B58A]">{params.warning}</p> : null}
      {params.error ? <p className="rounded-md border border-[#D94A4A]/30 bg-[#D94A4A]/10 px-3 py-2 text-xs text-[#ffb4b4]">{params.error}</p> : null}

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
            <p className="mt-1 text-sm text-[#8F877D]">{formatCurrencyEUR(booking.estimated_fare)} | {booking.booking_status}</p>

            <form action={assignDriverAction} className="mt-3 space-y-2">
              <input type="hidden" name="bookingId" value={booking.id} />
              <select name="driverId" defaultValue={booking.assigned_driver_id ?? ""} className="h-9 w-full rounded-md border border-[#292520] bg-[#0D0C0B] px-2 text-sm">
                <option value="">Selecteer chauffeur</option>
                {drivers?.map((d) => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </select>
              <PendingSubmitButton
                idleLabel="Toewijzen"
                pendingLabel="Toewijzen..."
                className="w-full rounded-md border border-[#3A2D1F] px-3 py-1.5 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815]"
              />
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
                <td className="px-3 py-3 text-[#B7AEA2]">{formatPassengerVehicle(booking.passengers, booking.vehicle_type)}<br />{formatCurrencyEUR(booking.estimated_fare)}</td>
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
                    <PendingSubmitButton
                      idleLabel="Toewijzen"
                      pendingLabel="Toewijzen..."
                      className="w-full rounded-md border border-[#3A2D1F] px-3 py-1.5 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815]"
                    />
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
