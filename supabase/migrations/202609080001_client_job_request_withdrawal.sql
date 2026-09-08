begin;

alter table public.client_job_requests
  drop constraint client_job_requests_status_check;

alter table public.client_job_requests
  add constraint client_job_requests_status_check
  check (
    status in (
      'new',
      'in_review',
      'converted',
      'dismissed',
      'withdrawn'
    )
  );

alter table public.client_job_requests
  add column withdrawn_at timestamptz,
  add column withdrawn_by uuid
    references public.profiles(id);

alter table public.client_job_requests
  add constraint client_job_requests_withdrawal_check
  check (
    (
      status = 'withdrawn'
      and withdrawn_at is not null
      and withdrawn_by is not null
      and withdrawn_by = submitted_by
      and converted_application_id is null
    )
    or
    (
      status <> 'withdrawn'
      and withdrawn_at is null
      and withdrawn_by is null
    )
  );

commit;
