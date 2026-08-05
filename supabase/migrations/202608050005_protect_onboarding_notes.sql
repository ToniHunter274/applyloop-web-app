begin;

drop policy if exists
  "Clients can view their onboarding"
  on public.client_onboarding_steps;

comment on column
  public.client_onboarding_steps.notes
is
  'Internal staff notes. Accessible only to authorized Admin and Owner accounts.';

commit;
