begin;

-- ============================================================
-- PERSONNEL RATINGS NOW COME FROM RATED WORK
--
-- Applicant:
--   average of per-Application Client ratings.
--
-- Linker:
--   average of per-Job-Link Client ratings.
--
-- The old blanket Client -> Applicant rating is retired.
-- ============================================================

create or replace function
public.get_applicant_performance()
returns table (
  applicant_id uuid,
  completed_tasks bigint,
  quality_rating numeric,
  rating_count bigint,
  completion_rate numeric,
  monitored_workdays bigint,
  today_completed bigint,
  today_completion_rate numeric
)
language sql
security definer
set search_path = public
as $function$
with business_clock as (
  select
    (
      timezone(
        'Africa/Lagos',
        now()
      )
    )::date as today
),

applicant_base as (
  select
    applicant.id,
    applicant.user_id,
    applicant.active_tasks,
    applicant.created_at
  from public.applicants
    as applicant
),

rating_summary as (
  select
    rating.applicant_id,
    round(
      avg(
        rating.rating::numeric
      ),
      1
    ) as quality_rating,
    count(*)::bigint
      as rating_count
  from public.application_client_ratings
    as rating
  where
    rating.applicant_id is not null
  group by
    rating.applicant_id
),

application_summary as (
  select
    application.created_by,
    count(*)::bigint
      as completed_tasks
  from public.applications
    as application
  where
    application.created_by
      is not null
  group by
    application.created_by
),

workdays as (
  select
    applicant.id
      as applicant_id,
    applicant.user_id,
    applicant.active_tasks,
    day.work_date
  from applicant_base
    as applicant
  cross join business_clock
  cross join lateral (
    select
      generated_day::date
        as work_date
    from generate_series(
      greatest(
        (
          applicant.created_at
          at time zone
            'Africa/Lagos'
        )::date,
        business_clock.today - 40
      ),
      business_clock.today,
      interval '1 day'
    ) as generated_day
    where
      extract(
        dow
        from generated_day
      ) <> 0
    order by
      generated_day desc
    limit 30
  ) as day
),

daily_counts as (
  select
    workday.applicant_id,
    workday.active_tasks,
    workday.work_date,
    count(
      application.id
    )::bigint
      as applied_count
  from workdays
    as workday
  left join public.applications
    as application
    on application.created_by =
      workday.user_id
    and (
      application.applied_at
      at time zone
        'Africa/Lagos'
    )::date =
      workday.work_date
  group by
    workday.applicant_id,
    workday.active_tasks,
    workday.work_date
),

daily_scores as (
  select
    daily_count.applicant_id,
    daily_count.work_date,
    daily_count.applied_count,
    case
      when
        daily_count.active_tasks >
        0
      then least(
        (
          daily_count.applied_count::numeric /
          daily_count.active_tasks::numeric
        ) * 100,
        100::numeric
      )
      else 0::numeric
    end as daily_completion_rate
  from daily_counts
    as daily_count
),

completion_summary as (
  select
    daily_score.applicant_id,

    count(*)::bigint
      as monitored_workdays,

    round(
      avg(
        daily_score.daily_completion_rate
      ),
      1
    ) as completion_rate,

    coalesce(
      max(
        daily_score.applied_count
      ) filter (
        where
          daily_score.work_date =
          business_clock.today
      ),
      0
    )::bigint
      as today_completed,

    coalesce(
      round(
        max(
          daily_score.daily_completion_rate
        ) filter (
          where
            daily_score.work_date =
            business_clock.today
        ),
        1
      ),
      0
    ) as today_completion_rate

  from daily_scores
    as daily_score
  cross join business_clock
  group by
    daily_score.applicant_id
)

select
  applicant.id
    as applicant_id,

  coalesce(
    application_summary.completed_tasks,
    0
  )::bigint
    as completed_tasks,

  coalesce(
    rating_summary.quality_rating,
    0
  )::numeric
    as quality_rating,

  coalesce(
    rating_summary.rating_count,
    0
  )::bigint
    as rating_count,

  coalesce(
    completion_summary.completion_rate,
    0
  )::numeric
    as completion_rate,

  coalesce(
    completion_summary.monitored_workdays,
    0
  )::bigint
    as monitored_workdays,

  coalesce(
    completion_summary.today_completed,
    0
  )::bigint
    as today_completed,

  coalesce(
    completion_summary.today_completion_rate,
    0
  )::numeric
    as today_completion_rate

from applicant_base
  as applicant

left join rating_summary
  on rating_summary.applicant_id =
    applicant.id

left join application_summary
  on application_summary.created_by =
    applicant.user_id

left join completion_summary
  on completion_summary.applicant_id =
    applicant.id;
$function$;

revoke all
on function
public.get_applicant_performance()
from public;

revoke all
on function
public.get_applicant_performance()
from anon;

revoke all
on function
public.get_applicant_performance()
from authenticated;

grant execute
on function
public.get_applicant_performance()
to service_role;


-- ============================================================
-- REMOVE OLD BLANKET APPLICANT RATING
-- ============================================================

drop table if exists
public.applicant_client_ratings;

drop function if exists
public.enforce_applicant_client_rating_assignment();



-- ============================================================
-- LINKER PERFORMANCE
--
-- A Linker's quality rating is derived only from individual
-- Client ratings of Job Links that Linker actually sourced.
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

rating_summary as (
  select
    request.submitted_by
      as linker_user_id,

    round(
      avg(
        rating.rating::numeric
      ),
      1
    ) as quality_rating,

    count(*)::bigint
      as rating_count

  from public.job_request_client_ratings
    as rating

  join public.client_job_requests
    as request
    on request.id =
      rating.job_request_id

  where
    request.request_source =
      'linker'
    and request.submitted_by
      is not null

  group by
    request.submitted_by
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
public.get_applicant_performance()
is
  'Applicant performance including cumulative quality rating derived from individual Client Application ratings.';

comment on function
public.get_linker_performance()
is
  'Linker quality rating derived from individual Client ratings of Linker-sourced Job Links.';

commit;
