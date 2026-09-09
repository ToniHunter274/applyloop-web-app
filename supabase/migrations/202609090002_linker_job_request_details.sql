begin;

alter table public.client_job_requests
  add column if not exists job_company text,
  add column if not exists job_position text,
  add column if not exists job_location text,
  add column if not exists job_type text,
  add column if not exists salary_range text,
  add column if not exists link_provider text;

alter table public.client_job_requests
  add constraint
    client_job_requests_job_company_length_check
  check (
    job_company is null
    or char_length(job_company) <= 200
  ),
  add constraint
    client_job_requests_job_position_length_check
  check (
    job_position is null
    or char_length(job_position) <= 200
  ),
  add constraint
    client_job_requests_job_location_length_check
  check (
    job_location is null
    or char_length(job_location) <= 200
  ),
  add constraint
    client_job_requests_job_type_length_check
  check (
    job_type is null
    or char_length(job_type) <= 100
  ),
  add constraint
    client_job_requests_salary_range_length_check
  check (
    salary_range is null
    or char_length(salary_range) <= 200
  ),
  add constraint
    client_job_requests_link_provider_length_check
  check (
    link_provider is null
    or char_length(link_provider) <= 100
  );

create or replace function
public.create_linker_job_request_with_details(
  p_linker_user_id uuid,
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
  v_request record;
begin
  if nullif(btrim(p_job_company), '') is null then
    raise exception 'Company name is required.';
  end if;

  if nullif(btrim(p_job_position), '') is null then
    raise exception 'Job position is required.';
  end if;

  if nullif(btrim(p_job_location), '') is null then
    raise exception 'Job location is required.';
  end if;

  if nullif(btrim(p_job_type), '') is null then
    raise exception 'Job type is required.';
  end if;

  select request.*
  into v_request
  from public.create_linker_job_request(
    p_linker_user_id,
    p_applicant_id,
    p_client_id,
    p_job_url,
    p_comment
  ) as request;

  if v_request.id is null then
    raise exception
      'The Linker job request could not be created.';
  end if;

  update public.client_job_requests
    as request
  set
    job_company =
      btrim(p_job_company),
    job_position =
      btrim(p_job_position),
    job_location =
      btrim(p_job_location),
    job_type =
      btrim(p_job_type),
    salary_range =
      nullif(btrim(p_salary_range), ''),
    link_provider =
      nullif(btrim(p_link_provider), '')
  where request.id = v_request.id;

  return query
  select
    request.id,
    request.client_id,
    request.submitted_by,
    request.job_url,
    request.comment,
    request.status,
    request.request_source,
    request.target_applicant_id,
    request.linker_assignment_id,
    request.job_company,
    request.job_position,
    request.job_location,
    request.job_type,
    request.salary_range,
    request.link_provider,
    request.created_at
  from public.client_job_requests
    as request
  where request.id = v_request.id;
end;
$function$;

revoke all
on function
public.create_linker_job_request_with_details(
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
from public;

revoke all
on function
public.create_linker_job_request_with_details(
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
from anon;

revoke all
on function
public.create_linker_job_request_with_details(
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
from authenticated;

grant execute
on function
public.create_linker_job_request_with_details(
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
