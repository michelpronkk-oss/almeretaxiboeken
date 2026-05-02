-- Driver access magic-link tokens (v1)

create table if not exists public.driver_login_tokens (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_driver_login_tokens_driver_id on public.driver_login_tokens(driver_id);
create index if not exists idx_driver_login_tokens_expires_at on public.driver_login_tokens(expires_at);
create index if not exists idx_driver_login_tokens_used_at on public.driver_login_tokens(used_at);
create index if not exists driver_login_tokens_token_hash_idx on public.driver_login_tokens(token_hash);
create index if not exists driver_login_tokens_driver_id_idx on public.driver_login_tokens(driver_id);
create index if not exists driver_login_tokens_expires_at_idx on public.driver_login_tokens(expires_at);

alter table public.drivers
  add column if not exists last_login_at timestamptz;

alter table public.driver_login_tokens enable row level security;

comment on table public.driver_login_tokens is 'RLS enabled. Access intended via Supabase service role from secure server routes.';
