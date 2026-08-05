begin;

-- Baseline roles required by authentication and role routing.
do $$
begin
  if not exists (
    select 1
    from pg_type
    join pg_namespace
      on pg_namespace.oid = pg_type.typnamespace
    where pg_namespace.nspname = 'public'
      and pg_type.typname = 'app_role'
  ) then
    create type public.app_role as enum (
      'user_client',
      'applicant',
      'chief_applicant',
      'prompt_engineer',
      'team_auditor',
      'chief_auditor',
      'owner',
      'admin',
      'operations'
    );
  end if;
end
$$;

-- Keep updated_at values consistent across application tables.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$function$;

-- Store the application profile linked to each Supabase Auth user.
create table if not exists public.profiles (
  id uuid primary key
    references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.app_role not null,
  account_status text not null default 'active'
    check (
      account_status in (
        'invited',
        'active',
        'suspended'
      )
    ),
  created_at timestamptz not null
    default timezone('utc', now()),
  updated_at timestamptz not null
    default timezone('utc', now()),
  phone text,
  country text,
  timezone text
);

alter table public.profiles
  enable row level security;

revoke all
  on public.profiles
  from anon;

revoke all
  on public.profiles
  from authenticated;

grant select
  on public.profiles
  to authenticated;

grant update (
  full_name,
  phone,
  country,
  timezone
)
  on public.profiles
  to authenticated;

grant all
  on public.profiles
  to service_role;

drop policy if exists
  "Users can read their own profile"
  on public.profiles;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
);

drop policy if exists
  "Users can update their own profile"
  on public.profiles;

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
)
with check (
  (select auth.uid()) = id
);

drop trigger if exists
  profiles_set_updated_at
  on public.profiles;

create trigger profiles_set_updated_at
before update
on public.profiles
for each row
execute function public.set_updated_at();

commit;
