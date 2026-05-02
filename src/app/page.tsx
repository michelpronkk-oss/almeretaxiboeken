"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookingWidget } from "@/components/booking-widget"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import {
  Phone,
  ArrowRight,
  Plane,
  Briefcase,
  Car,
  Star,
  Headphones,
  CheckCircle2,
} from "lucide-react"

const PHONE = "+31361234567"
const PHONE_DISPLAY = "036 123 45 67"

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
}

const services = [
  {
    icon: Plane,
    label: "Luchthaven",
    title: "Luchthaven vervoer",
    href: "/diensten/luchthaven",
    description:
      "Van Almere naar Schiphol, Rotterdam of Eindhoven. Vaste prijs, vlucht gevolgd, altijd op tijd.",
  },
  {
    icon: Briefcase,
    label: "Zakelijk",
    title: "Zakelijk vervoer",
    href: "/diensten/zakelijk",
    description:
      "Representatief vervoer voor vergaderingen, klantbezoeken en directieritten door heel Nederland.",
  },
  {
    icon: Car,
    label: "Particulier",
    title: "Particulier vervoer",
    href: "/diensten/particulier",
    description:
      "Een avond Amsterdam, medische afspraak of station. Wij regelen uw rit snel en comfortabel.",
  },
]

const usps = [
  {
    icon: CheckCircle2,
    title: "Vaste prijzen",
    description:
      "Geen taxameter, geen verrassingen. U weet vooraf wat u betaalt.",
  },
  {
    icon: Plane,
    title: "Vluchtvolgservice",
    description:
      "Vertraagd? Onze chauffeur past de rijtijd automatisch aan op uw vlucht.",
  },
  {
    icon: Star,
    title: "Schone voertuigen",
    description:
      "Ruime, verzorgde auto's. Sedan voor 4 personen, bus voor groepen tot 8.",
  },
  {
    icon: Headphones,
    title: "Direct bereikbaar",
    description:
      "Bel of stuur een bericht. Na betaling ontvangt u direct uw bevestiging.",
  },
]

const stats = [
  { value: "2.500+", label: "Ritten per jaar" },
  { value: "4,9 / 5", label: "Gemiddelde score" },
  { value: "10 min", label: "Bevestigingstijd" },
  { value: "7 jaar", label: "Actief in Almere" },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      <SiteHeader />

      {/* Hero */}
      <section className="relative min-h-screen pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_30%_40%,rgba(232,220,200,0.05),transparent)]" />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-[1.05fr_0.95fr] lg:py-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="flex flex-col gap-6"
          >
            <motion.span
              variants={fade}
              className="w-fit rounded-full border border-[#D4B896]/20 bg-[#D4B896]/[0.07] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D4B896]"
            >
              Taxivervoer in Almere
            </motion.span>

            <motion.h1
              variants={fade}
              className="font-display text-5xl font-black leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              Betrouwbaar vervoer.
              <br />
              <span className="text-[#D4B896]">Altijd op tijd.</span>
            </motion.h1>

            <motion.p
              variants={fade}
              className="max-w-md text-[15px] leading-relaxed text-white/50"
            >
              Vaste tarieven, directe bevestiging en professionele chauffeurs.
              Wij rijden u veilig in en rondom Almere, naar Schiphol en verder.
            </motion.p>

            <motion.div variants={fade} className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <Button
                asChild
                className="h-12 gap-2 border border-[#D4B896]/50 bg-transparent px-7 text-[15px] font-semibold text-[#D4B896] hover:bg-[#D4B896]/[0.1]"
              >
                <a href={`tel:${PHONE}`}>
                  <Phone className="size-4" />
                  {PHONE_DISPLAY}
                </a>
              </Button>
            </motion.div>

            <motion.div
              variants={fade}
              className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-2 text-[11px] text-white/30"
            >
              {["Schiphol", "Amsterdam Centraal", "Utrecht CS", "Rotterdam Airport"].map((loc, i) => (
                <span key={loc} className="flex items-center gap-2">
                  {i > 0 && <span className="size-1 rounded-full bg-white/15" />}
                  {loc}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.15 }}
          >
            <BookingWidget />
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-6 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="py-8 text-center">
              <p className="font-display text-4xl font-black text-[#D4B896]">{s.value}</p>
              <p className="mt-1 text-xs text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <section id="diensten" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fade} className="mb-12">
              <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D4B896]">
                Onze diensten
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Wij rijden u naar elk bestemming
              </h2>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-3">
              {services.map((s) => (
                <motion.div
                  key={s.title}
                  variants={fade}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 transition-colors duration-300 hover:border-[#D4B896]/[0.18] hover:bg-white/[0.035]"
                >
                  <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-[#D4B896]/[0.09]">
                    <s.icon className="size-5 text-[#D4B896]" />
                  </div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-white/30">
                    {s.label}
                  </p>
                  <h3 className="mb-2.5 text-[15px] font-semibold leading-snug">{s.title}</h3>
                  <p className="mb-5 text-sm leading-relaxed text-white/45">{s.description}</p>
                  <Link
                    href={s.href}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D4B896]/60 transition-colors hover:text-[#D4B896]"
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

      {/* Why us */}
      <section id="waarom-ons" className="border-y border-white/[0.06] bg-white/[0.015] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid gap-14 lg:grid-cols-[1fr_1.25fr]"
          >
            <motion.div variants={fade} className="flex flex-col justify-center gap-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D4B896]">
                Waarom klanten voor ons kiezen
              </p>
              <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Geen verrassingen.
                <br />
                Geen stress.
              </h2>
              <p className="max-w-xs text-sm leading-relaxed text-white/45">
                Een rit boeken moet eenvoudig zijn. Vaste prijs afspreken,
                bevestiging ontvangen en instappen. Dat is het.
              </p>
              <Button
                asChild
                className="w-fit gap-2 border border-[#D4B896]/50 bg-transparent px-5 text-sm font-semibold text-[#D4B896] hover:bg-[#D4B896]/[0.1]"
              >
                <a href={`tel:${PHONE}`}>
                  <Phone className="size-3.5" />
                  {PHONE_DISPLAY}
                </a>
              </Button>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              {usps.map((u) => (
                <motion.div
                  key={u.title}
                  variants={fade}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
                >
                  <u.icon className="mb-3.5 size-5 text-[#D4B896]" />
                  <h3 className="mb-1.5 text-[13px] font-semibold leading-snug">{u.title}</h3>
                  <p className="text-xs leading-relaxed text-white/40">{u.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
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
              className="relative overflow-hidden rounded-2xl border border-[#D4B896]/[0.11] px-8 py-12 md:px-12"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(232,220,200,0.06),transparent)]" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#D4B896]/[0.03] to-transparent" />

              <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
                <div className="flex flex-col gap-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D4B896]">
                    Rit boeken
                  </p>
                  <h2 className="font-display text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                    Klaar om te rijden?
                  </h2>
                  <p className="max-w-sm text-[15px] leading-relaxed text-white/45">
                    Vul uw rit in en ontvang direct een vaste prijs. Wij
                    bevestigen uw rit na succesvolle betaling.
                  </p>
                  <Button
                    asChild
                    className="w-fit gap-2 border border-[#D4B896]/50 bg-transparent px-6 text-sm font-semibold text-[#D4B896] hover:bg-[#D4B896]/[0.1]"
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
