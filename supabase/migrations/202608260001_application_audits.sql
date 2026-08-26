begin;

create table if not exists
public.application_audits (
  id uuid primary key
    default gen_random_uuid(),

  application_id uuid not null
    references public.applications(id)
    on delete cascade,

  auditor_user_id uuid not null
    references public.profiles(id)
    on delete restrict,

  status text not null
    default 'pending'
    check (
      status in (
        'pending',
        'in_review',
        'passed',
        'revision_requested',
        'escalated'
      )
    ),

  priority text not null
    default 'medium'
    check (
      priority in (
        'low',
        'medium',
        'high'
      )
    ),

  source text not null
    default 'manual'
    check (
      source in (
        'random_audit',
        'client_complaint',
        'quality_query',
        'scheduled_review',
        'manual'
      )
    ),

  quality_score smallint
    check (
      quality_score between 0 and 100
    ),

  comments text
    check (
      comments is null
      or char_length(comments) <= 5000
    ),

  started_at timestamptz,

  completed_at timestamptz,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);

create index if not exists
application_audits_application_idx
on public.application_audits(
  application_id
);

create index if not exists
application_audits_auditor_status_idx
on public.application_audits(
  auditor_user_id,
  status,
  created_at desc
);

create index if not exists
application_audits_status_idx
on public.application_audits(
  status,
  created_at desc
);

drop trigger if exists
set_application_audits_updated_at
on public.application_audits;

create trigger
set_application_audits_updated_at
before update
on public.application_audits
for each row
execute function
public.set_updated_at();


create table if not exists
public.application_audit_events (
  id uuid primary key
    default gen_random_uuid(),

  audit_id uuid not null
    references public.application_audits(id)
    on delete restrict,

  application_id uuid not null
    references public.applications(id)
    on delete restrict,

  actor_user_id uuid not null
    references public.profiles(id)
    on delete restrict,

  previous_status text not null,

  new_status text not null,

  reason text not null
    check (
      char_length(btrim(reason))
      between 1 and 5000
    ),

  document_version jsonb not null
    default '{}'::jsonb
    check (
      jsonb_typeof(document_version) =
        'object'
    ),

  created_at timestamptz not null
    default now()
);

create index if not exists
application_audit_events_audit_idx
on public.application_audit_events(
  audit_id,
  created_at
);

create index if not exists
application_audit_events_application_idx
on public.application_audit_events(
  application_id,
  created_at
);


create or replace function
public.prevent_application_audit_event_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  raise exception
    'Application audit events are immutable.';
end;
$function$;

drop trigger if exists
prevent_application_audit_event_update
on public.application_audit_events;

create trigger
prevent_application_audit_event_update
before update
on public.application_audit_events
for each row
execute function
public.prevent_application_audit_event_mutation();

drop trigger if exists
prevent_application_audit_event_delete
on public.application_audit_events;

create trigger
prevent_application_audit_event_delete
before delete
on public.application_audit_events
for each row
execute function
public.prevent_application_audit_event_mutation();


alter table
public.application_audits
enable row level security;

alter table
public.application_audit_events
enable row level security;

revoke all
on public.application_audits
from anon;

revoke all
on public.application_audits
from authenticated;

revoke all
on public.application_audit_events
from anon;

revoke all
on public.application_audit_events
from authenticated;

grant all
on public.application_audits
to service_role;

grant select, insert
on public.application_audit_events
to service_role;

revoke all
on function
public.prevent_application_audit_event_mutation()
from public;

revoke all
on function
public.prevent_application_audit_event_mutation()
from anon;

revoke all
on function
public.prevent_application_audit_event_mutation()
from authenticated;


create or replace function
public.pass_application_audit(
  p_audit_id uuid,
  p_actor_user_id uuid,
  p_quality_score smallint,
  p_comments text default null
)
returns public.application_audits
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_audit public.application_audits%rowtype;
  v_previous_status text;
  v_actor_role text;
  v_actor_status text;
  v_document_version jsonb;
  v_reason text;
begin
  if
    p_quality_score is null
    or p_quality_score < 0
    or p_quality_score > 100
  then
    raise exception using
      errcode = '22023',
      message =
        'Quality score must be between 0 and 100.';
  end if;

  if
    p_comments is not null
    and char_length(p_comments) > 5000
  then
    raise exception using
      errcode = '22023',
      message =
        'Audit comments cannot exceed 5000 characters.';
  end if;

  select
    profiles.role,
    profiles.account_status
  into
    v_actor_role,
    v_actor_status
  from public.profiles
  where profiles.id = p_actor_user_id;

  if
    v_actor_status is distinct from 'active'
    or v_actor_role not in (
      'team_auditor',
      'chief_auditor'
    )
  then
    raise exception using
      errcode = '42501',
      message =
        'This user cannot make audit decisions.';
  end if;

  select *
  into v_audit
  from public.application_audits
  where id = p_audit_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message =
        'The audit could not be found.';
  end if;

  if v_audit.status = 'passed' then
    return v_audit;
  end if;

  if
    v_audit.status not in (
      'pending',
      'in_review'
    )
  then
    raise exception using
      errcode = '22023',
      message =
        'This audit cannot be passed from its current status.';
  end if;

  if
    v_actor_role = 'team_auditor'
    and v_audit.auditor_user_id <>
      p_actor_user_id
  then
    raise exception using
      errcode = '42501',
      message =
        'This audit is assigned to another auditor.';
  end if;

  select
    jsonb_build_object(
      'resumeName',
        applications.resume_name,
      'resumePath',
        applications.resume_path,
      'coverLetterName',
        applications.cover_letter_name,
      'coverLetterPath',
        applications.cover_letter_path,
      'applicationUpdatedAt',
        applications.updated_at
    )
  into v_document_version
  from public.applications
  where applications.id =
    v_audit.application_id;

  v_previous_status :=
    v_audit.status;

  v_reason :=
    coalesce(
      nullif(
        btrim(p_comments),
        ''
      ),
      'Audit passed.'
    );

  update public.application_audits
  set
    status = 'passed',
    quality_score = p_quality_score,
    comments =
      nullif(
        btrim(p_comments),
        ''
      ),
    started_at =
      coalesce(
        started_at,
        now()
      ),
    completed_at = now()
  where id = p_audit_id
  returning *
  into v_audit;

  insert into
  public.application_audit_events (
    audit_id,
    application_id,
    actor_user_id,
    previous_status,
    new_status,
    reason,
    document_version
  )
  values (
    v_audit.id,
    v_audit.application_id,
    p_actor_user_id,
    v_previous_status,
    'passed',
    v_reason,
    coalesce(
      v_document_version,
      '{}'::jsonb
    )
  );

  return v_audit;
end;
$function$;

revoke all
on function
public.pass_application_audit(
  uuid,
  uuid,
  smallint,
  text
)
from public;

revoke all
on function
public.pass_application_audit(
  uuid,
  uuid,
  smallint,
  text
)
from anon;

revoke all
on function
public.pass_application_audit(
  uuid,
  uuid,
  smallint,
  text
)
from authenticated;

grant execute
on function
public.pass_application_audit(
  uuid,
  uuid,
  smallint,
  text
)
to service_role;

commit;
