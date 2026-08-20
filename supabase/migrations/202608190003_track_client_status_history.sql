begin;

create table if not exists
public.client_status_history (
  id uuid primary key default gen_random_uuid(),

  client_id uuid not null
    references public.clients(id)
    on delete cascade,

  status text not null
    check (
      status in (
        'active',
        'paused',
        'completed'
      )
    ),

  started_at timestamptz not null,

  ended_at timestamptz,

  created_at timestamptz not null
    default now(),

  check (
    ended_at is null
    or ended_at >= started_at
  )
);

create index if not exists
  client_status_history_client_idx
on public.client_status_history (
  client_id,
  started_at
);

create unique index if not exists
  client_status_history_open_idx
on public.client_status_history (
  client_id
)
where ended_at is null;

insert into
  public.client_status_history (
    client_id,
    status,
    started_at,
    ended_at
  )
select
  client.id,
  client.status,
  client.created_at,
  null
from public.clients
  as client
where not exists (
  select 1
  from public.client_status_history
    as history
  where history.client_id =
    client.id
);

create or replace function
public.record_client_status_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_changed_at timestamptz;
begin
  if tg_op = 'INSERT' then
    insert into
      public.client_status_history (
        client_id,
        status,
        started_at,
        ended_at
      )
    values (
      new.id,
      new.status,
      new.created_at,
      null
    )
    on conflict do nothing;

    return new;
  end if;

  if old.status is not distinct from new.status then
    return new;
  end if;

  v_changed_at := now();

  update
    public.client_status_history
  set
    ended_at = v_changed_at
  where client_id = new.id
    and ended_at is null;

  insert into
    public.client_status_history (
      client_id,
      status,
      started_at,
      ended_at
    )
  values (
    new.id,
    new.status,
    v_changed_at,
    null
  );

  return new;
end;
$function$;

drop trigger if exists
  record_client_status_history_insert_trigger
on public.clients;

create trigger
  record_client_status_history_insert_trigger
after insert
on public.clients
for each row
execute function
  public.record_client_status_history();

drop trigger if exists
  record_client_status_history_update_trigger
on public.clients;

create trigger
  record_client_status_history_update_trigger
after update of status
on public.clients
for each row
execute function
  public.record_client_status_history();

revoke all
on function
public.record_client_status_history()
from public;

revoke all
on function
public.record_client_status_history()
from anon;

revoke all
on function
public.record_client_status_history()
from authenticated;

alter table
  public.client_status_history
enable row level security;

revoke all
on public.client_status_history
from anon;

revoke all
on public.client_status_history
from authenticated;

grant all
on public.client_status_history
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
          as assignment_history
      join
        public.client_status_history
          as status_history
        on status_history.client_id =
          assignment_history.client_id
        and status_history.status =
          'active'
      cross join lateral
        generate_series(
          greatest(
            (
              assignment_history.assigned_at
              at time zone
                'Africa/Lagos'
            )::date,
            (
              status_history.started_at
              at time zone
                'Africa/Lagos'
            )::date
          ),
          least(
            coalesce(
              (
                assignment_history.unassigned_at
                at time zone
                  'Africa/Lagos'
              )::date,
              business_clock.today
            ),
            coalesce(
              (
                status_history.ended_at
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
        assignment_history.applicant_id =
          applicant.id
        and greatest(
          (
            assignment_history.assigned_at
            at time zone
              'Africa/Lagos'
          )::date,
          (
            status_history.started_at
            at time zone
              'Africa/Lagos'
          )::date
        ) <= least(
          coalesce(
            (
              assignment_history.unassigned_at
              at time zone
                'Africa/Lagos'
            )::date,
            business_clock.today
          ),
          coalesce(
            (
              status_history.ended_at
              at time zone
                'Africa/Lagos'
            )::date,
            business_clock.today
          ),
          business_clock.today
        )
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
