-- Chauffeur invite + onboarding migration (v1)
-- Run after supabase/almeretaxiboeken_schema.sql

create extension if not exists pgcrypto;

alter table public.drivers
  alter column full_name drop not null;

alter table public.drivers
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists address text,
  add column if not exists onboarding_status text not null default 'invited',
  add column if not exists approval_status text not null default 'pending',
  add column if not exists driver_license_path text,
  add column if not exists taxi_pass_path text,
  add column if not exists identity_document_path text,
  add column if not exists invited_at timestamptz,
  add column if not exists onboarded_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by text;

alter table public.drivers
  alter column email set not null;

alter table public.drivers
  alter column active set default false;

alter table public.drivers
  alter column status set default 'invited';

create unique index if not exists uq_drivers_email on public.drivers(lower(email));

create table if not exists public.driver_invites (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  status text not null default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists idx_driver_invites_driver_id on public.driver_invites(driver_id);
create index if not exists idx_driver_invites_email on public.driver_invites(lower(email));
create index if not exists idx_driver_invites_status on public.driver_invites(status);
create index if not exists idx_drivers_onboarding_status on public.drivers(onboarding_status);
create index if not exists idx_drivers_approval_status on public.drivers(approval_status);

alter table public.driver_invites enable row level security;

comment on table public.driver_invites is 'RLS enabled. Access intended via Supabase service role from secure server routes.';