-- Migration: cash payment support
-- Run this against your Supabase project via the SQL editor or CLI.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS cash_amount_due numeric,
  ADD COLUMN IF NOT EXISTS cash_collection_status text NOT NULL DEFAULT 'not_applicable',
  ADD COLUMN IF NOT EXISTS cash_collected_at timestamptz,
  ADD COLUMN IF NOT EXISTS cash_collected_by uuid;

-- Backfill existing rows
UPDATE bookings
SET
  payment_method = 'online',
  cash_collection_status = 'not_applicable'
WHERE payment_method = 'online';
