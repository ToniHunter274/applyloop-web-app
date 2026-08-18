begin;

create table if not exists public.applicants (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null unique
    references auth.users(id)
    on delete cascade,

  work_email text,

  assigned_team text,

  availability text not null default 'available'
    check (
      availability in (
        'available',
        'inactive'
      )
    ),

  active_tasks integer not null default 0
    check (active_tasks >= 0),

  completed_tasks integer not null default 0
    check (completed_tasks >= 0),

  quality_rating numeric(3, 2) not null default 0
    check (
      quality_rating >= 0
      and quality_rating <= 5
    ),

  completion_rate numeric(5, 2) not null default 0
    check (
      completion_rate >= 0
      and completion_rate <= 100
    ),

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null
    default timezone('utc', now()),

  updated_at timestamptz not null
    default timezone('utc', now())
);

create index if not exists applicants_user_id_idx
  on public.applicants(user_id);

create index if not exists applicants_assigned_team_idx
  on public.applicants(assigned_team);

create index if not exists applicants_availability_idx
  on public.applicants(availability);

drop trigger if exists
  applicants_set_updated_at
  on public.applicants;

create trigger applicants_set_updated_at
before update on public.applicants
for each row
execute function public.set_updated_at();

alter table public.applicants
  enable row level security;

revoke all
  on public.applicants
  from anon;

revoke all
  on public.applicants
  from authenticated;

grant all
  on public.applicants
  to service_role;

commit;
