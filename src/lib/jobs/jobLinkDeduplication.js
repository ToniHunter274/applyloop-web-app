const MAX_JOB_LINK_LENGTH = 2000;

const TRACKING_PARAMETERS = new Set([
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
  'trkinfo',
]);

const TRACKING_PREFIXES = [
  'utm_',
];

function normalizeInput(value) {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      'A job link is required.'
    );
  }

  const trimmed =
    value.trim();

  if (
    trimmed.length >
    MAX_JOB_LINK_LENGTH
  ) {
    throw new Error(
      'The job link is too long.'
    );
  }

  if (
    trimmed.startsWith('//')
  ) {
    return `https:${trimmed}`;
  }

  if (
    !/^[a-z][a-z0-9+.-]*:/i
      .test(trimmed)
  ) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

function normalizeHostname(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/\.$/, '');
}

function isPrivateIpv4(hostname) {
  const parts =
    hostname.split('.');

  if (
    parts.length !== 4 ||
    parts.some(
      (part) =>
        !/^\d+$/.test(part) ||
        Number(part) < 0 ||
        Number(part) > 255
    )
  ) {
    return false;
  }

  const [
    first,
    second,
  ] =
    parts.map(Number);

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (
      first === 100 &&
      second >= 64 &&
      second <= 127
    ) ||
    (
      first === 169 &&
      second === 254
    ) ||
    (
      first === 172 &&
      second >= 16 &&
      second <= 31
    ) ||
    (
      first === 192 &&
      second === 168
    ) ||
    first >= 224
  );
}

function isBlockedHostname(value) {
  const hostname =
    normalizeHostname(value)
      .replace(/^\[/, '')
      .replace(/\]$/, '');

  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith(
      '.localhost'
    ) ||
    hostname.endsWith('.local') ||
    hostname.endsWith(
      '.internal'
    )
  ) {
    return true;
  }

  if (
    isPrivateIpv4(hostname)
  ) {
    return true;
  }

  if (
    hostname.includes(':')
  ) {
    const ipv6 =
      hostname.toLowerCase();

    return (
      ipv6 === '::' ||
      ipv6 === '::1' ||
      ipv6.startsWith('fc') ||
      ipv6.startsWith('fd') ||
      ipv6.startsWith('fe80:')
    );
  }

  // Public job-posting hosts should be
  // fully qualified domains or public IPs.
  if (
    !hostname.includes('.') &&
    !/^\d+$/.test(hostname)
  ) {
    return true;
  }

  return false;
}

function parseJobLink(value) {
  const input =
    normalizeInput(value);

  let url;

  try {
    url = new URL(input);
  } catch {
    throw new Error(
      'Please enter a valid job link.'
    );
  }

  if (
    ![
      'http:',
      'https:',
    ].includes(
      url.protocol
    )
  ) {
    throw new Error(
      'Please enter a valid HTTP or HTTPS job link.'
    );
  }

  if (
    url.username ||
    url.password
  ) {
    throw new Error(
      'Job links cannot contain login credentials.'
    );
  }

  if (
    isBlockedHostname(
      url.hostname
    )
  ) {
    throw new Error(
      'Please enter a public job-posting link.'
    );
  }

  if (url.port) {
    throw new Error(
      'Job links using custom network ports are not supported.'
    );
  }

  return url;
}

function removeTrackingParameters(
  url
) {
  for (
    const key
    of [
      ...url.searchParams.keys(),
    ]
  ) {
    const normalizedKey =
      key.toLowerCase();

    if (
      TRACKING_PARAMETERS.has(
        normalizedKey
      ) ||
      TRACKING_PREFIXES.some(
        (prefix) =>
          normalizedKey.startsWith(
            prefix
          )
      )
    ) {
      url.searchParams.delete(
        key
      );
    }
  }
}

