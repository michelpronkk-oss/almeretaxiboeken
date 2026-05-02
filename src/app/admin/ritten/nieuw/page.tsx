import { redirect } from "next/navigation"
import ManualRideForm from "@/components/internal/manual-ride-form"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export default async function AdminNieuweRitPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login")
  }

  return <ManualRideForm />
}
