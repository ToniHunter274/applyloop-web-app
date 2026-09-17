-- Chief Applicant supervision for Linkers
-- + private employee document storage.

create table if not exists public.chief_linker_assignments (
  id uuid primary key default gen_random_uuid(),
  chief_user_id uuid not null
    references public.profiles(id)
    on delete cascade,
  linker_user_id uuid not null
    references public.profiles(id)
    on delete cascade,
  assigned_by uuid
    references public.profiles(id)
    on delete set null,
  is_active boolean not null default true,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists
  chief_linker_assignments_one_active_linker_idx
on public.chief_linker_assignments (
  linker_user_id
)
where is_active = true;

create unique index if not exists
  chief_linker_assignments_pair_idx
on public.chief_linker_assignments (
  chief_user_id,
  linker_user_id
);

create index if not exists
  chief_linker_assignments_active_chief_idx
on public.chief_linker_assignments (
  chief_user_id
)
where is_active = true;


create table if not exists public.staff_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references public.profiles(id)
    on delete cascade,
  document_type text not null
    check (
      document_type in ('nda')
    ),
  file_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  uploaded_by uuid
    references public.profiles(id)
    on delete set null,
  is_active boolean not null default true,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists
  staff_documents_one_active_type_idx
on public.staff_documents (
  user_id,
  document_type
)
where is_active = true;

create index if not exists
  staff_documents_user_idx
on public.staff_documents (
  user_id,
  document_type,
  uploaded_at desc
);


insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'staff-documents',
  'staff-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id)
do update set
  public = false,
  file_size_limit =
    excluded.file_size_limit,
  allowed_mime_types =
    excluded.allowed_mime_types;


alter table
  public.chief_linker_assignments
enable row level security;

alter table
  public.staff_documents
enable row level security;

revoke all
on table public.chief_linker_assignments
from public;

revoke all
on table public.chief_linker_assignments
from anon;

revoke all
on table public.chief_linker_assignments
from authenticated;

grant all
on table public.chief_linker_assignments
to service_role;

revoke all
on table public.staff_documents
from public;

revoke all
on table public.staff_documents
from anon;

revoke all
on table public.staff_documents
from authenticated;

grant all
on table public.staff_documents
to service_role;


create or replace function
public.create_chief_linker_assignment(
  p_chief_user_id uuid,
  p_linker_user_id uuid,
  p_assigned_by uuid
)
returns table (
  id uuid,
  chief_user_id uuid,
  linker_user_id uuid,
  assigned_by uuid,
  is_active boolean,
  assigned_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id =
      p_chief_user_id
      and profiles.role =
        'chief_applicant'
      and coalesce(
        profiles.account_status,
        'active'
      ) = 'active'
  ) then
    raise exception
      'The selected Chief Applicant is not active.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where profiles.id =
      p_linker_user_id
      and profiles.role = 'linker'
      and coalesce(
        profiles.account_status,
        'active'
      ) = 'active'
  ) then
    raise exception
      'The selected Linker is not active.';
  end if;

  if exists (
    select 1
    from public.chief_linker_assignments cla
    where cla.linker_user_id =
      p_linker_user_id
      and cla.is_active = true
      and cla.chief_user_id <>
        p_chief_user_id
  ) then
    raise exception
      'This Linker already has an active Chief Applicant.';
  end if;

  if exists (
    select 1
    from public.chief_linker_assignments cla
    where cla.linker_user_id =
      p_linker_user_id
      and cla.chief_user_id =
        p_chief_user_id
      and cla.is_active = true
  ) then
    raise exception
      'This Chief Applicant already supervises this Linker.';
  end if;

  return query
  insert into
    public.chief_linker_assignments (
      chief_user_id,
      linker_user_id,
      assigned_by,
      is_active,
      assigned_at,
      updated_at
    )
  values (
    p_chief_user_id,
    p_linker_user_id,
    p_assigned_by,
    true,
    now(),
    now()
  )
  on conflict (
    chief_user_id,
    linker_user_id
  )
  do update set
    assigned_by =
      excluded.assigned_by,
    is_active = true,
    assigned_at = now(),
    updated_at = now()
  returning
    chief_linker_assignments.id,
    chief_linker_assignments.chief_user_id,
    chief_linker_assignments.linker_user_id,
    chief_linker_assignments.assigned_by,
    chief_linker_assignments.is_active,
    chief_linker_assignments.assigned_at,
    chief_linker_assignments.updated_at;
