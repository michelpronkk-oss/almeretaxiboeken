// Server Component — no "use client".
// framer-motion lives only in the code-split BelowFold chunk.
// Above-fold: server HTML + CSS animations. No framer-motion in initial JS bundle.

import dynamic from "next/dynamic"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TrustBar } from "@/components/trust-bar"
import { HeroSection } from "@/components/home/hero-section"
import { Car, Users } from "lucide-react"

// Code-split: loads in a separate JS chunk after first paint.
// ssr: true keeps content in server HTML (no layout shift, SEO preserved).
// The JS for this chunk is deferred — framer-motion only downloads when needed.
const BelowFold = dynamic(
  () => import("@/components/home/below-fold"),
  { ssr: true }
)

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080807] text-[#F5F1E8]">
      <SiteHeader />

      {/* ── Above fold — server-rendered, CSS animations only ── */}
      <main className="pt-16">
        <HeroSection />

        {/* Vehicle photo slots — static HTML, no JS */}
        <div className="bg-[#080807] px-6 pb-10">
          <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1.15fr_1fr]">

            {/* Slot A — exterior / vehicle */}
            <div className="group relative aspect-[16/9] overflow-hidden rounded-2xl border border-[#292520] bg-[#151311] lg:aspect-[3/2]">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
                <Car className="size-9 text-[#292520]" />
                <span className="rounded-full border border-[#292520] px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-[#292520]">
                  Voertuig exterieur
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-5 py-4">
                <p className="text-sm font-semibold text-[#F5F1E8]">Professioneel voertuig</p>
                <p className="text-xs text-[#7F776E]">Schoon, ruim en altijd op tijd</p>
              </div>
            </div>

            {/* Slot B — interior */}
            <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#292520] bg-[#151311] lg:aspect-auto">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
                <Users className="size-9 text-[#292520]" />
                <span className="rounded-full border border-[#292520] px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-[#292520]">
                  Interieur
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-5 py-4">
                <p className="text-sm font-semibold text-[#F5F1E8]">Comfortabel interieur</p>
                <p className="text-xs text-[#7F776E]">Ruimte voor bagage en passagiers</p>
              </div>
            </div>
          </div>
        </div>

        <TrustBar />

        {/* ── Below fold — framer-motion, code-split JS chunk ── */}
        <BelowFold />
      </main>

      <SiteFooter />
    </div>
  )
}
