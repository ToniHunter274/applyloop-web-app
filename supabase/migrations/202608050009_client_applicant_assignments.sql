begin;

create table if not exists public.client_applicant_assignments (
  id uuid primary key default gen_random_uuid(),

  client_id uuid not null
    references public.clients(id)
    on delete cascade,

  applicant_id uuid not null
    references public.applicants(id)
    on delete cascade,

  assigned_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null
    default timezone('utc', now()),

  unique (client_id, applicant_id)
);

create index if not exists
  client_applicant_assignments_client_idx
  on public.client_applicant_assignments(client_id);

create index if not exists
  client_applicant_assignments_applicant_idx
  on public.client_applicant_assignments(applicant_id);

create or replace function
public.enforce_client_applicant_limit()
returns trigger
language plpgsql
as $$
declare
  assignment_count integer;
begin
  perform pg_advisory_xact_lock(
    hashtext(new.client_id::text)::bigint
  );

  select count(*)
  into assignment_count
  from public.client_applicant_assignments
  where client_id = new.client_id;

  if assignment_count >= 2 then
    raise exception
      'This client already has the maximum of 2 applicants assigned.';
  end if;

  return new;
end;
$$;

drop trigger if exists
  enforce_client_applicant_limit_trigger
  on public.client_applicant_assignments;

create trigger
  enforce_client_applicant_limit_trigger
before insert
on public.client_applicant_assignments
for each row
execute function
  public.enforce_client_applicant_limit();

alter table public.client_applicant_assignments
  enable row level security;

revoke all
  on public.client_applicant_assignments
  from anon;

revoke all
  on public.client_applicant_assignments
  from authenticated;

grant all
  on public.client_applicant_assignments
  to service_role;

commit;
