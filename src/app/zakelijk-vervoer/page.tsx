import type { Metadata } from "next"
import Link from "next/link"
import { BookingBlock } from "@/components/booking-block"
import { MarketingPageLayout } from "@/components/marketing-page-layout"
import { BadgeEuro, Briefcase, Clock, ShieldCheck, Users, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "Zakelijk taxivervoer Almere | Representatief en op tijd",
  description:
    "Zakelijk taxivervoer in Almere voor meetings, klanten, stations en luchthavens. Professioneel, betrouwbaar en eenvoudig te reserveren.",
}

const features = [
  {
    icon: Clock,
    title: "Punctueel en betrouwbaar",
    desc: "Op tijd voor uw vergadering, vlucht of klantafspraak.",
  },
  {
    icon: ShieldCheck,
    title: "Eenvoudig betalen",
    desc: "Betaal online via iDEAL of creditcard, of kies contant bij de chauffeur. Bonnetje per e-mail.",
  },
  {
    icon: BadgeEuro,
    title: "Vaste prijzen",
    desc: "Geen taxameter. Duidelijke prijs vooraf, ook voor terugkerende ritten.",
  },
  {
    icon: Users,
    title: "Taxi én taxibus",
    desc: "Sedan voor 1 tot 4 personen of taxibus voor teams tot 8 personen.",
  },
  {
    icon: Briefcase,
    title: "Representatief voertuig",
    desc: "Schone, verzorgde auto's passend bij uw zakelijke uitstraling.",
  },
  {
    icon: Zap,
    title: "Eenvoudig boeken",
    desc: "Online reserveren in twee minuten. Geen telefoontje nodig.",
  },
]

export default function ZakelijkVervoerPage() {
  return (
    <MarketingPageLayout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
          Zakelijk vervoer
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Zakelijk taxivervoer in Almere
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#B7AEA2]">
          Voor meetings, stations, luchthavens en klantbezoeken. U reist representatief,
          punctueel en zonder omwegen.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#B7AEA2]">
          Efficiënte ritten naar Schiphol en alle OV-knooppunten. Boek online en ontvang direct uw ritgegevens na betaling of aanvraag.
        </p>
      </section>

      <BookingBlock
        title="Direct zakelijk vervoer reserveren"
        subtitle="Bereken direct uw ritprijs en kies uw betaalmethode."
      />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
          Waarom zakelijk met ons
        </p>
        <h2 className="mb-8 text-2xl font-bold tracking-tight text-[#F5F1E8]">
          Betrouwbaar van A naar B
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-[#292520] bg-[#151311] p-6 transition-colors hover:border-[#D6B58A]/20 hover:bg-[#1B1815]"
            >
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-[#D6B58A]/[0.08] transition-colors group-hover:bg-[#D6B58A]/[0.13]">
                <f.icon className="size-5 text-[#D6B58A]" />
              </div>
              <h3 className="mb-1.5 text-sm font-semibold text-[#F5F1E8]">{f.title}</h3>
              <p className="text-xs leading-relaxed text-[#7F776E]">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-[#292520] bg-[#151311] p-6">
          <h2 className="text-xl font-semibold text-[#F5F1E8]">
            Regelmatig zakelijk vervoer nodig?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#B7AEA2]">
            Wij denken mee over terugkerende ritten voor teams, directie of klanten. Neem
            contact op voor een passend voorstel.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex rounded-lg border border-[#3A2D1F] px-5 py-2.5 text-sm font-semibold text-[#D6B58A] transition-colors hover:bg-[#1B1815]"
          >
            Neem contact op
          </Link>
        </div>
      </section>

      {/* Trust block */}
      <section className="border-t border-[#1F1C18] bg-[#0D0C0B] py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
              <p className="text-2xl font-black text-[#F5F1E8]">Vaste prijs</p>
              <p className="mt-1 text-xs text-[#7F776E]">Altijd vooraf duidelijk, nooit achteraf meer</p>
            </div>
            <div className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
              <p className="text-2xl font-black text-[#F5F1E8]">Online betalen</p>
              <p className="mt-1 text-xs text-[#7F776E]">Beveiligd via Mollie, iDEAL & creditcard</p>
            </div>
            <div className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
              <p className="text-2xl font-black text-[#F5F1E8]">Direct bevestigd</p>
              <p className="mt-1 text-xs text-[#7F776E]">E-mailbevestiging zodra betaling geslaagd is</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  )
}
