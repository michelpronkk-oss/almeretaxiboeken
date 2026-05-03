import { BookingWidget } from "@/components/booking-widget"

interface BookingBlockProps {
  title?: string
  subtitle?: string
}

export function BookingBlock({
  title = "Bereken direct uw ritprijs",
  subtitle = "Vul uw ritgegevens in, bekijk direct uw prijs en kies uw betaalmethode.",
}: BookingBlockProps) {
  return (
    <section className="border-y border-[#1F1C18] bg-[#0D0C0B] py-14">
      <div className="mx-auto grid max-w-6xl items-start gap-8 px-6 lg:grid-cols-[1fr_0.95fr]">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B58A]">Ritmodule</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#F5F1E8] sm:text-4xl">{title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#B7AEA2]">{subtitle}</p>
        </div>
        <BookingWidget />
      </div>
    </section>
  )
}
