begin;

do $$
begin
  if exists (
    select 1
    from public.clients as client
    left join public.profiles as profile
      on profile.id = client.assigned_applicant_id
    where client.assigned_applicant_id is not null
      and (
        profile.id is null
        or profile.role <> 'applicant'
      )
  ) then
    raise exception
      'Legacy client assignment references a missing or non-applicant profile.';
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from public.clients as client
    left join auth.users as auth_user
      on auth_user.id = client.assigned_applicant_id
    where client.assigned_applicant_id is not null
      and auth_user.id is null
  ) then
    raise exception
      'Legacy client assignment references an applicant profile without an auth user.';
  end if;
end;
$$;

insert into public.applicants (
  user_id,
  availability
)
select distinct
  client.assigned_applicant_id,
  case
    when profile.account_status = 'active'
      then 'available'
    else 'inactive'
  end
from public.clients as client
join public.profiles as profile
  on profile.id = client.assigned_applicant_id
left join public.applicants as applicant
  on applicant.user_id = client.assigned_applicant_id
where client.assigned_applicant_id is not null
  and profile.role = 'applicant'
  and applicant.id is null;

do $$
begin
  if exists (
    select 1
    from public.clients as client
    left join public.applicants as applicant
      on applicant.user_id =
        client.assigned_applicant_id
    where client.assigned_applicant_id is not null
      and applicant.id is null
  ) then
    raise exception
      'A legacy assignment could not be matched to an Applicant record.';
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from public.clients as client
    join public.applicants as applicant
      on applicant.user_id =
        client.assigned_applicant_id
    where client.assigned_applicant_id is not null
      and not exists (
        select 1
        from public.client_applicant_assignments
          as assignment
        where assignment.client_id = client.id
          and assignment.applicant_id =
            applicant.id
      )
      and (
        select count(*)
        from public.client_applicant_assignments
          as existing_assignment
        where existing_assignment.client_id =
          client.id
      ) >= 2
  ) then
    raise exception
      'A legacy assignment cannot be migrated because the client already has two assignments.';
  end if;
end;
$$;

insert into public.client_applicant_assignments (
  client_id,
  applicant_id,
  assigned_by
)
select
  client.id,
  applicant.id,
  null
from public.clients as client
join public.applicants as applicant
  on applicant.user_id =
    client.assigned_applicant_id
where client.assigned_applicant_id is not null
  and not exists (
    select 1
    from public.client_applicant_assignments
      as assignment
    where assignment.client_id = client.id
      and assignment.applicant_id =
        applicant.id
  );

do $$
begin
  if exists (
    select 1
    from public.clients as client
    join public.applicants as applicant
      on applicant.user_id =
        client.assigned_applicant_id
    where client.assigned_applicant_id is not null
      and not exists (
        select 1
        from public.client_applicant_assignments
          as assignment
        where assignment.client_id = client.id
          and assignment.applicant_id =
            applicant.id
      )
  ) then
    raise exception
      'Legacy assignment verification failed.';
  end if;
end;
$$;

drop index if exists
  public.clients_assigned_applicant_id_idx;

alter table public.clients
  drop column if exists assigned_applicant_id;

commit;
