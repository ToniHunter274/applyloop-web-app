begin;

drop policy if exists
  "Clients can view their own record"
  on public.clients;

comment on column public.clients.notes is
  'Internal staff notes. Accessible only to authorized Admin and Owner accounts.';

comment on column public.clients.created_by is
  'Internal staff metadata. Accessible only to authorized Admin and Owner accounts.';

commit;
