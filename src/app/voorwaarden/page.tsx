import type { Metadata } from "next"
import { MarketingPageLayout } from "@/components/marketing-page-layout"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Voorwaarden | AlmereTaxiBoeken",
  description:
    "Bekijk de voorwaarden voor online taxireserveringen, tariefberekening, betaling en wijzigingen bij AlmereTaxiBoeken.",
}

const sections: Array<{
  title: string
  paragraphs?: string[]
  bullets?: string[]
}> = [
  {
    title: "1. Algemeen",
    paragraphs: [
      "AlmereTaxiBoeken biedt taxivervoer in Almere en omgeving.",
      "Door gebruik te maken van deze website of een boeking te plaatsen, gaat u akkoord met deze voorwaarden.",
    ],
  },
  {
    title: "2. Boeking en reservering",
    bullets: [
      "Een boeking wordt geplaatst met ophaaladres, bestemmingsadres, datum/tijd en contactgegevens.",
      "De klant is verantwoordelijk voor het correct invullen van gegevens.",
      "Bij online betaling is een boeking bevestigd na succesvolle betaling. Bij contant betalen is de rit aangevraagd en worden de ritgegevens per e-mail verstuurd.",
      "Na betaling ontvangt de klant bevestiging of boekingsgegevens.",
    ],
  },
  {
    title: "3. Ritprijs en tariefberekening",
    bullets: [
      "De ritmodule berekent een prijs op basis van ophaaladres, bestemming, afstand, geschatte reistijd en voertuigkeuze.",
      "Tarieven zijn gebaseerd op de zichtbare tariefstructuur op de website.",
      "Route- en tijdinschattingen kunnen verschillen door verkeer, omleidingen, wachttijd of onjuiste adresgegevens.",
      "Bij wijziging van ophaaladres, bestemming, tijd of passagiersaantal kan de prijs wijzigen.",
    ],
  },
  {
    title: "4. Betaling",
    bullets: [
      "Online betalingen worden verwerkt via Mollie (iDEAL, creditcard en andere methoden).",
      "Betaling kan ook contant bij de chauffeur plaatsvinden, indien gekozen bij de boeking.",
      "Bij online betaling is de rit definitief gereserveerd na succesvolle betaling.",
      "Bij contant betalen is de rit aangevraagd en betaalt de klant het ritbedrag aan de chauffeur.",
      "Bij mislukte of geannuleerde online betaling kan de boeking niet worden bevestigd.",
    ],
  },
  {
    title: "5. Wijzigen of annuleren",
    paragraphs: [
      "Neem bij wijzigingen of annuleringen zo snel mogelijk contact op via telefoon, WhatsApp of e-mail.",
    ],
    bullets: [
      "Wijzigingen zijn afhankelijk van beschikbaarheid.",
      "Afhandeling van annulering of terugbetaling hangt af van timing, route en eventueel al gemaakte kosten.",
    ],
  },
  {
    title: "6. Ophaaltijd en wachttijd",
    bullets: [
      "De klant dient op het afgesproken tijdstip klaar te staan.",
      "Vertraging door onjuiste gegevens, te laat aanwezig zijn of extra wachttijd kan de planning en/of kosten beïnvloeden.",
      "Bij luchthaven- en stationritten dient de klant zelf voldoende tijdsmarge in te plannen.",
    ],
  },
  {
    title: "7. Luchthavenvervoer",
    bullets: [
      "De klant is verantwoordelijk voor juiste datum/tijd en terminal-/vluchtinformatie (indien van toepassing).",
      "Vertragingen of wijzigingen in vluchtschema's moeten zo snel mogelijk worden doorgegeven.",
      "AlmereTaxiBoeken plant ritten zorgvuldig, maar heeft geen invloed op verkeer, wegafsluitingen, luchthavenvertragingen of overmacht.",
    ],
  },
  {
    title: "8. Zakelijk vervoer",
    bullets: [
      "Zakelijke klanten kunnen regelmatig vervoer of maatwerkafspraken aanvragen.",
      "Voor terugkerend zakelijk vervoer kunnen aanvullende afspraken gelden.",
      "Deze online voorwaarden blijven van toepassing, tenzij schriftelijk anders overeengekomen.",
    ],
  },
  {
    title: "9. Gedrag en veiligheid",
    bullets: [
      "De chauffeur kan vervoer weigeren bij onveilige, agressieve of illegale situaties.",
      "Passagiers volgen redelijke veiligheidsinstructies van de chauffeur op.",
      "Schade of extra schoonmaakkosten veroorzaakt door passagiers kunnen worden doorbelast.",
    ],
  },
  {
    title: "10. Aansprakelijkheid",
    paragraphs: [
      "AlmereTaxiBoeken streeft naar betrouwbaar vervoer.",
      "Aansprakelijkheid is beperkt tot wat wettelijk verplicht is.",
      "Wij zijn niet aansprakelijk voor vertragingen of schade door verkeer, weer, onjuiste klantgegevens, overmacht of storingen bij derden, behalve waar de wet anders bepaalt.",
    ],
  },
  {
    title: "11. Website en beschikbaarheid",
    bullets: [
      "De website en ritcalculator worden met zorg aangeboden.",
      "Tijdelijke storingen of onderhoud kunnen voorkomen.",
      "Als online boeken niet lukt, kunt u contact opnemen via telefoon of WhatsApp.",
    ],
  },
  {
    title: "12. Contact",
    paragraphs: [
      "Voor vragen over deze voorwaarden of uw boeking: info@almeretaxiboeken.nl of via de contactpagina.",
      "Telefonisch en via WhatsApp zijn wij bereikbaar via de nummers die op de website staan.",
    ],
  },
  {
    title: "13. Wijzigingen in voorwaarden",
    paragraphs: [
      "Deze voorwaarden kunnen worden aangepast. De meest recente versie staat op deze pagina.",
    ],
  },
]

export default function VoorwaardenPage() {
  return (
    <MarketingPageLayout>
      <section className="mx-auto max-w-5xl px-6 py-14 sm:py-16">
        <div className="rounded-2xl border border-[#292520] bg-[#151311] p-6 sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
            Voorwaarden
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#F5F1E8] sm:text-5xl">
            Voorwaarden
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#B7AEA2]">
            Deze voorwaarden gelden voor het gebruik van de website, het berekenen van ritprijzen,
            het boeken van ritten en de betaalwijzen bij AlmereTaxiBoeken.
          </p>
          <p className="mt-3 text-xs text-[#7F776E]">Laatst bijgewerkt: 2026</p>
        </div>

        <div className="mt-6 space-y-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-[#292520] bg-[#151311] p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-[#F5F1E8]">{section.title}</h2>

              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-relaxed text-[#B7AEA2]">
                  {paragraph}
                </p>
              ))}

              {section.bullets ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#B7AEA2]">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>

        <p className="mt-6 text-sm text-[#B7AEA2]">
          Bekijk ook onze <Link className="text-[#D6B58A] hover:text-[#E4C69E]" href="/privacy">privacyverklaring</Link> voor informatie over gegevensverwerking.
        </p>
      </section>
    </MarketingPageLayout>
  )
}
