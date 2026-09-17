begin;

-- ============================================================
-- LINKER RATING ATTRIBUTION
--
-- Support all Linker Job-Link generations:
--
-- 1. Current Work Allocation attribution
--    client_job_requests.linker_work_allocation_id
--
-- 2. Legacy Applicant assignment attribution
--    client_job_requests.linker_assignment_id
--
-- 3. Direct submitted_by attribution as fallback
--
-- This ensures historical Linker-sourced links contribute to
-- the correct Linker's cumulative Client rating.
-- ============================================================

create or replace function
public.get_linker_performance()
returns table (
  linker_user_id uuid,
  quality_rating numeric,
  rating_count bigint
)
language sql
security definer
set search_path = public
as $function$
with linker_base as (
  select
    profile.id
      as linker_user_id

  from public.profiles
    as profile

  where
    profile.role = 'linker'
),

rated_links as (
  select
    coalesce(
      allocation.linker_user_id,
      legacy_assignment.linker_user_id,
      request.submitted_by
    ) as linker_user_id,

    rating.rating

  from public.job_request_client_ratings
    as rating

  join public.client_job_requests
    as request
    on request.id =
      rating.job_request_id

  left join public.linker_work_allocations
    as allocation
    on allocation.id =
      request.linker_work_allocation_id

  left join public.linker_applicant_assignments
    as legacy_assignment
    on legacy_assignment.id =
      request.linker_assignment_id

  where
    request.request_source =
      'linker'
),

rating_summary as (
  select
    rated_link.linker_user_id,

    round(
      avg(
        rated_link.rating::numeric
      ),
      1
    ) as quality_rating,

    count(*)::bigint
      as rating_count

  from rated_links
    as rated_link

  where
    rated_link.linker_user_id
      is not null

  group by
    rated_link.linker_user_id
)

select
  linker.linker_user_id,

  coalesce(
    rating.quality_rating,
    0
  )::numeric
    as quality_rating,

  coalesce(
    rating.rating_count,
    0
  )::bigint
    as rating_count

from linker_base
  as linker

left join rating_summary
  as rating
  on rating.linker_user_id =
    linker.linker_user_id;

$function$;


revoke all
on function
public.get_linker_performance()
from public;

revoke all
on function
public.get_linker_performance()
from anon;

revoke all
on function
public.get_linker_performance()
from authenticated;

grant execute
on function
public.get_linker_performance()
to service_role;


comment on function
public.get_linker_performance()
is
  'Cumulative Linker Client rating derived from individually rated Job Links, supporting current Work Allocation, legacy assignment, and submitted_by attribution.';

commit;
