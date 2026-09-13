begin;

create table if not exists public.client_subscriptions (
  id uuid primary key default gen_random_uuid(),

  client_id uuid not null unique
    references public.clients(id)
    on delete cascade,

  plan text not null
    check (
      plan in (
        'basic',
        'standard',
        'premium',
        'quarterly'
      )
    ),

  monthly_price_cents integer not null default 0
    check (monthly_price_cents >= 0),

  currency text not null default 'USD'
    check (char_length(currency) = 3),

  status text not null default 'active'
    check (
      status in (
        'active',
        'grace_period',
        'paused',
        'cancelled'
      )
    ),

  pause_reason text
    check (
      pause_reason is null
      or pause_reason in (
        'expired',
        'manual',
        'cancelled'
      )
    ),

  started_at timestamptz not null default now(),

  current_period_start date not null default current_date,

  current_period_end date not null,

  grace_period_ends_at date not null,

  last_renewed_at timestamptz,

  paused_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  check (
    current_period_end >=
      current_period_start
  ),

  check (
    grace_period_ends_at >=
      current_period_end
  )
);


create table if not exists public.client_subscription_events (
  id uuid primary key default gen_random_uuid(),

  subscription_id uuid not null
    references public.client_subscriptions(id)
    on delete cascade,

  client_id uuid not null
    references public.clients(id)
    on delete cascade,

  event_type text not null
    check (
      char_length(btrim(event_type))
      between 1 and 100
    ),

  event_key text not null
    check (
      char_length(btrim(event_key))
      between 1 and 200
    ),

  metadata jsonb not null default '{}'::jsonb,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),

  unique (
    subscription_id,
    event_key
  )
);


create index if not exists
  client_subscriptions_status_idx
on public.client_subscriptions(status);

create index if not exists
  client_subscriptions_period_end_idx
on public.client_subscriptions(
  current_period_end
);

create index if not exists
  client_subscription_events_client_idx
on public.client_subscription_events(
  client_id,
  created_at desc
);


alter table public.client_subscriptions
  enable row level security;

alter table public.client_subscription_events
  enable row level security;


revoke all
  on public.client_subscriptions
  from anon, authenticated;

revoke all
  on public.client_subscription_events
  from anon, authenticated;


grant select
  on public.client_subscriptions
  to authenticated;

grant select
  on public.client_subscription_events
  to authenticated;

grant all
  on public.client_subscriptions
  to service_role;

grant all
  on public.client_subscription_events
  to service_role;


drop policy if exists
  "Clients can view own subscription"
on public.client_subscriptions;

create policy
  "Clients can view own subscription"
on public.client_subscriptions
for select
to authenticated
using (
  public.user_owns_client(client_id)
);


drop policy if exists
  "Admins can view subscriptions"
on public.client_subscriptions;

create policy
  "Admins can view subscriptions"
on public.client_subscriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where
      profiles.id =
        (select auth.uid())
      and profiles.role in (
        'admin',
        'owner'
      )
      and profiles.account_status =
        'active'
  )
);


drop policy if exists
  "Clients can view own subscription events"
on public.client_subscription_events;

create policy
  "Clients can view own subscription events"
on public.client_subscription_events
for select
to authenticated
using (
  public.user_owns_client(client_id)
);


drop policy if exists
  "Admins can view subscription events"
on public.client_subscription_events;

create policy
  "Admins can view subscription events"
on public.client_subscription_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where
      profiles.id =
        (select auth.uid())
      and profiles.role in (
        'admin',
        'owner'
      )
      and profiles.account_status =
        'active'
  )
);


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
      else 0
    end;
$$;


create or replace function
  public.log_subscription_started()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into
    public.client_subscription_events (
      subscription_id,
      client_id,
      event_type,
      event_key,
      metadata
    )
  values (
    new.id,
    new.client_id,
    'subscription_started',
    'subscription_started',
    jsonb_build_object(
      'plan',
      new.plan,
      'periodStart',
      new.current_period_start,
      'periodEnd',
      new.current_period_end
    )
  )
  on conflict (
    subscription_id,
    event_key
  )
  do nothing;

  return new;
end;
$$;


drop trigger if exists
  log_subscription_started
on public.client_subscriptions;

create trigger
  log_subscription_started
after insert
on public.client_subscriptions
for each row
execute function
  public.log_subscription_started();


create or replace function
  public.create_default_client_subscription()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  period_end date;
begin
  period_end :=
    (
      current_date +
      interval '1 month'
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


drop trigger if exists
  create_default_client_subscription
on public.clients;

create trigger
  create_default_client_subscription
after insert
on public.clients
for each row
execute function
  public.create_default_client_subscription();


insert into public.client_subscriptions (
  client_id,
  plan,
  monthly_price_cents,
  current_period_start,
  current_period_end,
  grace_period_ends_at
)
select
  clients.id,
  clients.plan,
  public.subscription_plan_price_cents(
    clients.plan
  ),
  current_date,
  (
    current_date +
    interval '1 month'
  )::date,
  (
    (
      current_date +
      interval '1 month'
    )::date + 3
  )
from public.clients
on conflict (client_id)
do nothing;


create or replace function
  public.create_subscription_notification_once(
    p_subscription_id uuid,
    p_event_key text,
    p_event_type text,
    p_title text,
    p_message text,
    p_href text default '/billing'
  )
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_subscription
    public.client_subscriptions%rowtype;

  inserted_event_id uuid;
begin
  select *
  into target_subscription
  from public.client_subscriptions
  where id = p_subscription_id;

  if not found then
    return false;
  end if;

  insert into
    public.client_subscription_events (
      subscription_id,
      client_id,
      event_type,
      event_key,
      metadata
    )
  values (
    target_subscription.id,
    target_subscription.client_id,
    p_event_type,
    p_event_key,
    jsonb_build_object(
      'periodEnd',
      target_subscription.current_period_end
    )
  )
  on conflict (
    subscription_id,
    event_key
  )
  do nothing
  returning id
  into inserted_event_id;

  if inserted_event_id is null then
    return false;
  end if;

  insert into public.client_notifications (
    client_id,
    type,
    title,
    message,
    href
  )
  values (
    target_subscription.client_id,
    'system',
    p_title,
    p_message,
    coalesce(
      nullif(btrim(p_href), ''),
      '/billing'
    )
  );

  return true;
end;
$$;


revoke all
  on function
    public.create_subscription_notification_once(
      uuid,
      text,
      text,
      text,
      text,
      text
    )
  from public;

grant execute
  on function
    public.create_subscription_notification_once(
      uuid,
      text,
      text,
      text,
      text,
      text
    )
  to service_role;


drop trigger if exists
  set_client_subscriptions_updated_at
on public.client_subscriptions;

create trigger
  set_client_subscriptions_updated_at
before update
on public.client_subscriptions
for each row
execute function
  public.set_updated_at();

commit;
