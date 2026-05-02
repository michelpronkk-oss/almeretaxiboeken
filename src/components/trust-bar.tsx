import { CheckCircle2, Plane, ShieldCheck, Star } from "lucide-react"

const items = [
  {
    icon: Star,
    main: "4,9/5",
    sub: "beoordeling",
    accent: true,
  },
  {
    icon: CheckCircle2,
    main: "Vaste prijs",
    sub: "geen taxameter",
    accent: false,
  },
  {
    icon: ShieldCheck,
    main: "Veilig betalen",
    sub: "iDEAL & creditcard",
    accent: false,
  },
  {
    icon: Plane,
    main: "Schiphol & luchthavens",
    sub: "vanuit Almere",
    accent: false,
  },
]

export function TrustBar() {
  return (
    <div className="border-y border-[#1F1C18] bg-[#0D0C0B]">
      {/* ── Desktop ─────────────────────────────────────── */}
      <div className="mx-auto hidden max-w-6xl divide-x divide-[#1F1C18] md:grid md:grid-cols-4">
        {items.map((item) => (
          <div key={item.main} className="flex items-center gap-3 px-8 py-5">
            <div
              className={
                item.accent
                  ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#D6B58A]/[0.1]"
                  : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.03]"
              }
            >
              <item.icon
                className={item.accent ? "size-4 text-[#D6B58A]" : "size-4 text-[#7F776E]"}
              />
            </div>
            <div>
              <p
                className={
                  item.accent
                    ? "text-sm font-bold leading-tight text-[#D6B58A]"
                    : "text-sm font-semibold leading-tight text-[#F5F1E8]"
                }
              >
                {item.main}
              </p>
              <p className="text-[11px] leading-tight text-[#7F776E]">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Mobile: 2×2 grid ────────────────────────────── */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-[#1F1C18] md:hidden">
        {items.map((item) => (
          <div key={item.main} className="flex items-center gap-2.5 px-5 py-4">
            <item.icon
              className={item.accent ? "size-4 shrink-0 text-[#D6B58A]" : "size-4 shrink-0 text-[#7F776E]"}
            />
            <div>
              <p
                className={
                  item.accent
                    ? "text-xs font-bold leading-tight text-[#D6B58A]"
                    : "text-xs font-semibold leading-tight text-[#F5F1E8]"
                }
              >
                {item.main}
              </p>
              <p className="text-[10px] leading-tight text-[#7F776E]">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
