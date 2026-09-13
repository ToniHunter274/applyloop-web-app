begin;

create table if not exists
public.client_applicant_targets (
  id uuid primary key
    default gen_random_uuid(),

  subscription_id uuid not null
    references public.client_subscriptions(id)
    on delete cascade,

  client_id uuid not null
    references public.clients(id)
    on delete cascade,

  applicant_id uuid not null
    references public.applicants(id)
    on delete cascade,

  period_start date not null,

  period_end date not null,

  application_target integer
    not null default 0
    check (application_target >= 0),

  created_at timestamptz
    not null default now(),

  updated_at timestamptz
    not null default now(),

  check (
    period_end > period_start
  ),

  unique (
    subscription_id,
    period_start,
    applicant_id
  )
);


create index if not exists
  client_applicant_targets_client_idx
on public.client_applicant_targets(
  client_id,
  period_start
);


create index if not exists
  client_applicant_targets_applicant_idx
on public.client_applicant_targets(
  applicant_id,
  period_start
);


alter table
  public.client_applicant_targets
enable row level security;


revoke all
on public.client_applicant_targets
from anon, authenticated;


grant all
on public.client_applicant_targets
to service_role;


create or replace function
public.validate_client_applicant_target()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_client_id uuid;
  target_period_start date;
  target_period_end date;
  client_limit integer;
  allocated_target integer;
begin
  perform pg_advisory_xact_lock(
    hashtext(
      new.subscription_id::text
    )::bigint
  );

  select
    subscription.client_id,
    subscription.current_period_start,
    subscription.current_period_end,
    client.application_limit
  into
    target_client_id,
    target_period_start,
    target_period_end,
    client_limit
  from public.client_subscriptions
    as subscription
  join public.clients
    as client
    on client.id =
      subscription.client_id
  where subscription.id =
    new.subscription_id;

  if target_client_id is null then
    raise exception
      'The subscription does not exist.';
  end if;

  if new.client_id
    is distinct from
    target_client_id
  then
    raise exception
      'The target Client does not match the subscription.';
  end if;

  if
    new.period_start
      is distinct from
        target_period_start
    or
    new.period_end
      is distinct from
        target_period_end
  then
    raise exception
      'Applicant targets must belong to the current subscription period.';
  end if;

  if not exists (
    select 1
    from public.client_applicant_assignments
    where
      client_id = new.client_id
      and applicant_id =
        new.applicant_id
  ) then
    raise exception
      'The Applicant is not assigned to this Client.';
  end if;

  select
    coalesce(
      sum(application_target),
      0
    )::integer
  into allocated_target
  from public.client_applicant_targets
  where
    subscription_id =
      new.subscription_id
    and period_start =
      new.period_start
    and id <> new.id;

  if
    allocated_target +
      new.application_target >
      client_limit
  then
    raise exception
      'Applicant targets cannot exceed the Client subscription allowance of % applications.',
      client_limit;
  end if;

  return new;
end;
$$;


drop trigger if exists
  validate_client_applicant_target_trigger
on public.client_applicant_targets;

create trigger
  validate_client_applicant_target_trigger
before insert or update
on public.client_applicant_targets
for each row
execute function
  public.validate_client_applicant_target();


create or replace function
public.seed_client_applicant_targets(
  p_subscription_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  subscription_record record;
  assignment_record record;
  assignment_count integer;
  base_target integer;
  remainder integer;
  position integer := 0;
  target_value integer;
begin
  select
    subscription.id,
    subscription.client_id,
    subscription.current_period_start,
    subscription.current_period_end,
    client.application_limit
  into subscription_record
  from public.client_subscriptions
    as subscription
  join public.clients
    as client
    on client.id =
      subscription.client_id
  where subscription.id =
    p_subscription_id;

  if not found then
    return;
  end if;

  select count(*)::integer
  into assignment_count
  from public.client_applicant_assignments
  where client_id =
    subscription_record.client_id;

  if assignment_count = 0 then
    return;
  end if;

  base_target :=
    subscription_record.application_limit
    / assignment_count;

  remainder :=
    subscription_record.application_limit
    % assignment_count;

  for assignment_record in
    select
      applicant_id
    from public.client_applicant_assignments
    where client_id =
      subscription_record.client_id
    order by
      created_at,
      applicant_id
  loop
    position :=
      position + 1;

    target_value :=
      base_target +
      case
        when position <= remainder
          then 1
        else 0
      end;

    insert into
      public.client_applicant_targets (
        subscription_id,
        client_id,
        applicant_id,
        period_start,
        period_end,
        application_target
      )
    values (
      subscription_record.id,
      subscription_record.client_id,
      assignment_record.applicant_id,
      subscription_record.current_period_start,
      subscription_record.current_period_end,
      target_value
    )
    on conflict (
      subscription_id,
      period_start,
      applicant_id
    )
    do nothing;
  end loop;
end;
$$;


create or replace function
public.seed_targets_for_subscription_period()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform
    public.seed_client_applicant_targets(
      new.id
    );

  return new;
end;
$$;


drop trigger if exists
  seed_targets_for_subscription_period_trigger
on public.client_subscriptions;

create trigger
  seed_targets_for_subscription_period_trigger
after insert or update of
  current_period_start,
  current_period_end
on public.client_subscriptions
for each row
execute function
  public.seed_targets_for_subscription_period();


create or replace function
public.create_target_for_new_assignment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  subscription_record record;
  allocated_target integer;
  assignment_count integer;
  target_value integer := 0;
begin
  select
    subscription.id,
    subscription.client_id,
    subscription.current_period_start,
    subscription.current_period_end,
    client.application_limit
  into subscription_record
  from public.client_subscriptions
    as subscription
  join public.clients
    as client
    on client.id =
      subscription.client_id
  where subscription.client_id =
    new.client_id
    and subscription.status <>
      'cancelled'
  limit 1;

  if not found then
    return new;
  end if;

  select
    coalesce(
      sum(application_target),
      0
    )::integer
  into allocated_target
  from public.client_applicant_targets
  where
    subscription_id =
      subscription_record.id
    and period_start =
      subscription_record
        .current_period_start;

  select count(*)::integer
  into assignment_count
  from public.client_applicant_assignments
  where client_id =
    new.client_id;

  if
    assignment_count = 1
    and allocated_target = 0
  then
    target_value :=
      subscription_record
        .application_limit;
  end if;

  insert into
    public.client_applicant_targets (
      subscription_id,
      client_id,
      applicant_id,
      period_start,
      period_end,
      application_target
    )
  values (
    subscription_record.id,
    new.client_id,
    new.applicant_id,
    subscription_record.current_period_start,
    subscription_record.current_period_end,
    target_value
  )
  on conflict (
    subscription_id,
    period_start,
    applicant_id
  )
  do nothing;

  return new;
end;
$$;


drop trigger if exists
  create_target_for_new_assignment_trigger
on public.client_applicant_assignments;

create trigger
  create_target_for_new_assignment_trigger
after insert
on public.client_applicant_assignments
for each row
execute function
  public.create_target_for_new_assignment();


do $$
declare
  subscription_record record;
begin
  for subscription_record in
    select id
    from public.client_subscriptions
  loop
    perform
      public.seed_client_applicant_targets(
        subscription_record.id
      );
  end loop;
end;
$$;


drop trigger if exists
  set_client_applicant_targets_updated_at
on public.client_applicant_targets;

create trigger
  set_client_applicant_targets_updated_at
before update
on public.client_applicant_targets
for each row
execute function
  public.set_updated_at();

commit;
