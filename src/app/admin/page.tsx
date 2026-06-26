import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  AlertTriangle,
  ArrowRight,
  BadgeEuro,
  BarChart3,
  Car,
  CheckCircle2,
  CircleDot,
  Clock,
  ExternalLink,
  MapPin,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { formatCurrencyEUR } from "@/lib/format"
import { getDashboardMetrics, type BookingRow } from "@/lib/admin/metrics"
import { syncRecentPendingMollieBookings } from "@/lib/mollie-sync"

export const metadata: Metadata = {
  title: "Dashboard | AlmereTaxiBoeken Admin",
}

// ── Tiny UI helpers ──────────────────────────────────────────────────────────

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

function SectionHeader({
  title,
  sub,
  action,
}: {
  title: string
  sub?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7F776E]">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-[#7F776E]/60">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  alert,
}: {
  label: string
  value: string | number
  sub?: string
  icon?: React.ComponentType<{ className?: string }>
  accent?: boolean
  alert?: boolean
}) {
  return (
    <article
      className={cn(
        "rounded-xl border p-4",
        alert
          ? "border-[#D94A4A]/20 bg-[#D94A4A]/[0.04]"
          : accent
          ? "border-[#D6B58A]/20 bg-[#D6B58A]/[0.05]"
          : "border-[#1F1C18] bg-[#0D0C0B]"
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "mb-2.5 size-4",
            alert ? "text-[#D94A4A]" : accent ? "text-[#D6B58A]" : "text-[#7F776E]"
          )}
        />
      )}
      <p className="text-[11px] font-medium uppercase tracking-wider text-[#7F776E]">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold leading-none",
          alert ? "text-[#D94A4A]" : accent ? "text-[#D6B58A]" : "text-[#F5F1E8]"
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[11px] text-[#7F776E]">{sub}</p>}
    </article>
  )
}

function MetricRow({
  label,
  value,
  highlight,
  alert,
}: {
  label: string
  value: string | number
  highlight?: boolean
  alert?: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#1F1C18] bg-[#080807] px-3 py-2.5">
      <span className="text-xs text-[#7F776E]">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          alert ? "text-[#D94A4A]" : highlight ? "text-[#D6B58A]" : "text-[#F5F1E8]"
        )}
      >
        {value}
      </span>
    </div>
  )
}

const STATUS_LABEL: Record<string, string> = {
  paid: "Betaald",
  pending_payment: "Wacht",
  failed: "Mislukt",
  canceled: "Geannuleerd",
  cancelled: "Geannuleerd",
  expired: "Verlopen",
  confirmed: "Bevestigd",
  assigned: "Toegewezen",
  unassigned: "Niet toegewezen",
  completed: "Afgerond",
}

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-[#22A06B]/10 text-[#22A06B] border-[#22A06B]/20",
  confirmed: "bg-[#22A06B]/10 text-[#22A06B] border-[#22A06B]/20",
  assigned: "bg-[#D6B58A]/10 text-[#D6B58A] border-[#D6B58A]/20",
  completed: "bg-white/5 text-[#B7AEA2] border-white/10",
  cancelled: "bg-[#D94A4A]/10 text-[#D94A4A] border-[#D94A4A]/20",
  canceled: "bg-[#D94A4A]/10 text-[#D94A4A] border-[#D94A4A]/20",
  failed: "bg-[#D94A4A]/10 text-[#D94A4A] border-[#D94A4A]/20",
  expired: "bg-white/5 text-[#7F776E] border-white/10",
  pending_payment: "bg-white/5 text-[#7F776E] border-white/10",
  unassigned: "bg-[#D6B58A]/5 text-[#D6B58A]/70 border-[#D6B58A]/10",
}

function StatusPill({ status }: { status: string | null }) {
  const s = status ?? "unknown"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        STATUS_STYLE[s] ?? "bg-white/5 text-[#7F776E] border-white/10"
      )}
    >
      {STATUS_LABEL[s] ?? s}
    </span>
  )
}

function shortAddr(addr: string | null): string {
  if (!addr) return "-"
  return addr.split(",")[0].trim()
}

function formatDate(date: string | null, time: string | null): string {
  if (!date) return "-"
  const parts = date.split("-")
  if (parts.length < 3) return date
  const [y, m, d] = parts
  const base = `${d}-${m}-${y}`
  return time ? `${base} ${time}` : base
}

