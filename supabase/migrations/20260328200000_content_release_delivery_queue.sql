alter table public.content_releases
add column if not exists delivery_requested_at timestamptz,
add column if not exists delivery_requested_by uuid references public.profiles (id),
add column if not exists delivery_started_at timestamptz,
add column if not exists delivery_finished_at timestamptz,
add column if not exists delivery_summary jsonb not null default '{}'::jsonb,
add column if not exists last_delivery_error text;

alter table public.content_releases
drop constraint if exists content_releases_status_check;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'content_releases_status_check'
      and conrelid = 'public.content_releases'::regclass
  ) then
    alter table public.content_releases
    add constraint content_releases_status_check
    check (status in ('draft', 'approved', 'queued', 'sending', 'sent', 'cancelled'));
  end if;
end $$;

create index if not exists content_releases_delivery_requested_at_idx
  on public.content_releases (delivery_requested_at desc);
