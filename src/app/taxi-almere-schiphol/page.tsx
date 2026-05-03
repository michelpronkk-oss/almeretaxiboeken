import type { Metadata } from "next"
import Link from "next/link"
import { BookingBlock } from "@/components/booking-block"
import { MarketingPageLayout } from "@/components/marketing-page-layout"

export const metadata: Metadata = {
  title: "Taxi Almere naar Schiphol | Direct prijs berekenen",
  description:
    "Boek uw taxi van Almere naar Schiphol. Bereken direct uw ritprijs, kies online of contant betalen en reserveer betrouwbaar luchthavenvervoer.",
}

const faq = [
  ["Is dit ook geschikt voor zakelijke reizigers?", "Ja, zowel particuliere als zakelijke reizigers boeken hier direct hun rit."],
  ["Kan ik online of contant betalen?", "Beide opties zijn beschikbaar. U kiest uw betaalmethode na de prijsberekening. Bij online betaling is uw rit direct bevestigd."],
  ["Is de prijs vooraf duidelijk?", "Ja, u ontvangt direct een duidelijke prijs op basis van route en tijd."],
]

export default function TaxiAlmereSchipholPage() {
  return (
    <MarketingPageLayout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">Schiphol service</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Taxi Almere naar Schiphol</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#B7AEA2]">
          Betrouwbare airport pick-ups vanuit Almere met ruimte voor bagage, vroege ochtendritten en
          duidelijke planning. Ideaal voor vakantie en zakelijke reizen.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#B7AEA2]">
          U boekt vooraf, kiest uw betaalmethode en vertrekt met rust. De prijs is vooraf zichtbaar en geschikt voor
          particuliere en zakelijke reizigers.
        </p>
      </section>

      <BookingBlock title="Bereken direct uw rit Almere - Schiphol" subtitle="Duidelijke vaste prijs, keuze uit online of contant betalen, direct uw reservering rond." />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[#292520] bg-[#151311] p-6">
            <h2 className="text-lg font-semibold">Waarom vooraf boeken</h2>
            <p className="mt-3 text-sm text-[#B7AEA2]">Vooraf boeken geeft zekerheid voor vertrektijd, voertuig en prijs.</p>
          </article>
          <article className="rounded-2xl border border-[#292520] bg-[#151311] p-6">
            <h2 className="text-lg font-semibold">Hoe werkt het</h2>
            <p className="mt-3 text-sm text-[#B7AEA2]">Route invullen, ritprijs bekijken, betaalmethode kiezen en uw rit is geregeld.</p>
          </article>
          <article className="rounded-2xl border border-[#292520] bg-[#151311] p-6">
            <h2 className="text-lg font-semibold">Zakelijk naar Schiphol</h2>
            <p className="mt-3 text-sm text-[#B7AEA2]">Representatieve ritten voor meetings, klanten en internationale vluchten.</p>
          </article>
        </div>

        <Link href="/#contact" className="mt-7 inline-flex rounded-lg border border-[#3A2D1F] px-5 py-2.5 text-sm font-semibold text-[#D6B58A] transition-colors hover:bg-[#1B1815]">
          Bereken uw ritprijs
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-2xl font-semibold">Veelgestelde vragen</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {faq.map(([q, a]) => (
            <article key={q} className="rounded-xl border border-[#292520] bg-[#151311] p-4">
              <h3 className="text-sm font-semibold">{q}</h3>
              <p className="mt-2 text-sm text-[#B7AEA2]">{a}</p>
            </article>
          ))}
        </div>

        <Link
          href="/#contact"
          className="mt-8 inline-flex rounded-lg border border-[#3A2D1F] px-5 py-2.5 text-sm font-semibold text-[#D6B58A] transition-colors hover:bg-[#1B1815]"
        >
          Plan nu uw Schiphol-rit
        </Link>
      </section>

      {/* Trust block */}
      <section className="border-t border-[#1F1C18] bg-[#0D0C0B] py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
              <p className="text-lg font-bold text-[#F5F1E8]">Vlucht gevolgd</p>
              <p className="mt-1 text-xs text-[#7F776E]">
                Vertraagd? Uw chauffeur wacht, zonder extra kosten.
              </p>
            </div>
            <div className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
              <p className="text-lg font-bold text-[#F5F1E8]">Vaste prijs vooraf</p>
              <p className="mt-1 text-xs text-[#7F776E]">
                Geen taxameter. U betaalt wat u zag vóór de rit.
              </p>
            </div>
            <div className="rounded-2xl border border-[#292520] bg-[#151311] p-5">
              <p className="text-lg font-bold text-[#F5F1E8]">Snel geregeld</p>
              <p className="mt-1 text-xs text-[#7F776E]">
                Na betaling of aanvraag ontvangt u direct de ritgegevens per e-mail.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  )
}
