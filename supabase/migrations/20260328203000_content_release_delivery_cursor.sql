alter table public.content_releases
add column if not exists delivery_cursor text;
