begin;

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
begin
  select
    request.*
  into
    v_request
  from public.client_job_requests
    as request
  where request.id =
    p_job_request_id
  for update;

  if not found then
    raise exception
      'Client job request not found.';
  end if;

  if
    v_request.client_id <>
    p_client_id
  then
    raise exception
      'Client job request does not belong to this Client.';
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

  select
    application.*
  into
    v_application
  from public.create_applicant_application(
    p_applicant_id,
    p_client_id,
    p_created_by,
    p_company,
    p_position,
    p_location,
    p_status,
    'Client',
    p_role,
    p_preferences,
    v_request.job_url,
    p_resume_name,
    p_cover_letter_name,
    p_job_details,
    p_qualities,
    p_other_details
  ) as application;

  if
    v_application.id is null
  then
    raise exception
      'The Application could not be recorded.';
  end if;

  update public.client_job_requests
    as request
  set
    status = 'converted',
    converted_application_id =
      v_application.id,
    reviewed_by =
      p_created_by,
    reviewed_at =
      now()
  where request.id =
    p_job_request_id;

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
