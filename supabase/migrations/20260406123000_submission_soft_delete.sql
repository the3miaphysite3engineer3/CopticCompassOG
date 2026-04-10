alter table public.submissions
add column if not exists deleted_at timestamptz,
add column if not exists deleted_by uuid
  references public.profiles (id) on delete set null,
add column if not exists deletion_reason text;
