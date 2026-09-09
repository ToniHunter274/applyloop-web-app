import { ApiError } from '../../../lib/auth/requireAdmin';
import { requireLinker } from '../../../lib/auth/requireLinker';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateId(value, label) {
  const normalized =
    typeof value === 'string'
      ? value.trim()
      : '';

  if (!UUID_PATTERN.test(normalized)) {
    throw new ApiError(
      400,
      `A valid ${label} is required.`
    );
  }

  return normalized;
}

function validateJobUrl(value) {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new ApiError(
      400,
      'A job link is required.'
    );
  }

  const normalized = value.trim();

  if (normalized.length > 2000) {
    throw new ApiError(
      400,
      'The job link is too long.'
    );
  }

  let url;

  try {
    url = new URL(normalized);
  } catch {
    throw new ApiError(
      400,
      'Please enter a valid job link.'
    );
  }

  if (
    !['http:', 'https:'].includes(
      url.protocol
    )
  ) {
    throw new ApiError(
      400,
      'Please enter a valid HTTP or HTTPS job link.'
    );
  }

  return url.toString();
}

function validateComment(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new ApiError(
      400,
      'Comment must be text.'
    );
  }

  const normalized = value.trim();

  if (normalized.length > 2000) {
    throw new ApiError(
      400,
      'Comment is too long.'
    );
  }

  return normalized || null;
}

function validateDetail(
  value,
  label,
  {
    required = false,
    maxLength = 200,
  } = {}
) {
  if (
    value === undefined ||
    value === null
  ) {
    if (required) {
      throw new ApiError(
        400,
        `${label} is required.`
      );
    }

    return null;
  }

  if (typeof value !== 'string') {
    throw new ApiError(
      400,
      `${label} must be text.`
    );
  }

  const normalized = value.trim();

  if (required && !normalized) {
    throw new ApiError(
      400,
      `${label} is required.`
    );
  }

  if (normalized.length > maxLength) {
    throw new ApiError(
      400,
      `${label} is too long.`
    );
  }

  return normalized || null;
}

function formatRequest(request) {
  return {
    id: request.id,
    clientId: request.client_id,
    applicantId:
      request.target_applicant_id,
    jobLink: request.job_url,
    comment: request.comment,
    company:
      request.job_company || '',
    position:
      request.job_position || '',
    location:
      request.job_location || '',
    jobType:
      request.job_type || '',
    salaryRange:
      request.salary_range || '',
    linkProvider:
      request.link_provider || '',
    status: request.status,
    source: 'Linker',
    convertedApplicationId:
      request.converted_application_id ||
      null,
    reviewedAt:
      request.reviewed_at || null,
    createdAt: request.created_at,
    updatedAt:
      request.updated_at ||
      request.created_at,
  };
}

async function listRequests(
  profile,
  supabase,
  res
) {
  const {
    data: requestRows,
    error: requestsError,
  } = await supabase
    .from('client_job_requests')
    .select(
      [
        'id',
        'client_id',
        'target_applicant_id',
        'job_url',
        'comment',
        'job_company',
        'job_position',
        'job_location',
        'job_type',
        'salary_range',
        'link_provider',
        'status',
        'converted_application_id',
        'reviewed_at',
        'created_at',
        'updated_at',
      ].join(', ')
    )
    .eq('submitted_by', profile.id)
    .eq('request_source', 'linker')
    .order('created_at', {
      ascending: false,
    })
    .limit(50);

  if (requestsError) {
    console.error(
      'Unable to load Linker job requests:',
      requestsError
    );

    throw new ApiError(
      500,
      'Your recorded job links could not be loaded.'
    );
  }

  res.setHeader(
    'Cache-Control',
    'no-store'
  );

  return res.status(200).json({
    requests:
      (requestRows || []).map(
        formatRequest
      ),
  });
}

