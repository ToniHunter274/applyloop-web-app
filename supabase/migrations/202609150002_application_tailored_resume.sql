begin;

alter table public.applications
  add column if not exists
    tailored_resume_text text;

comment on column
  public.applications.tailored_resume_text
is
  'Application-specific tailored resume text used for this job. The Client master resume remains unchanged.';


-- ==========================================================
-- Applicant-sourced Applications
--
-- This overload preserves the existing canonical creation
-- function and adds one optional application-specific resume
-- parameter.
-- ==========================================================

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
  p_other_details jsonb,
  p_tailored_resume_text text
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
  v_created record;
begin
  select *
  into v_created
  from public.create_applicant_application(
    p_applicant_id,
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
  );

  if not found then
    raise exception
      'Application creation returned no row.';
  end if;

  update public.applications
    as application
  set tailored_resume_text =
    nullif(
      btrim(
        p_tailored_resume_text
      ),
      ''
    )
  where application.id =
    v_created.id;

  return query
  select
    v_created.id,
    v_created.client_id,
    v_created.company,
    v_created.position,
    v_created.location,
    v_created.status,
    v_created.link_source,
    v_created.role,
    v_created.applied_at,
    v_created.preferences,
    v_created.job_url,
    v_created.resume_name,
    v_created.cover_letter_name,
    v_created.feedback,
    v_created.job_details,
    v_created.qualities,
    v_created.other_details,
    v_created.created_at,
    v_created.updated_at,
    v_created.client_user_id;
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
  jsonb,
  text
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
  jsonb,
  text
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
  jsonb,
  text
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
  jsonb,
  text
)
to service_role;


-- ==========================================================
-- Client / Linker sourced Opportunity conversions
-- ==========================================================

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
  p_other_details jsonb,
  p_tailored_resume_text text
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
  v_created record;
begin
  select *
  into v_created
  from public.create_client_requested_application(
    p_job_request_id,
    p_applicant_id,
    p_client_id,
    p_created_by,
    p_company,
    p_position,
    p_location,
    p_status,
    p_role,
    p_preferences,
    p_resume_name,
    p_cover_letter_name,
    p_job_details,
    p_qualities,
    p_other_details
  );

  if not found then
    raise exception
      'Application creation returned no row.';
  end if;

  update public.applications
    as application
  set tailored_resume_text =
    nullif(
      btrim(
        p_tailored_resume_text
      ),
      ''
    )
  where application.id =
    v_created.id;

  return query
  select
    v_created.id,
    v_created.client_id,
    v_created.company,
    v_created.position,
    v_created.location,
    v_created.status,
    v_created.link_source,
    v_created.role,
    v_created.applied_at,
    v_created.preferences,
    v_created.job_url,
    v_created.resume_name,
    v_created.cover_letter_name,
    v_created.feedback,
    v_created.job_details,
    v_created.qualities,
    v_created.other_details,
    v_created.created_at,
    v_created.updated_at,
    v_created.client_user_id;
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
  jsonb,
  text
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
  jsonb,
  text
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
  jsonb,
  text
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
  jsonb,
  text
)
to service_role;

commit;
