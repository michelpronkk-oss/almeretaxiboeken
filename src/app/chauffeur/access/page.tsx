import { redirect } from "next/navigation"
import { consumeDriverAccessToken } from "@/lib/driver-access"
import { setDriverAuthCookie } from "@/lib/driver-auth"

type SearchParams = Promise<{ token?: string }>

export default async function ChauffeurAccessPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const token = String(params.token || "").trim()

  if (!token) {
    return (
      <section className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-16">
        <div className="w-full rounded-2xl border border-[#D94A4A]/30 bg-[#141210] p-6">
          <h1 className="text-2xl font-semibold">Inloglink ongeldig</h1>
          <p className="mt-2 text-sm text-[#B7AEA2]">Deze link is ongeldig of verlopen. Vraag een nieuwe inloglink aan.</p>
        </div>
      </section>
    )
  }

  const result = await consumeDriverAccessToken(token)
  if (!result.ok) {
    return (
      <section className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-16">
        <div className="w-full rounded-2xl border border-[#D94A4A]/30 bg-[#141210] p-6">
          <h1 className="text-2xl font-semibold">Inloglink ongeldig</h1>
          <p className="mt-2 text-sm text-[#B7AEA2]">Deze link is verlopen of al gebruikt. Vraag een nieuwe inloglink aan via de chauffeur login.</p>
        </div>
      </section>
    )
  }

  await setDriverAuthCookie(result.driverId)
  redirect("/chauffeur")
}
