// Maximumtarieven conform CROW/rijksoverheid (geldig 2025-2026)
// Bron: https://www.rijksoverheid.nl/onderwerpen/taxi/tarieven-taxi
const STARTTARIEF = 3.55
const KM_TARIEF_DAG = 2.35   // 06:00 – 23:00
const KM_TARIEF_NACHT = 2.85 // 23:00 – 06:00
const TAXIBUS_FACTOR = 1.25  // 25% toeslag voor grotere wagen
const MINIMUM_PRIJS = 10.0

export interface PrijsBerekening {
  price: number
  starttarief: number
  kmTarief: number
  kmPrijs: number
  distanceKm: number
}

export function berekenPrijs(
  distanceKm: number,
  time: string,
  vehicleType: "taxi" | "taxibus"
): PrijsBerekening {
  const hours = parseInt(time.split(":")[0], 10)
  const isNacht = hours >= 23 || hours < 6
  const kmTarief = isNacht ? KM_TARIEF_NACHT : KM_TARIEF_DAG

  let prijs = STARTTARIEF + distanceKm * kmTarief
  if (vehicleType === "taxibus") prijs *= TAXIBUS_FACTOR
  prijs = Math.max(prijs, MINIMUM_PRIJS)

  // Afronden op dichtstbijzijnde 0,50
  const afgerond = Math.ceil(prijs * 2) / 2

  return {
    price: afgerond,
    starttarief: STARTTARIEF,
    kmTarief,
    kmPrijs: Math.round(distanceKm * kmTarief * 100) / 100,
    distanceKm: Math.round(distanceKm * 10) / 10,
  }
}
