alter table public.bookings add column if not exists source text default 'website';
alter table public.bookings add column if not exists created_by text;
alter table public.bookings add column if not exists manual_created boolean not null default false;
alter table public.bookings add column if not exists payment_link_sent_at timestamptz;
alter table public.bookings add column if not exists customer_payment_link text;
alter table public.bookings add column if not exists price_calculated_at timestamptz;
