begin;

create table if not exists
public.client_applicant_assignment_history (
  id uuid primary key default gen_random_uuid(),

  assignment_id uuid not null unique,

  client_id uuid not null,

  applicant_id uuid not null
    references public.applicants(id)
    on delete cascade,

  assigned_at timestamptz not null,

  unassigned_at timestamptz,

  created_at timestamptz not null
    default now(),

  check (
    unassigned_at is null
    or unassigned_at >= assigned_at
  )
);

create index if not exists
  client_applicant_assignment_history_applicant_idx
on public.client_applicant_assignment_history(
  applicant_id,
  assigned_at
);

create index if not exists
  client_applicant_assignment_history_client_idx
on public.client_applicant_assignment_history(
  client_id
);

insert into
  public.client_applicant_assignment_history (
    assignment_id,
    client_id,
    applicant_id,
    assigned_at,
    unassigned_at
  )
select
  assignment.id,
  assignment.client_id,
  assignment.applicant_id,
  assignment.created_at,
  null
from public.client_applicant_assignments
  as assignment
on conflict (assignment_id)
do nothing;

create or replace function
public.record_client_applicant_assignment_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into
    public.client_applicant_assignment_history (
      assignment_id,
      client_id,
      applicant_id,
      assigned_at,
      unassigned_at
    )
  values (
    new.id,
    new.client_id,
    new.applicant_id,
    new.created_at,
    null
  )
  on conflict (assignment_id)
  do update
  set
    client_id = excluded.client_id,
    applicant_id = excluded.applicant_id,
    assigned_at = excluded.assigned_at,
    unassigned_at = null;

  return new;
end;
$function$;

create or replace function
public.close_client_applicant_assignment_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  update
    public.client_applicant_assignment_history
  set
    unassigned_at =
      coalesce(
        unassigned_at,
        now()
      )
  where assignment_id =
    old.id;

  return old;
end;
$function$;

drop trigger if exists
  record_client_applicant_assignment_history_trigger
on public.client_applicant_assignments;

create trigger
  record_client_applicant_assignment_history_trigger
after insert
on public.client_applicant_assignments
for each row
execute function
  public.record_client_applicant_assignment_history();

drop trigger if exists
  close_client_applicant_assignment_history_trigger
on public.client_applicant_assignments;

create trigger
  close_client_applicant_assignment_history_trigger
after delete
on public.client_applicant_assignments
for each row
execute function
  public.close_client_applicant_assignment_history();

alter table
  public.client_applicant_assignment_history
enable row level security;

revoke all
on public.client_applicant_assignment_history
from anon;

revoke all
on public.client_applicant_assignment_history
from authenticated;

grant all
on public.client_applicant_assignment_history
to service_role;

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
  from public.applicant_client_ratings
    as rating
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
      eligible_day.work_date
    from (
      select distinct
        generated_day::date
          as work_date
      from
        public.client_applicant_assignment_history
          as history
      cross join lateral
        generate_series(
          (
            history.assigned_at
            at time zone
              'Africa/Lagos'
          )::date,
          least(
            coalesce(
              (
                history.unassigned_at
                at time zone
                  'Africa/Lagos'
              )::date,
              business_clock.today
            ),
            business_clock.today
          ),
          interval '1 day'
        ) as generated_day
      where
        history.applicant_id =
          applicant.id
        and (
          history.assigned_at
          at time zone
            'Africa/Lagos'
        )::date <=
          business_clock.today
        and extract(
          dow
          from generated_day
        ) <> 0
    ) as eligible_day
    order by
      eligible_day.work_date desc
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

commit;
