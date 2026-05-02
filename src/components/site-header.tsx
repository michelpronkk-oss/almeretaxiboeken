import { Button } from "@/components/ui/button"
import { Phone } from "lucide-react"
import Link from "next/link"

const PHONE = "+31361234567"

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.05] bg-[#0a0a0a]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-white">
          AlmereTaxi<span className="text-[#D4B896]">Boeken</span>
        </Link>

        <nav className="hidden gap-8 text-sm text-white/45 md:flex">
          <a href="/#diensten" className="transition-colors hover:text-white">Diensten</a>
          <a href="/#waarom-ons" className="transition-colors hover:text-white">Waarom ons</a>
          <Link href="/contact" className="transition-colors hover:text-white">Contact</Link>
        </nav>

        <Button
          asChild
          className="h-9 gap-2 border border-[#D4B896]/50 bg-transparent px-4 text-sm font-semibold text-[#D4B896] hover:bg-[#D4B896]/[0.1]"
        >
          <a href={`tel:${PHONE}`}>
            <Phone className="size-3.5" />
            Bel direct
          </a>
        </Button>
      </div>
    </header>
  )
}
