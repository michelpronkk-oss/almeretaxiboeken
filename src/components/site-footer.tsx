import Image from "next/image"
import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-[#1F1C18] bg-[#080807]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo-icon.png"
                alt=""
                width={32}
                height={32}
                aria-hidden="true"
                className="h-8 w-8 object-contain"
              />
              <Image
                src="/logo-wordmark.png"
                alt="Almere Taxi Boeken"
                width={260}
                height={52}
                className="h-[52px] w-auto object-contain"
                style={{ width: "auto" }}
              />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[#B7AEA2]">
              Betrouwbaar taxivervoer in Almere voor luchthavenritten, zakelijke ritten en
              particulier vervoer.
            </p>
            <p className="mt-3 text-xs text-[#7F776E]">
              Vaste tarieven • Veilig online betalen • Almere en omgeving
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#F5F1E8]">Diensten</h4>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[#B7AEA2]">
              <Link href="/luchthavenvervoer" className="transition-colors hover:text-[#D6B58A]">Luchthaven vervoer</Link>
              <Link href="/zakelijk-vervoer" className="transition-colors hover:text-[#D6B58A]">Zakelijk vervoer</Link>
              <Link href="/particulier-vervoer" className="transition-colors hover:text-[#D6B58A]">Particulier vervoer</Link>
              <Link href="/taxi-almere-schiphol" className="transition-colors hover:text-[#D6B58A]">Taxi naar Schiphol</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#F5F1E8]">Contact</h4>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[#B7AEA2]">
              <a href="tel:+31853038136" className="transition-colors hover:text-[#D6B58A]">Bel direct: 085 303 8136</a>
              <a href="https://wa.me/31853038136" className="transition-colors hover:text-[#25D366]">WhatsApp: 085 303 8136</a>
              <p>Almere en omgeving</p>
              <p>24/7 op aanvraag</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#F5F1E8]">Informatie</h4>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[#B7AEA2]">
              <Link href="/tarieven" className="transition-colors hover:text-[#D6B58A]">Tarieven</Link>
              <Link href="/veelgestelde-vragen" className="transition-colors hover:text-[#D6B58A]">Veelgestelde vragen</Link>
              <Link href="/privacy" className="transition-colors hover:text-[#D6B58A]">Privacy</Link>
              <Link href="/voorwaarden" className="transition-colors hover:text-[#D6B58A]">Voorwaarden</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-[#1F1C18] pt-5 text-xs text-[#7F776E] sm:flex-row sm:items-center">
          <p>© 2026 AlmereTaxiBoeken. Alle rechten voorbehouden.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="transition-colors hover:text-[#D6B58A]">Privacy</Link>
            <Link href="/voorwaarden" className="transition-colors hover:text-[#D6B58A]">Voorwaarden</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
