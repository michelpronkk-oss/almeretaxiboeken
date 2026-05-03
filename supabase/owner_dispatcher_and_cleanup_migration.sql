-- owner_dispatcher_and_cleanup_migration.sql
-- Adds owner/dispatcher flags to drivers and soft-delete/assignment tracking to bookings.

-- ── Drivers: owner/dispatcher flags ──────────────────────────────────────────
alter table public.drivers
  add column if not exists is_owner       boolean     not null default false,
  add column if not exists can_dispatch   boolean     not null default false,
  add column if not exists default_assign boolean     not null default false,
  add column if not exists deleted_at     timestamptz,
  add column if not exists archived_at    timestamptz;

-- ── Bookings: soft-delete and assignment tracking ─────────────────────────────
alter table public.bookings
  add column if not exists deleted_at        timestamptz,
  add column if not exists archived_at       timestamptz,
  add column if not exists default_assigned  boolean     not null default false,
  add column if not exists assignment_source text;

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists drivers_default_assign_idx
  on public.drivers (default_assign) where default_assign = true;

create index if not exists drivers_can_dispatch_idx
  on public.drivers (can_dispatch) where can_dispatch = true;

create index if not exists drivers_deleted_at_idx
  on public.drivers (deleted_at);

create index if not exists bookings_deleted_at_idx
  on public.bookings (deleted_at);

create index if not exists bookings_archived_at_idx
  on public.bookings (archived_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- SETUP SNIPPET
-- Run once after applying this migration to mark the owner/dispatcher.
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Clear any existing default_assign flags (ensure only one default driver)
-- update public.drivers set default_assign = false;

-- Step 2: Mark fntaxi87@gmail.com as owner, dispatcher, and default assignment target
-- update public.drivers
-- set
--   is_owner        = true,
--   can_dispatch    = true,
--   default_assign  = true,
--   active          = true,
--   approval_status = 'approved',
--   onboarding_status = 'approved',
--   status          = 'available'
-- where lower(email) = 'fntaxi87@gmail.com';
