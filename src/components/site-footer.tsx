import Image from "next/image"
import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-[#1F1C18] bg-[#080807]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            {/* Footer brand: icon always, wordmark on md+ */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/icon.svg"
                alt="Almere Taxi Boeken"
                width={28}
                height={28}
                className="h-7 w-7 shrink-0"
                style={{ width: "28px", height: "28px" }}
                unoptimized
              />
              {/* Wordmark: 1898×829, at h-[36px] → w ≈ 82px */}
              <Image
                src="/wordmark.svg"
                alt=""
                aria-hidden="true"
                width={82}
                height={36}
                className="hidden object-contain sm:block"
                style={{ width: "auto", height: "36px" }}
                unoptimized
              />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[#B7AEA2]">
              Betrouwbaar taxivervoer in Almere voor luchthavenritten, zakelijke ritten en
              particulier vervoer.
            </p>
            <p className="mt-3 text-xs text-[#7F776E]">
              Vaste tarieven • Online of contant betalen • Almere en omgeving
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
