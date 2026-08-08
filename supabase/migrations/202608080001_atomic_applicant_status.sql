begin;

create or replace function
public.set_applicant_account_status(
  p_applicant_id uuid,
  p_account_status text
)
returns table (
  applicant_id uuid,
  user_id uuid,
  account_status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user_id uuid;
  v_account_status text;
  v_updated_at timestamptz;
begin
  if p_account_status not in (
    'active',
    'suspended'
  ) then
    raise exception
      'Invalid applicant account status.';
  end if;

  select applicants.user_id
  into v_user_id
  from public.applicants
  where applicants.id =
    p_applicant_id
  for update;

  if v_user_id is null then
    raise exception
      'Applicant not found.';
  end if;

  update public.profiles
  set account_status =
    p_account_status
  where id = v_user_id
    and role = 'applicant'
  returning
    profiles.account_status,
    profiles.updated_at
  into
    v_account_status,
    v_updated_at;

  if not found then
    raise exception
      'Applicant profile not found.';
  end if;

  if p_account_status = 'suspended' then
    delete from
      public.client_applicant_assignments
    where client_applicant_assignments.applicant_id =
      p_applicant_id;
  end if;

  return query
  select
    p_applicant_id,
    v_user_id,
    v_account_status,
    v_updated_at;
end;
$function$;

revoke all
  on function
  public.set_applicant_account_status(
    uuid,
    text
  )
  from public;

revoke all
  on function
  public.set_applicant_account_status(
    uuid,
    text
  )
  from anon;

revoke all
  on function
  public.set_applicant_account_status(
    uuid,
    text
  )
  from authenticated;

grant execute
  on function
  public.set_applicant_account_status(
    uuid,
    text
  )
  to service_role;

commit;
