-- Track each client's operational priority.
alter table public.clients
  add column if not exists priority text
  not null
  default 'high';

update public.clients
set priority = 'high'
where priority is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clients_priority_check'
      and conrelid = 'public.clients'::regclass
  ) then
    alter table public.clients
      add constraint clients_priority_check
      check (priority in ('high', 'urgent', 'critical'));
  end if;
end
$$;

create index if not exists clients_priority_idx
  on public.clients(priority);
