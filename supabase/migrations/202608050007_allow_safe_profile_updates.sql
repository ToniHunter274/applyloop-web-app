begin;

-- Remove any broad profile update access.
revoke update
  on public.profiles
  from authenticated;

-- Allow users to edit only their safe profile fields.
grant update (
  full_name,
  phone,
  country,
  timezone
)
  on public.profiles
  to authenticated;

commit;
