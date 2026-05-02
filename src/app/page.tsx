"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookingWidget } from "@/components/booking-widget"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TrustBar } from "@/components/trust-bar"
import {
  Phone,
  ArrowRight,
  Plane,
  Briefcase,
  Car,
  Star,
  CheckCircle2,
  MapPin,
  BadgeEuro,
  ShieldCheck,
  Zap,
  Users,
} from "lucide-react"

const PHONE = "+31853038136"
const PHONE_DISPLAY = "085 303 8136"

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
}

// ── Data ────────────────────────────────────────────────────

const services = [
  {
    icon: Plane,
    label: "Luchthaven",
    title: "Luchthaven vervoer",
    href: "/luchthavenvervoer",
    description:
      "Van Almere naar Schiphol, Rotterdam of Eindhoven. Vaste prijs, vlucht gevolgd, altijd op tijd.",
  },
  {
    icon: Briefcase,
    label: "Zakelijk",
    title: "Zakelijk vervoer",
    href: "/zakelijk-vervoer",
    description:
      "Representatief vervoer voor vergaderingen, klantbezoeken en directieritten door heel Nederland.",
  },
  {
    icon: Car,
    label: "Particulier",
    title: "Particulier vervoer",
    href: "/particulier-vervoer",
    description:
      "Een avond Amsterdam, medische afspraak of station. Wij regelen uw rit snel en comfortabel.",
  },
]

const steps = [
  {
    num: "01",
    icon: MapPin,
    title: "Vul uw route in",
    desc: "Vertrekpunt en bestemming via onze slimme routemodule.",
  },
  {
    num: "02",
    icon: BadgeEuro,
    title: "Bekijk uw ritprijs",
    desc: "Direct een vaste prijs op basis van route en reistijd.",
  },
  {
    num: "03",
    icon: ShieldCheck,
    title: "Betaal veilig online",
    desc: "iDEAL, Bancontact of creditcard. Snel en beveiligd.",
  },
  {
    num: "04",
    icon: CheckCircle2,
    title: "Rit bevestigd",
    desc: "Directe bevestiging per e-mail. Uw chauffeur is op tijd.",
  },
]

const popularRoutes = [
  { from: "Almere", to: "Schiphol", href: "/taxi-almere-schiphol" },
  { from: "Almere", to: "Amsterdam Centraal", href: "/#contact" },
  { from: "Almere", to: "Utrecht CS", href: "/#contact" },
  { from: "Almere", to: "Rotterdam Airport", href: "/luchthavenvervoer" },
  { from: "Almere", to: "Eindhoven Airport", href: "/luchthavenvervoer" },
  { from: "Almere", to: "Amsterdam Zuid", href: "/#contact" },
]

const pillars = [
  {
    icon: BadgeEuro,
    title: "Duidelijke ritprijs vooraf",
    desc: "Geen taxameter, geen verrassingen. U weet exact wat u betaalt vóór de rit.",
  },
  {
    icon: ShieldCheck,
    title: "Veilig online betalen",
    desc: "Betaal via iDEAL of creditcard. Beveiligd verwerkt via Mollie.",
  },
  {
    icon: Plane,
    title: "Luchthaven en zakelijk",
    desc: "Schiphol, Rotterdam Airport en Eindhoven Airport vanuit Almere.",
  },
  {
    icon: MapPin,
    title: "Almere en omgeving",
    desc: "Lokale expertise voor ritten binnen Almere en de Randstad.",
  },
  {
    icon: Car,
    title: "Taxi of taxibus",
    desc: "Sedan voor 1 tot 4 personen, comfortabele taxibus voor 5 tot 8 personen.",
  },
  {
    icon: Zap,
    title: "Direct reserveren",
    desc: "Online boeken zonder bellen. Bevestiging direct per e-mail.",
  },
]

