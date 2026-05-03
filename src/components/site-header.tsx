"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, Phone, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const PHONE = "+31853038136"
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "31853038136"

const navItems = [
  { label: "Diensten", href: "/diensten" },
  { label: "Tarieven", href: "/tarieven" },
  { label: "Waarom ons", href: "/#waarom-ons" },
  { label: "FAQ", href: "/veelgestelde-vragen" },
  { label: "Contact", href: "/contact" },
]

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggleMobileMenu = useCallback(() => setMobileOpen((v) => !v), [])
  const closeMobileMenu = useCallback(() => setMobileOpen(false), [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#1F1C18] bg-[rgba(8,8,7,0.92)] md:bg-[rgba(8,8,7,0.86)] md:backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* Mobile: icon only */}
          <Image
            src="/logo-icon.png"
            alt="Almere Taxi Boeken"
            width={32}
            height={32}
            className="h-8 w-8 object-contain md:hidden"
            priority
          />
          {/* Desktop: icon + wordmark */}
          <Image
            src="/logo-icon.png"
            alt=""
            width={32}
            height={32}
            aria-hidden="true"
            className="hidden h-8 w-8 object-contain md:block"
            priority
          />
          <Image
            src="/logo-wordmark.png"
            alt="Almere Taxi Boeken"
            width={260}
            height={52}
            className="hidden h-[52px] w-auto object-contain md:block"
            style={{ width: "auto" }}
            priority
          />
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[#B7AEA2] transition-colors hover:text-[#F5F1E8]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="hidden h-9 gap-2 border border-[#3A2D1F] bg-transparent px-4 text-sm font-semibold text-[#D6B58A] hover:bg-[#1B1815] md:inline-flex"
          >
            <a href={`tel:${PHONE}`}>
              <Phone className="size-3.5" />
              Bel direct
            </a>
          </Button>

          <button
            type="button"
            onClick={toggleMobileMenu}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#292520] text-[#B7AEA2] transition-colors hover:bg-[#151311] hover:text-[#F5F1E8] md:hidden"
            aria-label="Menu openen"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <div
        aria-hidden={!mobileOpen}
        className={`absolute inset-x-0 top-16 border-t border-[#1F1C18] bg-[#080807] px-6 py-4 transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none md:hidden ${
          mobileOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
          <nav className="flex flex-col gap-3 text-sm">
            <Link href="/#contact" onClick={closeMobileMenu} className="text-[#F5F1E8]">
              Rit reserveren
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMobileMenu}
                className="text-[#B7AEA2] transition-colors hover:text-[#D6B58A]"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={`tel:${PHONE}`}
              onClick={closeMobileMenu}
              className="pt-1 text-[#D6B58A]"
            >
              Bel direct
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMobileMenu}
              className="text-[#25D366]"
            >
              WhatsApp
            </a>
          </nav>
        </div>
    </header>
  )
}