// ── Website performance helper ────────────────────────────────────────────────

function isConfigured(val: string | undefined): boolean {
  if (!val || val.trim() === "") return false
  return !/X{4,}/.test(val) && !/^0+$/.test(val.replace(/^[A-Z]+-/, ""))
}

function ConfigRow({ label, configured }: { label: string; configured: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#1F1C18] bg-[#080807] px-3 py-2.5">
      <span className="text-xs text-[#7F776E]">{label}</span>
      {configured ? (
        <span className="flex items-center gap-1 text-xs font-medium text-[#22A06B]">
          <CheckCircle2 className="size-3" />
          Ingesteld
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs font-medium text-[#7F776E]">
          <XCircle className="size-3" />
          Niet ingesteld
        </span>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated()
  if (!authenticated) redirect("/admin/login")

  await syncRecentPendingMollieBookings()
  const m = await getDashboardMetrics()

  // Website performance env checks (server-side)
  const gaOk = isConfigured(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
  const gtmOk = isConfigured(process.env.NEXT_PUBLIC_GTM_ID)
  const adsOk = isConfigured(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID)
  const convOk = isConfigured(process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL)

  // Dutch date display
  const todayDisplay = new Date(m.todayStr + "T00:00:00").toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-8">
      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#F5F1E8]">Dashboard</h1>
          <p className="mt-0.5 text-xs capitalize text-[#7F776E]">{todayDisplay}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/ritten"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#3A2D1F] px-3 py-1.5 text-xs font-semibold text-[#D6B58A] transition-colors hover:bg-[#1B1815]"
          >
            Alle ritten
            <ArrowRight className="size-3" />
          </Link>
          <Link
            href="/admin/chauffeurs"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1F1C18] px-3 py-1.5 text-xs font-semibold text-[#B7AEA2] transition-colors hover:bg-[#0D0C0B]"
          >
            Chauffeurs
          </Link>
        </div>
      </div>

      {/* ── Warning: no paid bookings ────────────────────── */}
      {m.hasNoPaidBookings && (
        <div className="flex items-start gap-3 rounded-xl border border-[#D94A4A]/20 bg-[#D94A4A]/[0.04] p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#D94A4A]" />
          <div>
            <p className="text-sm font-semibold text-[#F5F1E8]">
              Geen betaalde boekingen gevonden
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#7F776E]">
              Controleer of de Mollie webhook actief is en betaalstatus-synchronisatie werkt.
              Betaalde boekingen verschijnen hier automatisch nadat{" "}
              <code className="rounded bg-white/5 px-1 text-[#D6B58A]">payment_status = paid</code>{" "}
              is opgeslagen.
            </p>
          </div>
        </div>
      )}

      {/* ── Section 1: Top KPI row ───────────────────────── */}
      <div>
        <SectionHeader title="Overzicht" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <KPICard
            label="Omzet vandaag"
            value={formatCurrencyEUR(m.revenueToday)}
            icon={BadgeEuro}
            accent
            sub={`${m.ridesToday} rit${m.ridesToday !== 1 ? "ten" : ""}`}
          />
          <KPICard
            label="Omzet deze maand"
            value={formatCurrencyEUR(m.revenueMonth)}
            icon={TrendingUp}
            sub={`${m.ridesThisMonth} ritten`}
          />
          <KPICard
            label="Betaalde ritten"
            value={m.paidRidesTotal}
            icon={CheckCircle2}
            sub="totaal"
          />
          <KPICard
            label="Niet toegewezen"
            value={m.unassignedCount}
            icon={CircleDot}
            alert={m.unassignedCount > 0}
            sub="wachten op chauffeur"
          />
          <KPICard
            label="Gem. ritwaarde"
            value={formatCurrencyEUR(m.averageFare)}
            icon={BarChart3}
            sub="betaalde ritten"
          />
          <KPICard
            label="Actieve chauffeurs"
            value={m.activeDrivers}
            icon={Users}
            sub="goedgekeurd"
          />
        </div>
      </div>

      {/* ── Sections 2 + 3 + 4: Finance · Bookings · Planning ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Section 2: Finance */}
        <section className="rounded-xl border border-[#1F1C18] bg-[#0D0C0B] p-4">
          <SectionHeader
            title="Financieel overzicht"
            sub="Online betaald + contant"
          />
          <div className="space-y-1.5">
            <MetricRow label="Online omzet vandaag" value={formatCurrencyEUR(m.revenueToday)} highlight />
            <MetricRow label="Online omzet deze week" value={formatCurrencyEUR(m.revenueWeek)} />
            <MetricRow label="Online omzet deze maand" value={formatCurrencyEUR(m.revenueMonth)} />
            <MetricRow label="Online omzet totaal" value={formatCurrencyEUR(m.revenueTotal)} />
            <MetricRow label="Contant te innen" value={`${m.cashPendingCount} rit${m.cashPendingCount !== 1 ? "ten" : ""} · ${formatCurrencyEUR(m.cashPendingAmount)}`} highlight={m.cashPendingCount > 0} />
            <MetricRow label="Contant ontvangen" value={`${m.cashCollectedCount} rit${m.cashCollectedCount !== 1 ? "ten" : ""} · ${formatCurrencyEUR(m.cashCollectedAmount)}`} />
            <MetricRow label="Gemiddelde ritwaarde" value={formatCurrencyEUR(m.averageFare)} />
          </div>
        </section>

        {/* Section 3: Bookings */}
        <section className="rounded-xl border border-[#1F1C18] bg-[#0D0C0B] p-4">
          <SectionHeader title="Boekingen" />
          <div className="space-y-1.5">
            <MetricRow
              label="Betaalde ritten totaal"
              value={m.paidRidesTotal}
              highlight
            />
            <MetricRow label="Ritten vandaag" value={m.ridesToday} />
            <MetricRow label="Ritten deze week" value={m.ridesThisWeek} />
            <MetricRow label="Ritten deze maand" value={m.ridesThisMonth} />
            <MetricRow
              label="Mislukt / geannuleerd"
              value={m.failedCancelledCount}
              alert={m.failedCancelledCount > 0}
            />
          </div>
          <p className="mt-3 rounded-lg border border-[#1F1C18] bg-[#080807] px-3 py-2 text-[11px] leading-relaxed text-[#7F776E]">
            Websiteconversies worden via GTM/GA4 gemeten zodra tracking actief is.
          </p>
        </section>

        {/* Section 4: Planning */}
        <section className="rounded-xl border border-[#1F1C18] bg-[#0D0C0B] p-4">
          <SectionHeader title="Planning" />
          <div className="space-y-1.5">
            <MetricRow
              label="Niet toegewezen"
              value={m.unassignedCount}
              alert={m.unassignedCount > 0}
            />
            <MetricRow label="Toegewezen" value={m.assignedCount} highlight />
            <MetricRow label="Ritten vandaag (totaal)" value={m.todayPlanningCount} />
            <MetricRow label="Komende ritten" value={m.upcomingCount} />
            <MetricRow label="Afgeronde ritten" value={m.completedCount} />
            <MetricRow label="Geannuleerd" value={m.cancelledCount} />
          </div>
          {m.unassignedCount > 0 && (
            <Link
              href="/admin/ritten"
              className="mt-3 flex items-center justify-between rounded-lg border border-[#D6B58A]/20 bg-[#D6B58A]/[0.05] px-3 py-2 text-xs font-medium text-[#D6B58A] transition-colors hover:bg-[#D6B58A]/[0.1]"
            >
              <span>{m.unassignedCount} rit{m.unassignedCount !== 1 ? "ten" : ""} toewijzen</span>
              <ArrowRight className="size-3" />
            </Link>
          )}
        </section>
      </div>

      {/* ── Section 5: Vehicle split ─────────────────────── */}
      <div>
        <SectionHeader title="Voertuigverdeling" sub="Betaalde ritten" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KPICard
            label="Taxi ritten"
            value={m.taxiRides}
            icon={Car}
            sub="1 tot 4 personen"
          />
          <KPICard
            label="Taxibus ritten"
            value={m.taxibusRides}
            icon={Car}
            sub="5 tot 8 personen"
          />
          <KPICard
            label="Taxi omzet"
            value={formatCurrencyEUR(m.taxiRevenue)}
            icon={BadgeEuro}
            accent
          />
          <KPICard
            label="Taxibus omzet"
            value={formatCurrencyEUR(m.taxibusRevenue)}
            icon={BadgeEuro}
            accent
          />
        </div>
      </div>

      {/* ── Sections 6 + 7: Latest rides · Today planning ── */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">

        {/* Section 6: Latest paid rides */}
        <section className="rounded-xl border border-[#1F1C18] bg-[#0D0C0B] p-4">
          <SectionHeader
            title="Laatste betaalde ritten"
            action={
              <Link
                href="/admin/ritten"
                className="flex items-center gap-1 text-xs text-[#D6B58A] hover:text-[#E4C69E]"
              >
                Alle ritten
                <ExternalLink className="size-3" />
              </Link>
            }
          />

          {m.latestPaidBookings.length === 0 ? (
            <div className="rounded-lg border border-[#1F1C18] bg-[#080807] p-6 text-center">
              <p className="text-sm text-[#B7AEA2]">Nog geen betaalde ritten gevonden</p>
              <p className="mt-1 text-xs text-[#7F776E]">
                Betaalde boekingen verschijnen hier automatisch na betaling.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {m.latestPaidBookings.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          )}
        </section>

        {/* Section 7: Today planning */}
        <section className="rounded-xl border border-[#1F1C18] bg-[#0D0C0B] p-4">
          <SectionHeader title="Planning vandaag" />

          {m.todayBookings.length === 0 ? (
            <div className="rounded-lg border border-[#1F1C18] bg-[#080807] p-6 text-center">
              <p className="text-sm text-[#B7AEA2]">Nog geen ritten voor vandaag</p>
              <p className="mt-1 text-xs text-[#7F776E]">
                Ritten met ophaaldatum vandaag verschijnen hier.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {m.todayBookings.map((ride) => (
                <TodayRideRow key={ride.id} ride={ride} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Section 8: Website performance ──────────────── */}
      <section className="rounded-xl border border-[#1F1C18] bg-[#0D0C0B] p-4">
        <SectionHeader title="Website performance" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#7F776E]">
              Tracking
            </p>
            <ConfigRow label="Google Analytics (GA4)" configured={gaOk} />
            <ConfigRow label="Google Tag Manager" configured={gtmOk} />
          </div>
          <div className="space-y-1.5">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#7F776E]">
              Advertenties
            </p>
            <ConfigRow label="Google Ads" configured={adsOk} />
            <ConfigRow label="Conversielabel" configured={convOk} />
          </div>
          <div className="lg:col-span-2">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#7F776E]">
              Opmerking
            </p>
            <p className="rounded-lg border border-[#1F1C18] bg-[#080807] px-3 py-3 text-xs leading-relaxed text-[#7F776E]">
              Live bezoekersdata kan later via de GA4 Data API worden gekoppeld. Boekings- en
              omzetdata komt direct uit Supabase en is altijd actueel.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RideCard({ ride }: { ride: BookingRow }) {
  return (
    <div className="rounded-lg border border-[#1F1C18] bg-[#080807] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#D6B58A]">
              {ride.reference ?? "—"}
            </span>
            <StatusPill status={ride.booking_status} />
          </div>
          <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-[#7F776E]">
            <MapPin className="mt-0.5 size-3 shrink-0 text-[#D6B58A]/50" />
            <span className="truncate">
              {shortAddr(ride.pickup_address)} → {shortAddr(ride.destination_address)}
            </span>
          </div>
          {ride.customer_name && (
            <p className="mt-0.5 text-[11px] text-[#7F776E]">{ride.customer_name}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-[#F5F1E8]">
            {formatCurrencyEUR(ride.estimated_fare)}
          </p>
          <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-[#7F776E]">
            <Clock className="size-3" />
            {formatDate(ride.pickup_date, ride.pickup_time)}
          </div>
        </div>
      </div>
    </div>
  )
}

function TodayRideRow({ ride }: { ride: BookingRow }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[#1F1C18] bg-[#080807] p-3">
      <div className="mt-0.5 min-w-[3rem] text-sm font-semibold tabular-nums text-[#D6B58A]">
        {ride.pickup_time ?? "--:--"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#F5F1E8]">
            {ride.reference ?? "—"}
          </span>
          <StatusPill status={ride.booking_status} />
        </div>
        <p className="mt-0.5 truncate text-[11px] text-[#7F776E]">
          {shortAddr(ride.pickup_address)} → {shortAddr(ride.destination_address)}
        </p>
        {!ride.assigned_driver_id && (
          <p className="mt-0.5 text-[10px] font-medium text-[#D6B58A]/60">Geen chauffeur</p>
        )}
      </div>
    </div>
  )
}
