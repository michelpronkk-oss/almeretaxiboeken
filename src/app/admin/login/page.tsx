import { redirect } from "next/navigation"
import { isAdminAuthenticated, setAdminAuthCookie } from "@/lib/admin-auth"

type SearchParams = Promise<{ error?: string }>

async function loginAction(formData: FormData) {
  "use server"

  const submitted = String(formData.get("password") || "")
  const expected = process.env.ADMIN_ACCESS_PASSWORD || ""

  if (!expected || submitted !== expected) {
    redirect("/admin/login?error=1")
  }

  await setAdminAuthCookie(expected)
  redirect("/admin")
}

export default async function AdminLoginPage({ searchParams }: { searchParams: SearchParams }) {
  if (await isAdminAuthenticated()) {
    redirect("/admin")
  }

  const params = await searchParams

  return (
    <section className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <div className="w-full rounded-2xl border border-[#292520] bg-[#141210] p-6">
        <h1 className="text-2xl font-semibold">Admin login</h1>
        <p className="mt-2 text-sm text-[#B7AEA2]">Log in om ritten en chauffeurs te beheren.</p>

        {params.error ? (
          <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300">Onjuist wachtwoord.</p>
        ) : null}

        <form action={loginAction} className="mt-5 space-y-3">
          <input
            type="password"
            name="password"
            required
            className="h-11 w-full rounded-lg border border-[#292520] bg-[#0D0C0B] px-3 text-sm text-[#F5F1E8] outline-none focus:border-[#D6B58A]"
            placeholder="Beheerwachtwoord"
          />
          <button className="rounded-lg border border-[#3A2D1F] px-4 py-2 text-sm font-semibold text-[#D6B58A] hover:bg-[#1B1815]">
            Inloggen
          </button>
        </form>
      </div>
    </section>
  )
}
