alter table public.submissions
add column if not exists exercise_id text,
add column if not exists submitted_language text
  check (submitted_language is null or submitted_language in ('en', 'nl')),
add column if not exists answers jsonb,
add column if not exists reviewed_at timestamptz,
add column if not exists reviewed_by uuid
  references public.profiles (id) on delete set null;

create index if not exists submissions_status_created_at_idx
  on public.submissions (status, created_at desc);

create index if not exists submissions_exercise_id_idx
  on public.submissions (exercise_id);

create index if not exists submissions_reviewed_at_idx
  on public.submissions (reviewed_at desc)
  where reviewed_at is not null;

create index if not exists submissions_reviewed_by_idx
  on public.submissions (reviewed_by)
  where reviewed_by is not null;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  inquiry_type text not null,
  message text not null check (char_length(message) between 5 and 5000),
  locale text not null check (locale in ('en', 'nl')),
  wants_updates boolean not null default false,
  status text not null default 'new' check (
    status in ('new', 'in_progress', 'answered', 'archived')
  ),
  created_at timestamptz not null default timezone('utc', now()),
  responded_at timestamptz
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_status_created_at_idx
  on public.contact_messages (status, created_at desc);

create index if not exists contact_messages_email_created_at_idx
  on public.contact_messages (email, created_at desc);

alter table public.contact_messages enable row level security;

drop policy if exists "Admins can read all contact messages" on public.contact_messages;
drop policy if exists "Admins can update contact messages" on public.contact_messages;

create policy "Admins can read all contact messages"
on public.contact_messages
for select
to authenticated
using (public.is_admin());

create policy "Admins can update contact messages"
on public.contact_messages
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
