import type { Metadata } from "next"
import { BookingBlock } from "@/components/booking-block"
import { MarketingPageLayout } from "@/components/marketing-page-layout"
import { BadgeEuro, Car, MapPin, MessageCircle, ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Particulier taxivervoer Almere | Snel en comfortabel",
  description:
    "Taxi nodig in Almere voor station, ziekenhuis, bezoek of avondrit? Bereken uw prijs en reserveer direct online.",
}

const useCases = [
  { label: "Station Almere Centrum" },
  { label: "Ziekenhuis of medische afspraak" },
  { label: "Avond Amsterdam of Utrecht" },
  { label: "Familiebezoek of feestje" },
  { label: "Schiphol of luchthaven" },
  { label: "Kortere ritten in de regio" },
]

const features = [
  {
    icon: BadgeEuro,
    title: "Vaste prijs vooraf",
    desc: "Geen taxameter. U ziet de prijs vóór betaling. Geen verrassingen achteraf.",
  },
  {
    icon: ShieldCheck,
    title: "Veilig online betalen",
    desc: "iDEAL of creditcard. Na betaling ontvangt u direct uw bevestiging per e-mail.",
  },
  {
    icon: Car,
    title: "Taxi of taxibus",
    desc: "Rijdt u alleen of met een groepje? Kies de juiste optie voor uw rit.",
  },
  {
    icon: MapPin,
    title: "Lokaal en regionaal",
    desc: "Van korte ritten in Almere tot comfortabele ritten naar Amsterdam, Utrecht of verder.",
  },
]

export default function ParticulierVervoerPage() {
  return (
    <MarketingPageLayout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
          Particulier vervoer
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Particulier taxivervoer in Almere
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#B7AEA2]">
          Voor station, ziekenhuis, familiebezoek, avondrit, restaurantbezoek of een rit naar de
          stad. Snel geregeld en comfortabel uitgevoerd.
        </p>
      </section>

      <BookingBlock
        title="Bereken uw ritprijs"
        subtitle="Bekijk direct uw prijs en reserveer veilig online wanneer het u uitkomt."
      />

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
          Onze voordelen
        </p>
        <h2 className="mb-8 text-2xl font-bold tracking-tight text-[#F5F1E8]">
          Comfortabel en zonder zorgen
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-[#292520] bg-[#151311] p-5 transition-colors hover:border-[#D6B58A]/20 hover:bg-[#1B1815]"
            >
              <div className="mb-3 inline-flex size-9 items-center justify-center rounded-xl bg-[#D6B58A]/[0.08] transition-colors group-hover:bg-[#D6B58A]/[0.13]">
                <f.icon className="size-4 text-[#D6B58A]" />
              </div>
              <h3 className="mb-1.5 text-sm font-semibold text-[#F5F1E8]">{f.title}</h3>
              <p className="text-xs leading-relaxed text-[#7F776E]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases + WhatsApp */}
      <section className="border-t border-[#1F1C18] bg-[#0D0C0B] py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">
                Populaire ritten
              </p>
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-[#F5F1E8]">
                Waarheen rijden we?
              </h2>
              <div className="flex flex-wrap gap-2">
                {useCases.map((u) => (
                  <span
                    key={u.label}
                    className="rounded-full border border-[#292520] bg-[#151311] px-4 py-2 text-sm text-[#B7AEA2]"
                  >
                    {u.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center gap-3 rounded-2xl border border-[#292520] bg-[#151311] p-6 lg:min-w-[260px]">
              <p className="text-sm font-semibold text-[#F5F1E8]">Liever direct contact?</p>
              <p className="text-xs leading-relaxed text-[#7F776E]">
                Stuur ons een WhatsApp-bericht en wij helpen u snel op weg.
              </p>
              <a
                href="https://wa.me/31853038136"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[#25D366]/20 px-4 py-2.5 text-sm font-medium text-[#25D366]/80 transition-colors hover:bg-[#25D366]/[0.07] hover:text-[#25D366]"
              >
                <MessageCircle className="size-4" />
                WhatsApp support
              </a>
            </div>
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  )
}
