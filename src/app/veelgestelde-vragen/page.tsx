import type { Metadata } from "next"
import Link from "next/link"
import { MarketingPageLayout } from "@/components/marketing-page-layout"

export const metadata: Metadata = {
  title: "Veelgestelde vragen | AlmereTaxiBoeken",
  description:
    "Antwoorden over ritprijzen, online betalen, luchthavenvervoer, taxibus en reserveringen bij AlmereTaxiBoeken.",
}

const faqs = [
  ["Hoe wordt de ritprijs berekend?", "Op basis van afstand, reistijd en gekozen voertuigtype."],
  ["Kan ik online betalen?", "Ja, betaling verloopt veilig via Mollie."],
  ["Kan ik naar Schiphol boeken?", "Ja, wij rijden dagelijks vanaf Almere naar Schiphol."],
  ["Kan ik een taxibus boeken?", "Ja, voor 5 t/m 8 personen kiest u taxibus."],
  ["Is de prijs direct definitief na betaling?", "Ja, na succesvolle betaling is uw reservering bevestigd."],
  ["Kan ik zakelijk vervoer aanvragen?", "Ja, wij verzorgen ook zakelijke ritten en vaste trajecten."],
  ["Kan ik mijn rit wijzigen?", "Wijzigingen verlopen via telefoon of WhatsApp."],
  ["Wat gebeurt er na betaling?", "U ontvangt een bevestiging per e-mail en wij plannen uw rit in."],
  ["Kan ik via WhatsApp contact opnemen?", "Ja, u kunt ons direct via WhatsApp bereiken."],
]

export default function VeelgesteldeVragenPage() {
  return (
    <MarketingPageLayout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">FAQ</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Veelgestelde vragen</h1>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {faqs.map(([q, a]) => (
            <article key={q} className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
              <h2 className="text-sm font-semibold text-[#F5F1E8]">{q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#B7AEA2]">{a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-2xl border border-[#292520] bg-[#151311] p-6">
          <h2 className="text-2xl font-semibold">Klaar om uw rit te reserveren?</h2>
          <p className="mt-2 text-sm text-[#B7AEA2]">Bereken direct uw ritprijs en reserveer online met veilige betaling.</p>
          <Link href="/#contact" className="mt-4 inline-flex rounded-lg border border-[#3A2D1F] px-5 py-2.5 text-sm font-semibold text-[#D6B58A] transition-colors hover:bg-[#1B1815]">Rit reserveren</Link>
        </div>
      </section>
    </MarketingPageLayout>
  )
}
