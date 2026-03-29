create table if not exists public.audience_contact_sync_state (
  audience_contact_id uuid primary key references public.audience_contacts (id) on delete cascade,
  provider text not null default 'resend' check (provider in ('resend')),
  provider_contact_id text,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.audience_contact_sync_state (
  audience_contact_id,
  provider,
  provider_contact_id,
  last_synced_at,
  last_error,
  created_at,
  updated_at
)
select
  id,
  'resend',
  resend_contact_id,
  resend_last_synced_at,
  resend_sync_error,
  created_at,
  greatest(
    updated_at,
    coalesce(resend_last_synced_at, updated_at)
  )
from public.audience_contacts
where
  resend_contact_id is not null
  or resend_last_synced_at is not null
  or resend_sync_error is not null
on conflict (audience_contact_id) do update
set
  provider_contact_id = excluded.provider_contact_id,
  last_synced_at = excluded.last_synced_at,
  last_error = excluded.last_error,
  updated_at = excluded.updated_at;

alter table public.audience_contacts
drop column if exists resend_contact_id,
drop column if exists resend_last_synced_at,
drop column if exists resend_sync_error;

create index if not exists audience_contact_sync_state_last_synced_at_idx
  on public.audience_contact_sync_state (last_synced_at desc)
  where last_synced_at is not null;

create index if not exists audience_contact_sync_state_last_error_idx
  on public.audience_contact_sync_state (updated_at desc)
  where last_error is not null;

alter table public.audience_contact_sync_state enable row level security;

drop policy if exists "Admins can read all audience contact sync states" on public.audience_contact_sync_state;
drop policy if exists "Admins can insert audience contact sync states" on public.audience_contact_sync_state;
drop policy if exists "Admins can update audience contact sync states" on public.audience_contact_sync_state;

create policy "Admins can read all audience contact sync states"
on public.audience_contact_sync_state
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert audience contact sync states"
on public.audience_contact_sync_state
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update audience contact sync states"
on public.audience_contact_sync_state
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
