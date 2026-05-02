"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Phone, Mail, Clock, MapPin, CheckCircle2 } from "lucide-react"

const PHONE = "+31361234567"
const PHONE_DISPLAY = "036 123 45 67"
const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
const fade = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }

const contactInfo = [
  {
    icon: Phone,
    label: "Telefoon",
    value: PHONE_DISPLAY,
    note: "Dagelijks bereikbaar",
    href: `tel:${PHONE}`,
  },
  {
    icon: Mail,
    label: "E-mail",
    value: "info@taxiboekenalmere.nl",
    note: "Reactie binnen 2 uur",
    href: "mailto:info@taxiboekenalmere.nl",
  },
  {
    icon: Clock,
    label: "Openingstijden",
    value: "Dagelijks 05:00 – 00:00",
    note: "Ook op feestdagen",
    href: null,
  },
  {
    icon: MapPin,
    label: "Werkgebied",
    value: "Almere en omgeving",
    note: "Heel Nederland op aanvraag",
    href: null,
  },
]

type FormState = "idle" | "sending" | "sent"

export default function ContactPage() {
  const [form, setForm] = useState({ naam: "", email: "", telefoon: "", onderwerp: "", bericht: "" })
  const [state, setState] = useState<FormState>("idle")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState("sending")
    setTimeout(() => setState("sent"), 1200)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_20%,rgba(232,220,200,0.04),transparent)]" />
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-xl">
            <motion.span
              variants={fade}
              className="mb-5 inline-block rounded-full border border-[#D4B896]/20 bg-[#D4B896]/[0.07] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D4B896]"
            >
              Contact
            </motion.span>
            <motion.h1
              variants={fade}
              className="font-display mb-4 text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl"
            >
              Hoe kunnen wij
              <br />
              <span className="text-[#D4B896]">u helpen?</span>
            </motion.h1>
            <motion.p variants={fade} className="text-[15px] leading-relaxed text-white/50">
              Bel ons direct voor een snelle boeking, of stuur een bericht voor
              een offerte of algemene vraag. Wij reageren snel.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Contact info + Form */}
      <section className="border-t border-white/[0.06] pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid gap-12 pt-12 lg:grid-cols-[0.85fr_1.15fr]"
          >
            {/* Left: contact details */}
            <motion.div variants={fade} className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold">Contactgegevens</h2>

              <div className="flex flex-col gap-3">
                {contactInfo.map((c) => (
                  <div
                    key={c.label}
                    className="flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
                  >
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#D4B896]/[0.09]">
                      <c.icon className="size-4 text-[#D4B896]" />
                    </div>
                    <div>
                      <p className="mb-0.5 text-[11px] font-medium uppercase tracking-widest text-white/30">
                        {c.label}
                      </p>
                      {c.href ? (
                        <a
                          href={c.href}
                          className="text-[14px] font-semibold text-white transition-colors hover:text-[#D4B896]"
                        >
                          {c.value}
                        </a>
                      ) : (
                        <p className="text-[14px] font-semibold">{c.value}</p>
                      )}
                      <p className="mt-0.5 text-xs text-white/35">{c.note}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[#D4B896]/[0.11] bg-[#D4B896]/[0.03] p-6">
                <p className="mb-1 text-sm font-semibold">Voorkeur voor bellen?</p>
                <p className="mb-4 text-sm text-white/45">
                  Voor directe boekingen is bellen het snelst. Wij bevestigen uw rit binnen 10 minuten.
                </p>
                <Button
                  asChild
                  className="gap-2 border border-[#D4B896]/50 bg-transparent text-sm font-semibold text-[#D4B896] hover:bg-[#D4B896]/[0.1]"
                >
                  <a href={`tel:${PHONE}`}>
                    <Phone className="size-3.5" />
                    {PHONE_DISPLAY}
                  </a>
                </Button>
              </div>
            </motion.div>

            {/* Right: form */}
            <motion.div variants={fade}>
              <div className="rounded-2xl border border-white/[0.09] bg-[#111111] p-7">
                {state === "sent" ? (
                  <div className="flex flex-col items-center gap-4 py-12 text-center">
                    <CheckCircle2 className="size-10 text-[#D4B896]" />
                    <h3 className="text-lg font-semibold">Bericht ontvangen</h3>
                    <p className="max-w-xs text-sm text-white/45">
                      Bedankt voor uw bericht. Wij nemen zo snel mogelijk contact met u op.
                    </p>
                    <Button
                      onClick={() => { setForm({ naam: "", email: "", telefoon: "", onderwerp: "", bericht: "" }); setState("idle") }}
                      className="mt-2 border border-[#D4B896]/40 bg-[#D4B896]/[0.08] text-[#D4B896] hover:bg-[#D4B896]/[0.15]"
                    >
                      Nieuw bericht
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="mb-6 text-base font-semibold">Stuur een bericht</h2>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                      <div className="grid gap-3.5 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">
                            Naam <span className="text-[#D4B896]/60">*</span>
                          </label>
                          <input
                            required
                            type="text"
                            value={form.naam}
                            onChange={(e) => setForm({ ...form, naam: e.target.value })}
                            placeholder="Uw volledige naam"
                            className="h-11 rounded-lg border border-white/[0.09] bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#D4B896]/40 focus:bg-white/[0.07] transition-colors"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">
                            Telefoon
                          </label>
                          <input
                            type="tel"
                            value={form.telefoon}
                            onChange={(e) => setForm({ ...form, telefoon: e.target.value })}
                            placeholder="06 00 00 00 00"
                            className="h-11 rounded-lg border border-white/[0.09] bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#D4B896]/40 focus:bg-white/[0.07] transition-colors"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">
                          E-mailadres <span className="text-[#D4B896]/60">*</span>
                        </label>
                        <input
                          required
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="uw@emailadres.nl"
                          className="h-11 rounded-lg border border-white/[0.09] bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#D4B896]/40 focus:bg-white/[0.07] transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">
                          Onderwerp
                        </label>
                        <select
                          value={form.onderwerp}
                          onChange={(e) => setForm({ ...form, onderwerp: e.target.value })}
                          className="h-11 rounded-lg border border-white/[0.09] bg-[#111111] px-4 text-sm text-white outline-none focus:border-[#D4B896]/40 transition-colors appearance-none"
                        >
                          <option value="" className="text-white/40">Kies een onderwerp</option>
                          <option value="offerte">Offerte aanvragen</option>
                          <option value="boeking">Boeking bespreken</option>
                          <option value="zakelijk">Zakelijk account</option>
                          <option value="vraag">Algemene vraag</option>
                          <option value="anders">Anders</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">
                          Bericht <span className="text-[#D4B896]/60">*</span>
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={form.bericht}
                          onChange={(e) => setForm({ ...form, bericht: e.target.value })}
                          placeholder="Beschrijf uw vraag of wens..."
                          className="resize-none rounded-lg border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#D4B896]/40 focus:bg-white/[0.07] transition-colors"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={state === "sending"}
                        className="mt-1 h-12 w-full border border-[#D4B896]/40 bg-[#D4B896]/[0.08] text-[15px] font-semibold text-[#D4B896] hover:bg-[#D4B896]/[0.16] disabled:opacity-50"
                      >
                        {state === "sending" ? "Versturen..." : "Verstuur bericht"}
                      </Button>

                      <p className="text-center text-[11px] text-white/25">
                        Wij reageren doorgaans binnen 2 uur op werkdagen.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
