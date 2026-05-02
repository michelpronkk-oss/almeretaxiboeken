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
  FileText,
  User,
  Shield,
  Clock,
  Map,
  Repeat,
} from "lucide-react"

const PHONE = "+31361234567"
const PHONE_DISPLAY = "036 123 45 67"
const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
const fade = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }

const features = [
  {
    icon: FileText,
    title: "Factuur op bedrijfsnaam",
    description: "Gespecificeerde factuur per rit, geschikt voor zakelijke declaraties en boekhoudingen.",
  },
  {
    icon: User,
    title: "Vaste chauffeur op aanvraag",
    description: "Uw vaste chauffeur leert uw voorkeuren en routes kennen. Op aanvraag beschikbaar.",
  },
  {
    icon: Shield,
    title: "Discreet en professioneel",
    description: "Strak geklede chauffeurs. Geen overbodige gesprekken, tenzij u dat wenst.",
  },
  {
    icon: Clock,
    title: "Vroeg en laat beschikbaar",
    description: "Ochtendvlucht om 05:30 of vergadering tot middernacht. Wij rijden altijd.",
  },
  {
    icon: Map,
    title: "Heel Nederland",
    description: "Van Almere naar Amsterdam, Rotterdam, Den Haag of verder. Geen afstand te groot.",
  },
  {
    icon: Repeat,
    title: "Abonnement mogelijk",
    description: "Vaste maandelijkse afrekening voor organisaties met regelmatig vervoer.",
  },
]

const useCases = [
  { title: "Directievervoer", description: "Representatief vervoer voor management en directieleden." },
  { title: "Klantbezoeken", description: "Zorg dat u uitgerust en op tijd bij uw klant aankomt." },
  { title: "Luchthavens", description: "Zakelijk vervoer naar Schiphol, Rotterdam en Eindhoven." },
  { title: "Congressen en events", description: "Vervoer voor sprekers, gasten en medewerkers." },
  { title: "Medewerkersvervoer", description: "Onboarding, late diensten of pendel tussen locaties." },
  { title: "Roadshows", description: "Meerdere bestemmingen op één dag, efficiënt gepland." },
]

const steps = [
  {
    number: "01",
    title: "Plan uw rit",
    description: "Bel of boek online. Geef uw bestemming, datum en tijd door. Wij bevestigen binnen 10 minuten.",
  },
  {
    number: "02",
    title: "Punctueel vervoer",
    description: "Uw chauffeur staat op tijd klaar. U concentreert zich op uw afspraken, wij op de rit.",
  },
  {
    number: "03",
    title: "Factuur achteraf",
    description: "Ontvang een gespecificeerde factuur per rit of per maand, geschikt voor uw administratie.",
  },
]

export default function ZakelijkPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_30%,rgba(232,220,200,0.04),transparent)]" />
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
              Zakelijk vervoer
            </motion.span>

            <motion.h1
              variants={fade}
              className="font-display mb-5 text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl"
            >
              Representatief vervoer
              <br />
              <span className="text-[#D4B896]">voor uw organisatie.</span>
            </motion.h1>

            <motion.p variants={fade} className="mb-8 max-w-lg text-[15px] leading-relaxed text-white/50">
              Discreet, punctueel en professioneel. Voor directieleden, zakenreizigers en
              corporate events. Met factuur op bedrijfsnaam.
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
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Vervoer dat past bij uw profiel</h2>
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

      {/* Use cases */}
      <section className="border-y border-white/[0.06] bg-white/[0.012] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fade} className="mb-10">
              <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D4B896]">Toepassingen</p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Geschikt voor elk zakelijk moment</h2>
            </motion.div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {useCases.map((u) => (
                <motion.div
                  key={u.title}
                  variants={fade}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
                >
                  <h3 className="mb-2 text-[14px] font-semibold">{u.title}</h3>
                  <p className="text-sm leading-relaxed text-white/40">{u.description}</p>
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
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Eenvoudig geregeld</h2>
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
                Plan uw zakelijke rit
              </h2>
              <p className="max-w-sm text-[15px] leading-relaxed text-white/45">
                Boek online of bel ons direct. Factuur op bedrijfsnaam, bevestiging binnen 10 minuten.
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
