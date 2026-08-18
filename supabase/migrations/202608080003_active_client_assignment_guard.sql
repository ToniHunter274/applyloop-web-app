begin;

create or replace function
public.create_client_applicant_assignment(
  p_applicant_id uuid,
  p_client_id uuid,
  p_assigned_by uuid
)
returns table (
  id uuid,
  client_id uuid,
  applicant_id uuid,
  assigned_by uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user_id uuid;
  v_availability text;
  v_account_status text;
  v_client_status text;
  v_assignment
    public.client_applicant_assignments%rowtype;
begin
  select
    applicant.user_id,
    applicant.availability
  into
    v_user_id,
    v_availability
  from public.applicants as applicant
  where applicant.id =
    p_applicant_id
  for update;

  if not found then
    raise exception
      'Applicant not found.';
  end if;

  select profile.account_status
  into v_account_status
  from public.profiles as profile
  where profile.id = v_user_id
    and profile.role = 'applicant';

  if not found then
    raise exception
      'Applicant profile not found.';
  end if;

  if v_account_status <> 'active' then
    raise exception
      'Reactivate this applicant before assigning another client.';
  end if;

  if v_availability <> 'available' then
    raise exception
      'Set this applicant to Available before assigning another client.';
  end if;

  select client.status
  into v_client_status
  from public.clients as client
  where client.id = p_client_id
  for update;

  if not found then
    raise exception
      'Client not found.';
  end if;

  if v_client_status <> 'active' then
    raise exception
      'Only active clients can receive new applicant assignments.';
  end if;

  begin
    insert into
      public.client_applicant_assignments
      as assignment (
        client_id,
        applicant_id,
        assigned_by
      )
    values (
      p_client_id,
      p_applicant_id,
      p_assigned_by
    )
    returning assignment.*
    into v_assignment;
  exception
    when unique_violation then
      raise exception
        'This client is already assigned to this applicant.';
  end;

  return query
  select
    v_assignment.id,
    v_assignment.client_id,
    v_assignment.applicant_id,
    v_assignment.assigned_by,
    v_assignment.created_at;
end;
$function$;

revoke all
  on function
  public.create_client_applicant_assignment(
    uuid,
    uuid,
    uuid
  )
  from public;

revoke all
  on function
  public.create_client_applicant_assignment(
    uuid,
    uuid,
    uuid
  )
  from anon;

revoke all
  on function
  public.create_client_applicant_assignment(
    uuid,
    uuid,
    uuid
  )
  from authenticated;

grant execute
  on function
  public.create_client_applicant_assignment(
    uuid,
    uuid,
    uuid
  )
  to service_role;

commit;