function canonicalizeKnownProvider(
  url
) {
  const hostname =
    normalizeHostname(
      url.hostname
    );

  /*
   * LinkedIn commonly changes the
   * human-readable slug and tracking
   * query while keeping one numeric
   * Job ID.
   */
  if (
    hostname ===
      'linkedin.com' ||
    hostname.endsWith(
      '.linkedin.com'
    )
  ) {
    const jobMatch =
      url.pathname.match(
        /\/jobs\/view\/(?:[^/]*-)?(\d+)(?:\/|$)/i
      );

    if (jobMatch) {
      url.hostname =
        'linkedin.com';

      url.pathname =
        `/jobs/view/${jobMatch[1]}`;

      url.search = '';
    }
  }

  /*
   * Indeed's jk/vjk value is the
   * stable job identity. Referral
   * URLs can otherwise look different.
   */
  if (
    hostname === 'indeed.com' ||
    hostname.endsWith(
      '.indeed.com'
    )
  ) {
    const jobKey =
      url.searchParams.get(
        'jk'
      ) ||
      url.searchParams.get(
        'vjk'
      );

    if (jobKey) {
      url.hostname =
        'indeed.com';

      url.pathname =
        '/viewjob';

      url.search = '';

      url.searchParams.set(
        'jk',
        jobKey
      );
    }
  }
}

export function validateJobLink(
  value
) {
  return parseJobLink(
    value
  ).toString();
}

export function normalizeJobLink(
  value
) {
  const parsed =
    parseJobLink(value);

  const url =
    new URL(
      parsed.toString()
    );

  url.hash = '';

  url.hostname =
    normalizeHostname(
      url.hostname
    );

  /*
   * HTTP and HTTPS versions of the
   * same public posting are treated
   * as the same opportunity.
   */
  url.protocol = 'https:';

  url.pathname =
    url.pathname.replace(
      /\/{2,}/g,
      '/'
    );

  if (
    url.pathname.length > 1
  ) {
    url.pathname =
      url.pathname.replace(
        /\/+$/,
        ''
      );
  }

  canonicalizeKnownProvider(
    url
  );

  removeTrackingParameters(
    url
  );

  url.searchParams.sort();

  const normalizedPath =
    url.pathname === '/'
      ? ''
      : url.pathname;

  return `${url.hostname}${normalizedPath}${url.search}`
    .toLowerCase();
}

export async function findDuplicateJobLink({
  supabase,
  clientId,
  jobLink,
}) {
  const normalizedJobLink =
    normalizeJobLink(
      jobLink
    );

  const [
    requestResult,
    applicationResult,
  ] =
    await Promise.all([
      supabase
        .from(
          'client_job_requests'
        )
        .select(
          [
            'id',
            'status',
            'job_url',
            'normalized_job_url',
          ].join(', ')
        )
        .eq(
          'client_id',
          clientId
        )
        .in(
          'status',
          [
            'new',
            'in_review',
            'converted',
          ]
        ),

      supabase
        .from(
          'applications'
        )
        .select(
          'id, status, job_url'
        )
        .eq(
          'client_id',
          clientId
        )
        .not(
          'job_url',
          'is',
          null
        ),
    ]);

  if (
    requestResult.error ||
    applicationResult.error
  ) {
    throw new Error(
      'Job-link duplication could not be checked.'
    );
  }

  const duplicateRequest =
    (
      requestResult.data ||
      []
    ).find(
      (request) => {
        try {
          return (
            request
              .normalized_job_url ===
              normalizedJobLink ||
            normalizeJobLink(
              request.job_url
            ) ===
              normalizedJobLink
          );
        } catch {
          return false;
        }
      }
    );

  if (duplicateRequest) {
    return {
      id:
        duplicateRequest.id,
      status:
        duplicateRequest.status,
      type:
        'job_request',
      normalizedJobLink,
    };
  }

  const duplicateApplication =
    (
      applicationResult.data ||
      []
    ).find(
      (application) => {
        try {
          return (
            normalizeJobLink(
              application.job_url
            ) ===
            normalizedJobLink
          );
        } catch {
          return false;
        }
      }
    );

  if (
    duplicateApplication
  ) {
    return {
      id:
        duplicateApplication.id,
      status:
        duplicateApplication.status,
      type:
        'application',
      normalizedJobLink,
    };
  }

  return {
    duplicate: false,
    normalizedJobLink,
  };
}
