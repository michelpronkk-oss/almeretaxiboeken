import { formatCurrencyEUR } from "@/lib/format"

export function euro(value: number) {
  return formatCurrencyEUR(value)
}

export function dateNl(dateStr: string) {
  const [y, m, d] = String(dateStr || "").split("-")
  if (!y || !m || !d) return dateStr || "-"
  const months = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]
  const idx = Math.max(0, Math.min(11, Number(m) - 1))
  return `${d} ${months[idx]} ${y}`
}

export function vehicleLabel(value?: string) {
  if (value === "taxibus") return "Taxibus (5-8 personen)"
  return "Taxi (1-4 personen)"
}
