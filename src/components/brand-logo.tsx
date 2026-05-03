import Image from "next/image"
import Link from "next/link"

type Variant = "sidebar" | "mobile-icon"

interface BrandLogoProps {
  variant: Variant
  sublabel?: string
  label?: string
  href?: string
  priority?: boolean
}

/**
 * Shared brand block for internal shells.
 * variant="sidebar"     — icon + wordmark in a horizontal row (desktop)
 * variant="mobile-icon" — icon only, with optional small text label (mobile)
 */
export default function BrandLogo({
  variant,
  sublabel,
  label,
  href,
  priority,
}: BrandLogoProps) {
  const inner =
    variant === "mobile-icon" ? (
      <div className="flex items-center gap-1.5">
        <Image
          src="/logo-icon.png"
          alt="Almere Taxi Boeken"
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 object-contain"
          priority={priority}
        />
        {label ? (
          <span className="text-[11px] leading-none text-[#8F877D]">{label}</span>
        ) : null}
      </div>
    ) : (
      // sidebar: icon + wordmark side-by-side, vertically centered
      <div className="flex items-center gap-2">
        <Image
          src="/logo-icon.png"
          alt=""
          aria-hidden="true"
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 object-contain"
          priority={priority}
        />
        <div className="flex flex-col justify-center gap-px">
          <Image
            src="/logo-wordmark.png"
            alt="Almere Taxi Boeken"
            width={120}
            height={20}
            className="h-5 w-auto object-contain"
            style={{ width: "auto" }}
            priority={priority}
          />
          {sublabel ? (
            <span className="text-[10px] leading-none text-[#7F776E]">{sublabel}</span>
          ) : null}
        </div>
      </div>
    )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}
