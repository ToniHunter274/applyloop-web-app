begin;

-- Preserve Linker-to-Applicant assignment history while allowing
-- only one active Linker for an Applicant at a time.
create table
  public.linker_applicant_assignments (
    id uuid primary key
      default gen_random_uuid(),

    linker_user_id uuid not null
      references public.profiles(id)
      on delete restrict,

    applicant_id uuid not null
      references public.applicants(id)
      on delete restrict,

    assigned_by uuid
      references public.profiles(id)
      on delete set null,

    unassigned_by uuid
      references public.profiles(id)
      on delete set null,

    is_active boolean not null
      default true,

    assigned_at timestamptz not null
      default timezone('utc', now()),

    unassigned_at timestamptz,

    created_at timestamptz not null
      default timezone('utc', now()),

    updated_at timestamptz not null
      default timezone('utc', now()),

    constraint
      linker_assignment_lifecycle_check
    check (
      (
        is_active = true
        and unassigned_at is null
        and unassigned_by is null
      )
      or (
        is_active = false
        and unassigned_at is not null
      )
    )
  );

create unique index
  linker_assignments_one_active_per_applicant_idx
on public.linker_applicant_assignments(
  applicant_id
)
where is_active = true;

create index
  linker_assignments_active_linker_idx
on public.linker_applicant_assignments(
  linker_user_id,
  applicant_id
)
where is_active = true;

create index
  linker_assignments_history_idx
on public.linker_applicant_assignments(
  applicant_id,
  assigned_at desc
);

create trigger
  linker_assignments_set_updated_at
before update
on public.linker_applicant_assignments
for each row
execute function public.set_updated_at();


alter table
  public.linker_applicant_assignments
enable row level security;

revoke all
on public.linker_applicant_assignments
from anon;

revoke all
on public.linker_applicant_assignments
from authenticated;

grant select
on public.linker_applicant_assignments
to authenticated;

grant all
on public.linker_applicant_assignments
to service_role;


create policy
  "Linkers can view their assignment history"
on public.linker_applicant_assignments
for select
to authenticated
using (
  linker_user_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'linker'
      and profiles.account_status = 'active'
  )
);

create policy
  "Leadership can view Linker assignments"
on public.linker_applicant_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
      and profiles.role in (
        'admin',
        'operations',
        'owner'
      )
  )
);


