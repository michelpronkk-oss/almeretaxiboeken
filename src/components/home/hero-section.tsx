// Server Component — no "use client", no framer-motion in this subtree.
// Hero text uses CSS keyframe animations (atb-fade-up) defined in globals.css.
// BookingWidget is the only client boundary here.

import { Phone } from "lucide-react"
import { BookingWidget } from "@/components/booking-widget"

const PHONE = "+31853038136"
const PHONE_DISPLAY = "085 303 8136"

const LOCATIONS = ["Schiphol", "Amsterdam Centraal", "Utrecht CS", "Rotterdam Airport"]

export function HeroSection() {
  return (
    <section className="relative pb-20 pt-16 sm:pb-24 lg:pb-28">

      {/* ── Background layers ────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>

        {/* Mobile: lightweight radial gradient, no filter/blur */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_15%_20%,rgba(214,181,138,0.09),transparent)] sm:hidden" />

        {/* Desktop: large blurred glows (expensive — hidden on mobile) */}
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

        {/* Top-fade overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080807]/70 via-transparent to-[#080807]/50" />

        {/* Decorative route SVG — desktop only (animateMotion is GPU work on mobile) */}
        <div className="absolute bottom-0 left-0 right-0 hidden h-44 opacity-[0.13] sm:block">
          <svg
            viewBox="0 0 800 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <path id="hero-route-path" d="M 0 92 C 140 92, 210 26, 400 46 S 618 76, 800 18" />
            </defs>
            <use href="#hero-route-path" stroke="#D6B58A" strokeWidth="1" strokeDasharray="4 8" opacity="0.3" />
            <path
              d="M 0 92 C 140 92, 210 26, 400 46 S 618 76, 800 18"
              stroke="#D6B58A"
              strokeWidth="1.5"
              fill="none"
              className="atb-route-line"
            />
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

      {/* ── Content grid ─────────────────────────────────── */}
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-10 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">

        {/* Left: text — CSS fade-up animations, no JS */}
        <div className="flex flex-col gap-6">
          <span className="atb-fade-up atb-delay-0 w-fit rounded-full border border-[#D6B58A]/20 bg-[#D6B58A]/[0.07] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
            Taxivervoer in Almere
          </span>

          <h1 className="atb-fade-up atb-delay-1 font-display text-4xl font-black leading-[1.04] tracking-tight text-[#F5F1E8] sm:text-5xl lg:text-6xl xl:text-7xl">
            Betrouwbaar vervoer.
            <br />
            <span className="text-[#D6B58A]">Altijd op tijd.</span>
          </h1>

          <p className="atb-fade-up atb-delay-2 max-w-md text-[15px] leading-relaxed text-[#B7AEA2]">
            Vaste tarieven, directe bevestiging en professionele chauffeurs.
            Wij rijden u veilig in en rondom Almere, naar Schiphol en verder.
          </p>

          <div className="atb-fade-up atb-delay-3 flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <a
              href={`tel:${PHONE}`}
              className="inline-flex h-12 items-center gap-2 rounded-md border border-[#D6B58A]/50 bg-transparent px-7 text-[15px] font-semibold text-[#D6B58A] transition-colors hover:bg-[#D6B58A]/[0.1]"
            >
              <Phone className="size-4" />
              {PHONE_DISPLAY}
            </a>
          </div>

          <div className="atb-fade-up atb-delay-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-2 text-[11px] text-[#7F776E]">
            {LOCATIONS.map((loc, i) => (
              <span key={loc} className="flex items-center gap-2">
                {i > 0 && <span className="size-1 rounded-full bg-[#292520]" />}
                {loc}
              </span>
            ))}
          </div>
        </div>

        {/* Right: booking widget — isolated client boundary */}
        <div className="atb-fade-up atb-delay-widget relative">
          {/* Ambient glow — desktop only (blur is GPU work on mobile) */}
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
