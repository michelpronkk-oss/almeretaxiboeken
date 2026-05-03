"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Car, LayoutDashboard, LogOut } from "lucide-react"

const BARE_PATHS = ["/chauffeur/login", "/chauffeur/onboarding", "/chauffeur/access"]

const nav = [
  { href: "/chauffeur", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/chauffeur/ritten", label: "Mijn ritten", shortLabel: "Ritten", icon: Car, exact: false },
]

export default function ChauffeurLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (BARE_PATHS.includes(pathname)) {
    return <div className="min-h-screen w-full overflow-x-hidden bg-[#080807] text-[#F5F1E8]">{children}</div>
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#080807] text-[#F5F1E8]">
      <header className="sticky top-0 z-30 border-b border-[#1F1C18] bg-[rgba(8,8,7,0.92)] backdrop-blur-md">
        <div className="mx-auto w-full max-w-2xl sm:hidden">
          <div className="flex w-full items-center justify-between gap-2 px-4 pt-2.5 pb-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Image
                src="/logo-icon.png"
                alt="Almere Taxi Boeken"
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 object-contain"
                priority
              />
              <span className="text-xs text-[#8F877D]">Chauffeur</span>
            </div>
            <a
              href="/chauffeur/logout"
              aria-label="Uitloggen"
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[#292520] bg-[#151311] px-2.5 text-[11px] font-medium text-[#B7AEA2] transition-colors hover:text-[#F5F1E8] active:bg-[#1B1815]"
            >
              <LogOut className="size-3.5" />
              <span className="hidden min-[360px]:inline">Uitloggen</span>
            </a>
          </div>

          <nav className="grid w-full grid-cols-2 gap-2 px-4 pb-2.5">
            {nav.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl border py-2 text-[13px] font-medium transition-colors ${
                    active
                      ? "border-[#3A2D1F] bg-[#1B1815] text-[#D6B58A]"
                      : "border-[#292520] bg-[#151311] text-[#8F877D] hover:text-[#B7AEA2]"
                  }`}
                >
                  <item.icon className="size-3.5 shrink-0" />
                  <span className="truncate min-[380px]:hidden">{item.shortLabel}</span>
                  <span className="hidden truncate min-[380px]:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mx-auto hidden max-w-2xl items-center justify-between px-6 sm:flex sm:h-14">
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
              <p className="text-[10px] leading-tight text-[#7F776E]">Chauffeurportaal</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {nav.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
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
              className="ml-2 flex items-center gap-1.5 rounded-lg border border-[#292520] px-3 py-1.5 text-xs font-semibold text-[#7F776E] transition-colors hover:border-[#D94A4A]/30 hover:text-[#D94A4A]"
            >
              <LogOut className="size-3.5" />
              Uitloggen
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6">{children}</main>
    </div>
  )
}
