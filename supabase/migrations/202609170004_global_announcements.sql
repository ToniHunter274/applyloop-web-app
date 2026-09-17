begin;

-- Preserve the existing Client announcement data,
-- but promote the table into a platform-wide system.
alter table public.client_announcements
  rename to platform_announcements;

alter index if exists
  public.client_announcements_published_idx
rename to
  platform_announcements_published_idx;

alter table public.platform_announcements
  add column if not exists audience_roles text[]
    not null
    default array['user_client']::text[];

alter table public.platform_announcements
  add column if not exists tone text
    not null
    default 'info';

alter table public.platform_announcements
  drop constraint if exists
    platform_announcements_tone_check;

alter table public.platform_announcements
  add constraint
    platform_announcements_tone_check
  check (
    tone in (
      'info',
      'success',
      'warning',
      'critical'
    )
  );

alter table public.platform_announcements
  drop constraint if exists
    platform_announcements_audience_roles_check;

alter table public.platform_announcements
  add constraint
    platform_announcements_audience_roles_check
  check (
    audience_roles <@
    array[
      'user_client',
      'applicant',
      'chief_applicant',
      'prompt_engineer',
      'team_auditor',
      'chief_auditor',
      'owner',
      'operations',
      'linker',
      'admin'
    ]::text[]
  );

drop policy if exists
  "Active clients can view announcements"
on public.platform_announcements;

drop policy if exists
  "Active users can view targeted announcements"
on public.platform_announcements;

create policy
  "Active users can view targeted announcements"
on public.platform_announcements
for select
to authenticated
using (
  is_active = true
  and published_at <= now()
  and (
    expires_at is null
    or expires_at > now()
  )
  and exists (
    select 1
    from public.profiles
    where profiles.id = (
      select auth.uid()
    )
      and profiles.account_status = 'active'
      and (
        cardinality(
          platform_announcements.audience_roles
        ) = 0
        or profiles.role::text = any(
          platform_announcements.audience_roles
        )
      )
  )
);

alter trigger
  set_client_announcements_updated_at
on public.platform_announcements
rename to
  set_platform_announcements_updated_at;

comment on table
  public.platform_announcements
is
  'Platform announcements. Empty audience_roles means all active ApplyLoop roles.';

commit;
