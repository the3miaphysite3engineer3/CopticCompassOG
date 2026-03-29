create table if not exists public.content_releases (
  id uuid primary key default gen_random_uuid(),
  release_type text not null check (
    release_type in ('lesson', 'publication', 'mixed')
  ),
  audience_segment text not null check (
    audience_segment in ('lessons', 'books', 'general')
  ),
  locale_mode text not null check (
    locale_mode in ('localized', 'en_only', 'nl_only')
  ),
  subject_en text,
  subject_nl text,
  body_en text,
  body_nl text,
  status text not null default 'draft' check (
    status in ('draft', 'approved', 'sent', 'cancelled')
  ),
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.content_release_items (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.content_releases (id) on delete cascade,
  item_type text not null check (item_type in ('lesson', 'publication')),
  item_id text not null,
  title_snapshot text not null,
  url_snapshot text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists content_releases_status_created_at_idx
  on public.content_releases (status, created_at desc);

create index if not exists content_releases_segment_created_at_idx
  on public.content_releases (audience_segment, created_at desc);

create index if not exists content_release_items_release_id_idx
  on public.content_release_items (release_id);

create index if not exists content_release_items_item_type_item_id_idx
  on public.content_release_items (item_type, item_id);

alter table public.content_releases enable row level security;
alter table public.content_release_items enable row level security;

drop policy if exists "Admins can read all content releases" on public.content_releases;
drop policy if exists "Admins can insert content releases" on public.content_releases;
drop policy if exists "Admins can update content releases" on public.content_releases;
drop policy if exists "Admins can read all content release items" on public.content_release_items;
drop policy if exists "Admins can insert content release items" on public.content_release_items;

create policy "Admins can read all content releases"
on public.content_releases
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert content releases"
on public.content_releases
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update content releases"
on public.content_releases
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can read all content release items"
on public.content_release_items
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert content release items"
on public.content_release_items
for insert
to authenticated
with check (public.is_admin());
