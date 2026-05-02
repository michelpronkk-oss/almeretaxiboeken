import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

interface MarketingPageLayoutProps {
  children: React.ReactNode
}

export function MarketingPageLayout({ children }: MarketingPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#080807] text-[#F5F1E8]">
      <SiteHeader />
      <main className="pt-16">{children}</main>
      <SiteFooter />
    </div>
  )
}
