create table if not exists public.deploypilot_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.deploypilot_simulation_runs (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  simulation_key text not null,
  simulation_name text not null,
  status text not null check (status in ('success', 'failed', 'rolled_back')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  duration_seconds integer not null,
  analysis jsonb not null,
  stages jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists deploypilot_runs_email_created_idx
  on public.deploypilot_simulation_runs (lower(user_email), created_at desc);

alter table public.deploypilot_users enable row level security;
alter table public.deploypilot_simulation_runs enable row level security;

drop policy if exists "deploypilot_users_insert" on public.deploypilot_users;
drop policy if exists "deploypilot_users_update_own_header_email" on public.deploypilot_users;
drop policy if exists "deploypilot_users_select_own_header_email" on public.deploypilot_users;
drop policy if exists "deploypilot_runs_insert_own_header_email" on public.deploypilot_simulation_runs;
drop policy if exists "deploypilot_runs_select_own_header_email" on public.deploypilot_simulation_runs;

create policy "deploypilot_users_insert"
on public.deploypilot_users
for insert
to anon, authenticated
with check (
  lower(email) = lower(coalesce(current_setting('request.headers', true)::json ->> 'x-deploypilot-email', ''))
);

create policy "deploypilot_users_update_own_header_email"
on public.deploypilot_users
for update
to anon, authenticated
using (
  lower(email) = lower(coalesce(current_setting('request.headers', true)::json ->> 'x-deploypilot-email', ''))
)
with check (
  lower(email) = lower(coalesce(current_setting('request.headers', true)::json ->> 'x-deploypilot-email', ''))
);

create policy "deploypilot_users_select_own_header_email"
on public.deploypilot_users
for select
to anon, authenticated
using (
  lower(email) = lower(coalesce(current_setting('request.headers', true)::json ->> 'x-deploypilot-email', ''))
);

create policy "deploypilot_runs_insert_own_header_email"
on public.deploypilot_simulation_runs
for insert
to anon, authenticated
with check (
  lower(user_email) = lower(coalesce(current_setting('request.headers', true)::json ->> 'x-deploypilot-email', ''))
);

create policy "deploypilot_runs_select_own_header_email"
on public.deploypilot_simulation_runs
for select
to anon, authenticated
using (
  lower(user_email) = lower(coalesce(current_setting('request.headers', true)::json ->> 'x-deploypilot-email', ''))
);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.deploypilot_users to anon, authenticated;
grant select, insert on public.deploypilot_simulation_runs to anon, authenticated;
