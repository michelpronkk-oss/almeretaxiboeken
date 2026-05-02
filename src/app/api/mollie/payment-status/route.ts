import { type NextRequest } from "next/server"
import { mapMollieToBookingPaymentStatus, mapMollieToPublicStatus } from "@/lib/mollie-status"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

type PublicStatus = "paid" | "open" | "pending" | "failed" | "canceled" | "expired"

interface MolliePayment {
  status?: string
}

function bookingStatusFromPayment(status: string | undefined): string {
  if (status === "paid") return "unassigned"
  if (status === "canceled") return "cancelled"
  return "pending_payment"
}

export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get("paymentId")?.trim() || ""

  if (!paymentId) {
    return Response.json({ success: false, error: "paymentId ontbreekt." }, { status: 400 })
  }

  const mollieApiKey = process.env.MOLLIE_API_KEY
  if (!mollieApiKey) {
    return Response.json({ success: false, error: "Mollie niet geconfigureerd." }, { status: 503 })
  }

  const res = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${mollieApiKey}` },
    cache: "no-store",
  })

  if (!res.ok) {
    return Response.json(
      { success: false, error: "Kon betaalstatus niet ophalen." },
      { status: 502 }
    )
  }

  const payment = (await res.json()) as MolliePayment
  const status = mapMollieToPublicStatus(payment.status) as PublicStatus
  const paid = status === "paid"

  const supabase = getSupabaseServiceClient()
  const paymentStatusDb = mapMollieToBookingPaymentStatus(payment.status)
  await supabase
    .from("bookings")
    .update({
      payment_status: paymentStatusDb,
      booking_status: bookingStatusFromPayment(payment.status),
    })
    .eq("mollie_payment_id", paymentId)

  return Response.json({
    success: true,
    status,
    paid,
  })
}