create or replace function
public.create_linker_applicant_assignment(
  p_linker_user_id uuid,
  p_applicant_id uuid,
  p_assigned_by uuid
)
returns table (
  assignment_id uuid,
  linker_user_id uuid,
  applicant_id uuid,
  assigned_by uuid,
  is_active boolean,
  assigned_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_manager_role public.app_role;
  v_manager_status text;
  v_linker_role public.app_role;
  v_linker_status text;
  v_applicant_user_id uuid;
  v_applicant_availability text;
  v_applicant_role public.app_role;
  v_applicant_status text;
  v_existing
    public.linker_applicant_assignments%rowtype;
  v_created
    public.linker_applicant_assignments%rowtype;
begin
  select
    profile.role,
    profile.account_status
  into
    v_manager_role,
    v_manager_status
  from public.profiles as profile
  where profile.id = p_assigned_by;

  if not found then
    raise exception
      'Assignment manager profile not found.';
  end if;

  if
    v_manager_status <> 'active'
    or v_manager_role not in (
      'admin',
      'operations'
    )
  then
    raise exception
      'Only active Admin or Operations accounts can assign Linkers.';
  end if;

  select
    profile.role,
    profile.account_status
  into
    v_linker_role,
    v_linker_status
  from public.profiles as profile
  where profile.id = p_linker_user_id
  for update;

  if not found then
    raise exception
      'Linker profile not found.';
  end if;

  if
    v_linker_role <> 'linker'
    or v_linker_status <> 'active'
  then
    raise exception
      'Only an active Linker can receive Applicant assignments.';
  end if;

  select
    applicant.user_id,
    applicant.availability
  into
    v_applicant_user_id,
    v_applicant_availability
  from public.applicants as applicant
  where applicant.id = p_applicant_id
  for update;

  if not found then
    raise exception
      'Applicant not found.';
  end if;

  select
    profile.role,
    profile.account_status
  into
    v_applicant_role,
    v_applicant_status
  from public.profiles as profile
  where profile.id = v_applicant_user_id;

  if not found then
    raise exception
      'Applicant profile not found.';
  end if;

  if
    v_applicant_role <> 'applicant'
    or v_applicant_status <> 'active'
  then
    raise exception
      'Only an active Applicant can receive a Linker assignment.';
  end if;

  if v_applicant_availability <> 'available' then
    raise exception
      'Set this Applicant to Available before assigning a Linker.';
  end if;

  select assignment.*
  into v_existing
  from public.linker_applicant_assignments
    as assignment
  where assignment.applicant_id =
      p_applicant_id
    and assignment.is_active = true
  for update;

  if found then
    if
      v_existing.linker_user_id =
      p_linker_user_id
    then
      raise exception
        'This Linker is already assigned to this Applicant.';
    end if;

    raise exception
      'This Applicant already has an active Linker.';
  end if;

  begin
    insert into
      public.linker_applicant_assignments
      as assignment (
        linker_user_id,
        applicant_id,
        assigned_by
      )
    values (
      p_linker_user_id,
      p_applicant_id,
      p_assigned_by
    )
    returning assignment.*
    into v_created;
  exception
    when unique_violation then
      raise exception
        'This Applicant already has an active Linker.';
  end;

  return query
  select
    v_created.id,
    v_created.linker_user_id,
    v_created.applicant_id,
    v_created.assigned_by,
    v_created.is_active,
    v_created.assigned_at;
end;
$function$;


create or replace function
public.deactivate_linker_applicant_assignment(
  p_assignment_id uuid,
  p_unassigned_by uuid
)
returns table (
  assignment_id uuid,
  linker_user_id uuid,
  applicant_id uuid,
  is_active boolean,
  unassigned_by uuid,
  unassigned_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_manager_role public.app_role;
  v_manager_status text;
  v_assignment
    public.linker_applicant_assignments%rowtype;
begin
  select
    profile.role,
    profile.account_status
  into
    v_manager_role,
    v_manager_status
  from public.profiles as profile
  where profile.id = p_unassigned_by;

  if not found then
    raise exception
      'Assignment manager profile not found.';
  end if;

  if
    v_manager_status <> 'active'
    or v_manager_role not in (
      'admin',
      'operations'
    )
  then
    raise exception
      'Only active Admin or Operations accounts can unassign Linkers.';
  end if;

  select assignment.*
  into v_assignment
  from public.linker_applicant_assignments
    as assignment
  where assignment.id = p_assignment_id
  for update;

  if not found then
    raise exception
      'Linker assignment not found.';
  end if;

  if v_assignment.is_active = false then
    raise exception
      'This Linker assignment is already inactive.';
  end if;

  update public.linker_applicant_assignments
  set
    is_active = false,
    unassigned_by = p_unassigned_by,
    unassigned_at = timezone('utc', now())
  where id = p_assignment_id
  returning *
  into v_assignment;

  return query
  select
    v_assignment.id,
    v_assignment.linker_user_id,
    v_assignment.applicant_id,
    v_assignment.is_active,
    v_assignment.unassigned_by,
    v_assignment.unassigned_at;
end;
$function$;


revoke all
on function
  public.create_linker_applicant_assignment(
    uuid,
    uuid,
    uuid
  )
from public;

revoke all
on function
  public.create_linker_applicant_assignment(
    uuid,
    uuid,
    uuid
  )
from anon;

revoke all
on function
  public.create_linker_applicant_assignment(
    uuid,
    uuid,
    uuid
  )
from authenticated;

grant execute
on function
  public.create_linker_applicant_assignment(
    uuid,
    uuid,
    uuid
  )
to service_role;


revoke all
on function
  public.deactivate_linker_applicant_assignment(
    uuid,
    uuid
  )
from public;

revoke all
on function
  public.deactivate_linker_applicant_assignment(
    uuid,
    uuid
  )
from anon;

revoke all
on function
  public.deactivate_linker_applicant_assignment(
    uuid,
    uuid
  )
from authenticated;

grant execute
on function
  public.deactivate_linker_applicant_assignment(
    uuid,
    uuid
  )
to service_role;

commit;
