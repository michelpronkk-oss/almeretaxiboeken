import type { Metadata } from "next"
import { BookingBlock } from "@/components/booking-block"
import { MarketingPageLayout } from "@/components/marketing-page-layout"

export const metadata: Metadata = {
  title: "Contact | AlmereTaxiBoeken",
  description:
    "Neem contact op met AlmereTaxiBoeken voor taxi, taxibus, luchthavenvervoer en zakelijke ritten in Almere.",
}

export default function ContactPage() {
  return (
    <MarketingPageLayout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">Contact</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Contact AlmereTaxiBoeken</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
            <h2 className="text-sm font-semibold">Bel direct</h2>
            <a className="mt-2 block text-sm text-[#D6B58A] hover:text-[#E4C69E]" href="tel:+31853038136">085 303 8136</a>
          </article>
          <article className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
            <h2 className="text-sm font-semibold">WhatsApp</h2>
            <a className="mt-2 block text-sm text-[#D6B58A] hover:text-[#E4C69E]" href="https://wa.me/31853038136">085 303 8136</a>
          </article>
          <article className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
            <h2 className="text-sm font-semibold">Werkgebied</h2>
            <p className="mt-2 text-sm text-[#B7AEA2]">Almere en omgeving</p>
          </article>
          <article className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
            <h2 className="text-sm font-semibold">Beschikbaar</h2>
            <p className="mt-2 text-sm text-[#B7AEA2]">24/7 op aanvraag</p>
          </article>
        </div>

        <p className="mt-6 text-sm text-[#B7AEA2]">
          Voor een definitieve reservering gebruikt u de ritmodule en kiest u uw betaalmethode: online of contant bij de chauffeur.
        </p>
      </section>

      <BookingBlock title="Reserveer direct uw rit" subtitle="Voor de snelste afhandeling gebruikt u onze ritmodule met directe prijsberekening." />
    </MarketingPageLayout>
  )
}
