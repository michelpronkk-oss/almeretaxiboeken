export function formatCurrencyEUR(value: number | string | null | undefined) {
  const amount = typeof value === "number" ? value : Number(value || 0)
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatPassengerVehicle(passengers?: number | null, vehicleType?: string | null) {
  const p = Number(passengers || 0)
  const vehicle = vehicleType === "taxibus" || p >= 5 ? "Taxibus" : "Taxi"

  if (p <= 0) {
    return `- - ${vehicle}`
  }

  const personWord = p === 1 ? "persoon" : "personen"
  return `${p} ${personWord} - ${vehicle}`
}
