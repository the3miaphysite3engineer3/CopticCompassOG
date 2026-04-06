alter table public.submissions
add column if not exists submission_intent_id text;

create unique index if not exists submissions_submission_intent_id_uidx
  on public.submissions (submission_intent_id)
  where submission_intent_id is not null;
