export interface FixedRoute {
  from: string
  to: string
  taxiPrice: number
  taxibusPrice: number
}

export const FIXED_ROUTES: FixedRoute[] = [
  { from: "almere",    to: "schiphol", taxiPrice: 80,  taxibusPrice: 95  },
  { from: "lelystad",  to: "schiphol", taxiPrice: 110, taxibusPrice: 125 },
  { from: "hilversum", to: "schiphol", taxiPrice: 75,  taxibusPrice: 90  },
]

export interface FixedRouteMatch {
  routeLabel: string
  taxiPrice: number
  taxibusPrice: number
}

// ── Normalisation ─────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ")
}

/**
 * Word-boundary match: the target word must not be immediately preceded or
 * followed by another letter.  Handles "schiphol" inside "amsterdam airport
 * schiphol (ams)" correctly, and does NOT match "ams" inside "amstelveen".
 */
function containsWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`(?<![a-zà-ÿ])${escaped}(?![a-zà-ÿ])`, "i").test(text)
}

// ── Airport / city guards ─────────────────────────────────────────────────────

/**
 * Returns true when the address refers to Amsterdam Airport Schiphol.
 *
 * Primary signal: the word "schiphol" (word-boundary match).
 *   Covers: "Schiphol", "Schiphol Airport", "Amsterdam Airport Schiphol",
 *           "Schiphol Amsterdam Airport (AMS), Evert van de Beekstraat, Schiphol, Nederland"
 *
 * Fallback: Google Places sometimes returns the terminal street without an
 *   explicit "Schiphol" label in the first component.  "Evert van de Beekstraat"
 *   is a street that exists only inside Schiphol's terminal zone — treat it as a
 *   definitive airport signal even without the word "schiphol" being present.
 *
 * Does NOT match: "Amsterdam", "Amsterdam Centrum", "Amstelveen", "AMS" alone,
 *                 "Airport" alone, or any address lacking both signals above.
 */
function isSchipholAddress(addr: string): boolean {
  const n = normalize(addr)
  // Primary: word-boundary match for "schiphol"
  if (containsWord(n, "schiphol")) return true
  // Fallback: Schiphol-exclusive street name (Google Places terminal address)
  if (n.includes("evert van de beekstraat")) return true
  return false
}

/**
 * Returns true when the address represents the given city.
 * Requires the city name as a whole word so "Almere" never matches "Galmere"
 * and "Lelystad" never matches an unrelated substring.
 */
function isCityAddress(addr: string, city: string): boolean {
  return containsWord(normalize(addr), city)
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Strict Schiphol fixed-route matcher.
 *
 * Returns a FixedRouteMatch only when:
 *   • one side is a known city (Almere / Lelystad / Hilversum) AND
 *   • the other side actually contains the word "schiphol".
 *
 * Returns null for any route where neither side is Schiphol (e.g. Almere →
 * Amstelveen, Almere → Amsterdam, Lelystad → Almere, etc.).
 */
export function matchFixedRoute(pickup: string, destination: string): FixedRouteMatch | null {
  for (const route of FIXED_ROUTES) {
    const cityInPickup  = isCityAddress(pickup,      route.from)
    const cityInDest    = isCityAddress(destination, route.from)
    const schipholPickup = isSchipholAddress(pickup)
    const schipholDest   = isSchipholAddress(destination)

    if (cityInPickup && schipholDest) {
      return {
        routeLabel: `${cap(route.from)} → Schiphol`,
        taxiPrice: route.taxiPrice,
        taxibusPrice: route.taxibusPrice,
      }
    }

    if (schipholPickup && cityInDest) {
      return {
        routeLabel: `Schiphol → ${cap(route.from)}`,
        taxiPrice: route.taxiPrice,
        taxibusPrice: route.taxibusPrice,
      }
    }
  }

  return null
}

// ── Development sanity check (runs only in dev, stripped in production) ───────
if (process.env.NODE_ENV === "development") {
  const SCHIPHOL_GOOGLE = "Schiphol Amsterdam Airport (AMS), Evert van de Beekstraat, Schiphol, Nederland"

  const cases: Array<{ p: string; d: string; expect: boolean }> = [
    // ── Should match ──────────────────────────────────────────────────────────
    { p: "Almere, Nederland",    d: SCHIPHOL_GOOGLE,                             expect: true  },
    { p: "Almere Stad",          d: "Amsterdam Airport Schiphol",                expect: true  },
    { p: "Almere, Nederland",    d: "Schiphol",                                  expect: true  },
    { p: "Almere, Nederland",    d: "Schiphol Airport",                          expect: true  },
    { p: "Lelystad, Nederland",  d: SCHIPHOL_GOOGLE,                             expect: true  },
    { p: "Hilversum, Nederland", d: SCHIPHOL_GOOGLE,                             expect: true  },
    { p: SCHIPHOL_GOOGLE,        d: "Almere, Nederland",                         expect: true  },
    { p: SCHIPHOL_GOOGLE,        d: "Lelystad, Nederland",                       expect: true  },
    { p: SCHIPHOL_GOOGLE,        d: "Hilversum, Nederland",                      expect: true  },
    // ── Must NOT match ────────────────────────────────────────────────────────
    { p: "Almere, Nederland",    d: "Brink, 1188 Amstelveen, Nederland",         expect: false },
    { p: "Almere, Nederland",    d: "Amsterdam Centrum",                         expect: false },
    { p: "Almere, Nederland",    d: "Amsterdam, Nederland",                      expect: false },
    { p: "Almere, Nederland",    d: "Den Haag",                                  expect: false },
    { p: "Lelystad, Nederland",  d: "Almere, Nederland",                         expect: false },
    { p: "Hilversum, Nederland", d: "Amsterdam",                                 expect: false },
    { p: "Amstelveen, Nederland",d: "Almere, Nederland",                         expect: false },
  ]

  let allPassed = true
  for (const c of cases) {
    const result = matchFixedRoute(c.p, c.d)
    const matched = result !== null
    if (matched !== c.expect) {
      console.error(`[fixed-routes] FAIL: "${c.p}" → "${c.d}" expected ${c.expect} got ${matched}`)
      allPassed = false
    }
  }
  if (allPassed) {
    console.log("[fixed-routes] All matcher sanity checks passed ✓")
  }
}
