begin;

alter table public.clients
  add column if not exists assigned_applicant_id uuid
    references public.profiles(id) on delete set null;

create index if not exists clients_assigned_applicant_id_idx
  on public.clients(assigned_applicant_id);

commit;
