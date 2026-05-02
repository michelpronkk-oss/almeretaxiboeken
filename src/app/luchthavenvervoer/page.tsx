import type { Metadata } from "next"
import Link from "next/link"
import { BookingBlock } from "@/components/booking-block"
import { MarketingPageLayout } from "@/components/marketing-page-layout"
import { BadgeEuro, Car, Clock, Plane, ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Luchthavenvervoer Almere | Schiphol, Rotterdam & Eindhoven",
  description:
    "Betrouwbaar luchthavenvervoer vanuit Almere naar Schiphol, Rotterdam Airport en Eindhoven Airport. Bereken direct uw ritprijs.",
}

const airports = [
  {
    name: "Schiphol Airport",
    desc: "De meest geboekte route. Vaste prijs, ruim op tijd en met oog voor uw vluchtschema.",
    href: "/taxi-almere-schiphol",
    cta: "Bereken rit naar Schiphol",
  },
  {
    name: "Rotterdam The Hague Airport",
    desc: "Comfortabele rit vanuit Almere. Vaste prijs vooraf, direct te reserveren.",
    href: "/#contact",
    cta: "Bereken ritprijs",
  },
  {
    name: "Eindhoven Airport",
    desc: "Lange rit? Dan weten onze chauffeurs precies hoe ze u comfortabel brengen.",
    href: "/#contact",
    cta: "Bereken ritprijs",
  },
]

const features = [
  {
    icon: Plane,
    title: "Vluchtvolgservice",
    desc: "Vertraagd? Uw chauffeur past de rijtijd automatisch aan op uw actuele aankomst.",
  },
  {
    icon: Clock,
    title: "Vroege ochtendritten",
    desc: "Vroeg vlucht? Geen probleem. Wij zijn ook 's nachts en vroeg in de ochtend beschikbaar.",
  },
  {
    icon: BadgeEuro,
    title: "Vaste prijs vooraf",
    desc: "Geen taxameter. U ziet de prijs vóór betaling. Geen verrassingen.",
  },
  {
    icon: ShieldCheck,
    title: "Veilig online betalen",
    desc: "Betaal veilig via iDEAL of creditcard. Uw rit is direct bevestigd na betaling.",
  },
]

export default function LuchthavenvervoerPage() {
  return (
    <MarketingPageLayout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
          Luchthavenvervoer
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Luchthavenvervoer vanuit Almere
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#B7AEA2]">
          Ritten naar Schiphol, Rotterdam Airport en Eindhoven Airport, met focus op vroege
          vertrektijden, bagagegemak en betrouwbare planning.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#B7AEA2]">
          Boek vooraf, betaal online en reis zonder stress naar de luchthaven.
        </p>
      </section>

      {/*
        PHOTO READY — airport transfer / vehicle-at-airport shot
        Swap in: <Image src="..." alt="..." fill className="object-cover" />
        inside the slot div, then remove the placeholder icon block.
        Keep the gradient overlay and caption.
      */}
      <div className="mx-auto max-w-6xl px-6 pb-4">
        <div className="group relative aspect-[21/9] overflow-hidden rounded-2xl border border-[#292520] bg-[#151311]">
          {/* ↓ Remove when adding real photo */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
            <Car className="size-9 text-[#292520]" />
            <span className="rounded-full border border-[#292520] px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-[#292520]">
              Luchthavenrit foto
            </span>
          </div>
          {/* ↑ Remove when adding real photo */}

          {/* Keep this overlay when using a real photo */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-6 py-5">
            <p className="text-base font-semibold text-[#F5F1E8]">Vanuit Almere naar de luchthaven</p>
            <p className="text-xs text-[#7F776E]">Ruimte voor bagage, op tijd voor elke vlucht</p>
          </div>
        </div>
      </div>

      <BookingBlock
        title="Bereken direct uw luchthavenrit"
        subtitle="Bekijk uw prijs op basis van route en reistijd en reserveer direct online."
      />

      {/* Airport cards */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
          Beschikbare luchthavens
        </p>
        <h2 className="mb-8 text-2xl font-bold tracking-tight text-[#F5F1E8]">
          Wij rijden naar alle grote luchthavens
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {airports.map((airport) => (
            <article
              key={airport.name}
              className="flex flex-col rounded-2xl border border-[#292520] bg-[#151311] p-6"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#D6B58A]/[0.08]">
                <Plane className="size-5 text-[#D6B58A]" />
              </div>
              <h2 className="text-base font-semibold text-[#F5F1E8]">{airport.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#B7AEA2]">{airport.desc}</p>
              <Link
                href={airport.href}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#D6B58A]/70 transition-colors hover:text-[#D6B58A]"
              >
                {airport.cta} →
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-6 text-sm text-[#B7AEA2]">
          Specifiek naar Schiphol? Bekijk ook onze pagina{" "}
          <Link
            className="text-[#D6B58A] transition-colors hover:text-[#E4C69E]"
            href="/taxi-almere-schiphol"
          >
            Taxi Almere naar Schiphol
          </Link>
          .
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-[#1F1C18] bg-[#0D0C0B] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
            Onze service
          </p>
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-[#F5F1E8]">
            Meer dan alleen een rit
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[#292520] bg-[#151311] p-5"
              >
                <div className="mb-3 inline-flex size-9 items-center justify-center rounded-xl bg-[#D6B58A]/[0.08]">
                  <f.icon className="size-4 text-[#D6B58A]" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-[#F5F1E8]">{f.title}</h3>
                <p className="text-xs leading-relaxed text-[#7F776E]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  )
}
