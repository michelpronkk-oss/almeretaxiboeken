import "server-only"
import { mapMollieToBookingPaymentStatus } from "@/lib/mollie-status"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

type PendingBooking = {
  id: string
  reference: string | null
  mollie_payment_id: string | null
  payment_status: string | null
  assigned_driver_id: string | null
}

type MolliePayment = {
  status?: string
}

function bookingStatusFromPayment(status: string | undefined, hasAssignedDriver: boolean): string {
  if (status === "paid") return hasAssignedDriver ? "assigned" : "unassigned"
  if (status === "canceled") return "cancelled"
  return "pending_payment"
}

function eventTypeFromStatus(status: string | undefined) {
  if (status === "paid") return "mollie_paid_resynced"
  if (status === "failed") return "mollie_failed_resynced"
  if (status === "canceled") return "mollie_canceled_resynced"
  if (status === "expired") return "mollie_expired_resynced"
  return "mollie_status_resynced"
}

export async function syncRecentPendingMollieBookings(limit = 50) {
  const mollieApiKey = process.env.MOLLIE_API_KEY
  if (!mollieApiKey) return { checked: 0, updated: 0 }

  const supabase = getSupabaseServiceClient()
  const { data } = await supabase
    .from("bookings")
    .select("id, reference, mollie_payment_id, payment_status, assigned_driver_id")
    .eq("payment_status", "pending_payment")
    .not("mollie_payment_id", "is", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit)

  const bookings = (data ?? []) as PendingBooking[]
  let updated = 0

  for (const booking of bookings) {
    if (!booking.mollie_payment_id) continue

    const paymentRes = await fetch(`https://api.mollie.com/v2/payments/${booking.mollie_payment_id}`, {
      headers: { Authorization: `Bearer ${mollieApiKey}` },
      cache: "no-store",
    })

    if (!paymentRes.ok) continue

    const payment = (await paymentRes.json()) as MolliePayment
    const nextPaymentStatus = mapMollieToBookingPaymentStatus(payment.status)
    if (nextPaymentStatus === booking.payment_status) continue

    await supabase
      .from("bookings")
      .update({
        payment_status: nextPaymentStatus,
        booking_status: bookingStatusFromPayment(payment.status, !!booking.assigned_driver_id),
      })
      .eq("id", booking.id)

    await supabase.from("booking_events").insert({
      booking_id: booking.id,
      event_type: eventTypeFromStatus(payment.status),
      actor_type: "system",
      note: `Mollie status opnieuw gesynchroniseerd via admin dashboard: ${payment.status ?? "unknown"}`,
    })

    updated += 1
  }

  return { checked: bookings.length, updated }
}
