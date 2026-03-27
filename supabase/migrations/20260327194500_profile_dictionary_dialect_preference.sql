alter table public.profiles
add column if not exists preferred_dictionary_dialect text
  not null
  default 'B'
  check (preferred_dictionary_dialect in ('ALL', 'S', 'B', 'A', 'L', 'F'));
