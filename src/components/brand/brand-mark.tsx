import Image from "next/image"
import Link from "next/link"

/**
 * BrandMark — internal shell branding (admin, chauffeur).
 *
 * Responsive behaviour (built in):
 *   < md  →  icon  +  optional `label` text  (e.g. "Admin")
 *   ≥ md  →  icon  +  wordmark SVG  +  optional `sublabel` (e.g. "Interne planning")
 *
 * Assets used:
 *   /icon.svg      — 1254 × 1254 (square vector icon)
 *   /wordmark.svg  — 1898 × 829  (wide wordmark, aspect ≈ 2.29 : 1)
 *
 * NOTE: Both SVGs are complex rasterized-to-vector exports from a design tool.
 * They render crisply at any size but the SVG code is large.
 * For a future quality improvement, supply clean hand-crafted or Figma-SVG source files.
 */

// Wordmark aspect ratio: 1898 / 829 ≈ 2.29
// At h-5 (20px) rendered height → width ≈ 46 px
const WM_RENDER_H = 20
const WM_RENDER_W = Math.round(20 * (1898 / 829)) // 46

interface BrandMarkProps {
  /** Short label shown mobile-only next to the icon  (e.g. "Admin") */
  label?: string
  /** Subdued caption shown desktop-only below the wordmark (e.g. "Interne planning") */
  sublabel?: string
  /** Wrap the whole mark in a <Link>. */
  href?: string
  /** Pass priority to next/image for above-the-fold usage. */
  priority?: boolean
}

export default function BrandMark({
  label,
  sublabel,
  href,
  priority,
}: BrandMarkProps) {
  const inner = (
    <div className="flex items-center gap-2">
      {/* Icon — always shown */}
      <Image
        src="/icon.svg"
        alt="Almere Taxi Boeken"
        width={28}
        height={28}
        className="h-7 w-7 shrink-0"
        style={{ width: "28px", height: "28px" }}
        unoptimized
        priority={priority}
      />

      {/* Mobile-only label  (< md) */}
      {label ? (
        <span className="text-[11px] leading-none text-[#8F877D] md:hidden">
          {label}
        </span>
      ) : null}

      {/* Desktop wordmark block  (≥ md) */}
      <div className="hidden flex-col justify-center gap-px md:flex">
        <Image
          src="/wordmark.svg"
          alt="Almere Taxi Boeken"
          width={WM_RENDER_W}
          height={WM_RENDER_H}
          className="object-contain"
          style={{ width: "auto", height: `${WM_RENDER_H}px` }}
          unoptimized
          priority={priority}
        />
        {sublabel ? (
          <span className="text-[10px] leading-none text-[#7F776E]">
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}
