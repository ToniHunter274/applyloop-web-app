begin;

create or replace function
public.update_applicant_application(
  p_actor_id uuid,
  p_application_id uuid,
  p_status text,
  p_link_source text
)
returns table (
  id uuid,
  client_id uuid,
  status text,
  link_source text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_applicant_id uuid;
  v_client_status text;
  v_application
    public.applications%rowtype;
begin
  select
    applicant.id
  into
    v_applicant_id
  from public.applicants
    as applicant
  where applicant.user_id =
    p_actor_id
  for update;

  if not found then
    raise exception
      'Applicant not found.';
  end if;

  perform 1
  from public.profiles
    as profile
  where profile.id =
      p_actor_id
    and profile.role =
      'applicant'
    and profile.account_status =
      'active'
  for update;

  if not found then
    raise exception
      'Your Applicant account is not active.';
  end if;

  select
    application.*
  into
    v_application
  from public.applications
    as application
  where application.id =
    p_application_id
  for update;

  if not found then
    raise exception
      'Application not found.';
  end if;

  select
    client.status
  into
    v_client_status
  from public.clients
    as client
  where client.id =
    v_application.client_id
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
      'Applications cannot be edited for a paused or completed Client.';
  end if;

  perform 1
  from
    public.client_applicant_assignments
      as assignment
  where assignment.applicant_id =
      v_applicant_id
    and assignment.client_id =
      v_application.client_id
  for update;

  if not found then
    raise exception
      'This Client is not assigned to you.';
  end if;

  update public.applications
    as application
  set
    status =
      coalesce(
        p_status,
        application.status
      ),
    link_source =
      coalesce(
        p_link_source,
        application.link_source
      )
  where application.id =
    p_application_id
  returning
    application.*
  into
    v_application;

  return query
  select
    v_application.id,
    v_application.client_id,
    v_application.status,
    v_application.link_source,
    v_application.updated_at;
end;
$function$;

revoke all
on function
public.update_applicant_application(
  uuid,
  uuid,
  text,
  text
)
from public;

revoke all
on function
public.update_applicant_application(
  uuid,
  uuid,
  text,
  text
)
from anon;

revoke all
on function
public.update_applicant_application(
  uuid,
  uuid,
  text,
  text
)
from authenticated;

grant execute
on function
public.update_applicant_application(
  uuid,
  uuid,
  text,
  text
)
to service_role;

commit;
