begin;

-- Temporarily remove the old trigger while existing rows
-- are recalculated into the stronger canonical format.
drop trigger if exists
  prevent_duplicate_job_links
on public.client_job_requests;


create or replace function
public.normalize_job_url(value text)
returns text
language plpgsql
immutable
set search_path = public
as $function$
declare
  normalized text;
  base_part text;
  query_part text;
  provider_path text;
  linkedin_job_id text;
  indeed_job_key text;
begin
  normalized :=
    lower(
      btrim(value)
    );

  if
    normalized is null
    or normalized = ''
  then
    return null;
  end if;

  -- Fragments never identify a different job.
  normalized :=
    regexp_replace(
      normalized,
      '#.*$',
      ''
    );

  -- HTTP/HTTPS and www are treated as equivalent.
  normalized :=
    regexp_replace(
      normalized,
      '^https?://',
      ''
    );

  normalized :=
    regexp_replace(
      normalized,
      '^www\.',
      ''
    );


  -- --------------------------------------------------------
  -- LinkedIn
  -- Canonical identity is the numeric Job ID.
  -- --------------------------------------------------------
  if
    normalized ~
      '(^|\.)linkedin\.com/'
    and normalized like
      '%/jobs/view/%'
  then
    provider_path :=
      split_part(
        split_part(
          normalized,
          '/jobs/view/',
          2
        ),
        '?',
        1
      );

    provider_path :=
      trim(
        both '/'
        from provider_path
      );

    linkedin_job_id :=
      substring(
        provider_path
        from '([0-9]+)$'
      );

    if linkedin_job_id is not null then
      return
        'linkedin.com/jobs/view/'
        || linkedin_job_id;
    end if;
  end if;


  -- --------------------------------------------------------
  -- Indeed
  -- jk / vjk identifies the job regardless of referral URL.
  -- --------------------------------------------------------
  if
    normalized ~
      '(^|\.)indeed\.com/'
  then
    query_part :=
      case
        when position(
          '?' in normalized
        ) > 0
        then substring(
          normalized
          from position(
            '?' in normalized
          ) + 1
        )
        else ''
      end;

    if query_part <> '' then
      select
        split_part(
          param,
          '=',
          2
        )
      into indeed_job_key
      from unnest(
        string_to_array(
          query_part,
          '&'
        )
      ) as indeed_params(param)
      where
        split_part(
          param,
          '=',
          1
        ) in (
          'jk',
          'vjk'
        )
        and split_part(
          param,
          '=',
          2
        ) <> ''
      order by
        case
          when split_part(
            param,
            '=',
            1
          ) = 'jk'
          then 0
          else 1
        end
      limit 1;
    end if;

    if indeed_job_key is not null then
      return
        'indeed.com/viewjob?jk='
        || indeed_job_key;
    end if;
  end if;


  -- --------------------------------------------------------
  -- Generic public Job URL
  -- --------------------------------------------------------
  base_part :=
    split_part(
      normalized,
      '?',
      1
    );

  query_part :=
    case
      when position(
        '?' in normalized
      ) > 0
      then substring(
        normalized
        from position(
          '?' in normalized
        ) + 1
      )
      else ''
    end;

  base_part :=
    regexp_replace(
      base_part,
      '/+$',
      ''
    );


  -- Remove common tracking/referral parameters and sort
  -- remaining parameters so query order cannot bypass dedupe.
  if query_part <> '' then
    select
      string_agg(
        param,
        '&'
        order by
          split_part(
            param,
            '=',
            1
          ),
          param
      )
    into query_part
    from unnest(
      string_to_array(
        query_part,
        '&'
      )
    ) as query_values(param)
    where
      param <> ''
      and split_part(
        param,
        '=',
        1
      ) <> ''
      and split_part(
        param,
        '=',
        1
      ) not in (
        'campaign',
        'campaign_id',
        'campaignid',
        'dclid',
        'fbclid',
        'gclid',
        'gh_src',
        'igshid',
        'lever-source',
        'li_fat_id',
        'mc_cid',
        'mc_eid',
        'msclkid',
        'ref',
        'ref_id',
        'referrer',
        'refid',
        'source',
        'tracking',
        'tracking_id',
        'trackingid',
        'trk',
        'trkinfo'
      )
      and not (
        split_part(
          param,
          '=',
          1
        ) ~ '^utm_'
      );
  end if;


  return nullif(
    case
      when
        query_part is null
        or query_part = ''
      then base_part
      else
        base_part
        || '?'
        || query_part
    end,
    ''
  );
end;
$function$;


-- Existing records are preserved.
-- Only their comparison value is recalculated.
update public.client_job_requests
set normalized_job_url =
  public.normalize_job_url(
    job_url
  )
where job_url is not null;


create or replace function
public.prevent_duplicate_job_links()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  comparison_value text;
begin
  new.normalized_job_url :=
    public.normalize_job_url(
      coalesce(
        nullif(
          btrim(
            new.normalized_job_url
          ),
          ''
        ),
        new.job_url
      )
    );

  comparison_value :=
    new.normalized_job_url;

  if
    new.status in (
      'new',
      'in_review',
      'converted'
    )
    and comparison_value is not null
  then
    -- Every equivalent URL for the same Client now shares
    -- the same transaction lock. This closes concurrent
    -- submission races across Client and Linker workflows.
    perform
      pg_advisory_xact_lock(
        hashtextextended(
          new.client_id::text
          || ':'
          || comparison_value,
          0
        )
      );

    if exists (
      select 1
      from public.client_job_requests
        as existing
      where
        existing.client_id =
          new.client_id

        and existing.id
          is distinct from
          new.id

        and existing.status in (
          'new',
          'in_review',
          'converted'
        )

        and (
          public.normalize_job_url(
            existing.normalized_job_url
          ) =
            comparison_value

          or

          public.normalize_job_url(
            existing.job_url
          ) =
            comparison_value
        )
    ) then
      raise exception using
        errcode = '23505',
        message =
          'Duplicate job link for this Client.';
    end if;
  end if;

  return new;
end;
$function$;


create trigger
prevent_duplicate_job_links
before insert or update of
  job_url,
  normalized_job_url,
  status
on public.client_job_requests
for each row
execute function
public.prevent_duplicate_job_links();


commit;
