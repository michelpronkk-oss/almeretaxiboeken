import type { Metadata } from "next"
import { MarketingPageLayout } from "@/components/marketing-page-layout"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacybeleid | AlmereTaxiBoeken",
  description:
    "Lees hoe AlmereTaxiBoeken omgaat met persoonsgegevens, boekingsgegevens, online betalingen en websitegebruik.",
}

const sections: Array<{
  title: string
  paragraphs?: string[]
  bullets?: string[]
}> = [
  {
    title: "1. Wie zijn wij",
    paragraphs: [
      "AlmereTaxiBoeken biedt taxivervoer in Almere en omgeving, waaronder luchthavenvervoer, zakelijk vervoer en particulier vervoer.",
      "Voor contact verwijzen wij naar de contactpagina en de contactgegevens in de footer van deze website.",
    ],
  },
  {
    title: "2. Welke gegevens wij verwerken",
    bullets: [
      "Naam",
      "E-mailadres",
      "Telefoonnummer",
      "Ophaaladres",
      "Bestemmingsadres",
      "Datum en tijd van de rit",
      "Aantal passagiers en voertuigkeuze",
      "Eventuele opmerkingen bij de boeking",
      "Betalingsstatus en betalingsreferentie",
      "Technische gegevens zoals IP-adres, apparaat-/browsergegevens en websitegebruik (indien analytics actief is)",
    ],
  },
  {
    title: "3. Waarom wij gegevens verwerken",
    bullets: [
      "Ritprijs berekenen",
      "Boeking verwerken",
      "Betaling controleren",
      "Rit bevestigen",
      "Contact opnemen over de rit",
      "Klantenservice bieden",
      "Website verbeteren",
      "Misbruik en fraude voorkomen",
      "Voldoen aan administratieve verplichtingen",
    ],
  },
  {
    title: "4. Online betalingen via Mollie",
    paragraphs: [
      "Online betalingen worden verwerkt via Mollie. AlmereTaxiBoeken slaat geen volledige betaalkaart- of bankgegevens op.",
      "Mollie verwerkt betaalinformatie volgens het eigen privacy- en beveiligingsbeleid.",
      "Wij kunnen wel betaalreferentie, betaalstatus en bedrag opslaan om te verifiëren of een boeking is betaald.",
    ],
  },
  {
    title: "5. Google Maps, routeberekening en adres-autocomplete",
    paragraphs: [
      "De website gebruikt Google Maps/Places/Routes om adressen in te vullen en afstand/reistijd te berekenen.",
      "Google kan hiervoor technische verzoekgegevens verwerken volgens de eigen voorwaarden en privacyregels.",
    ],
  },
  {
    title: "6. Analytics en tracking",
    paragraphs: [
      "Als analytics- of advertentietracking actief is, kunnen gegevens worden gebruikt om websitegebruik te begrijpen en conversies te meten.",
      "Waar van toepassing kunnen bezoekers cookie- en trackinginstellingen beheren via browserinstellingen of cookievoorkeuren.",
    ],
  },
  {
    title: "7. Met wie wij gegevens delen",
    bullets: [
      "Betaalprovider Mollie",
      "E-mailprovider voor bevestigingen (indien gebruikt)",
      "Google-diensten voor maps/routing/analytics",
      "Hosting- en technische serviceproviders",
      "Bevoegde autoriteiten als dit wettelijk verplicht is",
    ],
    paragraphs: ["Wij verkopen geen persoonsgegevens."],
  },
  {
    title: "8. Hoe lang wij gegevens bewaren",
    paragraphs: [
      "Wij bewaren persoonsgegevens niet langer dan nodig is voor het doel waarvoor ze zijn verzameld, waaronder klantenservice, administratie, betaalverificatie en wettelijke verplichtingen.",
    ],
  },
  {
    title: "9. Beveiliging",
    paragraphs: [
      "Wij nemen redelijke technische en organisatorische maatregelen om persoonsgegevens te beschermen tegen verlies, misbruik en onbevoegde toegang.",
    ],
  },
  {
    title: "10. Rechten van gebruikers",
    bullets: [
      "Recht op inzage",
      "Recht op correctie",
      "Recht op verwijdering",
      "Recht op beperking van verwerking",
      "Recht op bezwaar",
      "Recht op dataportabiliteit (waar van toepassing)",
      "Recht om toestemming in te trekken (waar van toepassing)",
    ],
    paragraphs: [
      "Voor privacyverzoeken kunt u contact opnemen met AlmereTaxiBoeken via de contactgegevens hieronder.",
    ],
  },
  {
    title: "11. Contact over privacy",
    paragraphs: [
      "Voor vragen over dit privacybeleid of verzoeken rond uw persoonsgegevens kunt u mailen naar info@almeretaxiboeken.nl of contact opnemen via de contactpagina.",
    ],
  },
  {
    title: "12. Wijzigingen in dit privacybeleid",
    paragraphs: [
      "Dit privacybeleid kan worden aangepast. De meest recente versie staat altijd op deze pagina.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <MarketingPageLayout>
      <section className="mx-auto max-w-5xl px-6 py-14 sm:py-16">
        <div className="rounded-2xl border border-[#292520] bg-[#151311] p-6 sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
            Privacybeleid
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#F5F1E8] sm:text-5xl">
            Privacybeleid
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#B7AEA2]">
            AlmereTaxiBoeken verwerkt persoonsgegevens zorgvuldig wanneer u de website gebruikt,
            een ritprijs berekent, een rit boekt, contact opneemt of online betaalt.
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
          Voor algemene vragen kunt u ook terecht op <Link className="text-[#D6B58A] hover:text-[#E4C69E]" href="/contact">/contact</Link>.
        </p>
      </section>
    </MarketingPageLayout>
  )
}
