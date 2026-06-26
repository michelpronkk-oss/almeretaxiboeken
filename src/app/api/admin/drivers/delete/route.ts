import { NextRequest } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ success: false, message: "Niet geautoriseerd." }, { status: 401 })
  }

  const body = await request.json()
  const driverId = String(body.driverId || "").trim()
  const reason = String(body.reason || "").trim()

  if (!driverId) {
    return Response.json({ success: false, message: "Chauffeur ID ontbreekt." }, { status: 400 })
  }

  const supabase = getSupabaseServiceClient()

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, is_owner, default_assign, full_name, email")
    .eq("id", driverId)
    .maybeSingle()

  if (!driver) {
    return Response.json({ success: false, message: "Chauffeur niet gevonden." }, { status: 404 })
  }

  if (driver.is_owner || driver.default_assign) {
    return Response.json(
      { success: false, message: "De standaard eigenaar/chauffeur kan niet worden verwijderd." },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from("drivers")
    .update({
      active: false,
      status: "inactive",
    })
    .eq("id", driverId)

  if (error) {
    return Response.json({ success: false, message: "Deactiveren mislukt." }, { status: 500 })
  }

  return Response.json({ success: true, message: "Chauffeur gedeactiveerd.", reason: reason || undefined })
}
