---
name: AlmereTaxiBoeken project context
description: Core tech stack, brand tokens, critical constraints, and what was implemented
type: project
---

Dutch taxi booking site for Almere. Dark premium design with champagne accent.

**Stack:** Next.js 16.2.4 (App Router), Tailwind v4, framer-motion v12, shadcn/ui, Mollie payments, Google Maps Places API, Resend email.

**Brand tokens:**
- bg: #080807, section bg: #0D0C0B, surface: #151311, hover: #1B1815
- text: #F5F1E8, secondary: #B7AEA2, muted: #7F776E
- accent: #D6B58A, hover: #E4C69E, border: #292520, soft border: #1F1C18
- WhatsApp: #25D366

**Critical constraints — never break:**
- `/api/calculate-price`, `/api/book`, `/api/mollie/webhook` route files
- `booking-widget.tsx` — full booking + Maps autocomplete + Mollie redirect logic
- env var names unchanged
- No white/light backgrounds, no taxi-yellow

**Contact:** phone `+31853038136` / `085 303 8136`, WhatsApp `31853038136`

**2026-05-02 audit + implementation pass:**
Added to homepage: animated hero background (CSS glow + route SVG), "Zo boekt u uw rit" (4 steps), "Veel geboekte ritten" (6 popular routes), enhanced "Waarom AlmereTaxiBoeken" (6 pillars), trust signals section.
Fixed: wrong phone in page.tsx, bg color #0a0a0a → #080807, removed min-h-screen from hero, UTF-8 encoding bug in zakelijk-vervoer.
Service pages: added feature grids, trust blocks, use-case tags. diensten page: removed internal "SEO-pagina" label.
CSS animations: atb-glow-pulse, atb-draw-route, atb-reduce-motion-hide — all respect prefers-reduced-motion.
Build: clean, 18 pages, no TS errors.

**Why:** Build passed 2026-05-02 with all pages static except the 3 API routes.