const trustSignals = [
  {
    icon: Star,
    label: "4,9/5",
    sublabel: "gemiddelde beoordeling",
  },
  {
    icon: ShieldCheck,
    label: "Veilig betalen",
    sublabel: "iDEAL & creditcard",
  },
  {
    icon: BadgeEuro,
    label: "Vaste tarieven",
    sublabel: "geen verborgen kosten",
  },
  {
    icon: Users,
    label: "Zakelijk & particulier",
    sublabel: "voor elke reiziger",
  },
]

// ── Page ────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080807] text-[#F5F1E8]">
      <SiteHeader />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative pb-12 pt-8 sm:pb-20 sm:pt-12 lg:pb-28 lg:pt-16">
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {/* Primary champagne glow — static */}
          <div className="absolute -top-40 left-[5%] h-[560px] w-[560px] rounded-full bg-[#D6B58A] opacity-[0.04] blur-[140px]" />
          {/* Secondary glow — static */}
          <div className="absolute right-[5%] top-1/4 h-[380px] w-[380px] rounded-full bg-[#D6B58A] opacity-[0.022] blur-[120px]" />
          {/* Faint grid */}
          <div
            className="absolute inset-0 opacity-[0.022]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(214,181,138,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(214,181,138,0.6) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
          {/* Top-fade overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080807]/35 via-transparent to-[#080807]/22" />
          {/* Decorative route SVG */}
          <div className="absolute bottom-0 left-0 right-0 h-44 opacity-[0.13]">
            <svg
              viewBox="0 0 800 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-full"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <path
                  id="hero-route-path"
                  d="M 0 92 C 140 92, 210 26, 400 46 S 618 76, 800 18"
                />
              </defs>
              {/* Static background path (always visible) */}
              <use
                href="#hero-route-path"
                stroke="#D6B58A"
                strokeWidth="1"
                strokeDasharray="4 8"
                opacity="0.3"
              />
              {/* Animated draw-on path */}
              <path
                d="M 0 92 C 140 92, 210 26, 400 46 S 618 76, 800 18"
                stroke="#D6B58A"
                strokeWidth="1.5"
                fill="none"
                className="atb-route-line"
              />
              {/* City node dots */}
              <circle cx="0"   cy="92" r="5" fill="#D6B58A" opacity="0.5" />
              <circle cx="215" cy="40" r="3" fill="#D6B58A" opacity="0.35" />
              <circle cx="400" cy="46" r="3" fill="#D6B58A" opacity="0.35" />
              <circle cx="800" cy="18" r="5" fill="#D6B58A" opacity="0.5" />
              {/* Moving dot — SVG animateMotion works cross-browser */}
              <circle r="4.5" fill="#D6B58A" className="atb-reduce-motion-hide">
                <animateMotion dur="7s" repeatCount="indefinite" begin="0.5s">
                  <mpath href="#hero-route-path" />
                </animateMotion>
              </circle>
            </svg>
          </div>
        </div>

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-6 px-4 py-5 sm:gap-10 sm:px-6 sm:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="order-1 flex flex-col gap-4 sm:gap-6"
          >
            <motion.span
              variants={fade}
              className="w-fit rounded-full border border-[#D6B58A]/20 bg-[#D6B58A]/[0.07] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]"
            >
              Taxivervoer in Almere
            </motion.span>

            <motion.h1
              variants={fade}
              className="font-display text-[34px] font-black leading-[1.06] tracking-tight text-[#F5F1E8] sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              Betrouwbaar vervoer.
              <br />
              <span className="text-[#D6B58A]">Altijd op tijd.</span>
            </motion.h1>

            <motion.p
              variants={fade}
              className="max-w-md text-[14px] leading-relaxed text-[#B7AEA2] sm:text-[15px]"
            >
              Vaste tarieven, directe bevestiging en professionele chauffeurs.
              Wij rijden u veilig in en rondom Almere, naar Schiphol en verder.
            </motion.p>

            <motion.div
              variants={fade}
              className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center"
            >
              <Button
                asChild
                className="h-12 gap-2 border border-[#D6B58A]/50 bg-transparent px-7 text-[15px] font-semibold text-[#D6B58A] hover:bg-[#D6B58A]/[0.1]"
              >
                <a href={`tel:${PHONE}`}>
                  <Phone className="size-4" />
                  {PHONE_DISPLAY}
                </a>
              </Button>
            </motion.div>

            <motion.div
              variants={fade}
              className="hidden flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 text-[11px] text-[#7F776E] sm:flex"
            >
              {["Schiphol", "Amsterdam Centraal", "Utrecht CS", "Rotterdam Airport"].map(
                (loc, i) => (
                  <span key={loc} className="flex items-center gap-2">
                    {i > 0 && <span className="size-1 rounded-full bg-[#292520]" />}
                    {loc}
                  </span>
                )
              )}
            </motion.div>
          </motion.div>

          {/* Booking widget with subtle ambient glow */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.15 }}
            className="order-2 relative"
          >
            <div
              className="pointer-events-none absolute -inset-3 rounded-3xl bg-[#D6B58A]/[0.045] blur-xl sm:-inset-4"
              aria-hidden
            />
            <div className="relative">
              <BookingWidget />
            </div>
          </motion.div>

          <motion.div
            variants={fade}
            className="order-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5 text-[11px] text-[#7F776E] sm:hidden"
          >
            {["Schiphol", "Amsterdam Centraal", "Utrecht CS", "Rotterdam Airport"].map(
              (loc, i) => (
                <span key={loc} className="flex items-center gap-2">
                  {i > 0 && <span className="size-1 rounded-full bg-[#292520]" />}
                  {loc}
                </span>
              )
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Vehicle photo slots ───────────────────────────── */}
      {/*
        PHOTO READY — swap in real images by:
        1. Adding Next.js <Image src="..." alt="..." fill className="object-cover" />
           inside the slot div (before the overlay div)
        2. Removing the placeholder icon + label divs
        3. Keeping the gradient overlay and caption intact
      */}
      <div className="bg-[#080807] px-6 pb-10">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1.15fr_1fr]">

          {/* Slot A — exterior / vehicle shot */}
          <div className="group relative aspect-[16/9] overflow-hidden rounded-2xl border border-[#292520] bg-[#151311] lg:aspect-[3/2]">
            {/* ↓ Remove this block when adding real photo */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
              <Car className="size-9 text-[#292520]" />
              <span className="rounded-full border border-[#292520] px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-[#292520]">
                Voertuig exterieur
              </span>
            </div>
            {/* ↑ Remove this block when adding real photo */}

            {/* Keep this overlay when using a real photo */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-5 py-4">
              <p className="text-sm font-semibold text-[#F5F1E8]">Professioneel voertuig</p>
              <p className="text-xs text-[#7F776E]">Schoon, ruim en altijd op tijd</p>
            </div>
          </div>

          {/* Slot B — interior shot */}
          <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#292520] bg-[#151311] lg:aspect-auto">
            {/* ↓ Remove this block when adding real photo */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
              <Users className="size-9 text-[#292520]" />
              <span className="rounded-full border border-[#292520] px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-[#292520]">
                Interieur
              </span>
            </div>
            {/* ↑ Remove this block when adding real photo */}

            {/* Keep this overlay when using a real photo */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-5 py-4">
              <p className="text-sm font-semibold text-[#F5F1E8]">Comfortabel interieur</p>
              <p className="text-xs text-[#7F776E]">Ruimte voor bagage en passagiers</p>
            </div>
          </div>

        </div>
      </div>

      <TrustBar />

      {/* ── How it works ─────────────────────────────────── */}
      <section className="border-y border-[#1F1C18] bg-[#0D0C0B] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            <motion.div variants={fade} className="mb-10">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
                Hoe het werkt
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Zo boekt u uw rit
              </h2>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <motion.div
                  key={step.num}
                  variants={fade}
                  className="group rounded-2xl border border-[#292520] bg-[#151311] p-6 transition-colors hover:border-[#D6B58A]/20 hover:bg-[#1B1815]"
                >
                  <span className="mb-4 block text-3xl font-black leading-none text-[#D6B58A]/[0.15]">
                    {step.num}
                  </span>
                  <step.icon className="mb-3 size-5 text-[#D6B58A]" />
                  <h3 className="mb-1.5 text-sm font-semibold text-[#F5F1E8]">
                    {step.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#7F776E]">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Tarieven preview ─────────────────────────────── */}
      <section id="tarieven" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
            Tarieven preview
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Duidelijke prijsopbouw vooraf
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
              <p className="text-sm font-semibold text-[#F5F1E8]">Personenauto (1-4)</p>
              <p className="mt-2 text-sm text-[#B7AEA2]">Start €4,31</p>
              <p className="text-sm text-[#B7AEA2]">€3,17 per km</p>
              <p className="text-sm text-[#B7AEA2]">€0,52 per minuut</p>
            </div>
            <div className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
              <p className="text-sm font-semibold text-[#F5F1E8]">Taxibus (5-8)</p>
              <p className="mt-2 text-sm text-[#B7AEA2]">Start €8,77</p>
              <p className="text-sm text-[#B7AEA2]">€4,00 per km</p>
              <p className="text-sm text-[#B7AEA2]">€0,59 per minuut</p>
            </div>
            <div className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
              <p className="text-sm font-semibold text-[#F5F1E8]">Wachttarief</p>
              <p className="mt-2 text-sm text-[#B7AEA2]">€59,41 per uur (indien toegepast)</p>
            </div>
          </div>
          <Link
            href="/tarieven"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#D6B58A] transition-colors hover:text-[#E4C69E]"
          >
            Bekijk alle tarieven
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────── */}
      <section id="diensten" className="border-y border-[#1F1C18] bg-[#0D0C0B] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fade} className="mb-10">
              <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
                Onze diensten
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Wij rijden u naar elke bestemming
              </h2>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-3">
              {services.map((s) => (
                <motion.div
                  key={s.title}
                  variants={fade}
                  className="group rounded-2xl border border-[#292520] bg-[#151311] p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D6B58A]/20 hover:bg-[#1B1815]"
                >
                  <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-[#D6B58A]/[0.09] transition-colors group-hover:bg-[#D6B58A]/[0.14]">
                    <s.icon className="size-5 text-[#D6B58A]" />
                  </div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-[#7F776E]">
                    {s.label}
                  </p>
                  <h3 className="mb-2.5 text-[15px] font-semibold leading-snug text-[#F5F1E8]">
                    {s.title}
                  </h3>
                  <p className="mb-5 text-sm leading-relaxed text-[#B7AEA2]">
                    {s.description}
                  </p>
                  <Link
                    href={s.href}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D6B58A]/60 transition-colors hover:text-[#D6B58A]"
                  >
                    Meer informatie
                    <ArrowRight className="size-3" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Popular routes ───────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            <motion.div variants={fade} className="mb-8">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
                Populaire routes
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Veel geboekte ritten
              </h2>
            </motion.div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {popularRoutes.map((route) => (
                <motion.div key={route.to} variants={fade}>
                  <Link
                    href={route.href}
                    className="group flex items-center justify-between rounded-xl border border-[#292520] bg-[#151311] px-5 py-4 transition-all hover:border-[#D6B58A]/20 hover:bg-[#1B1815]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#D6B58A]/[0.07] transition-colors group-hover:bg-[#D6B58A]/[0.12]">
                        <ArrowRight className="size-3.5 text-[#D6B58A]" />
                      </div>
                      <div>
                        <p className="text-[11px] text-[#7F776E]">{route.from}</p>
                        <p className="text-sm font-semibold text-[#F5F1E8]">{route.to}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-[#D6B58A] opacity-0 transition-opacity group-hover:opacity-100">
                      Bereken →
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Why AlmereTaxiBoeken ─────────────────────────── */}
      <section id="waarom-ons" className="border-y border-[#1F1C18] bg-[#0D0C0B] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            <motion.div variants={fade} className="mb-10">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
                Onze beloftes
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Waarom AlmereTaxiBoeken
              </h2>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pillars.map((p) => (
                <motion.div
                  key={p.title}
                  variants={fade}
                  className="group rounded-2xl border border-[#292520] bg-[#151311] p-6 transition-all hover:border-[#D6B58A]/20 hover:bg-[#1B1815]"
                >
                  <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-[#D6B58A]/[0.08] transition-colors group-hover:bg-[#D6B58A]/[0.13]">
                    <p.icon className="size-5 text-[#D6B58A]" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-[#F5F1E8]">{p.title}</h3>
                  <p className="text-xs leading-relaxed text-[#7F776E]">{p.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Trust signals ────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            <motion.div variants={fade} className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                Vertrouwd door reizigers in Almere
              </h2>
              <p className="mt-2 text-sm text-[#7F776E]">
                Zekerheid, vaste prijzen en professioneel vervoer. Dat zijn onze uitgangspunten.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trustSignals.map((t) => (
                <motion.div
                  key={t.label}
                  variants={fade}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-[#292520] bg-[#151311] px-5 py-7 text-center"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-[#D6B58A]/[0.08]">
                    <t.icon className="size-5 text-[#D6B58A]" />
                  </div>
                  <div className="flex min-h-[3.75rem] items-center justify-center">
                    <p className="text-2xl font-black leading-tight text-[#F5F1E8]">{t.label}</p>
                  </div>
                  <p className="text-xs text-[#7F776E]">{t.sublabel}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section id="faq" className="border-y border-[#1F1C18] bg-[#0D0C0B] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
            Veelgestelde vragen
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[#F5F1E8] sm:text-4xl">
            Duidelijk voor vertrek
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              {
                q: "Zijn de tarieven vooraf bekend?",
                a: "Ja. U ontvangt vooraf een vaste prijs op basis van route, tijd en voertuig.",
              },
              {
                q: "Wanneer is mijn rit bevestigd?",
                a: "Uw rit is bevestigd zodra de betaling succesvol is afgerond.",
              },
              {
                q: "Rijden jullie ook zakelijke ritten?",
                a: "Ja. Wij verzorgen representatief vervoer voor zakelijke en particuliere klanten.",
              },
              {
                q: "Kan ik contact opnemen via WhatsApp?",
                a: "Ja. Voor vragen of ondersteuning kunt u ons direct via WhatsApp bereiken.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-[#292520] bg-[#151311] p-5"
              >
                <p className="text-sm font-semibold text-[#F5F1E8]">{item.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#B7AEA2]">{item.a}</p>
              </div>
            ))}
          </div>
          <Link
            href="/veelgestelde-vragen"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#D6B58A] transition-colors hover:text-[#E4C69E]"
          >
            Alle veelgestelde vragen
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section id="contact" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div
              variants={fade}
              className="relative overflow-hidden rounded-2xl border border-[#D6B58A]/[0.11] px-8 py-12 md:px-12"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(214,181,138,0.07),transparent)]" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#D6B58A]/[0.03] to-transparent" />

              <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
                <div className="flex flex-col gap-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
                    Rit boeken
                  </p>
                  <h2 className="font-display text-3xl font-black leading-tight tracking-tight text-[#F5F1E8] sm:text-4xl lg:text-5xl">
                    Klaar om te rijden?
                  </h2>
                  <p className="max-w-sm text-[15px] leading-relaxed text-[#B7AEA2]">
                    Vul uw rit in en ontvang direct een vaste prijs. Wij bevestigen uw rit na
                    succesvolle betaling.
                  </p>
                  <Button
                    asChild
                    className="w-fit gap-2 border border-[#D6B58A]/50 bg-transparent px-6 text-sm font-semibold text-[#D6B58A] hover:bg-[#D6B58A]/[0.1]"
                  >
                    <a href={`tel:${PHONE}`}>
                      <Phone className="size-3.5" />
                      Liever bellen? {PHONE_DISPLAY}
                    </a>
                  </Button>
                </div>

                <BookingWidget />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
