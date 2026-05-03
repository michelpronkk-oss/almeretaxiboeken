-- chauffeur_onboarding_reliability_migration.sql
-- Adds submitted_at to driver_invites and ensures all columns used by the
-- onboarding submit route exist on drivers. Safe to run multiple times (IF NOT EXISTS).
-- Run after all prior migrations.

-- ── driver_invites ────────────────────────────────────────────────────────────

alter table public.driver_invites
  add column if not exists submitted_at timestamptz;

-- ── drivers: columns used during onboarding submit ───────────────────────────
-- Most columns were added in chauffeur_invite_onboarding_migration.sql and
-- owner_dispatcher_and_cleanup_migration.sql. These are the remaining gaps.

alter table public.drivers
  add column if not exists first_name              text,
  add column if not exists last_name               text,
  add column if not exists address                 text,
  add column if not exists phone                   text,
  add column if not exists vehicle_type            text,
  add column if not exists license_plate           text,
  add column if not exists onboarding_status       text not null default 'invited',
  add column if not exists approval_status         text not null default 'pending',
  add column if not exists driver_license_path     text,
  add column if not exists taxi_pass_path          text,
  add column if not exists identity_document_path  text,
  add column if not exists onboarded_at            timestamptz,
  add column if not exists approved_at             timestamptz,
  add column if not exists deleted_at              timestamptz,
  add column if not exists archived_at             timestamptz,
  add column if not exists active                  boolean not null default false,
  add column if not exists status                  text not null default 'invited';

-- ── Supabase Storage ──────────────────────────────────────────────────────────
-- The bucket 'driver-documents' must be created manually in the Supabase dashboard
-- (Storage → New bucket → name: driver-documents, Public: OFF).
-- SQL cannot create storage buckets.

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_driver_invites_submitted_at
  on public.driver_invites (submitted_at);
