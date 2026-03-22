create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id text not null,
  lesson_slug text not null,
  started_at timestamptz not null default timezone('utc', now()),
  last_viewed_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);

create table if not exists public.section_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id text not null,
  lesson_slug text not null,
  section_id text not null,
  section_slug text not null,
  completed_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, section_id)
);

create table if not exists public.lesson_bookmarks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id text not null,
  lesson_slug text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, lesson_id)
);

create table if not exists public.lesson_notes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id text not null,
  lesson_slug text not null,
  note_text text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, lesson_id)
);

create index if not exists lesson_progress_user_id_idx
  on public.lesson_progress (user_id);

create index if not exists lesson_progress_lesson_slug_idx
  on public.lesson_progress (lesson_slug);

create index if not exists lesson_progress_last_viewed_at_idx
  on public.lesson_progress (last_viewed_at desc);

create index if not exists section_progress_user_id_idx
  on public.section_progress (user_id);

create index if not exists section_progress_lesson_id_idx
  on public.section_progress (lesson_id);

create index if not exists section_progress_completed_at_idx
  on public.section_progress (completed_at desc);

create index if not exists lesson_bookmarks_user_id_idx
  on public.lesson_bookmarks (user_id);

create index if not exists lesson_bookmarks_created_at_idx
  on public.lesson_bookmarks (created_at desc);

create index if not exists lesson_notes_user_id_idx
  on public.lesson_notes (user_id);

create index if not exists lesson_notes_updated_at_idx
  on public.lesson_notes (updated_at desc);

alter table public.lesson_progress enable row level security;
alter table public.section_progress enable row level security;
alter table public.lesson_bookmarks enable row level security;
alter table public.lesson_notes enable row level security;

drop policy if exists "Users can read their own lesson progress" on public.lesson_progress;
drop policy if exists "Users can insert their own lesson progress" on public.lesson_progress;
drop policy if exists "Users can update their own lesson progress" on public.lesson_progress;
drop policy if exists "Admins can read all lesson progress" on public.lesson_progress;
drop policy if exists "Users can read their own section progress" on public.section_progress;
drop policy if exists "Users can insert their own section progress" on public.section_progress;
drop policy if exists "Users can update their own section progress" on public.section_progress;
drop policy if exists "Users can delete their own section progress" on public.section_progress;
drop policy if exists "Admins can read all section progress" on public.section_progress;
drop policy if exists "Users can read their own lesson bookmarks" on public.lesson_bookmarks;
drop policy if exists "Users can insert their own lesson bookmarks" on public.lesson_bookmarks;
drop policy if exists "Users can delete their own lesson bookmarks" on public.lesson_bookmarks;
drop policy if exists "Admins can read all lesson bookmarks" on public.lesson_bookmarks;
drop policy if exists "Users can read their own lesson notes" on public.lesson_notes;
drop policy if exists "Users can insert their own lesson notes" on public.lesson_notes;
drop policy if exists "Users can update their own lesson notes" on public.lesson_notes;
drop policy if exists "Users can delete their own lesson notes" on public.lesson_notes;
drop policy if exists "Admins can read all lesson notes" on public.lesson_notes;

create policy "Users can read their own lesson progress"
on public.lesson_progress
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own lesson progress"
on public.lesson_progress
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own lesson progress"
on public.lesson_progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Admins can read all lesson progress"
on public.lesson_progress
for select
to authenticated
using (public.is_admin());

create policy "Users can read their own section progress"
on public.section_progress
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own section progress"
on public.section_progress
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own section progress"
on public.section_progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own section progress"
on public.section_progress
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Admins can read all section progress"
on public.section_progress
for select
to authenticated
using (public.is_admin());

create policy "Users can read their own lesson bookmarks"
on public.lesson_bookmarks
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own lesson bookmarks"
on public.lesson_bookmarks
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete their own lesson bookmarks"
on public.lesson_bookmarks
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Admins can read all lesson bookmarks"
on public.lesson_bookmarks
for select
to authenticated
using (public.is_admin());

create policy "Users can read their own lesson notes"
on public.lesson_notes
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own lesson notes"
on public.lesson_notes
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own lesson notes"
on public.lesson_notes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own lesson notes"
on public.lesson_notes
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Admins can read all lesson notes"
on public.lesson_notes
for select
to authenticated
using (public.is_admin());
