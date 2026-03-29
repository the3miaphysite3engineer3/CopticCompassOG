create table if not exists public.audience_opt_in_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 3 and 254),
  full_name text,
  locale text not null default 'en' check (locale in ('en', 'nl')),
  source text not null check (
    source in ('contact_form', 'signup')
  ),
  lessons_requested boolean not null default false,
  books_requested boolean not null default false,
  general_updates_requested boolean not null default false,
  token_hash text not null unique,
  expires_at timestamptz not null,
  confirmed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists audience_opt_in_requests_expires_at_idx
  on public.audience_opt_in_requests (expires_at);

create index if not exists audience_opt_in_requests_confirmed_at_idx
  on public.audience_opt_in_requests (confirmed_at)
  where confirmed_at is not null;

create index if not exists audience_opt_in_requests_updated_at_idx
  on public.audience_opt_in_requests (updated_at desc);

alter table public.audience_opt_in_requests enable row level security;

drop policy if exists "Admins can read all audience opt-in requests" on public.audience_opt_in_requests;
drop policy if exists "Admins can update audience opt-in requests" on public.audience_opt_in_requests;

create policy "Admins can read all audience opt-in requests"
on public.audience_opt_in_requests
for select
to authenticated
using (public.is_admin());

create policy "Admins can update audience opt-in requests"
on public.audience_opt_in_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
