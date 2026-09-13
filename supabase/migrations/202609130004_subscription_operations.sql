begin;

create or replace function
public.subscription_plan_period_months(
  plan_name text
)
returns integer
language sql
immutable
as $$
  select
    case lower(plan_name)
      when 'quarterly' then 3
      else 1
    end;
$$;


create or replace function
public.subscription_plan_price_cents(
  plan_name text
)
returns integer
language sql
immutable
as $$
  select
    case lower(plan_name)
      when 'basic' then 15000
      when 'standard' then 20000
      when 'premium' then 25000
      when 'quarterly' then 75000
      else 0
    end;
$$;


create or replace function
public.create_default_client_subscription()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  period_months integer;
  period_end date;
begin
  period_months :=
    public.subscription_plan_period_months(
      new.plan
    );

  period_end :=
    (
      current_date +
      make_interval(
        months => period_months
      )
    )::date;

  insert into
    public.client_subscriptions (
      client_id,
      plan,
      monthly_price_cents,
      current_period_start,
      current_period_end,
      grace_period_ends_at
    )
  values (
    new.id,
    new.plan,
    public.subscription_plan_price_cents(
      new.plan
    ),
    current_date,
    period_end,
    period_end + 3
  )
  on conflict (client_id)
  do nothing;

  return new;
end;
$$;


/*
 * Correct pilot quarterly subscriptions that were
 * initially created with a one-month period before
 * quarterly cadence was introduced.
 */
update public.client_subscriptions
set
  monthly_price_cents =
    public.subscription_plan_price_cents(
      plan
    ),
  current_period_end =
    (
      current_period_start +
      interval '3 months'
    )::date,
  grace_period_ends_at =
    (
      current_period_start +
      interval '3 months'
    )::date + 3
where
  plan = 'quarterly'
  and last_renewed_at is null
  and current_period_end =
    (
      current_period_start +
      interval '1 month'
    )::date;


update public.client_applicant_targets
set period_end =
  subscription.current_period_end
from public.client_subscriptions
  as subscription
where
  client_applicant_targets.subscription_id =
    subscription.id
  and client_applicant_targets.period_start =
    subscription.current_period_start
  and client_applicant_targets.period_end <>
    subscription.current_period_end;


/*
 * Mark subscription renewed.
 *
 * If the Client renews before the grace period ends,
 * preserve their normal billing cycle.
 *
 * If they renew after the grace period has expired,
 * the new paid period begins today.
 */
