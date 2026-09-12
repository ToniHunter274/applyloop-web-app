begin;

alter table public.client_job_requests
  add column if not exists normalized_job_url text;

create index if not exists
  client_job_requests_dedupe_idx
on public.client_job_requests (
  client_id,
  normalized_job_url
)
where status in ('new', 'in_review', 'converted');

-- Existing data is deliberately not deleted or merged. New writes receive the
-- stronger canonical value produced by the API, while this fallback protects
-- direct database writes from exact protocol/www/trailing-slash duplicates.
create or replace function public.normalize_job_url(value text)
returns text
language sql
immutable
set search_path = public
as $function$
  select nullif(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(btrim(value)),
          '#.*$',
          ''
        ),
        '^https?://(www\.)?',
        ''
      ),
      '/+$',
      ''
    ),
    ''
  );
$function$;

create or replace function public.prevent_duplicate_job_links()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  comparison_value text;
begin
  new.normalized_job_url = coalesce(
    nullif(btrim(new.normalized_job_url), ''),
    public.normalize_job_url(new.job_url)
  );

  comparison_value = public.normalize_job_url(new.job_url);

  perform pg_advisory_xact_lock(
    hashtextextended(
      new.client_id::text || ':' || comparison_value,
      0
    )
  );

  if new.status in ('new', 'in_review', 'converted') and exists (
    select 1
    from public.client_job_requests as existing
    where existing.client_id = new.client_id
      and existing.id is distinct from new.id
      and existing.status in ('new', 'in_review', 'converted')
      and (
        existing.normalized_job_url = new.normalized_job_url
        or public.normalize_job_url(existing.job_url) = comparison_value
      )
  ) then
    raise exception using
      errcode = '23505',
      message = 'Duplicate job link for this Client.';
  end if;

  return new;
end;
$function$;

drop trigger if exists prevent_duplicate_job_links
on public.client_job_requests;

create trigger prevent_duplicate_job_links
before insert or update of job_url, normalized_job_url, status
on public.client_job_requests
for each row
execute function public.prevent_duplicate_job_links();

commit;
