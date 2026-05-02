export type BookingPaymentStatus = "pending_payment" | "paid" | "failed" | "canceled" | "expired"
export type PublicPaymentStatus = "paid" | "open" | "pending" | "failed" | "canceled" | "expired"

export function mapMollieToPublicStatus(status: string | undefined): PublicPaymentStatus {
  if (status === "paid") return "paid"
  if (status === "open") return "open"
  if (status === "pending") return "pending"
  if (status === "failed") return "failed"
  if (status === "canceled") return "canceled"
  if (status === "expired") return "expired"
  return "open"
}

export function mapMollieToBookingPaymentStatus(status: string | undefined): BookingPaymentStatus {
  if (status === "paid") return "paid"
  if (status === "failed") return "failed"
  if (status === "canceled") return "canceled"
  if (status === "expired") return "expired"
  return "pending_payment"
}
