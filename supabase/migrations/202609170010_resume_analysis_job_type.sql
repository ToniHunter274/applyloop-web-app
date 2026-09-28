begin;

-- ============================================================
-- RESUME ANALYSIS AI JOB
--
-- Resume Analysis is a separate Workshop stage:
--
-- Generate Resume
--   -> Resume Analysis
--   -> ATS Audit
--   -> Human Review
--   -> Mark Applied
--
-- Keep it distinct from resume_generation and resume_audit so
-- its state and failures can be tracked independently.
-- ============================================================

alter table
public.application_draft_ai_jobs
drop constraint if exists
application_draft_ai_jobs_job_type_check;

alter table
public.application_draft_ai_jobs
add constraint
application_draft_ai_jobs_job_type_check
check (
  job_type in (
    'fit_analysis',
    'resume_generation',
    'resume_analysis',
    'resume_audit'
  )
);

comment on column
public.application_draft_ai_jobs.job_type
is
  'AI operation type: fit analysis, resume generation, resume analysis, or resume audit.';

commit;
