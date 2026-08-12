-- Add the restricted Client Administrator role.
alter type public.app_role
  add value if not exists 'admin';
