import Link from "next/link"
import { redirect } from "next/navigation"
import CopyButton from "@/components/internal/copy-button"
import AdminAssignDriverControl from "@/components/internal/admin-assign-driver-control"
import AdminExceptionActions from "@/components/internal/admin-exception-actions"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { formatCurrencyEUR, formatPassengerVehicle } from "@/lib/format"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

type SearchParams = Promise<{ filter?: string; status?: string; error?: string; warning?: string }>

function sourceLabel(source: string | null | undefined, manualCreated: boolean | null | undefined) {
  if (manualCreated || source === "admin_manual") return "Handmatig"
  return "Website"
}

const statusBadge: Record<string, string> = {
  no_show_reported: "No-show gemeld",
  issue_reported: "Probleem gemeld",
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
    .select("id, reference, pickup_date, pickup_time, pickup_address, destination_address, customer_name, customer_phone, passengers, vehicle_type, estimated_fare, payment_status, booking_status, assigned_driver_id, source, manual_created, mollie_checkout_url")
    .order("created_at", { ascending: false })

  if (filter === "niet-toegewezen") query = query.eq("booking_status", "unassigned")
  if (filter === "toegewezen") query = query.in("booking_status", ["assigned", "accepted", "on_the_way", "arrived", "in_progress"])
  if (filter === "afgerond") query = query.eq("booking_status", "completed")
  if (filter === "vandaag") query = query.eq("pickup_date", today)
  if (filter === "problemen") query = query.eq("booking_status", "issue_reported")
  if (filter === "no-show") query = query.eq("booking_status", "no_show_reported")

  const { data: bookings } = await query.limit(200)

  const filters = [
    { id: "alle", label: "Alle" },
    { id: "niet-toegewezen", label: "Niet toegewezen" },
    { id: "toegewezen", label: "Toegewezen" },
    { id: "vandaag", label: "Vandaag" },
    { id: "problemen", label: "Problemen" },
    { id: "no-show", label: "No-show" },
    { id: "afgerond", label: "Afgerond" },
  ]

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Ritten</h1>
          <p className="mt-2 text-sm text-[#B7AEA2]">Bekijk betaalde boekingen en wijs chauffeurs toe.</p>
        </div>
        <Link href="/admin/ritten/nieuw" className="rounded-lg border border-[#3A2D1F] px-3 py-2 text-xs font-semibold text-[#D6B58A] hover:bg-[#1B1815]">
          Nieuwe rit invoeren
        </Link>
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
            <div className="flex items-center gap-2">
              <p className="font-semibold">{booking.reference}</p>
              <span className="rounded-full border border-[#292520] bg-[#0D0C0B] px-2 py-0.5 text-[10px] text-[#B7AEA2]">{sourceLabel(booking.source, booking.manual_created)}</span>
              {statusBadge[booking.booking_status || ""] ? (
                <span className="rounded-full border border-[#D6B58A]/40 bg-[#D6B58A]/10 px-2 py-0.5 text-[10px] text-[#D6B58A]">{statusBadge[booking.booking_status || ""]}</span>
              ) : null}
            </div>
            <p className="text-sm text-[#B7AEA2]">{booking.pickup_date || "-"} {booking.pickup_time || ""}</p>
            <p className="mt-2 text-sm text-[#B7AEA2]">{booking.pickup_address} {"->"} {booking.destination_address}</p>
            <p className="mt-1 text-sm text-[#8F877D]">{booking.customer_name || "-"} | {booking.customer_phone || "-"}</p>
            <p className="mt-1 text-sm text-[#8F877D]">{formatPassengerVehicle(booking.passengers, booking.vehicle_type)} | {formatCurrencyEUR(booking.estimated_fare)}</p>
            <p className="mt-1 text-xs text-[#8F877D]">{booking.payment_status} / {booking.booking_status}</p>

            {booking.mollie_checkout_url && booking.payment_status !== "paid" ? (
              <div className="mt-2 flex items-center gap-2">
                <a href={booking.mollie_checkout_url} target="_blank" rel="noopener noreferrer" className="rounded-md border border-[#3A2D1F] px-2 py-1 text-[11px] font-semibold text-[#D6B58A] hover:bg-[#1B1815]">
                  Betaallink openen
                </a>
                <CopyButton value={booking.mollie_checkout_url} label="Betaallink kopieren" />
              </div>
            ) : null}

            <div className="mt-3">
              <AdminAssignDriverControl bookingId={booking.id} initialDriverId={booking.assigned_driver_id} drivers={(drivers || []).map((d) => ({ id: d.id, full_name: d.full_name }))} />
            </div>

            {booking.booking_status === "no_show_reported" || booking.booking_status === "issue_reported" ? (
              <AdminExceptionActions bookingId={booking.id} />
            ) : null}
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
              <th className="px-3 py-2">Betaallink</th>
              <th className="px-3 py-2">Toewijzen</th>
            </tr>
          </thead>
          <tbody>
            {bookings?.map((booking) => (
              <tr key={booking.id} className="border-b border-[#292520]/60 align-top">
                <td className="px-3 py-3 font-semibold">
                  <div>{booking.reference}</div>
                  <span className="mt-1 inline-block rounded-full border border-[#292520] bg-[#0D0C0B] px-2 py-0.5 text-[10px] text-[#B7AEA2]">{sourceLabel(booking.source, booking.manual_created)}</span>
                  {statusBadge[booking.booking_status || ""] ? (
                    <div className="mt-1"><span className="rounded-full border border-[#D6B58A]/40 bg-[#D6B58A]/10 px-2 py-0.5 text-[10px] text-[#D6B58A]">{statusBadge[booking.booking_status || ""]}</span></div>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-[#B7AEA2]">{booking.pickup_date || "-"} {booking.pickup_time || ""}</td>
                <td className="px-3 py-3 text-[#B7AEA2]"><div>{booking.pickup_address}</div><div className="text-[#8F877D]">{booking.destination_address}</div></td>
                <td className="px-3 py-3 text-[#B7AEA2]"><div>{booking.customer_name || "-"}</div><div className="text-[#8F877D]">{booking.customer_phone || "-"}</div></td>
                <td className="px-3 py-3 text-[#B7AEA2]">{formatPassengerVehicle(booking.passengers, booking.vehicle_type)}<br />{formatCurrencyEUR(booking.estimated_fare)}</td>
                <td className="px-3 py-3 text-[#B7AEA2]">{booking.payment_status}<br />{booking.booking_status}</td>
                <td className="px-3 py-3 text-[#B7AEA2]">
                  {booking.mollie_checkout_url && booking.payment_status !== "paid" ? (
                    <div className="space-y-2">
                      <a href={booking.mollie_checkout_url} target="_blank" rel="noopener noreferrer" className="inline-block rounded-md border border-[#3A2D1F] px-2 py-1 text-[11px] font-semibold text-[#D6B58A] hover:bg-[#1B1815]">Openen</a>
                      <div><CopyButton value={booking.mollie_checkout_url} label="Kopieren" /></div>
                    </div>
                  ) : <span className="text-[#8F877D]">-</span>}
                </td>
                <td className="px-3 py-3 w-64">
                  <AdminAssignDriverControl bookingId={booking.id} initialDriverId={booking.assigned_driver_id} drivers={(drivers || []).map((d) => ({ id: d.id, full_name: d.full_name }))} />
                  {booking.booking_status === "no_show_reported" || booking.booking_status === "issue_reported" ? (
                    <AdminExceptionActions bookingId={booking.id} />
                  ) : null}
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
