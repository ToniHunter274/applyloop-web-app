begin;

create or replace function
public.set_client_applicant_targets(
  p_client_id uuid,
  p_targets jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  subscription_record record;
  assignment_count integer;
  supplied_count integer;
  supplied_distinct_count integer;
  total_target integer;
  target_record record;
begin
  if
    p_targets is null
    or jsonb_typeof(p_targets) <> 'array'
  then
    raise exception
      'Targets must be supplied as an array.';
  end if;

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
    p_client_id
  limit 1;

  if not found then
    raise exception
      'The Client subscription could not be found.';
  end if;

  perform pg_advisory_xact_lock(
    hashtext(
      subscription_record.id::text
    )::bigint
  );

  select count(*)::integer
  into assignment_count
  from public.client_applicant_assignments
  where client_id =
    p_client_id;

  select count(*)::integer
  into supplied_count
  from jsonb_array_elements(
    p_targets
  );

  select count(
    distinct item.applicant_id
  )::integer
  into supplied_distinct_count
  from jsonb_to_recordset(
    p_targets
  ) as item(
    applicant_id uuid,
    application_target integer
  );

  if supplied_count <> assignment_count then
    raise exception
      'A target must be supplied for every Applicant assigned to this Client.';
  end if;

  if
    supplied_distinct_count <>
      supplied_count
  then
    raise exception
      'Each Applicant can only have one target.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(
      p_targets
    ) as item(
      applicant_id uuid,
      application_target integer
    )
    where
      item.application_target is null
      or item.application_target < 0
  ) then
    raise exception
      'Applicant targets must be whole numbers of zero or more.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(
      p_targets
    ) as item(
      applicant_id uuid,
      application_target integer
    )
    where not exists (
      select 1
      from public.client_applicant_assignments
      where
        client_id =
          p_client_id
        and applicant_id =
          item.applicant_id
    )
  ) then
    raise exception
      'One or more Applicants are not assigned to this Client.';
  end if;

  select
    coalesce(
      sum(item.application_target),
      0
    )::integer
  into total_target
  from jsonb_to_recordset(
    p_targets
  ) as item(
    applicant_id uuid,
    application_target integer
  );

  if
    total_target >
      subscription_record.application_limit
  then
    raise exception
      'Applicant targets cannot exceed the Client subscription allowance of % applications.',
      subscription_record.application_limit;
  end if;

  /*
   * Clear the current values first.
   * This allows safe redistribution such as
   * 100 + 100 -> 150 + 50 without temporarily
   * exceeding the Client allowance.
   */
  update public.client_applicant_targets
  set application_target = 0
  where
    subscription_id =
      subscription_record.id
    and period_start =
      subscription_record.current_period_start;

  for target_record in
    select *
    from jsonb_to_recordset(
      p_targets
    ) as item(
      applicant_id uuid,
      application_target integer
    )
  loop
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
      p_client_id,
      target_record.applicant_id,
      subscription_record.current_period_start,
      subscription_record.current_period_end,
      target_record.application_target
    )
    on conflict (
      subscription_id,
      period_start,
      applicant_id
    )
    do update
    set
      application_target =
        excluded.application_target,
      period_end =
        excluded.period_end;
  end loop;
end;
$$;


revoke all
on function
  public.set_client_applicant_targets(
    uuid,
    jsonb
  )
from public;

grant execute
on function
  public.set_client_applicant_targets(
    uuid,
    jsonb
  )
to service_role;

commit;
