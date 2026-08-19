begin;

create table if not exists public.applicant_team_assignments (
  applicant_id uuid primary key references public.profiles(id) on delete cascade,
  team_lead_id uuid not null references public.profiles(id) on delete restrict,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applicant_team_assignments_team_lead_id_idx
  on public.applicant_team_assignments(team_lead_id);

alter table public.applicant_team_assignments enable row level security;

commit;
