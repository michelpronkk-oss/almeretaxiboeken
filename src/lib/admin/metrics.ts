import "server-only"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

// ── Types ────────────────────────────────────────────────────────────────────

export interface BookingRow {
  id: string
  reference: string | null
  customer_name: string | null
  pickup_address: string | null
  destination_address: string | null
  pickup_date: string | null       // YYYY-MM-DD
  pickup_time: string | null       // HH:MM
  estimated_fare: number | null
  vehicle_type: string | null
  passengers: number | null
  booking_status: string | null
  payment_status: string | null
  assigned_driver_id: string | null
  created_at: string
}

export interface DashboardMetrics {
  // Date context (Europe/Amsterdam)
  todayStr: string
  weekStartStr: string
  monthStartStr: string

  // Revenue — paid bookings only
  revenueToday: number
  revenueWeek: number
  revenueMonth: number
  revenueTotal: number
  averageFare: number
  highestFare: number

  // Booking counts — paid
  paidRidesTotal: number
  ridesToday: number       // paid, pickup_date = today
  ridesThisWeek: number    // paid, pickup_date >= weekStart
  ridesThisMonth: number   // paid, pickup_date >= monthStart

  // Failed/cancelled across all payment statuses
  failedCancelledCount: number

  // Planning — operational (all statuses)
  unassignedCount: number        // paid, no driver, not done
  assignedCount: number          // paid, has driver, not done
  todayPlanningCount: number     // any booking, pickup_date = today
  upcomingCount: number          // paid, pickup_date > today, not done
  completedCount: number         // booking_status = completed
  cancelledCount: number         // booking_status = cancelled

  // Vehicle split — paid bookings
  taxiRides: number
  taxibusRides: number
  taxiRevenue: number
  taxibusRevenue: number

  // Drivers
  activeDrivers: number

  // Lists
  latestPaidBookings: BookingRow[]
  todayBookings: BookingRow[]

  // Sentinel
  hasNoPaidBookings: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns today / week-start / month-start as YYYY-MM-DD strings in the
 * Europe/Amsterdam timezone. sv-SE locale produces ISO date format natively.
 */
function getAmsterdamDateStrings() {
  const TZ = "Europe/Amsterdam"
  const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: TZ })

  // Derive Monday of current week
  const d = new Date(`${todayStr}T00:00:00`)
  const jsDay = d.getDay() // 0 = Sunday
  const daysFromMonday = jsDay === 0 ? 6 : jsDay - 1
  const monday = new Date(d)
  monday.setDate(d.getDate() - daysFromMonday)
  const weekStartStr = monday.toLocaleDateString("sv-SE")

  // Start of month
  const [year, month] = todayStr.split("-")
  const monthStartStr = `${year}-${month}-01`

  return { todayStr, weekStartStr, monthStartStr }
}

function isTaxibus(row: BookingRow): boolean {
  const vt = (row.vehicle_type ?? "").toLowerCase().trim()
  if (vt === "taxibus") return true
  if (vt === "taxi" || vt === "personenauto") return false
  // Fallback: derive from passengers
  return (row.passengers ?? 1) >= 5
}

function safeFare(row: BookingRow): number {
  const f = Number(row.estimated_fare)
  return Number.isFinite(f) && f > 0 ? f : 0
}

const DONE_STATUSES = new Set(["completed", "cancelled", "canceled"])

