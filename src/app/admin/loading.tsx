import { Loader2 } from "lucide-react"

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl border border-[#292520] bg-[#141210] ${className}`} />
}

export default function AdminLoading() {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 rounded-xl border border-[#3A2D1F] bg-[#141210] p-4 text-[#D6B58A]">
        <Loader2 className="size-4 animate-spin" />
        <div>
          <p className="text-sm font-semibold">Admin laden...</p>
          <p className="mt-0.5 text-xs text-[#8F877D]">Gegevens worden opgehaald.</p>
        </div>
      </div>
      <SkeletonBlock className="h-24" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
      </div>
      <SkeletonBlock className="h-64" />
    </section>
  )
}
