"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BookingWidget } from "@/components/booking-widget"
import {
  Phone,
  ArrowLeft,
  Car,
  CreditCard,
  Moon,
  Users,
  Heart,
  Zap,
} from "lucide-react"

const PHONE = "+31361234567"
const PHONE_DISPLAY = "036 123 45 67"
const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
const fade = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }

const features = [
  {
    icon: Car,
    title: "Geen parkeergedoe",
    description: "Wij brengen u tot aan de deur. Geen rondrijden, geen parkeertarieven, geen gedoe.",
  },
  {
    icon: CreditCard,
    title: "Vaste prijs vooraf",
    description: "Geen meter die loopt. U weet vóór de rit wat het kost. Pin, creditcard of contant.",
  },
  {
    icon: Moon,
    title: "Avonden en weekenden",
    description: "Wij rijden ook laat in de avond en het hele weekend. Ook met feestdagen.",
  },
  {
    icon: Users,
    title: "Tot 8 personen",
    description: "Kies een ruime sedan voor maximaal 4 passagiers of een taxibus voor groepen tot 8.",
  },
  {
    icon: Heart,
    title: "Zorgvervoer",
    description: "Rustig en betrouwbaar vervoer naar ziekenhuis, kliniek, fysiotherapeut of specialist.",
  },
  {
    icon: Zap,
    title: "Op korte termijn",
    description: "Geen wachtlijsten. Bel en wij regelen uw rit zo snel mogelijk, ook last-minute.",
  },
]

const destinations = [
  { from: "Almere Centrum", to: "Amsterdam Centrum", note: "Ca. 30 minuten" },
  { from: "Almere Buiten", to: "Schiphol Airport", note: "Ca. 40 minuten" },
  { from: "Almere", to: "Utrecht Centraal", note: "Ca. 35 minuten" },
  { from: "Almere", to: "Amsterdam ArenA", note: "Evenementen en concerten" },
  { from: "Almere", to: "Flevoziekenhuis", note: "Medische afspraken" },
  { from: "Almere", to: "Station Almere Centrum", note: "Aansluiting op NS" },
]

const steps = [
  {
    number: "01",
    title: "Bel of boek online",
    description: "Geef uw ophaaladres en bestemming door. Dat is alles wat wij nodig hebben.",
  },
  {
    number: "02",
    title: "Chauffeur aan de deur",
    description: "Uw chauffeur staat op het afgesproken tijdstip voor uw deur. Geen wachttijd.",
  },
  {
    number: "03",
    title: "Ontspan en geniet",
    description: "Relaxed aankomen zonder haast, parkeergedoe of het zoeken naar een plek.",
  },
]

export default function ParticulierPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_30%_30%,rgba(232,220,200,0.04),transparent)]" />
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-2xl">
            <motion.div variants={fade}>
              <Link
                href="/#diensten"
                className="mb-8 inline-flex items-center gap-2 text-sm text-white/35 transition-colors hover:text-white/60"
              >
                <ArrowLeft className="size-3.5" />
                Alle diensten
              </Link>
            </motion.div>

            <motion.span
              variants={fade}
              className="mb-5 inline-block rounded-full border border-[#D4B896]/20 bg-[#D4B896]/[0.07] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D4B896]"
            >
              Particulier vervoer
            </motion.span>

            <motion.h1
              variants={fade}
              className="font-display mb-5 text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl"
            >
              Van deur tot deur.
              <br />
              <span className="text-[#D4B896]">Comfortabel en zorgeloos.</span>
            </motion.h1>

            <motion.p variants={fade} className="mb-8 max-w-lg text-[15px] leading-relaxed text-white/50">
              Geen parkeergedoe, geen alcohol achter het stuur en geen gedoe met OV. Gewoon
              instappen en ontspannen aankomen op uw bestemming.
            </motion.p>

            <motion.div variants={fade} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                className="h-12 gap-2 border border-[#D4B896]/50 bg-transparent px-7 text-[15px] font-semibold text-[#D4B896] hover:bg-[#D4B896]/[0.1]"
              >
                <a href={`tel:${PHONE}`}>
                  <Phone className="size-4" />
                  {PHONE_DISPLAY}
                </a>
              </Button>
              <a href="#boeken" className="text-sm text-white/40 transition-colors hover:text-white/70 sm:pl-2">
                Of boek direct hieronder
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/[0.06] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fade} className="mb-12">
              <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D4B896]">Wat wij bieden</p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Uw rit, uw gemak</h2>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <motion.div
                  key={f.title}
                  variants={fade}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
                >
                  <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-[#D4B896]/[0.09]">
                    <f.icon className="size-4.5 text-[#D4B896]" />
                  </div>
                  <h3 className="mb-2 text-[14px] font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-white/40">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Popular destinations */}
      <section className="border-y border-white/[0.06] bg-white/[0.012] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fade} className="mb-10">
              <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D4B896]">Populaire ritten</p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Veelgeboekte bestemmingen</h2>
            </motion.div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((d) => (
                <motion.div
                  key={d.to}
                  variants={fade}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
                >
                  <div className="mb-3 flex items-center gap-2 text-xs text-white/30">
                    <span>{d.from}</span>
                    <span className="h-px flex-1 bg-white/10" />
                    <span>{d.to}</span>
                  </div>
                  <p className="text-[13px] font-semibold">{d.to}</p>
                  <p className="mt-1 text-xs text-[#D4B896]/60">{d.note}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fade} className="mb-12">
              <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D4B896]">Zo werkt het</p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Binnen drie stappen onderweg</h2>
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-3">
              {steps.map((s) => (
                <motion.div key={s.number} variants={fade} className="flex flex-col gap-4">
                  <p className="font-display text-5xl font-bold text-[#D4B896]/20">{s.number}</p>
                  <div>
                    <h3 className="mb-2 text-[15px] font-semibold">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-white/40">{s.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Booking CTA */}
      <section id="boeken" className="border-t border-white/[0.06] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]"
          >
            <motion.div variants={fade} className="flex flex-col gap-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D4B896]">Rit boeken</p>
              <h2 className="font-display text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Klaar om te boeken?
              </h2>
              <p className="max-w-sm text-[15px] leading-relaxed text-white/45">
                Vul uw rit in en ontvang direct een vaste prijs. Wij bevestigen uw boeking binnen 10 minuten.
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
            </motion.div>

            <motion.div variants={fade}>
              <BookingWidget />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
