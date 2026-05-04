// Server Component — no "use client".
// framer-motion lives only in the code-split BelowFold chunk.
// Above-fold: server HTML + CSS animations. No framer-motion in initial JS bundle.

import dynamic from "next/dynamic"
import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TrustBar } from "@/components/trust-bar"
import { HeroSection } from "@/components/home/hero-section"

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
            <div className="group relative min-h-[260px] overflow-hidden rounded-[28px] border border-[#292520] lg:min-h-[320px]">
              <Image
                src="/taxi-driver-premium.jpg"
                alt="Professionele taxi chauffeur in voertuig"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 58vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-sm font-semibold text-[#F5F1E8]">Professioneel voertuig</p>
                <p className="text-xs text-[#7F776E]">Schoon, ruim en altijd op tijd</p>
              </div>
            </div>

            {/* Slot B — interior */}
            <div className="group relative min-h-[260px] overflow-hidden rounded-[28px] border border-[#292520] lg:min-h-[320px]">
              <Image
                src="/taxi-driver-app.jpg"
                alt="Comfortabel taxi interieur"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 42vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
              <div className="absolute bottom-6 left-6 right-6">
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
