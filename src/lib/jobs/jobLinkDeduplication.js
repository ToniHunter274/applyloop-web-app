const TRACKING_PARAMETERS = new Set([
  'campaign',
  'fbclid',
  'gclid',
  'ref',
  'referrer',
  'source',
]);

export function normalizeJobLink(value) {
  const url = new URL(String(value || '').trim());

  url.hash = '';
  url.protocol = 'https:';
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');

  for (const key of [...url.searchParams.keys()]) {
    if (
      key.toLowerCase().startsWith('utm_') ||
      TRACKING_PARAMETERS.has(key.toLowerCase())
    ) {
      url.searchParams.delete(key);
    }
  }

  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/{2,}/g, '/');

  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }

  if (
    (url.protocol === 'https:' && url.port === '443') ||
    (url.protocol === 'http:' && url.port === '80')
  ) {
    url.port = '';
  }

  return url.toString();
}

export async function findDuplicateJobLink({
  supabase,
  clientId,
  jobLink,
}) {
  const normalizedJobLink = normalizeJobLink(jobLink);

  const [requestResult, applicationResult] = await Promise.all([
    supabase
      .from('client_job_requests')
      .select('id, status, job_url, normalized_job_url')
      .eq('client_id', clientId)
      .in('status', ['new', 'in_review', 'converted']),
    supabase
      .from('applications')
      .select('id, status, job_url')
      .eq('client_id', clientId)
      .not('job_url', 'is', null),
  ]);

  if (requestResult.error || applicationResult.error) {
    throw new Error('Job-link duplication could not be checked.');
  }

  const duplicateRequest = (requestResult.data || []).find(
    (request) => {
      try {
        return (
          request.normalized_job_url === normalizedJobLink ||
          normalizeJobLink(request.job_url) === normalizedJobLink
        );
      } catch {
        return false;
      }
    }
  );

  if (duplicateRequest) {
    return {
      id: duplicateRequest.id,
      status: duplicateRequest.status,
      type: 'job_request',
      normalizedJobLink,
    };
  }

  const duplicateApplication = (applicationResult.data || []).find(
    (application) => {
      try {
        return normalizeJobLink(application.job_url) === normalizedJobLink;
      } catch {
        return false;
      }
    }
  );

  if (duplicateApplication) {
    return {
      id: duplicateApplication.id,
      status: duplicateApplication.status,
      type: 'application',
      normalizedJobLink,
    };
  }

  return {
    duplicate: false,
    normalizedJobLink,
  };
}
