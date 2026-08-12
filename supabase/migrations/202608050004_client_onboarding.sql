create table if not exists public.client_onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null
    references public.clients(id) on delete cascade,
  step_key text not null
    check (
      step_key in (
        'profile_setup',
        'initial_consultation',
        'preference_form',
        'payment',
        'resume_alignment',
        'preference_alignment',
        'analyst_onboarding',
        'application_commencement',
        'touch_call_1',
        'touch_call_2',
        'touch_call_3',
        'resubscription',
        'season_complete'
      )
    ),
  step_order smallint not null
    check (step_order between 1 and 13),
  label text not null,
  status text not null default 'not_started'
    check (
      status in (
        'not_started',
        'in_progress',
        'completed',
        'skipped'
      )
    ),
  completed_at timestamptz,
  updated_by uuid
    references public.profiles(id) on delete set null,
  update_source text not null default 'manual'
    check (
      update_source in (
        'system',
        'manual',
        'calendar',
        'form',
        'payment',
        'assignment',
        'application',
        'subscription'
      )
    ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, step_key),
  unique (client_id, step_order)
);

create index if not exists client_onboarding_client_idx
  on public.client_onboarding_steps(client_id);

create index if not exists client_onboarding_status_idx
  on public.client_onboarding_steps(status);

alter table public.client_onboarding_steps
  enable row level security;

revoke all on public.client_onboarding_steps from anon;
revoke all on public.client_onboarding_steps from authenticated;

grant select, update
  on public.client_onboarding_steps
  to authenticated;

grant all
  on public.client_onboarding_steps
  to service_role;

drop policy if exists
  "Admins can view client onboarding"
  on public.client_onboarding_steps;

create policy "Admins can view client onboarding"
on public.client_onboarding_steps
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

drop policy if exists
  "Admins can update client onboarding"
  on public.client_onboarding_steps;

create policy "Admins can update client onboarding"
on public.client_onboarding_steps
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

drop trigger if exists set_client_onboarding_updated_at
  on public.client_onboarding_steps;

create trigger set_client_onboarding_updated_at
before update on public.client_onboarding_steps
for each row
execute function public.set_updated_at();

create or replace function public.initialize_client_onboarding()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.client_onboarding_steps (
    client_id,
    step_key,
    step_order,
    label,
    status,
    completed_at,
    update_source
  )
  values
    (
      new.id,
      'profile_setup',
      1,
      'Profile Setup',
      'completed',
      new.created_at,
      'system'
    ),
    (
      new.id,
      'initial_consultation',
      2,
      'Initial Consultation',
      'not_started',
      null,
      'system'
    ),
    (
      new.id,
      'preference_form',
      3,
      'Preference Form',
      'not_started',
      null,
      'system'
    ),
    (
      new.id,
      'payment',
      4,
      'Payment',
      'not_started',
      null,
      'system'
    ),
    (
      new.id,
      'resume_alignment',
      5,
      'Resume Alignment',
      'not_started',
      null,
      'system'
    ),
    (
      new.id,
      'preference_alignment',
      6,
      'Preference Alignment',
      'not_started',
      null,
      'system'
    ),
    (
      new.id,
      'analyst_onboarding',
      7,
      'Analyst Onboarding',
      'not_started',
      null,
      'system'
    ),
    (
      new.id,
      'application_commencement',
      8,
      'Application Commencement',
      'not_started',
      null,
      'system'
    ),
    (
      new.id,
      'touch_call_1',
      9,
      'Touch Call 1',
      'not_started',
      null,
      'system'
    ),
    (
      new.id,
      'touch_call_2',
      10,
      'Touch Call 2',
      'not_started',
      null,
      'system'
    ),
    (
      new.id,
      'touch_call_3',
      11,
      'Touch Call 3',
      'not_started',
      null,
      'system'
    ),
    (
      new.id,
      'resubscription',
      12,
      'Re-subscription',
      'not_started',
      null,
      'system'
    ),
    (
      new.id,
      'season_complete',
      13,
      'Season Complete',
      'not_started',
      null,
      'system'
    )
  on conflict (client_id, step_key) do nothing;

  return new;
end;
$$;

drop trigger if exists
  initialize_client_onboarding_after_insert
  on public.clients;

create trigger initialize_client_onboarding_after_insert
after insert on public.clients
for each row
execute function public.initialize_client_onboarding();

insert into public.client_onboarding_steps (
  client_id,
  step_key,
  step_order,
  label,
  status,
  completed_at,
  update_source
)
select
  clients.id,
  steps.step_key,
  steps.step_order,
  steps.label,
  case
    when steps.step_key = 'profile_setup'
      then 'completed'
    else 'not_started'
  end,
  case
    when steps.step_key = 'profile_setup'
      then clients.created_at
    else null
  end,
  'system'
from public.clients
cross join (
  values
    ('profile_setup', 1, 'Profile Setup'),
    ('initial_consultation', 2, 'Initial Consultation'),
    ('preference_form', 3, 'Preference Form'),
    ('payment', 4, 'Payment'),
    ('resume_alignment', 5, 'Resume Alignment'),
    ('preference_alignment', 6, 'Preference Alignment'),
    ('analyst_onboarding', 7, 'Analyst Onboarding'),
    (
      'application_commencement',
      8,
      'Application Commencement'
    ),
    ('touch_call_1', 9, 'Touch Call 1'),
    ('touch_call_2', 10, 'Touch Call 2'),
    ('touch_call_3', 11, 'Touch Call 3'),
    ('resubscription', 12, 'Re-subscription'),
    ('season_complete', 13, 'Season Complete')
) as steps(step_key, step_order, label)
on conflict (client_id, step_key) do nothing;
