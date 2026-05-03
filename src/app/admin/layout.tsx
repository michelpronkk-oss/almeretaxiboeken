"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import BrandLogo from "@/components/brand-logo"

const sidebarNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/ritten", label: "Ritten" },
  { href: "/admin/chauffeurs", label: "Chauffeurs" },
  { href: "/admin/docs", label: "Handleiding" },
]

const mobileNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/ritten", label: "Ritten" },
  { href: "/admin/ritten/nieuw", label: "Nieuwe rit" },
  { href: "/admin/chauffeurs", label: "Chauffeurs" },
  { href: "/admin/docs", label: "Handleiding" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === "/admin/login"
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { setMenuOpen(false) }, [pathname])

  if (isLogin) {
    return <div className="min-h-screen bg-[#070707] text-[#F5F1E8]">{children}</div>
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070707] text-[#F5F1E8]">
      <div className="flex min-h-screen">

        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-[#292520] bg-[#0D0C0B] p-5 lg:flex lg:flex-col">
          <BrandLogo variant="sidebar" sublabel="Interne planning" priority />

          <nav className="mt-8 space-y-1">
            {sidebarNav.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm ${active ? "bg-[#141210] text-[#D6B58A]" : "text-[#B7AEA2] hover:bg-[#141210]"}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto border-t border-[#292520] pt-4">
            <p className="text-xs text-[#8F877D]">Status: Admin</p>
            <a href="/admin/logout" className="mt-2 inline-block text-sm font-semibold text-[#D6B58A] hover:text-[#E4C69E]">
              Uitloggen
            </a>
          </div>
        </aside>

        {/* Mobile content column */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Mobile header */}
          <header className="sticky top-0 z-40 border-b border-[#292520] bg-[#0D0C0B] lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <BrandLogo variant="mobile-icon" label="Admin" priority />
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Menu sluiten" : "Menu openen"}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#292520] text-[#B7AEA2] transition-colors hover:bg-[#141210] hover:text-[#F5F1E8]"
              >
                {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </button>
            </div>

            {/* Dropdown nav — opacity + translate only, no height animation */}
            <div
              aria-hidden={!menuOpen}
              className={`absolute inset-x-0 top-full border-b border-[#292520] bg-[#0D0C0B] transition-[opacity,transform] duration-150 ease-out ${
                menuOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              }`}
            >
              <nav className="flex flex-col px-4 py-3 gap-0.5">
                {mobileNav.map((item) => {
                  const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active ? "bg-[#141210] text-[#D6B58A]" : "text-[#B7AEA2] hover:bg-[#141210] hover:text-[#F5F1E8]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
                <div className="my-1.5 border-t border-[#292520]" />
                <a
                  href="/admin/logout"
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#D6B58A] hover:bg-[#141210]"
                >
                  Uitloggen
                </a>
              </nav>
            </div>
          </header>

          <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
