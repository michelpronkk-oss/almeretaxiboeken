-- Migration: fixed route pricing + manual price override
-- Run this against your Supabase project via the SQL editor or CLI.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS pricing_mode text,
  ADD COLUMN IF NOT EXISTS calculated_fare numeric,
  ADD COLUMN IF NOT EXISTS fixed_route_fare numeric,
  ADD COLUMN IF NOT EXISTS final_fare numeric,
  ADD COLUMN IF NOT EXISTS matched_fixed_route text,
  ADD COLUMN IF NOT EXISTS airport_surcharge_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS airport_surcharge_label text,
  ADD COLUMN IF NOT EXISTS price_override_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_override_reason text,
  ADD COLUMN IF NOT EXISTS admin_vehicle_override boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pricing_notes text;

-- Backfill: existing rows get metered mode and final_fare = estimated_fare
UPDATE bookings
SET
  pricing_mode = 'metered',
  final_fare = estimated_fare,
  calculated_fare = estimated_fare
WHERE pricing_mode IS NULL AND estimated_fare IS NOT NULL;