end;
$$;


create or replace function
public.deactivate_chief_linker_assignment(
  p_assignment_id uuid,
  p_chief_user_id uuid
)
returns table (
  id uuid,
  chief_user_id uuid,
  linker_user_id uuid,
  assigned_by uuid,
  is_active boolean,
  assigned_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.chief_linker_assignments cla
    where cla.id =
      p_assignment_id
      and cla.chief_user_id =
        p_chief_user_id
      and cla.is_active = true
  ) then
    raise exception
      'The active Chief Applicant assignment could not be found.';
  end if;

  return query
  update public.chief_linker_assignments cla
  set
    is_active = false,
    updated_at = now()
  where cla.id =
    p_assignment_id
    and cla.chief_user_id =
      p_chief_user_id
    and cla.is_active = true
  returning
    cla.id,
    cla.chief_user_id,
    cla.linker_user_id,
    cla.assigned_by,
    cla.is_active,
    cla.assigned_at,
    cla.updated_at;
end;
$$;


create or replace function
public.set_active_staff_document(
  p_user_id uuid,
  p_document_type text,
  p_file_path text,
  p_file_name text,
  p_mime_type text,
  p_file_size bigint,
  p_uploaded_by uuid
)
returns table (
  id uuid,
  user_id uuid,
  document_type text,
  file_path text,
  file_name text,
  mime_type text,
  file_size bigint,
  uploaded_by uuid,
  is_active boolean,
  uploaded_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_document_type <> 'nda' then
    raise exception
      'Unsupported staff document type.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where profiles.id =
      p_user_id
  ) then
    raise exception
      'The staff account could not be found.';
  end if;

  update public.staff_documents sd
  set
    is_active = false,
    updated_at = now()
  where sd.user_id =
    p_user_id
    and sd.document_type =
      p_document_type
    and sd.is_active = true;

  return query
  insert into public.staff_documents (
    user_id,
    document_type,
    file_path,
    file_name,
    mime_type,
    file_size,
    uploaded_by,
    is_active,
    uploaded_at,
    updated_at
  )
  values (
    p_user_id,
    p_document_type,
    p_file_path,
    p_file_name,
    p_mime_type,
    p_file_size,
    p_uploaded_by,
    true,
    now(),
    now()
  )
  returning
    staff_documents.id,
    staff_documents.user_id,
    staff_documents.document_type,
    staff_documents.file_path,
    staff_documents.file_name,
    staff_documents.mime_type,
    staff_documents.file_size,
    staff_documents.uploaded_by,
    staff_documents.is_active,
    staff_documents.uploaded_at,
    staff_documents.updated_at;
end;
$$;


revoke execute
on function
  public.create_chief_linker_assignment(
    uuid,
    uuid,
    uuid
  )
from public, anon, authenticated;

grant execute
on function
  public.create_chief_linker_assignment(
    uuid,
    uuid,
    uuid
  )
to service_role;


revoke execute
on function
  public.deactivate_chief_linker_assignment(
    uuid,
    uuid
  )
from public, anon, authenticated;

grant execute
on function
  public.deactivate_chief_linker_assignment(
    uuid,
    uuid
  )
to service_role;


revoke execute
on function
  public.set_active_staff_document(
    uuid,
    text,
    text,
    text,
    text,
    bigint,
    uuid
  )
from public, anon, authenticated;

grant execute
on function
  public.set_active_staff_document(
    uuid,
    text,
    text,
    text,
    text,
    bigint,
    uuid
  )
to service_role;
