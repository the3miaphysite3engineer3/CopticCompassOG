create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  channel text not null check (channel in ('email')),
  recipient text not null,
  subject text not null,
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text unique,
  status text not null default 'queued' check (
    status in ('queued', 'sent', 'failed')
  ),
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.notification_events (id) on delete cascade,
  channel text not null check (channel in ('email')),
  recipient text not null,
  provider_message_id text,
  status text not null check (status in ('sent', 'failed')),
  error text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notification_events_status_created_at_idx
  on public.notification_events (status, created_at desc);

create index if not exists notification_events_aggregate_created_at_idx
  on public.notification_events (aggregate_type, aggregate_id, created_at desc);

create index if not exists notification_events_event_type_created_at_idx
  on public.notification_events (event_type, created_at desc);

create index if not exists notification_deliveries_event_id_idx
  on public.notification_deliveries (event_id);

create index if not exists notification_deliveries_status_created_at_idx
  on public.notification_deliveries (status, created_at desc);

alter table public.notification_events enable row level security;
alter table public.notification_deliveries enable row level security;

drop policy if exists "Admins can read all notification events" on public.notification_events;
drop policy if exists "Admins can read all notification deliveries" on public.notification_deliveries;

create policy "Admins can read all notification events"
on public.notification_events
for select
to authenticated
using (public.is_admin());

create policy "Admins can read all notification deliveries"
on public.notification_deliveries
for select
to authenticated
using (public.is_admin());
