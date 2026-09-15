begin;

-- ============================================================
-- OPPORTUNITY -> APPLICATION RELATIONSHIP
--
-- client_job_requests is the canonical Opportunity record.
-- converted_application_id already links Opportunity -> Application.
--
-- Add the reverse Application -> Opportunity relationship so every
-- role can navigate the same workflow identity in either direction.
-- ============================================================

alter table public.applications
  add column if not exists job_request_id uuid;


-- ------------------------------------------------------------
-- FOREIGN KEY
-- ------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname =
      'applications_job_request_id_fkey'
      and conrelid =
        'public.applications'::regclass
  ) then
    alter table public.applications
      add constraint
        applications_job_request_id_fkey
      foreign key (job_request_id)
      references public.client_job_requests(id)
      on delete set null;
  end if;
end
$$;


-- ------------------------------------------------------------
-- VERIFY EXISTING CONVERSIONS ARE ONE-TO-ONE
-- ------------------------------------------------------------

do $$
begin
  if exists (
    select
      converted_application_id
    from public.client_job_requests
    where converted_application_id is not null
    group by converted_application_id
    having count(*) > 1
  ) then
    raise exception
      'An Application is linked to more than one job request.';
  end if;
end
$$;


-- ------------------------------------------------------------
-- PROTECT AGAINST PRE-EXISTING CONFLICTING REVERSE LINKS
-- ------------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from public.applications
      as application
    join public.client_job_requests
      as request
      on request.converted_application_id =
        application.id
    where application.job_request_id
      is not null
      and application.job_request_id <>
        request.id
  ) then
    raise exception
      'An Application has a conflicting job request link.';
  end if;
end
$$;


-- ------------------------------------------------------------
-- BACKFILL EXISTING CONVERTED OPPORTUNITIES
-- ------------------------------------------------------------

update public.applications
  as application
set
  job_request_id = request.id
from public.client_job_requests
  as request
where
  request.converted_application_id =
    application.id
  and application.job_request_id is null;


-- ------------------------------------------------------------
-- ENFORCE ONE OPPORTUNITY <-> ONE APPLICATION
-- ------------------------------------------------------------

create unique index if not exists
  applications_job_request_unique_idx
on public.applications(job_request_id)
where job_request_id is not null;

create unique index if not exists
  client_job_requests_converted_application_unique_idx
on public.client_job_requests(
  converted_application_id
)
where converted_application_id is not null;


-- ------------------------------------------------------------
-- KEEP THE REVERSE LINK SYNCHRONIZED
--
-- Existing conversion RPCs already set:
-- client_job_requests.converted_application_id
--
-- This trigger makes that existing write automatically populate:
-- applications.job_request_id
-- ------------------------------------------------------------

create or replace function
public.sync_application_job_request_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  -- A previous conversion link was cleared or replaced.
  if
    old.converted_application_id
      is not null
    and old.converted_application_id
      is distinct from
        new.converted_application_id
  then
    update public.applications
    set job_request_id = null
    where id =
      old.converted_application_id
      and job_request_id =
        old.id;
  end if;

  -- No new Application link to synchronize.
  if new.converted_application_id
    is null
  then
    return new;
  end if;

  update public.applications
  set job_request_id = new.id
  where id =
    new.converted_application_id
    and (
      job_request_id is null
      or job_request_id = new.id
    );

  if not found then
    raise exception
      'The converted Application is already linked to another job request.';
  end if;

  return new;
end;
$function$;


drop trigger if exists
  sync_application_job_request_link
on public.client_job_requests;

create trigger
  sync_application_job_request_link
after update of converted_application_id
on public.client_job_requests
for each row
when (
  old.converted_application_id
    is distinct from
  new.converted_application_id
)
execute function
  public.sync_application_job_request_link();


comment on column
  public.applications.job_request_id
is
  'Canonical Opportunity (client_job_requests) that produced this Application. Null for Applications created directly by an Applicant.';


commit;
