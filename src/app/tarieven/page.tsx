import type { Metadata } from "next"
import { MarketingPageLayout } from "@/components/marketing-page-layout"
import { BookingBlock } from "@/components/booking-block"

export const metadata: Metadata = {
  title: "Taxi Tarieven Almere | Bereken uw ritprijs",
  description:
    "Bereken direct uw ritprijs op basis van afstand, reistijd en voertuigtype. Vaste tarieven voor bekende routes zoals Schiphol. Taxi en taxibus in Almere en omgeving.",
}

const faqs = [
  {
    q: "Hoe wordt mijn ritprijs berekend?",
    a: "Op basis van afstand, reistijd en gekozen voertuigtype. Voor bekende routes zoals Schiphol worden vaste tarieven toegepast die u vooraf ziet.",
  },
  {
    q: "Wanneer is mijn rit definitief?",
    a: "Uw reservering is definitief zodra de online betaling succesvol is afgerond. U kunt ook kiezen voor contante betaling bij de chauffeur.",
  },
  {
    q: "Zijn dit vaste prijzen?",
    a: "U krijgt altijd een duidelijke prijsopgave vóór betaling. Eventuele vaste routeprijzen worden direct weergegeven.",
  },
]

export default function TarievenPage() {
  return (
    <MarketingPageLayout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-20 sm:pb-14 sm:pt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D6B58A]">
          Tarieven
        </p>

        <h1 className="mt-3 max-w-[760px] text-[2.5rem] font-bold leading-[1.12] tracking-tight text-[#F5F1E8] sm:text-5xl lg:text-[3.25rem]">
          Duidelijke tarieven.{" "}
          <span className="text-[#D6B58A]">Geen verrassingen.</span>
        </h1>

        <p className="mt-5 max-w-[680px] text-[15px] leading-relaxed text-[#B7AEA2] sm:text-base">
          Bereken direct uw ritprijs op basis van afstand, reistijd en
          voertuigtype. Voor bekende routes zoals Schiphol kunnen vaste tarieven
          worden toegepast.
        </p>

        <p className="mt-4 text-xs text-[#7F776E]">
          Online betalen of contant bij de chauffeur&nbsp;·&nbsp;Taxi en
          taxibus&nbsp;·&nbsp;Almere en omgeving
        </p>
      </section>

      {/* ── Booking / price calculator ───────────────────────────────────── */}
      <BookingBlock
        title="Bereken direct uw ritprijs"
        subtitle="Voer uw route in en bekijk direct uw prijs. Na betaling is uw rit definitief gereserveerd."
      />

      {/* ── Rate cards ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[#292520] bg-[#151311] p-6">
            <h2 className="text-base font-semibold text-[#F5F1E8]">
              Personenauto
            </h2>
            <p className="mt-1 text-xs text-[#7F776E]">1 – 4 personen</p>
            <ul className="mt-4 space-y-1.5 text-sm text-[#B7AEA2]">
              <li className="flex justify-between">
                <span>Starttarief</span>
                <span className="text-[#F5F1E8]">€ 4,31</span>
              </li>
              <li className="flex justify-between">
                <span>Per km</span>
                <span className="text-[#F5F1E8]">€ 3,17</span>
              </li>
              <li className="flex justify-between">
                <span>Per minuut</span>
                <span className="text-[#F5F1E8]">€ 0,52</span>
              </li>
            </ul>
          </article>

          <article className="rounded-2xl border border-[#292520] bg-[#151311] p-6">
            <h2 className="text-base font-semibold text-[#F5F1E8]">
              Taxibus
            </h2>
            <p className="mt-1 text-xs text-[#7F776E]">5 – 8 personen</p>
            <ul className="mt-4 space-y-1.5 text-sm text-[#B7AEA2]">
              <li className="flex justify-between">
                <span>Starttarief</span>
                <span className="text-[#F5F1E8]">€ 8,77</span>
              </li>
              <li className="flex justify-between">
                <span>Per km</span>
                <span className="text-[#F5F1E8]">€ 4,00</span>
              </li>
              <li className="flex justify-between">
                <span>Per minuut</span>
                <span className="text-[#F5F1E8]">€ 0,59</span>
              </li>
            </ul>
          </article>

          <article className="rounded-2xl border border-[#292520] bg-[#151311] p-6">
            <h2 className="text-base font-semibold text-[#F5F1E8]">
              Vaste routes
            </h2>
            <p className="mt-1 text-xs text-[#7F776E]">Schiphol en omgeving</p>
            <p className="mt-4 text-sm leading-relaxed text-[#B7AEA2]">
              Voor bekende routes zoals Almere–Schiphol gelden vaste prijzen die
              direct worden weergegeven bij het berekenen.
            </p>
          </article>
        </div>

        <p className="mt-5 rounded-xl border border-[#292520] bg-[#151311] px-5 py-4 text-xs leading-relaxed text-[#7F776E]">
          De berekening gebruikt afstand, reistijd en voertuigtype. Eventuele
          vaste routeprijzen worden vooraf weergegeven. De prijsopbouw sluit aan
          op de officiële taxitariefstructuur; vaste routeprijzen en handmatige
          afspraken kunnen afwijken maar worden altijd vooraf getoond.
        </p>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl">
          Veelgestelde vragen over prijzen
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {faqs.map((item) => (
            <article
              key={item.q}
              className="rounded-xl border border-[#292520] bg-[#151311] p-5"
            >
              <h3 className="text-sm font-semibold text-[#F5F1E8]">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#B7AEA2]">
                {item.a}
              </p>
            </article>
          ))}
        </div>
      </section>
    </MarketingPageLayout>
  )
}
