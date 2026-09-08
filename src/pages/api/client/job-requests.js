import { ApiError } from '../../../lib/auth/requireAdmin';
import { requireClient } from '../../../lib/auth/requireClient';

function validateJobUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(400, 'A job link is required.');
  }

  const trimmed = value.trim();

  if (trimmed.length > 2000) {
    throw new ApiError(400, 'The job link is too long.');
  }

  let url;

  try {
    url = new URL(trimmed);
  } catch {
    throw new ApiError(
      400,
      'Please enter a valid job link.'
    );
  }

  if (
    !['http:', 'https:'].includes(url.protocol)
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

  const trimmed = value.trim();

  if (trimmed.length > 2000) {
    throw new ApiError(
      400,
      'Comment is too long.'
    );
  }

  return trimmed || null;
}

export default async function handler(req, res) {
  if (
    !['GET', 'POST', 'PATCH'].includes(req.method)
  ) {
    res.setHeader(
      'Allow',
      'GET, POST, PATCH'
    );

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const {
      profile,
      supabase,
    } = await requireClient(req);

    const {
      data: client,
      error: clientError,
    } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (clientError || !client) {
      throw new ApiError(
        404,
        'Your client record could not be found.'
      );
    }

    if (req.method === 'PATCH') {
      const requestId =
        typeof req.body?.requestId === 'string'
          ? req.body.requestId.trim()
          : '';

      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)
        || req.body?.action !== 'withdraw'
      ) {
        throw new ApiError(400, 'A valid job request and withdrawal action are required.');
      }

      const { data: withdrawn, error: withdrawalError } = await supabase
        .from('client_job_requests')
        .update({
          status: 'withdrawn',
          withdrawn_at: new Date().toISOString(),
          withdrawn_by: profile.id,
        })
        .eq('id', requestId)
        .eq('client_id', client.id)
        .eq('submitted_by', profile.id)
        .in('status', ['new', 'in_review'])
        .is('converted_application_id', null)
        .select('id, status, withdrawn_at')
        .maybeSingle();

      if (withdrawalError) {
        throw new ApiError(500, 'The job link could not be withdrawn.');
      }

      if (!withdrawn) {
        throw new ApiError(
          409,
          'This link is unavailable for withdrawal. It may already be withdrawn or recorded as an application.'
        );
      }

      return res.status(200).json({
        message: 'Job link withdrawn successfully.',
        request: {
          id: withdrawn.id,
          status: withdrawn.status,
          withdrawnAt: withdrawn.withdrawn_at,
        },
      });
    }

    if (req.method === 'GET') {
      const {
        data: requestRows,
        error: requestsError,
      } = await supabase
        .from('client_job_requests')
        .select(`
          id,
          job_url,
          comment,
          status,
          converted_application_id,
          reviewed_at,
          created_at,
          updated_at
        `)
        .eq('client_id', client.id)
        .order('created_at', {
          ascending: false,
        })
        .limit(20);

      if (requestsError) {
        throw new ApiError(
          500,
          'Your submitted job links could not be loaded.'
        );
      }

      return res.status(200).json({
        requests: (requestRows || []).map(
          (request) => ({
            id: request.id,
            jobLink: request.job_url,
            comment: request.comment,
            status: request.status,
            convertedApplicationId:
              request.converted_application_id,
            reviewedAt:
              request.reviewed_at,
            createdAt:
              request.created_at,
            updatedAt:
              request.updated_at,
          })
        ),
      });
    }

    const jobUrl = validateJobUrl(
      req.body?.jobLink
    );

    const comment = validateComment(
      req.body?.comment
    );

    const {
      data: request,
      error: requestError,
    } = await supabase
      .from('client_job_requests')
      .insert({
        client_id: client.id,
        submitted_by: profile.id,
        job_url: jobUrl,
        comment,
        status: 'new',
      })
      .select(`
        id,
        job_url,
        comment,
        status,
        created_at
      `)
      .single();

    if (requestError || !request) {
      throw new ApiError(
        500,
        'Your job link could not be submitted.'
      );
    }

    return res.status(201).json({
      message: 'Job link submitted successfully.',
      request: {
        id: request.id,
        jobLink: request.job_url,
        comment: request.comment,
        status: request.status,
        createdAt: request.created_at,
      },
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Client job request API error:',
        error
      );
    }

    return res.status(statusCode).json({
      error:
        statusCode >= 500
          ? req.method === 'GET'
            ? 'Unable to load your submitted job links right now.'
            : req.method === 'PATCH'
              ? 'Unable to withdraw your job link right now.'
              : 'Unable to submit your job link right now.'
          : error.message,
    });
  }
}
