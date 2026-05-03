"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/ritten", label: "Ritten" },
  { href: "/admin/chauffeurs", label: "Chauffeurs" },
  { href: "/admin/docs", label: "Handleiding" },
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
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-icon.png"
              alt=""
              width={32}
              height={32}
              aria-hidden="true"
              className="h-8 w-8 shrink-0 object-contain"
              priority
            />
            <div>
              <Image
                src="/logo-wordmark.png"
                alt="Almere Taxi Boeken"
                width={260}
                height={52}
                className="h-[52px] w-auto object-contain"
                style={{ width: "auto" }}
                priority
              />
              <p className="mt-0.5 text-xs text-[#8F877D]">Interne planning</p>
            </div>
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
            <div className="flex items-center gap-2">
              <Image
                src="/logo-icon.png"
                alt="Almere Taxi Boeken"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                priority
              />
              <span className="text-xs text-[#8F877D]">Admin</span>
            </div>
            <a href="/admin/logout" className="text-xs font-semibold text-[#D6B58A]">Uitloggen</a>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

