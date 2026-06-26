// Server Component — CSS keyframe animations, no framer-motion.
// BookingWidget is the only client boundary.

import { Phone } from "lucide-react"
import { BookingWidget } from "@/components/booking-widget"

const PHONE = "+31853038136"
const PHONE_DISPLAY = "085 303 8136"

export function HeroSection() {
  return (
    // NOTE: <main className="pt-16"> in page.tsx already offsets the fixed
    // header. Do NOT add pt-16 here — that was the cause of the double gap.
    <section className="relative pb-8 sm:pb-20 lg:pb-28">

      {/* ── Background layers ────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* Mobile: simple CSS gradient, zero GPU cost */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_10%_20%,rgba(214,181,138,0.08),transparent)] sm:hidden" />

        {/* Desktop only: large blurred orbs */}
        <div className="absolute -top-40 left-[5%] hidden h-[560px] w-[560px] rounded-full bg-[#D6B58A] opacity-[0.04] blur-[140px] sm:block" />
        <div className="absolute right-[5%] top-1/4 hidden h-[380px] w-[380px] rounded-full bg-[#D6B58A] opacity-[0.022] blur-[120px] sm:block" />

        {/* Faint grid — desktop only */}
        <div
          className="absolute inset-0 hidden opacity-[0.022] sm:block"
          style={{
            backgroundImage:
              "linear-gradient(rgba(214,181,138,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(214,181,138,0.6) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Fade overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080807]/70 via-transparent to-[#080807]/50" />

        {/* Route SVG — desktop only */}
        <div className="absolute bottom-0 left-0 right-0 hidden h-44 opacity-[0.13] sm:block">
          <svg viewBox="0 0 800 120" fill="none" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
            <defs>
              <path id="hero-route-path" d="M 0 92 C 140 92, 210 26, 400 46 S 618 76, 800 18" />
            </defs>
            <use href="#hero-route-path" stroke="#D6B58A" strokeWidth="1" strokeDasharray="4 8" opacity="0.3" />
            <path d="M 0 92 C 140 92, 210 26, 400 46 S 618 76, 800 18" stroke="#D6B58A" strokeWidth="1.5" fill="none" className="atb-route-line" />
            <circle cx="0"   cy="92" r="5" fill="#D6B58A" opacity="0.5" />
            <circle cx="215" cy="40" r="3" fill="#D6B58A" opacity="0.35" />
            <circle cx="400" cy="46" r="3" fill="#D6B58A" opacity="0.35" />
            <circle cx="800" cy="18" r="5" fill="#D6B58A" opacity="0.5" />
            <circle r="4.5" fill="#D6B58A" className="atb-reduce-motion-hide">
              <animateMotion dur="7s" repeatCount="indefinite" begin="0.5s">
                <mpath href="#hero-route-path" />
              </animateMotion>
            </circle>
          </svg>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 pt-6 sm:gap-10 sm:px-6 sm:pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20 lg:pb-8">

        {/* ── Left: text — centered on mobile, left-aligned on desktop ── */}
        <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:gap-6 sm:text-left">
          {/* Badge */}
          <span className="atb-fade-up atb-delay-0 w-fit rounded-full border border-[#D6B58A]/20 bg-[#D6B58A]/[0.07] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#D6B58A] sm:px-4 sm:py-1.5 sm:text-[11px]">
            Taxivervoer in Almere
          </span>

          {/* Headline — smaller on mobile so form stays visible */}
          <h1 className="atb-fade-up atb-delay-1 font-display text-[2.25rem] font-black leading-[1.05] tracking-tight text-[#F5F1E8] sm:text-5xl lg:text-6xl xl:text-7xl">
            Betrouwbaar vervoer.
            <br />
            <span className="text-[#D6B58A]">Altijd op tijd.</span>
          </h1>

          {/* Description — hidden on mobile to keep form in view */}
          <p className="atb-fade-up atb-delay-2 hidden max-w-md text-[15px] leading-relaxed text-[#B7AEA2] sm:block">
            Vaste tarieven, directe bevestiging en professionele chauffeurs.
            Wij rijden u veilig in en rondom Almere, naar Schiphol en verder.
          </p>

          {/* Phone CTA — hidden on mobile, form is the CTA */}
          <div className="atb-fade-up atb-delay-3 hidden sm:block">
            <a
              href={`tel:${PHONE}`}
              className="inline-flex h-12 items-center gap-2 rounded-md border border-[#D6B58A]/50 bg-transparent px-7 text-[15px] font-semibold text-[#D6B58A] transition-colors hover:bg-[#D6B58A]/[0.1]"
            >
              <Phone className="size-4" />
              {PHONE_DISPLAY}
            </a>
          </div>

          {/* Location tags — desktop only, don't wrap on mobile */}
          <div className="atb-fade-up atb-delay-4 hidden items-center gap-x-5 gap-y-1.5 pt-1 text-[11px] text-[#7F776E] sm:flex">
            {["Schiphol", "Amsterdam Centraal", "Utrecht CS", "Rotterdam Airport"].map((loc, i) => (
              <span key={loc} className="flex items-center gap-2">
                {i > 0 && <span className="size-1 rounded-full bg-[#292520]" />}
                {loc}
              </span>
            ))}
          </div>

          {/* Mobile-only phone link — compact, below the heading */}
          <a
            href={`tel:${PHONE}`}
            className="atb-fade-up atb-delay-3 flex w-fit items-center gap-2 text-sm font-semibold text-[#D6B58A] sm:hidden"
          >
            <Phone className="size-3.5" />
            {PHONE_DISPLAY}
          </a>
        </div>

        {/* ── Right: booking widget ── */}
        <div id="boeken" className="atb-fade-up atb-delay-widget relative scroll-mt-24">
          {/* Ambient glow — desktop only */}
          <div
            className="pointer-events-none absolute -inset-4 hidden rounded-3xl bg-[#D6B58A]/[0.05] blur-xl sm:block"
            aria-hidden
          />
          <div className="relative">
            <BookingWidget />
          </div>
        </div>
      </div>
    </section>
  )
}
