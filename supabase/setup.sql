create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_slug text not null,
  submitted_text text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewed')),
  rating integer check (rating is null or rating between 1 and 5),
  feedback_text text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists submissions_user_id_idx
  on public.submissions (user_id);

create index if not exists submissions_created_at_idx
  on public.submissions (created_at desc);

create index if not exists submissions_lesson_slug_idx
  on public.submissions (lesson_slug);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into public.profiles (id, email)
select id, email
from auth.users
on conflict (id) do update
  set email = excluded.email;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Users can read their own submissions" on public.submissions;
drop policy if exists "Admins can read all submissions" on public.submissions;
drop policy if exists "Users can insert their own submissions" on public.submissions;
drop policy if exists "Admins can update submissions" on public.submissions;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

create policy "Users can read their own submissions"
on public.submissions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can read all submissions"
on public.submissions
for select
to authenticated
using (public.is_admin());

create policy "Users can insert their own submissions"
on public.submissions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Admins can update submissions"
on public.submissions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- After running this file, promote your own account manually:
-- update public.profiles
-- set role = 'admin'
-- where email = 'your-email@example.com';
