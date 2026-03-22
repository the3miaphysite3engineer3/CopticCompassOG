alter table public.profiles
add column if not exists full_name text,
add column if not exists avatar_url text;

insert into public.profiles (id, email, role, full_name, avatar_url)
select
  id,
  email,
  'student',
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, full_name, avatar_url)
  values (
    new.id,
    new.email,
    'student',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  return new;
end;
$$;

drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not public.is_admin() then
      raise exception 'Security Breach: Unauthorized role change attempt';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists check_role_update on public.profiles;

create trigger check_role_update
before update on public.profiles
for each row execute function public.protect_profile_role();

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update
  set public = excluded.public;

drop policy if exists "Avatars are publicly accessible." on storage.objects;
drop policy if exists "Users can upload their own avatar." on storage.objects;
drop policy if exists "Users can update their own avatar." on storage.objects;
drop policy if exists "Users can delete their own avatar." on storage.objects;
drop policy if exists "Users can read their own avatar objects" on storage.objects;
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;

create policy "Users can read their own avatar objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