// ── Main export ──────────────────────────────────────────────────────────────

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = getSupabaseServiceClient()
  const { todayStr, weekStartStr, monthStartStr } = getAmsterdamDateStrings()

  const SELECT =
    "id, reference, customer_name, pickup_address, destination_address, pickup_date, pickup_time, estimated_fare, vehicle_type, passengers, booking_status, payment_status, assigned_driver_id, created_at"

  const [paidRes, allRes, driversRes] = await Promise.all([
    // Paid bookings only — for revenue + latest list
    supabase
      .from("bookings")
      .select(SELECT)
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false }),

    // All bookings — for operational planning + failed counts
    supabase
      .from("bookings")
      .select(SELECT)
      .order("pickup_date", { ascending: true })
      .order("pickup_time", { ascending: true }),

    // Active, approved drivers
    supabase
      .from("drivers")
      .select("id", { count: "exact", head: true })
      .eq("active", true)
      .eq("approval_status", "approved"),
  ])

  const paid: BookingRow[] = (paidRes.data as BookingRow[] | null) ?? []
  const all: BookingRow[] = (allRes.data as BookingRow[] | null) ?? []
  const activeDrivers = driversRes.count ?? 0

  // ── Revenue ─────────────────────────────────────────────────────────────
  const revenueTotal = paid.reduce((s, r) => s + safeFare(r), 0)
  const revenueToday = paid
    .filter((r) => r.pickup_date === todayStr)
    .reduce((s, r) => s + safeFare(r), 0)
  const revenueWeek = paid
    .filter((r) => (r.pickup_date ?? "") >= weekStartStr)
    .reduce((s, r) => s + safeFare(r), 0)
  const revenueMonth = paid
    .filter((r) => (r.pickup_date ?? "") >= monthStartStr)
    .reduce((s, r) => s + safeFare(r), 0)

  const paidFares = paid.map(safeFare).filter((f) => f > 0)
  const averageFare =
    paidFares.length > 0
      ? paidFares.reduce((s, f) => s + f, 0) / paidFares.length
      : 0
  const highestFare = paidFares.length > 0 ? Math.max(...paidFares) : 0

  // ── Booking counts ───────────────────────────────────────────────────────
  const paidRidesTotal = paid.length
  const ridesToday = paid.filter((r) => r.pickup_date === todayStr).length
  const ridesThisWeek = paid.filter((r) => (r.pickup_date ?? "") >= weekStartStr).length
  const ridesThisMonth = paid.filter((r) => (r.pickup_date ?? "") >= monthStartStr).length

  const failedCancelledCount = all.filter((r) =>
    ["failed", "canceled", "cancelled", "expired"].includes(r.payment_status ?? "")
  ).length

  // ── Planning ─────────────────────────────────────────────────────────────
  const unassignedCount = paid.filter(
    (r) => !r.assigned_driver_id && !DONE_STATUSES.has(r.booking_status ?? "")
  ).length

  const assignedCount = paid.filter(
    (r) => r.assigned_driver_id && !DONE_STATUSES.has(r.booking_status ?? "")
  ).length

  const todayPlanningCount = all.filter((r) => r.pickup_date === todayStr).length

  const upcomingCount = paid.filter(
    (r) =>
      (r.pickup_date ?? "") > todayStr && !DONE_STATUSES.has(r.booking_status ?? "")
  ).length

  const completedCount = all.filter((r) => r.booking_status === "completed").length

  const cancelledCount = all.filter((r) =>
    ["cancelled", "canceled"].includes(r.booking_status ?? "")
  ).length

  // ── Vehicle split ────────────────────────────────────────────────────────
  const taxiPaid = paid.filter((r) => !isTaxibus(r))
  const taxibusPaid = paid.filter((r) => isTaxibus(r))

  // ── Lists ────────────────────────────────────────────────────────────────
  const latestPaidBookings = paid.slice(0, 5)

  const todayBookings = all.filter((r) => r.pickup_date === todayStr)

  return {
    todayStr,
    weekStartStr,
    monthStartStr,
    revenueToday,
    revenueWeek,
    revenueMonth,
    revenueTotal,
    averageFare,
    highestFare,
    paidRidesTotal,
    ridesToday,
    ridesThisWeek,
    ridesThisMonth,
    failedCancelledCount,
    unassignedCount,
    assignedCount,
    todayPlanningCount,
    upcomingCount,
    completedCount,
    cancelledCount,
    taxiRides: taxiPaid.length,
    taxibusRides: taxibusPaid.length,
    taxiRevenue: taxiPaid.reduce((s, r) => s + safeFare(r), 0),
    taxibusRevenue: taxibusPaid.reduce((s, r) => s + safeFare(r), 0),
    activeDrivers,
    latestPaidBookings,
    todayBookings,
    hasNoPaidBookings: paid.length === 0,
  }
}
