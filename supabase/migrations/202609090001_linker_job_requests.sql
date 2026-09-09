begin;

-- Permit database-derived Linker attribution on converted
-- applications. Browser input must never choose this value.
alter table public.applications
  drop constraint if exists
    applications_link_source_check;

alter table public.applications
  add constraint applications_link_source_check
  check (
    link_source in (
      'Client',
      'Finder',
      'Applicant',
      'Linker'
    )
  );


-- Existing rows remain Client requests. Linker requests target one
-- Applicant and retain the exact assignment used at submission.
alter table public.client_job_requests
  add column request_source text
    not null default 'client',

  add column target_applicant_id uuid
    references public.applicants(id)
    on delete restrict,

  add column linker_assignment_id uuid
    references public.linker_applicant_assignments(id)
    on delete restrict;

alter table public.client_job_requests
  add constraint client_job_requests_source_check
  check (
    request_source in (
      'client',
      'linker'
    )
  );

alter table public.client_job_requests
  add constraint client_job_requests_attribution_check
  check (
    (
      request_source = 'client'
      and target_applicant_id is null
      and linker_assignment_id is null
    )
    or
    (
      request_source = 'linker'
      and target_applicant_id is not null
      and linker_assignment_id is not null
    )
  );

create index
  client_job_requests_target_applicant_idx
on public.client_job_requests(
  target_applicant_id,
  created_at desc
)
where request_source = 'linker';


-- Source, target, and submitter identify provenance and cannot be
-- rewritten after a request has been created.
create or replace function
public.prevent_job_request_attribution_changes()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if
    old.client_id is distinct from
      new.client_id
    or old.submitted_by is distinct from
      new.submitted_by
    or old.job_url is distinct from
      new.job_url
    or old.request_source is distinct from
      new.request_source
    or old.target_applicant_id is distinct from
      new.target_applicant_id
    or old.linker_assignment_id is distinct from
      new.linker_assignment_id
  then
    raise exception
      'Job request attribution cannot be changed.';
  end if;

  return new;
end;
$function$;

drop trigger if exists
  prevent_job_request_attribution_changes
on public.client_job_requests;

create trigger
  prevent_job_request_attribution_changes
before update
on public.client_job_requests
for each row
execute function
  public.prevent_job_request_attribution_changes();


-- Client requests remain visible to all Applicants assigned to that
-- Client. Linker requests are visible only to their target Applicant.
drop policy if exists
  "Assigned applicants can view job requests"
on public.client_job_requests;

create policy
  "Assigned applicants can view job requests"
on public.client_job_requests
for select
to authenticated
using (
  (
    request_source = 'client'
    and exists (
      select 1
      from public.client_staff_assignments
      where client_staff_assignments.client_id =
        client_job_requests.client_id
        and client_staff_assignments.staff_user_id =
          (select auth.uid())
        and client_staff_assignments.assignment_role =
          'applicant'
        and client_staff_assignments.is_active = true
    )
  )
  or
  (
    request_source = 'linker'
    and exists (
      select 1
      from public.applicants
      where applicants.id =
        client_job_requests.target_applicant_id
        and applicants.user_id =
          (select auth.uid())
    )
    and exists (
      select 1
      from public.client_applicant_assignments
      where client_applicant_assignments.applicant_id =
        client_job_requests.target_applicant_id
        and client_applicant_assignments.client_id =
          client_job_requests.client_id
    )
  )
);


-- Clients should only see requests they submitted themselves.
drop policy if exists
  "Clients can view their job requests"
on public.client_job_requests;

create policy
  "Clients can view their job requests"
on public.client_job_requests
for select
to authenticated
using (
  request_source = 'client'
  and submitted_by = (select auth.uid())
  and public.user_owns_client(client_id)
);


create policy
  "Linkers can view their submitted job requests"
on public.client_job_requests
for select
to authenticated
using (
  request_source = 'linker'
  and submitted_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'linker'
      and profiles.account_status = 'active'
  )
);


