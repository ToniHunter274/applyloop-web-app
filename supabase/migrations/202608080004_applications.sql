begin;

create table if not exists
public.applications (
  id uuid primary key
    default gen_random_uuid(),

  client_id uuid not null
    references public.clients(id)
    on delete cascade,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  company text not null,

  position text not null,

  location text not null
    default '',

  status text not null
    default 'Submitted'
    check (
      status in (
        'Interview Scheduled',
        'Waiting',
        'Offer Received',
        'Rejected',
        'Submitted'
      )
    ),

  link_source text not null
    default 'Applicant'
    check (
      link_source in (
        'Client',
        'Finder',
        'Applicant'
      )
    ),

  role text,

  applied_at timestamptz not null
    default now(),

  preferences jsonb not null
    default '[]'::jsonb
    check (
      jsonb_typeof(preferences) =
        'array'
    ),

  job_url text,

  resume_name text,

  cover_letter_name text,

  feedback text,

  job_details jsonb not null
    default '[]'::jsonb
    check (
      jsonb_typeof(job_details) =
        'array'
    ),

  qualities jsonb not null
    default '[]'::jsonb
    check (
      jsonb_typeof(qualities) =
        'array'
    ),

  other_details jsonb not null
    default '[]'::jsonb
    check (
      jsonb_typeof(other_details) =
        'array'
    ),

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);

create index if not exists
applications_client_id_idx
on public.applications(client_id);

create index if not exists
applications_applied_at_idx
on public.applications(
  applied_at desc
);

create index if not exists
applications_status_idx
on public.applications(status);

drop trigger if exists
set_applications_updated_at
on public.applications;

create trigger
set_applications_updated_at
before update
on public.applications
for each row
execute function
public.set_updated_at();

alter table
public.applications
enable row level security;

revoke all
on public.applications
from anon;

revoke all
on public.applications
from authenticated;

grant all
on public.applications
to service_role;

commit;
