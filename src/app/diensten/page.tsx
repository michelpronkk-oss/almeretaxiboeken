import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Briefcase, Car, Plane } from "lucide-react"
import { MarketingPageLayout } from "@/components/marketing-page-layout"
import { BookingBlock } from "@/components/booking-block"

export const metadata: Metadata = {
  title: "Diensten | AlmereTaxiBoeken",
  description:
    "Taxi in Almere voor luchthaven, zakelijke en particuliere ritten. Vergelijk onze diensten en bereken direct uw ritprijs.",
}

const services = [
  {
    title: "Luchthavenvervoer",
    description: "Betrouwbaar vervoer naar Schiphol, Rotterdam Airport en Eindhoven Airport.",
    href: "/luchthavenvervoer",
    icon: Plane,
  },
  {
    title: "Zakelijk vervoer",
    description: "Representatief taxivervoer voor meetings, klantenbezoek en stationsritten.",
    href: "/zakelijk-vervoer",
    icon: Briefcase,
  },
  {
    title: "Particulier vervoer",
    description: "Comfortabele ritten voor station, ziekenhuis, avond uit of familiebezoek.",
    href: "/particulier-vervoer",
    icon: Car,
  },
  {
    title: "Taxi Almere Schiphol",
    description: "Directe verbinding van Almere naar Schiphol. Vaste prijs, duidelijke ritopgave en keuze uit online of contant betalen.",
    href: "/taxi-almere-schiphol",
    icon: Plane,
  },
]

export default function DienstenPage() {
  return (
    <MarketingPageLayout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">Diensten</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Taxi in Almere voor elke rit</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#B7AEA2]">
          AlmereTaxiBoeken verzorgt luchthavenvervoer, zakelijk taxivervoer en particulier vervoer.
          Kies de dienst die past bij uw rit en reserveer direct via de ritmodule.
        </p>
      </section>

      <BookingBlock title="Direct uw rit berekenen" subtitle="Plan uw rit en ontvang meteen een duidelijke prijs. Kies na de prijsberekening hoe u wilt betalen: online of contant." />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="group rounded-2xl border border-[#292520] bg-[#151311] p-6 transition-colors hover:bg-[#1B1815]"
            >
              <service.icon className="mb-4 size-5 text-[#D6B58A]" />
              <h2 className="text-xl font-semibold text-[#F5F1E8]">{service.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#B7AEA2]">{service.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm text-[#D6B58A]">
                Bekijk dienst
                <ArrowRight className="size-3.5" />
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/#contact"
          className="mt-8 inline-flex rounded-lg border border-[#3A2D1F] px-5 py-2.5 text-sm font-semibold text-[#D6B58A] transition-colors hover:bg-[#1B1815]"
        >
          Bereken uw ritprijs
        </Link>
      </section>
    </MarketingPageLayout>
  )
}
