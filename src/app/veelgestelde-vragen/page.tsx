import type { Metadata } from "next"
import Link from "next/link"
import { MarketingPageLayout } from "@/components/marketing-page-layout"

export const metadata: Metadata = {
  title: "Veelgestelde vragen | AlmereTaxiBoeken",
  description:
    "Antwoorden over ritprijzen, betaalmethodes, contant betalen, luchthavenvervoer, taxibus en reserveringen bij AlmereTaxiBoeken.",
}

const faqs = [
  ["Hoe wordt de ritprijs berekend?", "Op basis van afstand, reistijd en gekozen voertuigtype. Voor bekende routes zoals Schiphol kunnen vaste tarieven worden toegepast."],
  ["Kan ik contant betalen?", "Ja. Na het berekenen van uw ritprijs kiest u online betalen of contant betalen bij de chauffeur. Bij contant betalen wordt de rit als aanvraag verwerkt en betaalt u het bedrag tijdens de rit."],
  ["Kan ik online betalen?", "Ja, online betaling verloopt veilig via Mollie met iDEAL, creditcard en andere gangbare betaalmethoden."],
  ["Wanneer is mijn rit bevestigd?", "Bij online betaling is uw rit bevestigd zodra de betaling is ontvangen. Bij contant betalen ontvangt u de ritgegevens per e-mail en is de rit ingepland."],
  ["Kan ik naar Schiphol boeken?", "Ja, wij rijden dagelijks vanuit Almere naar Schiphol. Voor deze route gelden vaste tarieven die u vooraf ziet."],
  ["Kan ik een taxibus boeken?", "Ja, voor 5 tot en met 8 personen kiest u de taxibus. De prijs wordt aangepast aan het voertuigtype."],
  ["Kan ik zakelijk vervoer aanvragen?", "Ja, wij verzorgen ook zakelijke ritten en vaste trajecten."],
  ["Kan ik mijn rit wijzigen?", "Wijzigingen verlopen via telefoon of WhatsApp. Neem zo snel mogelijk contact op."],
  ["Wat ontvang ik na mijn boeking?", "U ontvangt een bevestiging per e-mail met de ritgegevens. Bij online betaling is uw rit direct definitief."],
  ["Kan ik via WhatsApp contact opnemen?", "Ja, u kunt ons direct via WhatsApp bereiken voor vragen, wijzigingen of last-minute ritten."],
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
          <p className="mt-2 text-sm text-[#B7AEA2]">Bereken direct uw ritprijs en kies hoe u wilt betalen.</p>
          <Link href="/#contact" className="mt-4 inline-flex rounded-lg border border-[#3A2D1F] px-5 py-2.5 text-sm font-semibold text-[#D6B58A] transition-colors hover:bg-[#1B1815]">Rit reserveren</Link>
        </div>
      </section>
    </MarketingPageLayout>
  )
}
