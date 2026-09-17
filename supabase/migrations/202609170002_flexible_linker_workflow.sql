begin;

-- ============================================================
-- 1. FIX CHIEF -> LINKER LINE MANAGER RPC
-- ============================================================

create or replace function
public.create_chief_linker_assignment(
  p_chief_user_id uuid,
  p_linker_user_id uuid,
  p_assigned_by uuid
)
returns table (
  id uuid,
  chief_user_id uuid,
  linker_user_id uuid,
  assigned_by uuid,
  is_active boolean,
  assigned_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not exists (
    select 1
    from public.profiles as manager
    where manager.id = p_assigned_by
      and manager.role = 'admin'
      and coalesce(
        manager.account_status,
        'active'
      ) = 'active'
  ) then
    raise exception
      'Only an active Admin can manage Linker Line Managers.';
  end if;

  if not exists (
    select 1
    from public.profiles as chief
    where chief.id = p_chief_user_id
      and chief.role = 'chief_applicant'
      and coalesce(
        chief.account_status,
        'active'
      ) = 'active'
  ) then
    raise exception
      'The selected Chief Applicant is not active.';
  end if;

  perform 1
  from public.profiles as linker
  where linker.id = p_linker_user_id
    and linker.role = 'linker'
    and coalesce(
      linker.account_status,
      'active'
    ) = 'active'
  for update;

  if not found then
    raise exception
      'The selected Linker is not active.';
  end if;

  if exists (
    select 1
    from public.chief_linker_assignments as cla
    where cla.linker_user_id = p_linker_user_id
      and cla.is_active = true
      and cla.chief_user_id <> p_chief_user_id
  ) then
    raise exception
      'This Linker already has an active Chief Applicant.';
  end if;

  if exists (
    select 1
    from public.chief_linker_assignments as cla
    where cla.linker_user_id = p_linker_user_id
      and cla.chief_user_id = p_chief_user_id
      and cla.is_active = true
  ) then
    raise exception
      'This Chief Applicant already supervises this Linker.';
  end if;

  if exists (
    select 1
    from public.chief_linker_assignments as cla
    where cla.linker_user_id = p_linker_user_id
      and cla.chief_user_id = p_chief_user_id
      and cla.is_active = false
  ) then
    return query
    update public.chief_linker_assignments as cla
    set
      assigned_by = p_assigned_by,
      is_active = true,
      assigned_at = now(),
      updated_at = now()
    where cla.linker_user_id = p_linker_user_id
      and cla.chief_user_id = p_chief_user_id
      and cla.is_active = false
    returning
      cla.id,
      cla.chief_user_id,
      cla.linker_user_id,
      cla.assigned_by,
      cla.is_active,
      cla.assigned_at,
      cla.updated_at;

    return;
  end if;

  return query
  insert into public.chief_linker_assignments as cla (
    chief_user_id,
    linker_user_id,
    assigned_by,
    is_active,
    assigned_at,
    updated_at
  )
  values (
    p_chief_user_id,
    p_linker_user_id,
    p_assigned_by,
    true,
    now(),
    now()
  )
  returning
    cla.id,
    cla.chief_user_id,
    cla.linker_user_id,
    cla.assigned_by,
    cla.is_active,
    cla.assigned_at,
    cla.updated_at;
end;
$function$;

revoke execute
on function
  public.create_chief_linker_assignment(
    uuid,
    uuid,
    uuid
  )
from public, anon, authenticated;

grant execute
on function
  public.create_chief_linker_assignment(
    uuid,
    uuid,
    uuid
  )
to service_role;


-- ============================================================
-- 2. REMOVE OLD "MAXIMUM 2 APPLICANTS PER CLIENT" RULE
--
-- Client <-> Applicant becomes unrestricted many-to-many.
-- The existing unique(client_id, applicant_id) still prevents
-- duplicate copies of the same relationship.
-- ============================================================

drop trigger if exists
  enforce_client_applicant_limit_trigger
on public.client_applicant_assignments;

drop function if exists
  public.enforce_client_applicant_limit();


-- ============================================================
-- 3. DYNAMIC LINKER WORK ALLOCATIONS
--
-- One Linker can have many allocations.
-- One Client can have many Linkers.
-- One Applicant can participate in many allocations.
-- One allocation can have one or many eligible Applicants.
-- ============================================================

create table if not exists
public.linker_work_allocations (
  id uuid primary key
    default gen_random_uuid(),

  linker_user_id uuid not null
    references public.profiles(id)
    on delete restrict,

  client_id uuid not null
    references public.clients(id)
    on delete restrict,

  target_links integer not null
    check (target_links > 0),

  priority text not null
    default 'normal'
    check (
      priority in (
        'low',
        'normal',
        'high',
        'urgent'
      )
    ),

  status text not null
    default 'active'
    check (
      status in (
        'active',
        'paused',
        'completed',
        'cancelled'
      )
    ),

  instructions text,

  start_date date not null
    default current_date,

  due_date date,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  completed_at timestamptz,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint
    linker_work_allocation_dates_check
  check (
    due_date is null
    or due_date >= start_date
  )
);


create table if not exists
public.linker_work_allocation_applicants (
  id uuid primary key
    default gen_random_uuid(),

  allocation_id uuid not null
    references public.linker_work_allocations(id)
    on delete cascade,

  applicant_id uuid not null
    references public.applicants(id)
    on delete restrict,

  added_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null
    default now(),

  unique (
    allocation_id,
    applicant_id
  )
);


create index if not exists
  linker_work_allocations_linker_idx
on public.linker_work_allocations (
  linker_user_id,
  status,
  created_at desc
);


create index if not exists
  linker_work_allocations_client_idx
on public.linker_work_allocations (
  client_id,
  status,
  created_at desc
);


create index if not exists
  linker_work_allocation_applicants_applicant_idx
on public.linker_work_allocation_applicants (
  applicant_id,
  allocation_id
);


alter table
  public.linker_work_allocations
enable row level security;

alter table
  public.linker_work_allocation_applicants
enable row level security;

revoke all
on table public.linker_work_allocations
from public, anon, authenticated;

revoke all
on table public.linker_work_allocation_applicants
from public, anon, authenticated;

grant all
on table public.linker_work_allocations
to service_role;

grant all
on table public.linker_work_allocation_applicants
to service_role;


-- ============================================================
-- 4. ALLOCATION CREATION RPC
--
-- Admin selects:
--   Linker
--   Client
--   one or many Applicants
--   target number of links
--   priority / dates / instructions
--
-- Every selected Applicant must already work on that Client.
-- ============================================================

create or replace function
public.create_linker_work_allocation(
  p_linker_user_id uuid,
  p_client_id uuid,
  p_applicant_ids uuid[],
  p_target_links integer,
  p_priority text,
  p_start_date date,
  p_due_date date,
  p_instructions text,
  p_created_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_allocation_id uuid;
  v_applicant_id uuid;
begin
  if not exists (
    select 1
    from public.profiles as admin_profile
    where admin_profile.id = p_created_by
      and admin_profile.role = 'admin'
      and coalesce(
        admin_profile.account_status,
        'active'
      ) = 'active'
  ) then
    raise exception
      'Only an active Admin can create Linker work allocations.';
  end if;

  if not exists (
    select 1
    from public.profiles as linker_profile
    where linker_profile.id =
      p_linker_user_id
      and linker_profile.role =
        'linker'
      and coalesce(
        linker_profile.account_status,
        'active'
      ) = 'active'
  ) then
    raise exception
      'The selected Linker is not active.';
  end if;

  if not exists (
    select 1
    from public.clients as client
    where client.id = p_client_id
      and client.status = 'active'
  ) then
    raise exception
      'The selected Client is not active.';
  end if;

  if p_target_links is null
     or p_target_links <= 0
  then
    raise exception
      'Target links must be greater than zero.';
  end if;

  if coalesce(
    array_length(
      p_applicant_ids,
      1
    ),
    0
  ) = 0 then
    raise exception
      'Choose at least one Applicant.';
  end if;

  foreach v_applicant_id
    in array p_applicant_ids
  loop
    if not exists (
      select 1
      from public.client_applicant_assignments
        as caa
      join public.applicants
        as applicant
        on applicant.id =
          caa.applicant_id
      join public.profiles
        as applicant_profile
        on applicant_profile.id =
          applicant.user_id
      where caa.client_id =
        p_client_id
        and caa.applicant_id =
          v_applicant_id
        and applicant_profile.role =
          'applicant'
        and coalesce(
          applicant_profile.account_status,
          'active'
        ) = 'active'
    ) then
      raise exception
        'Every selected Applicant must be actively assigned to the selected Client.';
    end if;
  end loop;

  insert into
    public.linker_work_allocations (
      linker_user_id,
      client_id,
      target_links,
      priority,
      status,
      instructions,
      start_date,
      due_date,
      created_by
    )
  values (
    p_linker_user_id,
    p_client_id,
    p_target_links,
    coalesce(
      nullif(
        btrim(p_priority),
        ''
      ),
      'normal'
    ),
    'active',
    nullif(
      btrim(p_instructions),
      ''
    ),
    coalesce(
      p_start_date,
      current_date
    ),
    p_due_date,
    p_created_by
  )
  returning id
  into v_allocation_id;

  foreach v_applicant_id
    in array p_applicant_ids
  loop
    insert into
      public.linker_work_allocation_applicants (
        allocation_id,
        applicant_id,
        added_by
      )
    values (
      v_allocation_id,
      v_applicant_id,
      p_created_by
    )
    on conflict (
      allocation_id,
      applicant_id
    )
    do nothing;
  end loop;

  return v_allocation_id;
end;
$function$;


revoke execute
on function
  public.create_linker_work_allocation(
    uuid,
    uuid,
    uuid[],
    integer,
    text,
    date,
    date,
    text,
    uuid
  )
from public, anon, authenticated;

grant execute
on function
  public.create_linker_work_allocation(
    uuid,
    uuid,
    uuid[],
    integer,
    text,
    date,
    date,
    text,
    uuid
  )
to service_role;


-- ============================================================
-- 5. PREPARE JOB REQUESTS FOR ALLOCATION ATTRIBUTION
--
-- Existing Linker requests keep their legacy assignment ID.
-- New allocation-aware requests will use allocation ID instead.
-- ============================================================

alter table public.client_job_requests
  add column if not exists
    linker_work_allocation_id uuid
    references public.linker_work_allocations(id)
    on delete restrict;


alter table public.client_job_requests
  drop constraint if exists
    client_job_requests_attribution_check;

alter table public.client_job_requests
  add constraint
    client_job_requests_attribution_check
  check (
    (
      request_source = 'client'
      and target_applicant_id is null
      and linker_assignment_id is null
      and linker_work_allocation_id is null
    )
    or
    (
      request_source = 'linker'
      and target_applicant_id is not null
      and (
        (
          linker_assignment_id is not null
          and linker_work_allocation_id is null
        )
        or
        (
          linker_assignment_id is null
          and linker_work_allocation_id is not null
        )
      )
    )
  );


create index if not exists
  client_job_requests_work_allocation_idx
on public.client_job_requests (
  linker_work_allocation_id,
  created_at desc
)
where linker_work_allocation_id
  is not null;


create or replace function
public.prevent_job_request_attribution_changes()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if
    old.client_id is distinct from
      new.client_id
    or old.submitted_by is distinct from
      new.submitted_by
    or old.job_url is distinct from
      new.job_url
    or old.request_source is distinct from
      new.request_source
    or old.target_applicant_id is distinct from
      new.target_applicant_id
    or old.linker_assignment_id is distinct from
      new.linker_assignment_id
    or old.linker_work_allocation_id is distinct from
      new.linker_work_allocation_id
  then
    raise exception
      'Job request attribution cannot be changed.';
  end if;

  return new;
end;
$function$;


-- ============================================================
-- 6. PROGRESS VIEW
--
-- Target, submitted and remaining links are derived rather
-- than manually maintained.
-- ============================================================

create or replace view
public.linker_work_allocation_progress
as
select
  allocation.id,
  allocation.linker_user_id,
  allocation.client_id,
  allocation.target_links,
  allocation.priority,
  allocation.status,
  allocation.instructions,
  allocation.start_date,
  allocation.due_date,
  allocation.created_by,
  allocation.created_at,
  allocation.updated_at,

  count(request.id)::integer
    as links_submitted,

  greatest(
    allocation.target_links -
      count(request.id)::integer,
    0
  ) as links_remaining,

  case
    when allocation.target_links <= 0
      then 0
    else least(
      round(
        (
          count(request.id)::numeric /
          allocation.target_links::numeric
        ) * 100,
        2
      ),
      100
    )
  end as progress_percent

from public.linker_work_allocations
  as allocation

left join public.client_job_requests
  as request
  on request.linker_work_allocation_id =
    allocation.id
  and request.request_source =
    'linker'

group by allocation.id;


revoke all
on public.linker_work_allocation_progress
from public, anon, authenticated;

grant select
on public.linker_work_allocation_progress
to service_role;

commit;
