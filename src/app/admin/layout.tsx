"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/ritten", label: "Ritten" },
  { href: "/admin/chauffeurs", label: "Chauffeurs" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === "/admin/login"

  if (isLogin) {
    return <div className="min-h-screen bg-[#070707] text-[#F5F1E8]">{children}</div>
  }

  return (
    <div className="min-h-screen bg-[#070707] text-[#F5F1E8]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-[#292520] bg-[#0D0C0B] p-5 lg:flex lg:flex-col">
          <div>
            <p className="text-base font-semibold">AlmereTaxiBoeken</p>
            <p className="mt-1 text-xs text-[#8F877D]">Interne planning</p>
          </div>

          <nav className="mt-8 space-y-1">
            {nav.map((item) => {
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

        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-[#292520] bg-[#0D0C0B] px-4 py-3 lg:hidden">
            <div>
              <p className="text-sm font-semibold">AlmereTaxiBoeken</p>
              <p className="text-[11px] text-[#8F877D]">Interne planning</p>
            </div>
            <a href="/admin/logout" className="text-xs font-semibold text-[#D6B58A]">Uitloggen</a>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
