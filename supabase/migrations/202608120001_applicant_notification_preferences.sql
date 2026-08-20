begin;

alter table public.profiles
  add column if not exists email_notifications boolean not null default true,
  add column if not exists push_notifications boolean not null default false;

revoke update
  on public.profiles
  from authenticated;

grant update (
  full_name,
  phone,
  country,
  timezone,
  email_notifications,
  push_notifications
)
  on public.profiles
  to authenticated;

commit;
