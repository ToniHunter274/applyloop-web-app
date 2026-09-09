-- Add the Linker workspace role without modifying the applied
-- baseline authentication migration.
alter type public.app_role
  add value if not exists 'linker';
