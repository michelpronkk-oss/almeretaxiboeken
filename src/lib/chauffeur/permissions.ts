import type { CurrentDriver } from "./current-driver"

export interface BookingRef {
  assigned_driver_id: string | null | undefined
}

/**
 * A driver may manage (accept, update status, report, etc.) a booking if:
 * - the booking is assigned to them, OR
 * - they hold owner or dispatcher rights.
 *
 * IDs are compared as strings to avoid object-reference mismatches.
 */
export function canManageBooking(driver: CurrentDriver, booking: BookingRef): boolean {
  if (driver.is_owner === true || driver.can_dispatch === true) return true
  const assignedId = String(booking.assigned_driver_id ?? "").trim()
  const driverId = String(driver.id ?? "").trim()
  return assignedId.length > 0 && assignedId === driverId
}

/**
 * A driver may assign/reassign rides only if they hold dispatcher rights.
 * Normal chauffeurs may not call the assign-driver API.
 */
export function canDispatch(driver: CurrentDriver): boolean {
  return driver.is_owner === true || driver.can_dispatch === true
}