async function createRequest(
  req,
  profile,
  supabase,
  res
) {
  const applicantId = validateId(
    req.body?.applicantId,
    'Applicant'
  );

  const clientId = validateId(
    req.body?.clientId,
    'Client'
  );

  const jobUrl = validateJobUrl(
    req.body?.jobLink
  );

  const comment = validateComment(
    req.body?.comment
  );

  const company = validateDetail(
    req.body?.company,
    'Company name',
    {
      required: true,
    }
  );

  const position = validateDetail(
    req.body?.position,
    'Job position',
    {
      required: true,
    }
  );

  const location = validateDetail(
    req.body?.location,
    'Location',
    {
      required: true,
    }
  );

  const jobType = validateDetail(
    req.body?.jobType,
    'Job type',
    {
      required: true,
      maxLength: 100,
    }
  );

  const salaryRange = validateDetail(
    req.body?.salaryRange,
    'Salary range'
  );

  const linkProvider = validateDetail(
    req.body?.linkProvider,
    'Link provider',
    {
      maxLength: 100,
    }
  );

  const {
    data: requestRows,
    error: requestError,
  } = await supabase.rpc(
    'create_linker_job_request_with_details',
    {
      p_linker_user_id:
        profile.id,
      p_applicant_id:
        applicantId,
      p_client_id:
        clientId,
      p_job_url:
        jobUrl,
      p_comment:
        comment,
      p_job_company:
        company,
      p_job_position:
        position,
      p_job_location:
        location,
      p_job_type:
        jobType,
      p_salary_range:
        salaryRange,
      p_link_provider:
        linkProvider,
    }
  );

  const request =
    Array.isArray(requestRows)
      ? requestRows[0]
      : requestRows;

  if (
    requestError ||
    !request
  ) {
    const message =
      String(
        requestError?.message || ''
      ).toLowerCase();

    if (
      message.includes(
        'linker account is not active'
      )
    ) {
      throw new ApiError(
        403,
        'Your Linker account cannot record job links.'
      );
    }

    if (
      message.includes(
        'applicant is not assigned to you'
      )
    ) {
      throw new ApiError(
        403,
        'This Applicant is not assigned to you.'
      );
    }

    if (
      message.includes(
        'applicant account is not active'
      ) ||
      message.includes(
        'applicant is not available'
      )
    ) {
      throw new ApiError(
        409,
        'The selected Applicant is unavailable.'
      );
    }

    if (
      message.includes(
        'client is not assigned'
      )
    ) {
      throw new ApiError(
        403,
        'This Client is not assigned to the selected Applicant.'
      );
    }

    if (
      message.includes(
        'client is not active'
      )
    ) {
      throw new ApiError(
        409,
        'The selected Client is unavailable.'
      );
    }

    if (
      message.includes(
        'applicant not found'
      ) ||
      message.includes(
        'client not found'
      )
    ) {
      throw new ApiError(
        404,
        'The selected assignment could not be found.'
      );
    }

    console.error(
      'Unable to create Linker job request:',
      requestError
    );

    throw new ApiError(
      500,
      'The job link could not be recorded.'
    );
  }

  return res.status(201).json({
    message:
      'Job link recorded successfully.',
    request: formatRequest({
      ...request,
      converted_application_id:
        null,
      reviewed_at:
        null,
      updated_at:
        request.created_at,
    }),
  });
}

export default async function handler(
  req,
  res
) {
  if (
    !['GET', 'POST'].includes(
      req.method
    )
  ) {
    res.setHeader(
      'Allow',
      'GET, POST'
    );

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const {
      profile,
      supabase,
    } = await requireLinker(req);

    if (req.method === 'GET') {
      return await listRequests(
        profile,
        supabase,
        res
      );
    }

    return await createRequest(
      req,
      profile,
      supabase,
      res
    );
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Linker job request API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? req.method === 'GET'
              ? 'Unable to load your recorded job links right now.'
              : 'Unable to record the job link right now.'
            : error.message,
      });
  }
}
