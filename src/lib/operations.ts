import "server-only"

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "unassigned"
  | "assigned"
  | "accepted"
  | "on_the_way"
  | "arrived"
  | "in_progress"
  | "completed"
  | "no_show_reported"
  | "issue_reported"
  | "cancelled"
  | "refunded"
  | "rescheduled"

export function toPickupDateTime(pickupDate?: string | null, pickupTime?: string | null): Date | null {
  if (!pickupDate || !pickupTime) return null
  const dt = new Date(`${pickupDate}T${pickupTime}:00`)
  if (Number.isNaN(dt.getTime())) return null
  return dt
}

export function isTooSoonForPublicBooking(pickupDate?: string | null, pickupTime?: string | null, minMinutes = 60) {
  const pickup = toPickupDateTime(pickupDate, pickupTime)
  if (!pickup) return false
  const now = new Date()
  const minAllowed = new Date(now.getTime() + minMinutes * 60_000)
  return pickup.getTime() < minAllowed.getTime()
}

function includesAirportText(value?: string | null) {
  const txt = String(value || "").toLowerCase()
  return txt.includes("schiphol") || txt.includes("airport") || txt.includes("rotterdam airport") || txt.includes("eindhoven airport")
}

export function computeBufferAfterMinutes(input: {
  vehicleType?: string | null
  pickupAddress?: string | null
  destinationAddress?: string | null
  durationMinutes?: number | null
}) {
  const duration = Number(input.durationMinutes || 0)
  const isLong = duration >= 45
  const isTaxibus = input.vehicleType === "taxibus"
  const isAirport = includesAirportText(input.pickupAddress) || includesAirportText(input.destinationAddress)
  return isTaxibus || isAirport || isLong ? 60 : 45
}

export function computeRideWindow(input: {
  pickupDate?: string | null
  pickupTime?: string | null
  durationMinutes?: number | null
  bufferAfterMinutes?: number | null
}) {
  const start = toPickupDateTime(input.pickupDate, input.pickupTime)
  if (!start) return null
  const duration = Math.max(0, Number(input.durationMinutes || 0))
  const buffer = Math.max(0, Number(input.bufferAfterMinutes || 0))
  const end = new Date(start.getTime() + (duration + buffer) * 60_000)
  return { start, end }
}

export function windowsOverlap(a: { start: Date; end: Date }, b: { start: Date; end: Date }) {
  return a.start < b.end && b.start < a.end
}

export const CHAUFFEUR_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  assigned: ["accepted"],
  accepted: ["on_the_way"],
  on_the_way: ["arrived"],
  arrived: ["in_progress", "no_show_reported"],
  in_progress: ["completed"],
}

export function canTransition(currentStatus: string | null | undefined, nextStatus: string) {
  const allowed = CHAUFFEUR_ALLOWED_TRANSITIONS[currentStatus || ""] || []
  return allowed.includes(nextStatus)
}
