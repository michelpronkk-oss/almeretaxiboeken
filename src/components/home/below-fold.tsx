"use client"

// All below-the-fold sections live here so framer-motion is code-split from
// the above-fold initial bundle. This component loads in a separate JS chunk.

import { motion } from "framer-motion"
import Link from "next/link"
import {
  ArrowRight,
  BadgeEuro,
  Briefcase,
  Car,
  CheckCircle2,
  MapPin,
  Phone,
  Plane,
  ShieldCheck,
  Star,
  Users,
  Zap,
} from "lucide-react"
import { BookingWidget } from "@/components/booking-widget"

const PHONE = "+31853038136"
const PHONE_DISPLAY = "085 303 8136"

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
const fade = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }

const steps = [
  { num: "01", icon: MapPin,       title: "Vul uw route in",     desc: "Vertrekpunt en bestemming via onze slimme routemodule." },
  { num: "02", icon: BadgeEuro,    title: "Bekijk uw ritprijs",  desc: "Direct een vaste prijs op basis van route en reistijd." },
  { num: "03", icon: ShieldCheck,  title: "Betaal veilig online", desc: "iDEAL, Bancontact of creditcard. Snel en beveiligd." },
  { num: "04", icon: CheckCircle2, title: "Rit bevestigd",       desc: "Directe bevestiging per e-mail. Uw chauffeur is op tijd." },
]

const services = [
  { icon: Plane,    label: "Luchthaven", title: "Luchthaven vervoer",  href: "/luchthavenvervoer",   description: "Van Almere naar Schiphol, Rotterdam of Eindhoven. Vaste prijs, vlucht gevolgd, altijd op tijd." },
  { icon: Briefcase, label: "Zakelijk",  title: "Zakelijk vervoer",    href: "/zakelijk-vervoer",    description: "Representatief vervoer voor vergaderingen, klantbezoeken en directieritten door heel Nederland." },
  { icon: Car,       label: "Particulier", title: "Particulier vervoer", href: "/particulier-vervoer", description: "Een avond Amsterdam, medische afspraak of station. Wij regelen uw rit snel en comfortabel." },
]

const popularRoutes = [
  { from: "Almere", to: "Schiphol",           href: "/taxi-almere-schiphol" },
  { from: "Almere", to: "Amsterdam Centraal", href: "/#contact" },
  { from: "Almere", to: "Utrecht CS",         href: "/#contact" },
  { from: "Almere", to: "Rotterdam Airport",  href: "/luchthavenvervoer" },
  { from: "Almere", to: "Eindhoven Airport",  href: "/luchthavenvervoer" },
  { from: "Almere", to: "Amsterdam Zuid",     href: "/#contact" },
]

const pillars = [
  { icon: BadgeEuro,   title: "Duidelijke ritprijs vooraf", desc: "Geen taxameter, geen verrassingen. U weet exact wat u betaalt voor de rit." },
  { icon: ShieldCheck, title: "Veilig online betalen",     desc: "Betaal via iDEAL of creditcard. Beveiligd verwerkt via Mollie." },
  { icon: Plane,       title: "Luchthaven en zakelijk",    desc: "Schiphol, Rotterdam Airport en Eindhoven Airport vanuit Almere." },
  { icon: MapPin,      title: "Almere en omgeving",        desc: "Lokale expertise voor ritten binnen Almere en de Randstad." },
  { icon: Car,         title: "Taxi of taxibus",           desc: "Sedan voor 1 tot 4 personen, comfortabele taxibus voor 5 tot 8 personen." },
  { icon: Zap,         title: "Direct reserveren",         desc: "Online boeken zonder bellen. Bevestiging direct per e-mail." },
]

const trustSignals = [
  { icon: Star,        label: "4,9/5",               sublabel: "gemiddelde beoordeling" },
  { icon: ShieldCheck, label: "Veilig betalen",       sublabel: "iDEAL & creditcard" },
  { icon: BadgeEuro,   label: "Vaste tarieven",       sublabel: "geen verborgen kosten" },
  { icon: Users,       label: "Zakelijk & particulier", sublabel: "voor elke reiziger" },
]

const VP = { once: true, margin: "-60px" }

