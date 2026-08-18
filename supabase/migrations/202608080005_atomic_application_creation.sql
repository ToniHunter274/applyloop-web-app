begin;

with application_counts as (
  select
    client_id,
    count(*)::integer as application_count
  from public.applications
  group by client_id
)
update public.clients
set applications_completed =
  greatest(
    public.clients.applications_completed,
    application_counts.application_count
  )
from application_counts
where public.clients.id =
  application_counts.client_id;

create or replace function
public.create_applicant_application(
  p_applicant_id uuid,
  p_client_id uuid,
  p_created_by uuid,
  p_company text,
  p_position text,
  p_location text,
  p_status text,
  p_link_source text,
  p_role text,
  p_preferences jsonb,
  p_job_url text,
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
  v_applicant_user_id uuid;
  v_applicant_account_status text;
  v_client_user_id uuid;
  v_client_status text;
  v_application_limit integer;
  v_applications_completed integer;
  v_application
    public.applications%rowtype;
begin
  select
    applicant.user_id
  into
    v_applicant_user_id
  from public.applicants
    as applicant
  where applicant.id =
    p_applicant_id
  for update;

  if not found then
    raise exception
      'Applicant not found.';
  end if;

  if
    v_applicant_user_id <>
    p_created_by
  then
    raise exception
      'Applicant identity mismatch.';
  end if;

  select
    profile.account_status
  into
    v_applicant_account_status
  from public.profiles
    as profile
  where profile.id =
      v_applicant_user_id
    and profile.role =
      'applicant';

  if not found then
    raise exception
      'Applicant profile not found.';
  end if;

  if
    v_applicant_account_status <>
    'active'
  then
    raise exception
      'Your Applicant account is not active.';
  end if;

  select
    client.user_id,
    client.status,
    client.application_limit,
    client.applications_completed
  into
    v_client_user_id,
    v_client_status,
    v_application_limit,
    v_applications_completed
  from public.clients
    as client
  where client.id =
    p_client_id
  for update;

  if not found then
    raise exception
      'Client not found.';
  end if;

  if
    v_client_status <>
    'active'
  then
    raise exception
      'Applications cannot be recorded for a paused or completed Client.';
  end if;

  perform 1
  from
    public.client_applicant_assignments
      as assignment
  where assignment.applicant_id =
      p_applicant_id
    and assignment.client_id =
      p_client_id
  for update;

  if not found then
    raise exception
      'This Client is not assigned to you.';
  end if;

  if
    v_applications_completed >=
    v_application_limit
  then
    raise exception
      'This Client has reached the application limit.';
  end if;

  insert into
    public.applications
      as application (
        client_id,
        created_by,
        company,
        position,
        location,
        status,
        link_source,
        role,
        preferences,
        job_url,
        resume_name,
        cover_letter_name,
        job_details,
        qualities,
        other_details
      )
  values (
    p_client_id,
    p_created_by,
    p_company,
    p_position,
    p_location,
    p_status,
    p_link_source,
    p_role,
    p_preferences,
    p_job_url,
    p_resume_name,
    p_cover_letter_name,
    p_job_details,
    p_qualities,
    p_other_details
  )
  returning
    application.*
  into
    v_application;

  update public.clients
    as client
  set applications_completed =
    client.applications_completed + 1
  where client.id =
    p_client_id;

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
    v_client_user_id;
end;
$function$;

revoke all
on function
public.create_applicant_application(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  text,
  text,
  text,
  jsonb,
  jsonb,
  jsonb
)
from public;

revoke all
on function
public.create_applicant_application(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  text,
  text,
  text,
  jsonb,
  jsonb,
  jsonb
)
from anon;

revoke all
on function
public.create_applicant_application(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  text,
  text,
  text,
  jsonb,
  jsonb,
  jsonb
)
from authenticated;

grant execute
on function
public.create_applicant_application(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  text,
  text,
  text,
  jsonb,
  jsonb,
  jsonb
)
to service_role;

commit;
