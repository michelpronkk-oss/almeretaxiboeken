import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-6 sm:flex-row">
        <Link href="/" className="text-[15px] font-semibold text-white/55">
          AlmereTaxi<span className="text-[#D4B896]">Boeken</span>
        </Link>
        <p className="text-xs text-white/25">
          © 2026 AlmereTaxiBoeken. Alle rechten voorbehouden.
        </p>
        <div className="flex gap-6 text-xs text-white/25">
          <Link href="#" className="transition-colors hover:text-white/50">Privacy</Link>
          <Link href="#" className="transition-colors hover:text-white/50">Voorwaarden</Link>
        </div>
      </div>
    </footer>
  )
}
