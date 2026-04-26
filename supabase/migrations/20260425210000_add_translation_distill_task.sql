alter table public.distill_examples drop constraint distill_examples_task_type_check;
alter table public.distill_examples add constraint distill_examples_task_type_check check (
  task_type in ('qa', 'rewrite', 'retrieval', 'contrastive', 'translation')
);
