const SCHIPHOL_ALIASES = [
  "schiphol",
  "schiphol airport",
  "amsterdam airport schiphol",
  "schiphol amsterdam airport",
  "ams",
  "luchthaven amsterdam",
]

export interface FixedRoute {
  from: string
  to: string
  taxiPrice: number
  taxibusPrice: number
}

export const FIXED_ROUTES: FixedRoute[] = [
  { from: "almere", to: "schiphol", taxiPrice: 80, taxibusPrice: 95 },
  { from: "lelystad", to: "schiphol", taxiPrice: 110, taxibusPrice: 125 },
  { from: "hilversum", to: "schiphol", taxiPrice: 75, taxibusPrice: 90 },
]

export interface FixedRouteMatch {
  routeLabel: string
  taxiPrice: number
  taxibusPrice: number
}

function isSchiphol(addr: string): boolean {
  const n = addr.toLowerCase()
  return SCHIPHOL_ALIASES.some((a) => n.includes(a))
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function matchFixedRoute(pickup: string, destination: string): FixedRouteMatch | null {
  const p = pickup.toLowerCase()
  const d = destination.toLowerCase()

  for (const route of FIXED_ROUTES) {
    if (p.includes(route.from) && isSchiphol(d)) {
      return {
        routeLabel: `${cap(route.from)} → Schiphol`,
        taxiPrice: route.taxiPrice,
        taxibusPrice: route.taxibusPrice,
      }
    }
    if (isSchiphol(p) && d.includes(route.from)) {
      return {
        routeLabel: `Schiphol → ${cap(route.from)}`,
        taxiPrice: route.taxiPrice,
        taxibusPrice: route.taxibusPrice,
      }
    }
  }

  return null
}
