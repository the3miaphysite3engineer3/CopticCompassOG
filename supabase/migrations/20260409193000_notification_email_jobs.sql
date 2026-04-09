create table if not exists public.notification_email_jobs (
  id uuid primary key default gen_random_uuid(),
  notification_event_id uuid not null unique references public.notification_events (id) on delete cascade,
  subject text not null,
  from_email text,
  to_recipients text[] not null check (cardinality(to_recipients) > 0),
  cc_recipients text[] not null default '{}'::text[],
  bcc_recipients text[] not null default '{}'::text[],
  reply_to_recipients text[] not null default '{}'::text[],
  html_body text,
  text_body text not null,
  status text not null default 'queued' check (
    status in ('queued', 'processing', 'sent', 'failed')
  ),
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notification_email_jobs_status_created_at_idx
  on public.notification_email_jobs (status, created_at asc);

alter table public.notification_email_jobs enable row level security;
