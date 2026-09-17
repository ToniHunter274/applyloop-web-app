begin;

create or replace function
public.create_linker_allocation_job_request_with_details(
  p_linker_user_id uuid,
  p_allocation_id uuid,
  p_applicant_id uuid,
  p_client_id uuid,
  p_job_url text,
  p_comment text,
  p_job_company text,
  p_job_position text,
  p_job_location text,
  p_job_type text,
  p_salary_range text,
  p_link_provider text
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
  linker_work_allocation_id uuid,
  job_company text,
  job_position text,
  job_location text,
  job_type text,
  salary_range text,
  link_provider text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_allocation
    public.linker_work_allocations%rowtype;

  v_applicant_user_id uuid;
  v_applicant_availability text;
  v_applicant_status text;
  v_client_status text;

  v_request
    public.client_job_requests%rowtype;
begin
  -- Linker must still be active.
  perform 1
  from public.profiles as linker_profile
  where linker_profile.id =
      p_linker_user_id
    and linker_profile.role =
      'linker'
    and linker_profile.account_status =
      'active';

  if not found then
    raise exception
      'Your Linker account is not active.';
  end if;


  -- Allocation is the operational source of truth.
  select allocation.*
  into v_allocation
  from public.linker_work_allocations
    as allocation
  where allocation.id =
      p_allocation_id
    and allocation.linker_user_id =
      p_linker_user_id
  for update;

  if not found then
    raise exception
      'This work allocation is not assigned to you.';
  end if;

  if v_allocation.status <> 'active' then
    raise exception
      'This work allocation is not active.';
  end if;

  if v_allocation.client_id <>
      p_client_id
  then
    raise exception
      'The selected Client does not match this work allocation.';
  end if;


  -- Applicant must be explicitly permitted on this allocation.
  perform 1
  from public.linker_work_allocation_applicants
    as allocation_applicant
  where allocation_applicant.allocation_id =
      p_allocation_id
    and allocation_applicant.applicant_id =
      p_applicant_id;

  if not found then
    raise exception
      'The selected Applicant is not part of this work allocation.';
  end if;


  -- Applicant must still be operational.
  select
    applicant.user_id,
    applicant.availability
  into
    v_applicant_user_id,
    v_applicant_availability
  from public.applicants
    as applicant
  where applicant.id =
      p_applicant_id
  for update;

  if not found then
    raise exception
      'Applicant not found.';
  end if;

  select profile.account_status
  into v_applicant_status
  from public.profiles
    as profile
  where profile.id =
      v_applicant_user_id
    and profile.role =
      'applicant';

  if
    not found
    or v_applicant_status <>
      'active'
  then
    raise exception
      'The Applicant account is not active.';
  end if;

  if v_applicant_availability <>
      'available'
  then
    raise exception
      'The Applicant is not available.';
  end if;


  -- Client must still be active.
  select client.status
  into v_client_status
  from public.clients
    as client
  where client.id =
      p_client_id
  for update;

  if not found then
    raise exception
      'Client not found.';
  end if;

  if v_client_status <> 'active' then
    raise exception
      'The Client is not active.';
  end if;


  -- Applicant must still actually work on this Client.
  perform 1
  from public.client_applicant_assignments
    as client_assignment
  where client_assignment.client_id =
      p_client_id
    and client_assignment.applicant_id =
      p_applicant_id;

  if not found then
    raise exception
      'The selected Applicant is no longer assigned to this Client.';
  end if;


  if nullif(
    btrim(p_job_company),
    ''
  ) is null then
    raise exception
      'Company name is required.';
  end if;

  if nullif(
    btrim(p_job_position),
    ''
  ) is null then
    raise exception
      'Job position is required.';
  end if;

  if nullif(
    btrim(p_job_location),
    ''
  ) is null then
    raise exception
      'Job location is required.';
  end if;

  if nullif(
    btrim(p_job_type),
    ''
  ) is null then
    raise exception
      'Job type is required.';
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
      linker_assignment_id,
      linker_work_allocation_id,
      job_company,
      job_position,
      job_location,
      job_type,
      salary_range,
      link_provider
    )
  values (
    p_client_id,
    p_linker_user_id,
    p_job_url,
    nullif(
      btrim(p_comment),
      ''
    ),
    'new',
    'linker',
    p_applicant_id,
    null,
    p_allocation_id,
    btrim(p_job_company),
    btrim(p_job_position),
    btrim(p_job_location),
    btrim(p_job_type),
    nullif(
      btrim(p_salary_range),
      ''
    ),
    nullif(
      btrim(p_link_provider),
      ''
    )
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
    v_request.linker_work_allocation_id,
    v_request.job_company,
    v_request.job_position,
    v_request.job_location,
    v_request.job_type,
    v_request.salary_range,
    v_request.link_provider,
    v_request.created_at;
end;
$function$;


revoke all
on function
public.create_linker_allocation_job_request_with_details(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
)
from public, anon, authenticated;


grant execute
on function
public.create_linker_allocation_job_request_with_details(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
)
to service_role;

commit;
