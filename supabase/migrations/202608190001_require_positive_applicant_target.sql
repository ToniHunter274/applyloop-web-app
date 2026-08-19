begin;

alter table public.applicants
  drop constraint if exists applicants_active_tasks_check;

alter table public.applicants
  add constraint applicants_active_tasks_check
  check (active_tasks >= 1);

commit;
