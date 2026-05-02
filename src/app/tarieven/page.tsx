import type { Metadata } from "next"
import { MarketingPageLayout } from "@/components/marketing-page-layout"
import { BookingBlock } from "@/components/booking-block"

export const metadata: Metadata = {
  title: "Taxi Tarieven Almere | Bereken uw ritprijs",
  description:
    "Bekijk taxi tarieven voor Almere en bereken direct uw ritprijs op basis van afstand, reistijd en voertuigtype.",
}

const faqs = [
  {
    q: "Hoe wordt mijn ritprijs berekend?",
    a: "Op basis van afstand, reistijd en gekozen voertuigtype (taxi of taxibus).",
  },
  {
    q: "Wanneer is mijn rit definitief?",
    a: "Uw reservering is definitief zodra de online betaling succesvol is afgerond.",
  },
  {
    q: "Zijn dit vaste prijzen?",
    a: "Ja, u krijgt vooraf een duidelijke prijsinschatting voordat u betaalt.",
  },
]

export default function TarievenPage() {
  return (
    <MarketingPageLayout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">Tarieven</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Bekijk onze taxitarieven</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#B7AEA2]">
          Onze prijsopbouw sluit aan op de maximumtarieven volgens Rijksoverheid. Bereken direct
          uw ritprijs met de module hieronder.
        </p>
      </section>

      <BookingBlock
        title="Bereken direct uw ritprijs"
        subtitle="Voer uw route in en bekijk direct uw prijs. Na betaling is uw rit definitief gereserveerd."
      />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[#292520] bg-[#151311] p-6">
            <h2 className="text-lg font-semibold">Personenauto (1-4 personen)</h2>
            <p className="mt-3 text-sm text-[#B7AEA2]">Starttarief €4,31</p>
            <p className="text-sm text-[#B7AEA2]">Per km €3,17</p>
            <p className="text-sm text-[#B7AEA2]">Per minuut €0,52</p>
          </article>
          <article className="rounded-2xl border border-[#292520] bg-[#151311] p-6">
            <h2 className="text-lg font-semibold">Taxibus (5-8 personen)</h2>
            <p className="mt-3 text-sm text-[#B7AEA2]">Starttarief €8,77</p>
            <p className="text-sm text-[#B7AEA2]">Per km €4,00</p>
            <p className="text-sm text-[#B7AEA2]">Per minuut €0,59</p>
          </article>
          <article className="rounded-2xl border border-[#292520] bg-[#151311] p-6">
            <h2 className="text-lg font-semibold">Wachttarief</h2>
            <p className="mt-3 text-sm text-[#B7AEA2]">€59,41 per uur (indien toegepast)</p>
          </article>
        </div>

        <p className="mt-6 rounded-xl border border-[#292520] bg-[#151311] p-4 text-sm text-[#B7AEA2]">
          De getoonde prijs is gebaseerd op afstand en reistijd. Bij betaling wordt uw rit definitief gereserveerd.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-2xl font-semibold">Veelgestelde vragen over prijzen</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {faqs.map((item) => (
            <article key={item.q} className="rounded-xl border border-[#292520] bg-[#151311] p-4">
              <h3 className="text-sm font-semibold">{item.q}</h3>
              <p className="mt-2 text-sm text-[#B7AEA2]">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </MarketingPageLayout>
  )
}
