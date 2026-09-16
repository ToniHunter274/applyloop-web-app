begin;

create table if not exists public.chief_applicant_assignments (
  id uuid primary key default gen_random_uuid(),

  chief_user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  applicant_id uuid not null
    references public.applicants(id)
    on delete cascade,

  assigned_by uuid
    references public.profiles(id)
    on delete set null,

  is_active boolean not null default true,

  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


alter table public.chief_applicant_assignments
  enable row level security;

revoke all
on table public.chief_applicant_assignments
from public;

revoke all
on table public.chief_applicant_assignments
from anon;

revoke all
on table public.chief_applicant_assignments
from authenticated;

grant all
on table public.chief_applicant_assignments
to service_role;

create unique index if not exists
  chief_applicant_assignments_active_applicant_idx
on public.chief_applicant_assignments (
  applicant_id
)
where is_active = true;

create unique index if not exists
  chief_applicant_assignments_pair_idx
on public.chief_applicant_assignments (
  chief_user_id,
  applicant_id
);

create index if not exists
  chief_applicant_assignments_chief_idx
on public.chief_applicant_assignments (
  chief_user_id
)
where is_active = true;


create or replace function
public.create_chief_applicant_assignment(
  p_chief_user_id uuid,
  p_applicant_id uuid,
  p_assigned_by uuid
)
returns table (
  assignment_id uuid,
  chief_user_id uuid,
  applicant_id uuid,
  assigned_by uuid,
  is_active boolean,
  assigned_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_chief_status text;
  v_applicant_user_id uuid;
  v_applicant_status text;
  v_existing
    public.chief_applicant_assignments%rowtype;
begin
  select profile.account_status
  into v_chief_status
  from public.profiles as profile
  where profile.id = p_chief_user_id
    and profile.role = 'chief_applicant';

  if not found then
    raise exception
      'Chief Applicant not found.';
  end if;

  if v_chief_status <> 'active' then
    raise exception
      'Only an active Chief Applicant can supervise Applicants.';
  end if;


  select applicant.user_id
  into v_applicant_user_id
  from public.applicants as applicant
  where applicant.id = p_applicant_id;

  if not found then
    raise exception
      'Applicant not found.';
  end if;


  select profile.account_status
  into v_applicant_status
  from public.profiles as profile
  where profile.id = v_applicant_user_id
    and profile.role = 'applicant';

  if not found then
    raise exception
      'Applicant profile not found.';
  end if;

  if v_applicant_status <> 'active' then
    raise exception
      'Only an active Applicant can receive Chief Applicant supervision.';
  end if;


  if exists (
    select 1
    from public.chief_applicant_assignments as assignment
    where assignment.applicant_id =
      p_applicant_id
      and assignment.is_active = true
      and assignment.chief_user_id <>
        p_chief_user_id
  ) then
    raise exception
      'This Applicant already has an active Chief Applicant.';
  end if;


  select assignment.*
  into v_existing
  from public.chief_applicant_assignments
    as assignment
  where assignment.chief_user_id =
      p_chief_user_id
    and assignment.applicant_id =
      p_applicant_id
  limit 1;

  if found then
    if v_existing.is_active then
      raise exception
        'This Applicant is already assigned to this Chief Applicant.';
    end if;

    update public.chief_applicant_assignments
    set
      is_active = true,
      assigned_by = p_assigned_by,
      assigned_at = now(),
      updated_at = now()
    where id = v_existing.id
    returning *
    into v_existing;
  else
    insert into
      public.chief_applicant_assignments (
        chief_user_id,
        applicant_id,
        assigned_by
      )
    values (
      p_chief_user_id,
      p_applicant_id,
      p_assigned_by
    )
    returning *
    into v_existing;
  end if;


  return query
  select
    v_existing.id,
    v_existing.chief_user_id,
    v_existing.applicant_id,
    v_existing.assigned_by,
    v_existing.is_active,
    v_existing.assigned_at,
    v_existing.updated_at;
end;
$function$;


revoke all
on function
public.create_chief_applicant_assignment(
  uuid,
  uuid,
  uuid
)
from public;

revoke all
on function
public.create_chief_applicant_assignment(
  uuid,
  uuid,
  uuid
)
from anon;

revoke all
on function
public.create_chief_applicant_assignment(
  uuid,
  uuid,
  uuid
)
from authenticated;

grant execute
on function
public.create_chief_applicant_assignment(
  uuid,
  uuid,
  uuid
)
to service_role;


create or replace function
public.deactivate_chief_applicant_assignment(
  p_assignment_id uuid,
  p_chief_user_id uuid
)
returns table (
  assignment_id uuid,
  chief_user_id uuid,
  applicant_id uuid,
  is_active boolean,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_assignment
    public.chief_applicant_assignments%rowtype;
begin
  select assignment.*
  into v_assignment
  from public.chief_applicant_assignments
    as assignment
  where assignment.id =
      p_assignment_id
    and assignment.chief_user_id =
      p_chief_user_id;

  if not found then
    raise exception
      'Chief Applicant assignment not found.';
  end if;

  if not v_assignment.is_active then
    raise exception
      'This Chief Applicant assignment is already inactive.';
  end if;

  update public.chief_applicant_assignments
  set
    is_active = false,
    updated_at = now()
  where id = v_assignment.id
  returning *
  into v_assignment;

  return query
  select
    v_assignment.id,
    v_assignment.chief_user_id,
    v_assignment.applicant_id,
    v_assignment.is_active,
    v_assignment.updated_at;
end;
$function$;


revoke all
on function
public.deactivate_chief_applicant_assignment(
  uuid,
  uuid
)
from public;

revoke all
on function
public.deactivate_chief_applicant_assignment(
  uuid,
  uuid
)
from anon;

revoke all
on function
public.deactivate_chief_applicant_assignment(
  uuid,
  uuid
)
from authenticated;

grant execute
on function
public.deactivate_chief_applicant_assignment(
  uuid,
  uuid
)
to service_role;

commit;
