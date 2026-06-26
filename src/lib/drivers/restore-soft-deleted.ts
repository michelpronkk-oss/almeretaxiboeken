import "server-only"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

type DeletedDriver = {
  id: string
  active: boolean | null
  approval_status: string | null
}

export async function restoreSoftDeletedDrivers(limit = 100) {
  const supabase = getSupabaseServiceClient()

  const { data, error } = await supabase
    .from("drivers")
    .select("id, active, approval_status")
    .not("deleted_at", "is", null)
    .limit(limit)

  if (error || !data?.length) {
    return { checked: 0, restored: 0 }
  }

  const drivers = data as DeletedDriver[]
  let restored = 0

  for (const driver of drivers) {
    const approved = driver.approval_status === "approved"
    const { error: restoreError } = await supabase
      .from("drivers")
      .update({
        deleted_at: null,
        active: approved ? true : Boolean(driver.active),
        status: approved ? "available" : "invited",
      })
      .eq("id", driver.id)

    if (!restoreError) restored += 1
  }

  return { checked: drivers.length, restored }
}

export async function restoreSoftDeletedDriver(driverId: string) {
  const supabase = getSupabaseServiceClient()

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, active, approval_status, deleted_at")
    .eq("id", driverId)
    .maybeSingle()

  if (!driver?.deleted_at) return { restored: false }

  const approved = driver.approval_status === "approved"
  const { error } = await supabase
    .from("drivers")
    .update({
      deleted_at: null,
      active: approved ? true : Boolean(driver.active),
      status: approved ? "available" : "invited",
    })
    .eq("id", driverId)

  return { restored: !error }
}
