begin;

-- ============================================================
-- APPLICATION DRAFTS
--
-- Persistent Workshop records.
--
-- A Draft exists before an Application is marked as applied.
-- This allows Applicants to prepare several opportunities at
-- the same time while AI work runs independently per Draft.
-- ============================================================

create table if not exists
public.application_drafts (
  id uuid primary key
    default gen_random_uuid(),

  applicant_id uuid not null
    references public.applicants(id)
    on delete cascade,

  client_id uuid not null
    references public.clients(id)
    on delete cascade,

  job_request_id uuid
    references public.client_job_requests(id)
    on delete set null,

  application_id uuid
    references public.applications(id)
    on delete set null,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  origin text not null
    default 'applicant'
    check (
      origin in (
        'applicant',
        'job_request'
      )
    ),

  company text not null
    default '',

  position text not null
    default '',

  location text not null
    default '',

  job_url text not null
    default '',

  job_description text not null
    default '',

  -- ----------------------------------------------------------
  -- Overall Draft lifecycle
  -- ----------------------------------------------------------

  status text not null
    default 'active'
    check (
      status in (
        'active',
        'ready_to_apply',
        'applied',
        'cancelled'
      )
    ),

  -- ----------------------------------------------------------
  -- Fit analysis
  -- ----------------------------------------------------------

  fit_status text not null
    default 'not_started'
    check (
      fit_status in (
        'not_started',
        'analyzing',
        'completed',
        'failed'
      )
    ),

  applicability_score smallint
    check (
      applicability_score is null
      or (
        applicability_score >= 0
        and applicability_score <= 100
      )
    ),

  applicability_directive text,

  preference_alignment jsonb not null
    default '[]'::jsonb
    check (
      jsonb_typeof(
        preference_alignment
      ) = 'array'
    ),

  fit_analysis jsonb not null
    default '{}'::jsonb
    check (
      jsonb_typeof(
        fit_analysis
      ) = 'object'
    ),

  -- ----------------------------------------------------------
  -- Tailored Resume
  -- ----------------------------------------------------------

  resume_status text not null
    default 'not_started'
    check (
      resume_status in (
        'not_started',
        'generating',
        'completed',
        'failed'
      )
    ),

  tailored_resume_text text,

  resume_analysis jsonb not null
    default '{}'::jsonb
    check (
      jsonb_typeof(
        resume_analysis
      ) = 'object'
    ),

  resume_reviewed_at timestamptz,

  -- ----------------------------------------------------------
  -- ATS Audit
  -- ----------------------------------------------------------

  audit_status text not null
    default 'not_started'
    check (
      audit_status in (
        'not_started',
        'auditing',
        'completed',
        'failed'
      )
    ),

  ats_score smallint
    check (
      ats_score is null
      or (
        ats_score >= 0
        and ats_score <= 100
      )
    ),

  ats_audit jsonb not null
    default '{}'::jsonb
    check (
      jsonb_typeof(
        ats_audit
      ) = 'object'
    ),

  -- ----------------------------------------------------------
  -- Diagnostics
  -- ----------------------------------------------------------

  last_error text,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);


-- One Client/Linker Opportunity should map to one Workshop Draft.
create unique index if not exists
application_drafts_job_request_unique_idx
on public.application_drafts(
  job_request_id
)
where job_request_id is not null;


-- One Draft can produce at most one recorded Application.
create unique index if not exists
application_drafts_application_unique_idx
on public.application_drafts(
  application_id
)
where application_id is not null;


create index if not exists
application_drafts_applicant_idx
on public.application_drafts(
  applicant_id,
  updated_at desc
);


create index if not exists
application_drafts_client_idx
on public.application_drafts(
  client_id,
  updated_at desc
);


create index if not exists
application_drafts_status_idx
on public.application_drafts(
  status,
  updated_at desc
);


drop trigger if exists
set_application_drafts_updated_at
on public.application_drafts;

create trigger
set_application_drafts_updated_at
before update
on public.application_drafts
for each row
execute function
public.set_updated_at();


alter table
public.application_drafts
enable row level security;

revoke all
on public.application_drafts
from anon;

revoke all
on public.application_drafts
from authenticated;

grant all
on public.application_drafts
to service_role;


comment on table
public.application_drafts
is
  'Persistent Applicant Workshop state before an opportunity becomes a recorded Application.';


-- ============================================================
-- APPLICATION DRAFT AI JOBS
--
-- Separate AI operations allow Fit Analysis, Resume Generation
-- and ATS Audit to run and report state independently.
-- ============================================================

create table if not exists
public.application_draft_ai_jobs (
  id uuid primary key
    default gen_random_uuid(),

  draft_id uuid not null
    references public.application_drafts(id)
    on delete cascade,

  job_type text not null
    check (
      job_type in (
        'fit_analysis',
        'resume_generation',
        'resume_audit'
      )
    ),

  status text not null
    default 'queued'
    check (
      status in (
        'queued',
        'running',
        'completed',
        'failed',
        'cancelled'
      )
    ),

  provider text not null
    default 'huggingface',

  model text,

  request_fingerprint text,

  result jsonb not null
    default '{}'::jsonb
    check (
      jsonb_typeof(result) =
        'object'
    ),

  error_message text,

  attempt_count integer not null
    default 0
    check (
      attempt_count >= 0
    ),

  started_at timestamptz,

  completed_at timestamptz,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);


-- Prevent duplicate simultaneous AI work of the same kind.
create unique index if not exists
application_draft_ai_jobs_active_unique_idx
on public.application_draft_ai_jobs(
  draft_id,
  job_type
)
where status in (
  'queued',
  'running'
);


create index if not exists
application_draft_ai_jobs_draft_idx
on public.application_draft_ai_jobs(
  draft_id,
  created_at desc
);


create index if not exists
application_draft_ai_jobs_queue_idx
on public.application_draft_ai_jobs(
  status,
  created_at
);


drop trigger if exists
set_application_draft_ai_jobs_updated_at
on public.application_draft_ai_jobs;

create trigger
set_application_draft_ai_jobs_updated_at
before update
on public.application_draft_ai_jobs
for each row
execute function
public.set_updated_at();


alter table
public.application_draft_ai_jobs
enable row level security;

revoke all
on public.application_draft_ai_jobs
from anon;

revoke all
on public.application_draft_ai_jobs
from authenticated;

grant all
on public.application_draft_ai_jobs
to service_role;


comment on table
public.application_draft_ai_jobs
is
  'Persistent AI operation state for Workshop fit analysis, tailored resume generation and ATS audit.';

commit;
