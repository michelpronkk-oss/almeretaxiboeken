import "server-only"
import { getSupabaseServiceClient } from "@/lib/supabase/server"

interface DefaultOwner {
  id: string
  full_name: string | null
  email: string | null
}

export async function findDefaultOwnerDriver(): Promise<DefaultOwner | null> {
  const supabase = getSupabaseServiceClient()
  const { data } = await supabase
    .from("drivers")
    .select("id, full_name, email")
    .eq("default_assign", true)
    .eq("active", true)
    .eq("approval_status", "approved")
    .is("deleted_at", null)
    .maybeSingle()
  return data ?? null
}

export async function assignDefaultOwnerToBooking(
  bookingId: string,
  driverId: string,
  newBookingStatus: string,
): Promise<void> {
  const supabase = getSupabaseServiceClient()
  await supabase
    .from("bookings")
    .update({
      assigned_driver_id: driverId,
      booking_status: newBookingStatus,
      default_assigned: true,
      assignment_source: "default_owner",
    })
    .eq("id", bookingId)

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "default_owner_assigned",
    actor_type: "system",
    note: "Rit automatisch toegewezen aan eigenaar/chauffeur.",
  })
}

export async function preAssignDefaultOwnerOnline(
  bookingId: string,
  driverId: string,
): Promise<void> {
  const supabase = getSupabaseServiceClient()
  await supabase
    .from("bookings")
    .update({
      assigned_driver_id: driverId,
      default_assigned: true,
      assignment_source: "default_owner",
    })
    .eq("id", bookingId)

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "default_owner_assigned",
    actor_type: "system",
    note: "Eigenaar/chauffeur alvast gekoppeld, wacht op betaling.",
  })
}