-- This server-only function verifies both assignment relationships
-- at submission time and derives all attribution fields.
create or replace function
public.create_linker_job_request(
  p_linker_user_id uuid,
  p_applicant_id uuid,
  p_client_id uuid,
  p_job_url text,
  p_comment text
)
returns table (
  id uuid,
  client_id uuid,
  submitted_by uuid,
  job_url text,
  comment text,
  status text,
  request_source text,
  target_applicant_id uuid,
  linker_assignment_id uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_linker_assignment_id uuid;
  v_applicant_user_id uuid;
  v_applicant_availability text;
  v_applicant_status text;
  v_client_status text;
  v_request
    public.client_job_requests%rowtype;
begin
  perform 1
  from public.profiles
  where profiles.id = p_linker_user_id
    and profiles.role = 'linker'
    and profiles.account_status = 'active';

  if not found then
    raise exception
      'Your Linker account is not active.';
  end if;

  select assignment.id
  into v_linker_assignment_id
  from public.linker_applicant_assignments
    as assignment
  where assignment.linker_user_id =
      p_linker_user_id
    and assignment.applicant_id =
      p_applicant_id
    and assignment.is_active = true
  for update;

  if not found then
    raise exception
      'This Applicant is not assigned to you.';
  end if;

  select
    applicant.user_id,
    applicant.availability
  into
    v_applicant_user_id,
    v_applicant_availability
  from public.applicants
    as applicant
  where applicant.id = p_applicant_id
  for update;

  if not found then
    raise exception
      'Applicant not found.';
  end if;

  select profile.account_status
  into v_applicant_status
  from public.profiles
    as profile
  where profile.id = v_applicant_user_id
    and profile.role = 'applicant';

  if
    not found
    or v_applicant_status <> 'active'
  then
    raise exception
      'The Applicant account is not active.';
  end if;

  if v_applicant_availability <> 'available' then
    raise exception
      'The Applicant is not available.';
  end if;

  select client.status
  into v_client_status
  from public.clients
    as client
  where client.id = p_client_id
  for update;

  if not found then
    raise exception
      'Client not found.';
  end if;

  if v_client_status <> 'active' then
    raise exception
      'The Client is not active.';
  end if;

  perform 1
  from public.client_applicant_assignments
    as assignment
  where assignment.applicant_id =
      p_applicant_id
    and assignment.client_id =
      p_client_id
  for update;

  if not found then
    raise exception
      'This Client is not assigned to the selected Applicant.';
  end if;

  insert into public.client_job_requests
    as request (
      client_id,
      submitted_by,
      job_url,
      comment,
      status,
      request_source,
      target_applicant_id,
      linker_assignment_id
    )
  values (
    p_client_id,
    p_linker_user_id,
    p_job_url,
    nullif(btrim(p_comment), ''),
    'new',
    'linker',
    p_applicant_id,
    v_linker_assignment_id
  )
  returning request.*
  into v_request;

  return query
  select
    v_request.id,
    v_request.client_id,
    v_request.submitted_by,
    v_request.job_url,
    v_request.comment,
    v_request.status,
    v_request.request_source,
    v_request.target_applicant_id,
    v_request.linker_assignment_id,
    v_request.created_at;
end;
$function$;

revoke all
on function public.create_linker_job_request(
  uuid,
  uuid,
  uuid,
  text,
  text
)
from public;

revoke all
on function public.create_linker_job_request(
  uuid,
  uuid,
  uuid,
  text,
  text
)
from anon;

revoke all
on function public.create_linker_job_request(
  uuid,
  uuid,
  uuid,
  text,
  text
)
from authenticated;

grant execute
on function public.create_linker_job_request(
  uuid,
  uuid,
  uuid,
  text,
  text
)
to service_role;


-- Preserve Client attribution and derive Linker attribution during
-- atomic Applicant conversion.
create or replace function
public.create_client_requested_application(
  p_job_request_id uuid,
  p_applicant_id uuid,
  p_client_id uuid,
  p_created_by uuid,
  p_company text,
  p_position text,
  p_location text,
  p_status text,
  p_role text,
  p_preferences jsonb,
  p_resume_name text,
  p_cover_letter_name text,
  p_job_details jsonb,
  p_qualities jsonb,
  p_other_details jsonb
)
returns table (
  id uuid,
  client_id uuid,
  company text,
  "position" text,
  location text,
  status text,
  link_source text,
  role text,
  applied_at timestamptz,
  preferences jsonb,
  job_url text,
  resume_name text,
  cover_letter_name text,
  feedback text,
  job_details jsonb,
  qualities jsonb,
  other_details jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  client_user_id uuid
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_request
    public.client_job_requests%rowtype;
  v_application record;
  v_link_source text;
begin
  select request.*
  into v_request
  from public.client_job_requests
    as request
  where request.id = p_job_request_id
  for update;

  if not found then
    raise exception
      'Client job request not found.';
  end if;

  if v_request.client_id <> p_client_id then
    raise exception
      'Client job request does not belong to this Client.';
  end if;

  if
    v_request.request_source = 'linker'
    and v_request.target_applicant_id <>
      p_applicant_id
  then
    raise exception
      'This Linker job request is not assigned to you.';
  end if;

  if
    v_request.status not in (
      'new',
      'in_review'
    )
  then
    raise exception
      'Client job request has already been completed.';
  end if;

  v_link_source =
    case v_request.request_source
      when 'linker' then 'Linker'
      else 'Client'
    end;

  select application.*
  into v_application
  from public.create_applicant_application(
    p_applicant_id,
    p_client_id,
    p_created_by,
    p_company,
    p_position,
    p_location,
    p_status,
    v_link_source,
    p_role,
    p_preferences,
    v_request.job_url,
    p_resume_name,
    p_cover_letter_name,
    p_job_details,
    p_qualities,
    p_other_details
  ) as application;

  if v_application.id is null then
    raise exception
      'The Application could not be recorded.';
  end if;

  update public.client_job_requests
    as request
  set
    status = 'converted',
    converted_application_id =
      v_application.id,
    reviewed_by = p_created_by,
    reviewed_at = now()
  where request.id = p_job_request_id;

  return query
  select
    v_application.id,
    v_application.client_id,
    v_application.company,
    v_application.position,
    v_application.location,
    v_application.status,
    v_application.link_source,
    v_application.role,
    v_application.applied_at,
    v_application.preferences,
    v_application.job_url,
    v_application.resume_name,
    v_application.cover_letter_name,
    v_application.feedback,
    v_application.job_details,
    v_application.qualities,
    v_application.other_details,
    v_application.created_at,
    v_application.updated_at,
    v_application.client_user_id;
end;
$function$;

revoke all
on function
public.create_client_requested_application(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  text,
  text,
  jsonb,
  jsonb,
  jsonb
)
from public;

revoke all
on function
public.create_client_requested_application(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  text,
  text,
  jsonb,
  jsonb,
  jsonb
)
from anon;

revoke all
on function
public.create_client_requested_application(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  text,
  text,
  jsonb,
  jsonb,
  jsonb
)
from authenticated;

grant execute
on function
public.create_client_requested_application(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  text,
  text,
  jsonb,
  jsonb,
  jsonb
)
to service_role;

commit;
