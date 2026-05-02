"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function ChauffeurLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === "/chauffeur/login"
  const isOnboarding = pathname === "/chauffeur/onboarding"
  const isAccess = pathname === "/chauffeur/access"

  if (isLogin || isOnboarding || isAccess) {
    return <div className="min-h-screen bg-[#070707] text-[#F5F1E8]">{children}</div>
  }

  return (
    <div className="min-h-screen bg-[#070707] text-[#F5F1E8]">
      <header className="border-b border-[#292520] bg-[#0D0C0B]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-sm font-semibold">AlmereTaxiBoeken</p>
            <p className="text-[11px] text-[#8F877D]">Chauffeurportaal</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/chauffeur/ritten" className={`text-xs ${pathname === "/chauffeur/ritten" ? "text-[#D6B58A]" : "text-[#B7AEA2] hover:text-[#F5F1E8]"}`}>
              Mijn ritten
            </Link>
            <a href="/chauffeur/logout" className="text-xs font-semibold text-[#D6B58A] hover:text-[#E4C69E]">
              Uitloggen
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
