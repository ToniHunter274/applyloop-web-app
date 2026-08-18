begin;

create table if not exists public.applicant_messages (
  id uuid primary key default gen_random_uuid(),

  applicant_id uuid not null
    references public.applicants(id)
    on delete cascade,

  sender_profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  message text not null
    check (
      char_length(trim(message)) >= 1
      and char_length(trim(message)) <= 4000
    ),

  read_at timestamptz,

  created_at timestamptz not null
    default timezone('utc', now())
);

create index if not exists
  applicant_messages_applicant_created_idx
  on public.applicant_messages(
    applicant_id,
    created_at
  );

create index if not exists
  applicant_messages_sender_idx
  on public.applicant_messages(
    sender_profile_id
  );

alter table public.applicant_messages
  enable row level security;

revoke all
  on public.applicant_messages
  from anon;

revoke all
  on public.applicant_messages
  from authenticated;

grant all
  on public.applicant_messages
  to service_role;

commit;
