create table if not exists public.audience_contacts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  email text not null unique check (char_length(email) between 3 and 254),
  full_name text,
  locale text not null default 'en' check (locale in ('en', 'nl')),
  source text not null check (
    source in ('contact_form', 'dashboard', 'signup')
  ),
  lessons_opt_in boolean not null default false,
  books_opt_in boolean not null default false,
  general_updates_opt_in boolean not null default false,
  consented_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists audience_contacts_profile_id_idx
  on public.audience_contacts (profile_id);

create index if not exists audience_contacts_locale_idx
  on public.audience_contacts (locale);

create index if not exists audience_contacts_source_idx
  on public.audience_contacts (source);

create index if not exists audience_contacts_active_idx
  on public.audience_contacts (
    lessons_opt_in,
    books_opt_in,
    general_updates_opt_in,
    updated_at desc
  );

create index if not exists audience_contacts_consented_at_idx
  on public.audience_contacts (consented_at desc)
  where consented_at is not null;

alter table public.audience_contacts enable row level security;

drop policy if exists "Users can read their own audience contact" on public.audience_contacts;
drop policy if exists "Admins can read all audience contacts" on public.audience_contacts;

create policy "Users can read their own audience contact"
on public.audience_contacts
for select
to authenticated
using (
  profile_id = auth.uid()
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "Admins can read all audience contacts"
on public.audience_contacts
for select
to authenticated
using (public.is_admin());