create or replace function
public.renew_client_subscription(
  p_client_id uuid,
  p_expected_period_end date,
  p_created_by uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  subscription_record
    public.client_subscriptions%rowtype;

  previous_targets jsonb;

  current_assignment_count integer;
  previous_target_count integer;

  period_months integer;

  next_period_start date;
  next_period_end date;
begin
  select *
  into subscription_record
  from public.client_subscriptions
  where client_id =
    p_client_id
  for update;

  if not found then
    raise exception
      'The Client subscription could not be found.';
  end if;

  if
    subscription_record.current_period_end
      is distinct from
        p_expected_period_end
  then
    raise exception
      'The subscription period has changed. Refresh and try again.';
  end if;

  if subscription_record.status =
    'cancelled'
  then
    raise exception
      'A cancelled subscription cannot be renewed from this action.';
  end if;

  /*
   * Do not start the next Applicant target
   * period before the current paid period ends.
   */
  if
    current_date <
      subscription_record.current_period_end
  then
    raise exception
      'This subscription is not due for renewal until %. Mark it renewed on or after the renewal date.',
      subscription_record.current_period_end;
  end if;


  select count(*)::integer
  into current_assignment_count
  from public.client_applicant_assignments
  where client_id =
    p_client_id;


  select
    count(*)::integer,
    jsonb_agg(
      jsonb_build_object(
        'applicant_id',
        target.applicant_id,
        'application_target',
        target.application_target
      )
      order by target.applicant_id
    )
  into
    previous_target_count,
    previous_targets
  from public.client_applicant_targets
    as target
  join public.client_applicant_assignments
    as assignment
    on assignment.client_id =
      target.client_id
    and assignment.applicant_id =
      target.applicant_id
  where
    target.subscription_id =
      subscription_record.id
    and target.period_start =
      subscription_record.current_period_start;


  period_months :=
    public.subscription_plan_period_months(
      subscription_record.plan
    );


  if
    current_date <=
      subscription_record.grace_period_ends_at
  then
    next_period_start :=
      subscription_record.current_period_end;
  else
    next_period_start :=
      current_date;
  end if;


  next_period_end :=
    (
      next_period_start +
      make_interval(
        months => period_months
      )
    )::date;


  update public.client_subscriptions
  set
    status = 'active',
    pause_reason = null,
    current_period_start =
      next_period_start,
    current_period_end =
      next_period_end,
    grace_period_ends_at =
      next_period_end + 3,
    last_renewed_at = now(),
    paused_at = null,
    monthly_price_cents =
      public.subscription_plan_price_cents(
        subscription_record.plan
      )
  where id =
    subscription_record.id;


  update public.clients
  set status = 'active'
  where id =
    p_client_id;


  /*
   * The period-change trigger creates fresh
   * target rows. When the assignment roster has
   * not changed, preserve the previous allocation.
   *
   * Example: 150 + 50 remains 150 + 50 next period.
   */
  if
    current_assignment_count > 0
    and previous_target_count =
      current_assignment_count
    and previous_targets is not null
  then
    perform
      public.set_client_applicant_targets(
        p_client_id,
        previous_targets
      );
  end if;


  insert into
    public.client_subscription_events (
      subscription_id,
      client_id,
      event_type,
      event_key,
      metadata,
      created_by
    )
  values (
    subscription_record.id,
    p_client_id,
    'renewed',
    format(
      'renewed_%s_%s',
      next_period_start,
      next_period_end
    ),
    jsonb_build_object(
      'previousPeriodEnd',
      subscription_record.current_period_end,
      'periodStart',
      next_period_start,
      'periodEnd',
      next_period_end
    ),
    p_created_by
  )
  on conflict (
    subscription_id,
    event_key
  )
  do nothing;


  insert into
    public.client_notifications (
      client_id,
      type,
      title,
      message,
      href
    )
  values (
    p_client_id,
    'system',
    'Subscription renewed',
    format(
      'Your ApplyLoop subscription has been renewed. Your next renewal date is %s.',
      to_char(
        next_period_end,
        'Mon DD, YYYY'
      )
    ),
    '/billing'
  );
end;
$$;


create or replace function
public.pause_client_subscription(
  p_client_id uuid,
  p_created_by uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  subscription_record
    public.client_subscriptions%rowtype;

  event_key_value text;
begin
  select *
  into subscription_record
  from public.client_subscriptions
  where client_id =
    p_client_id
  for update;

  if not found then
    raise exception
      'The Client subscription could not be found.';
  end if;

  if subscription_record.status =
    'cancelled'
  then
    raise exception
      'A cancelled subscription cannot be paused.';
  end if;

  if
    subscription_record.status = 'paused'
    and subscription_record.pause_reason =
      'manual'
  then
    return;
  end if;

  update public.client_subscriptions
  set
    status = 'paused',
    pause_reason = 'manual',
    paused_at = now()
  where id =
    subscription_record.id;

  update public.clients
  set status = 'paused'
  where id =
    p_client_id;

  event_key_value :=
    format(
      'manual_pause_%s',
      floor(
        extract(
          epoch from clock_timestamp()
        ) * 1000
      )::bigint
    );

  insert into
    public.client_subscription_events (
      subscription_id,
      client_id,
      event_type,
      event_key,
      metadata,
      created_by
    )
  values (
    subscription_record.id,
    p_client_id,
    'paused',
    event_key_value,
    jsonb_build_object(
      'reason',
      'manual'
    ),
    p_created_by
  );

  insert into
    public.client_notifications (
      client_id,
      type,
      title,
      message,
      href
    )
  values (
    p_client_id,
    'system',
    'Application service paused',
    'Your ApplyLoop application service has been paused. Your account and existing history remain available.',
    '/billing'
  );
end;
$$;


create or replace function
public.reactivate_client_subscription(
  p_client_id uuid,
  p_created_by uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  subscription_record
    public.client_subscriptions%rowtype;

  next_status text;

  event_key_value text;
begin
  select *
  into subscription_record
  from public.client_subscriptions
  where client_id =
    p_client_id
  for update;

  if not found then
    raise exception
      'The Client subscription could not be found.';
  end if;

  if subscription_record.status =
    'cancelled'
  then
    raise exception
      'A cancelled subscription cannot be reactivated.';
  end if;

  if
    subscription_record.status <>
      'paused'
  then
    return;
  end if;

  if
    subscription_record.pause_reason <>
      'manual'
  then
    raise exception
      'This subscription requires renewal before service can be reactivated.';
  end if;

  if
    current_date >
      subscription_record.grace_period_ends_at
  then
    raise exception
      'The subscription period has expired. Mark the subscription renewed instead.';
  end if;

  if
    current_date >
      subscription_record.current_period_end
  then
    next_status :=
      'grace_period';
  else
    next_status :=
      'active';
  end if;

  update public.client_subscriptions
  set
    status = next_status,
    pause_reason = null,
    paused_at = null
  where id =
    subscription_record.id;

  update public.clients
  set status = 'active'
  where id =
    p_client_id;

  event_key_value :=
    format(
      'reactivated_%s',
      floor(
        extract(
          epoch from clock_timestamp()
        ) * 1000
      )::bigint
    );

  insert into
    public.client_subscription_events (
      subscription_id,
      client_id,
      event_type,
      event_key,
      metadata,
      created_by
    )
  values (
    subscription_record.id,
    p_client_id,
    'reactivated',
    event_key_value,
    jsonb_build_object(
      'status',
      next_status
    ),
    p_created_by
  );

  insert into
    public.client_notifications (
      client_id,
      type,
      title,
      message,
      href
    )
  values (
    p_client_id,
    'system',
    'Application service reactivated',
    'Your ApplyLoop application service has been reactivated.',
    '/billing'
  );
end;
$$;


revoke all
on function
  public.renew_client_subscription(
    uuid,
    date,
    uuid
  )
from public;

revoke all
on function
  public.pause_client_subscription(
    uuid,
    uuid
  )
from public;

revoke all
on function
  public.reactivate_client_subscription(
    uuid,
    uuid
  )
from public;


grant execute
on function
  public.renew_client_subscription(
    uuid,
    date,
    uuid
  )
to service_role;

grant execute
on function
  public.pause_client_subscription(
    uuid,
    uuid
  )
to service_role;

grant execute
on function
  public.reactivate_client_subscription(
    uuid,
    uuid
  )
to service_role;

commit;