export default function BelowFold() {
  return (
    <>
      {/* ── How it works ─────────────────────────────────── */}
      <section className="border-y border-[#1F1C18] bg-[#0D0C0B] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={VP} variants={stagger}>
            <motion.div variants={fade} className="mb-10">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">Hoe het werkt</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Zo boekt u uw rit</h2>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <motion.div key={step.num} variants={fade} className="group rounded-2xl border border-[#292520] bg-[#151311] p-6 transition-colors hover:border-[#D6B58A]/20 hover:bg-[#1B1815]">
                  <span className="mb-4 block text-3xl font-black leading-none text-[#D6B58A]/[0.15]">{step.num}</span>
                  <step.icon className="mb-3 size-5 text-[#D6B58A]" />
                  <h3 className="mb-1.5 text-sm font-semibold text-[#F5F1E8]">{step.title}</h3>
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
          <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">Tarieven preview</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Duidelijke prijsopbouw vooraf</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { title: "Personenauto (1-4)", rows: ["Start €4,31", "€3,17 per km", "€0,52 per minuut"] },
              { title: "Taxibus (5-8)",       rows: ["Start €8,77", "€4,00 per km", "€0,59 per minuut"] },
              { title: "Wachttarief",         rows: ["€59,41 per uur (indien toegepast)"] },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
                <p className="text-sm font-semibold text-[#F5F1E8]">{card.title}</p>
                {card.rows.map((r) => <p key={r} className="mt-2 text-sm text-[#B7AEA2]">{r}</p>)}
              </div>
            ))}
          </div>
          <Link href="/tarieven" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#D6B58A] transition-colors hover:text-[#E4C69E]">
            Bekijk alle tarieven <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────── */}
      <section id="diensten" className="border-y border-[#1F1C18] bg-[#0D0C0B] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={VP} variants={stagger}>
            <motion.div variants={fade} className="mb-10">
              <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">Onze diensten</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Wij rijden u naar elke bestemming</h2>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-3">
              {services.map((s) => (
                <motion.div key={s.title} variants={fade} className="group rounded-2xl border border-[#292520] bg-[#151311] p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D6B58A]/20 hover:bg-[#1B1815]">
                  <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-[#D6B58A]/[0.09] transition-colors group-hover:bg-[#D6B58A]/[0.14]">
                    <s.icon className="size-5 text-[#D6B58A]" />
                  </div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-[#7F776E]">{s.label}</p>
                  <h3 className="mb-2.5 text-[15px] font-semibold leading-snug text-[#F5F1E8]">{s.title}</h3>
                  <p className="mb-5 text-sm leading-relaxed text-[#B7AEA2]">{s.description}</p>
                  <Link href={s.href} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D6B58A]/60 transition-colors hover:text-[#D6B58A]">
                    Meer informatie <ArrowRight className="size-3" />
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
          <motion.div initial="hidden" whileInView="visible" viewport={VP} variants={stagger}>
            <motion.div variants={fade} className="mb-8">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">Populaire routes</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Veel geboekte ritten</h2>
            </motion.div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {popularRoutes.map((route) => (
                <motion.div key={route.to} variants={fade}>
                  <Link href={route.href} className="group flex items-center justify-between rounded-xl border border-[#292520] bg-[#151311] px-5 py-4 transition-all hover:border-[#D6B58A]/20 hover:bg-[#1B1815]">
                    <div className="flex items-center gap-3.5">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#D6B58A]/[0.07] transition-colors group-hover:bg-[#D6B58A]/[0.12]">
                        <ArrowRight className="size-3.5 text-[#D6B58A]" />
                      </div>
                      <div>
                        <p className="text-[11px] text-[#7F776E]">{route.from}</p>
                        <p className="text-sm font-semibold text-[#F5F1E8]">{route.to}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-[#D6B58A] opacity-0 transition-opacity group-hover:opacity-100">Bereken →</span>
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
          <motion.div initial="hidden" whileInView="visible" viewport={VP} variants={stagger}>
            <motion.div variants={fade} className="mb-10">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">Onze beloftes</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Waarom AlmereTaxiBoeken</h2>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pillars.map((p) => (
                <motion.div key={p.title} variants={fade} className="group rounded-2xl border border-[#292520] bg-[#151311] p-6 transition-all hover:border-[#D6B58A]/20 hover:bg-[#1B1815]">
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
          <motion.div initial="hidden" whileInView="visible" viewport={VP} variants={stagger}>
            <motion.div variants={fade} className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight">Vertrouwd door reizigers in Almere</h2>
              <p className="mt-2 text-sm text-[#7F776E]">Zekerheid, vaste prijzen en professioneel vervoer. Dat zijn onze uitgangspunten.</p>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trustSignals.map((t) => (
                <motion.div key={t.label} variants={fade} className="flex flex-col items-center gap-3 rounded-2xl border border-[#292520] bg-[#151311] px-5 py-7 text-center">
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
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">Veelgestelde vragen</p>
          <h2 className="text-3xl font-bold tracking-tight text-[#F5F1E8] sm:text-4xl">Duidelijk voor vertrek</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              { q: "Zijn de tarieven vooraf bekend?",       a: "Ja. U ontvangt vooraf een vaste prijs op basis van route, tijd en voertuig." },
              { q: "Wanneer is mijn rit bevestigd?",        a: "Uw rit is bevestigd zodra de betaling succesvol is afgerond." },
              { q: "Rijden jullie ook zakelijke ritten?",   a: "Ja. Wij verzorgen representatief vervoer voor zakelijke en particuliere klanten." },
              { q: "Kan ik contact opnemen via WhatsApp?",  a: "Ja. Voor vragen of ondersteuning kunt u ons direct via WhatsApp bereiken." },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
                <p className="text-sm font-semibold text-[#F5F1E8]">{item.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#B7AEA2]">{item.a}</p>
              </div>
            ))}
          </div>
          <Link href="/veelgestelde-vragen" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#D6B58A] transition-colors hover:text-[#E4C69E]">
            Alle veelgestelde vragen <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section id="contact" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fade} className="relative overflow-hidden rounded-2xl border border-[#D6B58A]/[0.11] px-8 py-12 md:px-12">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(214,181,138,0.07),transparent)]" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#D6B58A]/[0.03] to-transparent" />
              <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
                <div className="flex flex-col gap-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">Rit boeken</p>
                  <h2 className="font-display text-3xl font-black leading-tight tracking-tight text-[#F5F1E8] sm:text-4xl lg:text-5xl">Klaar om te rijden?</h2>
                  <p className="max-w-sm text-[15px] leading-relaxed text-[#B7AEA2]">Vul uw rit in en ontvang direct een vaste prijs. Wij bevestigen uw rit na succesvolle betaling.</p>
                  <a href={`tel:${PHONE}`} className="inline-flex w-fit items-center gap-2 rounded-md border border-[#D6B58A]/50 bg-transparent px-6 py-2.5 text-sm font-semibold text-[#D6B58A] transition-colors hover:bg-[#D6B58A]/[0.1]">
                    <Phone className="size-3.5" /> Liever bellen? {PHONE_DISPLAY}
                  </a>
                </div>
                <BookingWidget />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
