-- Store client-specific account and subscription details.
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique
    references public.profiles(id) on delete cascade,
  plan text not null
    check (plan in ('basic', 'standard', 'premium', 'quarterly')),
  application_limit integer not null
    check (application_limit > 0),
  applications_completed integer not null default 0
    check (applications_completed >= 0),
  interviews integer not null default 0
    check (interviews >= 0),
  assigned_team text,
  gender text,
  portfolio_url text,
  linkedin_url text,
  resume_path text,
  notes text,
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed')),
  created_by uuid
    references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_status_idx
  on public.clients(status);

create index if not exists clients_plan_idx
  on public.clients(plan);

create index if not exists clients_assigned_team_idx
  on public.clients(assigned_team);

alter table public.clients enable row level security;

revoke all on public.clients from anon;
revoke all on public.clients from authenticated;

grant select, update on public.clients to authenticated;
grant all on public.clients to service_role;

drop policy if exists "Admins can view all clients"
  on public.clients;

create policy "Admins can view all clients"
on public.clients
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin', 'owner')
      and profiles.account_status = 'active'
  )
);

drop policy if exists "Admins can update clients"
  on public.clients;

create policy "Admins can update clients"
on public.clients
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin', 'owner')
      and profiles.account_status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin', 'owner')
      and profiles.account_status = 'active'
  )
);

drop trigger if exists set_clients_updated_at
  on public.clients;

create trigger set_clients_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();

-- Resumes are private and are stored under each client's user ID.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'client-resumes',
  'client-resumes',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Clients can view their own resume"
  on storage.objects;

create policy "Clients can view their own resume"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'client-resumes'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Admins can view client resumes"
  on storage.objects;

create policy "Admins can view client resumes"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'client-resumes'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin', 'owner')
      and profiles.account_status = 'active'
  )
);
