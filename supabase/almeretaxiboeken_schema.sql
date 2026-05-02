-- AlmereTaxiBoeken schema v1
-- Service-role-only access for now. RLS is enabled without public policies.

create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  pickup_address text not null,
  destination_address text not null,
  pickup_date text,
  pickup_time text,
  passengers integer,
  vehicle_type text,
  distance_km numeric,
  duration_minutes integer,
  estimated_fare numeric,
  currency text default 'EUR',
  payment_status text not null default 'pending_payment',
  booking_status text not null default 'pending_payment',
  mollie_payment_id text,
  mollie_checkout_url text,
  assigned_driver_id uuid null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid null,
  full_name text not null,
  email text,
  phone text,
  vehicle_type text default 'taxi',
  license_plate text,
  active boolean not null default true,
  status text not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  event_type text not null,
  actor_type text,
  actor_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create index if not exists idx_bookings_reference on public.bookings(reference);
create index if not exists idx_bookings_mollie_payment_id on public.bookings(mollie_payment_id);
create index if not exists idx_bookings_payment_status on public.bookings(payment_status);
create index if not exists idx_bookings_booking_status on public.bookings(booking_status);
create index if not exists idx_bookings_assigned_driver_id on public.bookings(assigned_driver_id);
create index if not exists idx_bookings_pickup_date on public.bookings(pickup_date);

create index if not exists idx_drivers_auth_user_id on public.drivers(auth_user_id);
create index if not exists idx_drivers_email on public.drivers(email);
create index if not exists idx_drivers_active on public.drivers(active);

create index if not exists idx_booking_events_booking_id on public.booking_events(booking_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

drop trigger if exists trg_drivers_updated_at on public.drivers;
create trigger trg_drivers_updated_at
before update on public.drivers
for each row execute function public.set_updated_at();

alter table public.bookings enable row level security;
alter table public.drivers enable row level security;
alter table public.booking_events enable row level security;
alter table public.admin_users enable row level security;

comment on table public.bookings is 'RLS enabled. Access intended via Supabase service role from secure server routes.';
comment on table public.drivers is 'RLS enabled. Access intended via Supabase service role from secure server routes.';
comment on table public.booking_events is 'RLS enabled. Access intended via Supabase service role from secure server routes.';
comment on table public.admin_users is 'RLS enabled. Access intended via Supabase service role from secure server routes.';
