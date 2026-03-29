alter table public.audience_contacts
add column if not exists resend_contact_id text,
add column if not exists resend_last_synced_at timestamptz,
add column if not exists resend_sync_error text;
