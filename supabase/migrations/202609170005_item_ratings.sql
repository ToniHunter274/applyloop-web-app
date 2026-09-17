begin;

-- ============================================================
-- PER-APPLICATION CLIENT RATINGS
-- ============================================================

create table if not exists
public.application_client_ratings (
  id uuid primary key
    default gen_random_uuid(),

  client_id uuid not null
    references public.clients(id)
    on delete cascade,

  application_id uuid not null
    references public.applications(id)
    on delete cascade,

  applicant_id uuid
    references public.applicants(id)
    on delete set null,

  rating smallint not null
    check (
      rating >= 1
      and rating <= 5
    ),

  note text,

  created_at timestamptz not null
    default timezone(
      'utc',
      now()
    ),

  updated_at timestamptz not null
    default timezone(
      'utc',
      now()
    ),

  constraint
    application_client_ratings_unique
    unique (
      client_id,
      application_id
    ),

  constraint
    application_client_rating_note_length
    check (
      note is null
      or char_length(note) <= 1000
    )
);

create index if not exists
application_client_ratings_application_idx
on public.application_client_ratings(
  application_id
);

create index if not exists
application_client_ratings_applicant_idx
on public.application_client_ratings(
  applicant_id
);

create index if not exists
application_client_ratings_client_idx
on public.application_client_ratings(
  client_id
);


create or replace function
public.enforce_application_client_rating_scope()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  application_client_id uuid;
  application_created_by uuid;
begin
  select
    application.client_id,
    application.created_by
  into
    application_client_id,
    application_created_by
  from public.applications
    as application
  where application.id =
    new.application_id;

  if not found then
    raise exception
      'Application not found.';
  end if;

  if application_client_id <>
    new.client_id
  then
    raise exception
      'The Client cannot rate this Application.';
  end if;

  if
    new.applicant_id is not null
    and not exists (
      select 1
      from public.applicants
        as applicant
      where applicant.id =
        new.applicant_id
        and applicant.user_id =
          application_created_by
    )
  then
    raise exception
      'The Applicant does not match the Application creator.';
  end if;

  return new;
end;
$function$;


drop trigger if exists
enforce_application_client_rating_scope_trigger
on public.application_client_ratings;

create trigger
enforce_application_client_rating_scope_trigger
before insert or update
on public.application_client_ratings
for each row
execute function
public.enforce_application_client_rating_scope();


drop trigger if exists
application_client_ratings_set_updated_at
on public.application_client_ratings;

create trigger
application_client_ratings_set_updated_at
before update
on public.application_client_ratings
for each row
execute function
public.set_updated_at();


alter table
public.application_client_ratings
enable row level security;

revoke all
on public.application_client_ratings
from anon;

revoke all
on public.application_client_ratings
from authenticated;

grant all
on public.application_client_ratings
to service_role;


-- ============================================================
-- PER-JOB-LINK CLIENT RATINGS
-- ============================================================

create table if not exists
public.job_request_client_ratings (
  id uuid primary key
    default gen_random_uuid(),

  client_id uuid not null
    references public.clients(id)
    on delete cascade,

  job_request_id uuid not null
    references public.client_job_requests(id)
    on delete cascade,

  rating smallint not null
    check (
      rating >= 1
      and rating <= 5
    ),

  note text,

  created_at timestamptz not null
    default timezone(
      'utc',
      now()
    ),

  updated_at timestamptz not null
    default timezone(
      'utc',
      now()
    ),

  constraint
    job_request_client_ratings_unique
    unique (
      client_id,
      job_request_id
    ),

  constraint
    job_request_client_rating_note_length
    check (
      note is null
      or char_length(note) <= 1000
    )
);

create index if not exists
job_request_client_ratings_request_idx
on public.job_request_client_ratings(
  job_request_id
);

create index if not exists
job_request_client_ratings_client_idx
on public.job_request_client_ratings(
  client_id
);


create or replace function
public.enforce_job_request_client_rating_scope()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  request_client_id uuid;
  request_source text;
begin
  select
    request.client_id,
    request.request_source
  into
    request_client_id,
    request_source
  from public.client_job_requests
    as request
  where request.id =
    new.job_request_id;

  if not found then
    raise exception
      'Job Link not found.';
  end if;

  if request_client_id <>
    new.client_id
  then
    raise exception
      'The Client cannot rate this Job Link.';
  end if;

  if request_source = 'client'
  then
    raise exception
      'A Client cannot rate a Job Link they submitted themselves.';
  end if;

  return new;
end;
$function$;


drop trigger if exists
enforce_job_request_client_rating_scope_trigger
on public.job_request_client_ratings;

create trigger
enforce_job_request_client_rating_scope_trigger
before insert or update
on public.job_request_client_ratings
for each row
execute function
public.enforce_job_request_client_rating_scope();


drop trigger if exists
job_request_client_ratings_set_updated_at
on public.job_request_client_ratings;

create trigger
job_request_client_ratings_set_updated_at
before update
on public.job_request_client_ratings
for each row
execute function
public.set_updated_at();


alter table
public.job_request_client_ratings
enable row level security;

revoke all
on public.job_request_client_ratings
from anon;

revoke all
on public.job_request_client_ratings
from authenticated;

grant all
on public.job_request_client_ratings
to service_role;


comment on table
public.application_client_ratings
is
  'Client quality ratings for individual Applications.';

comment on table
public.job_request_client_ratings
is
  'Client quality ratings for workforce-sourced Job Links.';

commit;
