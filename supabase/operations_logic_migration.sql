alter table public.bookings add column if not exists arrived_at timestamptz;
alter table public.bookings add column if not exists started_at timestamptz;
alter table public.bookings add column if not exists completed_at timestamptz;
alter table public.bookings add column if not exists buffer_after_minutes integer not null default 45;
alter table public.bookings add column if not exists issue_reason text;
alter table public.bookings add column if not exists issue_note text;
alter table public.bookings add column if not exists no_show_note text;
alter table public.bookings add column if not exists admin_note text;

create index if not exists bookings_assigned_driver_pickup_idx
  on public.bookings (assigned_driver_id, pickup_date, pickup_time);

create index if not exists bookings_status_idx
  on public.bookings (booking_status);
