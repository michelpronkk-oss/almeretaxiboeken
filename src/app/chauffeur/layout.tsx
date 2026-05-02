"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Car, LayoutDashboard } from "lucide-react"

const BARE_PATHS = ["/chauffeur/login", "/chauffeur/onboarding", "/chauffeur/access"]

const nav = [
  { href: "/chauffeur", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/chauffeur/ritten", label: "Mijn ritten", icon: Car, exact: false },
]

export default function ChauffeurLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (BARE_PATHS.includes(pathname)) {
    return (
      <div className="min-h-screen bg-[#070707] text-[#F5F1E8]">{children}</div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070707] text-[#F5F1E8]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#292520] bg-[#0D0C0B]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold leading-tight text-[#F5F1E8]">
                AlmereTaxi<span className="text-[#D6B58A]">Boeken</span>
              </p>
              <p className="text-[10px] leading-tight text-[#7F776E]">Chauffeurportaal</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {nav.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-[#1B1815] text-[#D6B58A]"
                      : "text-[#B7AEA2] hover:bg-[#141210] hover:text-[#F5F1E8]"
                  }`}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>
              )
            })}
            <a
              href="/chauffeur/logout"
              className="ml-2 rounded-lg border border-[#292520] px-3 py-1.5 text-xs font-semibold text-[#7F776E] transition-colors hover:border-[#D94A4A]/30 hover:text-[#D94A4A]"
            >
              Uitloggen
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
