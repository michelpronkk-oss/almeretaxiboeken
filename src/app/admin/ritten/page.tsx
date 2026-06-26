import Link from "next/link"
import { redirect } from "next/navigation"
import CopyButton from "@/components/internal/copy-button"
import AdminAssignDriverControl from "@/components/internal/admin-assign-driver-control"
import AdminExceptionActions from "@/components/internal/admin-exception-actions"
import DeleteBookingButton from "@/components/internal/delete-booking-button"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { formatCurrencyEUR, formatPassengerVehicle } from "@/lib/format"
import { getAmsterdamTodayString } from "@/lib/date"
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
  const today = getAmsterdamTodayString()

  const supabase = getSupabaseServiceClient()
  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, full_name, active")
    .eq("active", true)
    .is("deleted_at", null)
    .order("full_name", { ascending: true })

  let query = supabase
    .from("bookings")
    .select("id, reference, pickup_date, pickup_time, pickup_address, destination_address, customer_name, customer_phone, passengers, vehicle_type, estimated_fare, payment_status, booking_status, assigned_driver_id, source, manual_created, mollie_checkout_url, pricing_mode, price_override_enabled, price_override_reason, matched_fixed_route, calculated_fare, payment_method, cash_amount_due, cash_collection_status")
    .is("deleted_at", null)
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
            <p className="mt-1 text-sm text-[#8F877D]">
              {formatPassengerVehicle(booking.passengers, booking.vehicle_type)} | {formatCurrencyEUR(booking.estimated_fare)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {booking.pricing_mode === "fixed_route" ? (
                <span className="rounded-full border border-[#D6B58A]/30 bg-[#D6B58A]/10 px-2 py-0.5 text-[10px] text-[#D6B58A]">Vaste routeprijs</span>
              ) : null}
              {booking.price_override_enabled ? (
                <span className="rounded-full border border-[#B7AEA2]/30 bg-[#B7AEA2]/10 px-2 py-0.5 text-[10px] text-[#B7AEA2]">Handmatig aangepast</span>
              ) : null}
            </div>
            {booking.matched_fixed_route ? (
              <p className="text-[10px] text-[#8F877D]">{booking.matched_fixed_route}</p>
            ) : null}
            {booking.price_override_reason ? (
              <p className="text-[10px] text-[#8F877D]">Reden: {booking.price_override_reason}</p>
            ) : null}
            {booking.calculated_fare && booking.calculated_fare !== booking.estimated_fare ? (
              <p className="text-[10px] text-[#8F877D]">Berekend: {formatCurrencyEUR(booking.calculated_fare)}</p>
            ) : null}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <p className="text-xs text-[#8F877D]">{booking.payment_status} / {booking.booking_status}</p>
              {booking.payment_method === "cash" ? (
                <span className="rounded-full border border-[#22A06B]/30 bg-[#22A06B]/10 px-2 py-0.5 text-[10px] font-medium text-[#22A06B]">Contant</span>
              ) : booking.payment_method === "manual" ? (
                <span className="rounded-full border border-[#8F877D]/30 bg-[#8F877D]/10 px-2 py-0.5 text-[10px] text-[#8F877D]">Zonder betaling</span>
              ) : (
                <span className="rounded-full border border-[#292520] bg-[#0D0C0B] px-2 py-0.5 text-[10px] text-[#B7AEA2]">Online</span>
              )}
            </div>
            {booking.payment_method === "cash" && booking.cash_amount_due ? (
              <p className="text-xs text-[#22A06B]">
                {booking.cash_collection_status === "collected" ? "Contant ontvangen" : "Contant te innen"}: {formatCurrencyEUR(booking.cash_amount_due)}
              </p>
            ) : null}

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
            <div className="mt-2">
              <DeleteBookingButton bookingId={booking.id} reference={booking.reference || booking.id} />
            </div>
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
                <td className="px-3 py-3 text-[#B7AEA2]">
                  <div>{formatPassengerVehicle(booking.passengers, booking.vehicle_type)}</div>
                  <div className="font-medium text-[#F5F1E8]">{formatCurrencyEUR(booking.estimated_fare)}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {booking.pricing_mode === "fixed_route" ? (
                      <span className="rounded-full border border-[#D6B58A]/30 bg-[#D6B58A]/10 px-2 py-0.5 text-[10px] text-[#D6B58A]">Vaste routeprijs</span>
                    ) : null}
                    {booking.price_override_enabled ? (
                      <span className="rounded-full border border-[#B7AEA2]/30 bg-[#B7AEA2]/10 px-2 py-0.5 text-[10px] text-[#B7AEA2]">Handmatig</span>
                    ) : null}
                  </div>
                  {booking.matched_fixed_route ? (
                    <div className="text-[10px] text-[#8F877D]">{booking.matched_fixed_route}</div>
                  ) : null}
                  {booking.price_override_reason ? (
                    <div className="text-[10px] text-[#8F877D]">Reden: {booking.price_override_reason}</div>
                  ) : null}
                  {booking.calculated_fare && booking.calculated_fare !== booking.estimated_fare ? (
                    <div className="text-[10px] text-[#8F877D]">Calc: {formatCurrencyEUR(booking.calculated_fare)}</div>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-[#B7AEA2]">
                  <div>{booking.payment_status}</div>
                  <div>{booking.booking_status}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {booking.payment_method === "cash" ? (
                      <span className="rounded-full border border-[#22A06B]/30 bg-[#22A06B]/10 px-2 py-0.5 text-[10px] font-medium text-[#22A06B]">Contant</span>
                    ) : booking.payment_method === "manual" ? (
                      <span className="rounded-full border border-[#8F877D]/30 bg-[#8F877D]/10 px-2 py-0.5 text-[10px] text-[#8F877D]">Zonder betaling</span>
                    ) : (
                      <span className="rounded-full border border-[#292520] bg-[#0D0C0B] px-2 py-0.5 text-[10px] text-[#B7AEA2]">Online</span>
                    )}
                  </div>
                  {booking.payment_method === "cash" && booking.cash_amount_due ? (
                    <div className="text-[10px] font-medium text-[#22A06B]">
                      {booking.cash_collection_status === "collected" ? "Ontvangen" : "Te innen"}: {formatCurrencyEUR(booking.cash_amount_due)}
                    </div>
                  ) : null}
                </td>
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
                  <div className="mt-2">
                    <DeleteBookingButton bookingId={booking.id} reference={booking.reference || booking.id} />
                  </div>
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
