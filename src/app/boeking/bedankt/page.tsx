import Link from "next/link"
import { formatCurrencyEUR } from "@/lib/format"
import { getSupabaseServiceClient } from "@/lib/supabase/server"
import { mapMollieToBookingPaymentStatus, mapMollieToPublicStatus } from "@/lib/mollie-status"

type SearchParams = Promise<{
  bookingId?: string
  reference?: string
  payment_id?: string
  id?: string
}>

type ViewStatus = "paid" | "cash" | "open" | "pending" | "failed" | "canceled" | "expired" | "unknown"

function bookingStatusFromPayment(status: string | undefined): string {
  if (status === "paid") return "unassigned"
  if (status === "canceled") return "cancelled"
  return "pending_payment"
}

function statusCopy(status: ViewStatus) {
  if (status === "cash") {
    return {
      title: "Rit aangevraagd",
      body: "Uw rit is ontvangen. U betaalt contant bij de chauffeur.",
      sub: "Bewaar uw referentienummer. De planning kan contact opnemen bij vragen.",
    }
  }

  if (status === "paid") {
    return {
      title: "Boeking bevestigd",
      body: "Uw betaling is ontvangen en uw rit is bevestigd.",
      sub: "U ontvangt de bevestiging per e-mail.",
    }
  }

  if (status === "failed" || status === "canceled" || status === "expired") {
    return {
      title: "Betaling niet voltooid",
      body: "Uw betaling is niet afgerond. Probeer opnieuw of neem contact op via WhatsApp.",
      sub: "",
    }
  }

  return {
    title: "Betaling in behandeling",
    body: "We controleren uw betaling. Vernieuw deze pagina over enkele seconden of neem contact op via WhatsApp.",
    sub: "",
  }
}

async function fetchMollieStatus(paymentId: string): Promise<ViewStatus> {
  const mollieApiKey = process.env.MOLLIE_API_KEY
  if (!mollieApiKey) return "unknown"

  const res = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${mollieApiKey}` },
    cache: "no-store",
  })

  if (!res.ok) return "unknown"

  const payment = (await res.json()) as { status?: string }
  return mapMollieToPublicStatus(payment.status)
}

export default async function BookingThanksPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const bookingId = params.bookingId?.trim() || ""
  const reference = params.reference?.trim() || ""
  const paymentId = params.payment_id?.trim() || params.id?.trim() || ""

  const supabase = getSupabaseServiceClient()

  let booking:
    | {
        id: string
        reference: string
        payment_status: string
        payment_method: string | null
        mollie_payment_id: string | null
        estimated_fare: number | null
      }
    | null = null

  if (bookingId) {
    const { data } = await supabase
      .from("bookings")
      .select("id, reference, payment_status, payment_method, mollie_payment_id, estimated_fare")
      .eq("id", bookingId)
      .maybeSingle()
    booking = data
  } else if (reference) {
    const { data } = await supabase
      .from("bookings")
      .select("id, reference, payment_status, payment_method, mollie_payment_id, estimated_fare")
      .eq("reference", reference)
      .maybeSingle()
    booking = data
  }

  // Cash booking: skip Mollie entirely
  if (booking?.payment_method === "cash" || booking?.payment_status === "cash_pending") {
    const copy = statusCopy("cash")
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-6 py-24 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/[0.09] bg-[#111111] p-6 shadow-2xl">
          <h1 className="text-2xl font-semibold text-white">{copy.title}</h1>
          {booking.reference ? (
            <p className="mt-2 text-sm text-white/50">
              Referentie: <span className="font-mono text-[#D4B896]">{booking.reference}</span>
            </p>
          ) : null}
          <div className="mt-4 space-y-2 text-sm text-white/70">
            <p>{copy.body}</p>
            {copy.sub ? <p className="text-white/40">{copy.sub}</p> : null}
            {typeof booking.estimated_fare === "number" ? (
              <p>Te betalen bij chauffeur: <span className="font-semibold text-[#D4B896]">{formatCurrencyEUR(booking.estimated_fare)}</span></p>
            ) : null}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-lg border border-[#D4B896]/40 bg-[#D4B896]/[0.08] px-4 py-2 text-sm font-semibold text-[#D4B896] transition-colors hover:bg-[#D4B896]/[0.16]"
            >
              Terug naar home
            </Link>
            <a
              href="https://wa.me/31853038136"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.04]"
            >
              Contact via WhatsApp
            </a>
          </div>
        </div>
      </main>
    )
  }

  // Online payment path — existing logic
  const effectivePaymentId = paymentId || booking?.mollie_payment_id || ""
  let viewStatus: ViewStatus = "unknown"

  if (booking?.payment_status === "paid") {
    viewStatus = "paid"
  } else if (booking?.payment_status === "failed") {
    viewStatus = "failed"
  } else if (booking?.payment_status === "canceled") {
    viewStatus = "canceled"
  } else if (booking?.payment_status === "expired") {
    viewStatus = "expired"
  } else {
    viewStatus = "open"
  }

  if (effectivePaymentId && viewStatus !== "paid") {
    const mollieStatus = await fetchMollieStatus(effectivePaymentId)

    if (booking && mollieStatus !== "unknown") {
      const paymentStatusDb = mapMollieToBookingPaymentStatus(mollieStatus)
      await supabase
        .from("bookings")
        .update({
          payment_status: paymentStatusDb,
          booking_status: bookingStatusFromPayment(mollieStatus),
        })
        .eq("id", booking.id)

      await supabase.from("booking_events").insert({
        booking_id: booking.id,
        event_type: `return_status_${mollieStatus}`,
        actor_type: "system",
        note: "Status gecontroleerd op bedankpagina.",
      })
    }

    viewStatus = mollieStatus
  }

  const copy = statusCopy(viewStatus)
  const shownReference = booking?.reference || reference

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-24 text-white">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/[0.09] bg-[#111111] p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold text-white">{copy.title}</h1>

        {shownReference ? (
          <p className="mt-2 text-sm text-white/50">
            Referentie: <span className="font-mono text-[#D4B896]">{shownReference}</span>
          </p>
        ) : null}

        <div className="mt-4 space-y-2 text-sm text-white/70">
          <p>{copy.body}</p>
          {copy.sub ? <p>{copy.sub}</p> : null}
          {typeof booking?.estimated_fare === "number" ? <p>Ritprijs: {formatCurrencyEUR(booking.estimated_fare)}</p> : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={
              shownReference
                ? `/boeking/bedankt?bookingId=${encodeURIComponent(booking?.id || bookingId)}&reference=${encodeURIComponent(shownReference)}&payment_id=${encodeURIComponent(effectivePaymentId)}`
                : "/boeking/bedankt"
            }
            className="rounded-lg border border-[#D4B896]/40 bg-[#D4B896]/[0.08] px-4 py-2 text-sm font-semibold text-[#D4B896] transition-colors hover:bg-[#D4B896]/[0.16]"
          >
            Status opnieuw controleren
          </Link>
          <a
            href="https://wa.me/31853038136"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.04]"
          >
            Contact via WhatsApp
          </a>
        </div>
      </div>
    </main>
  )
}
