import { ApiError } from '../../../lib/auth/requireAdmin';
import { requireClient } from '../../../lib/auth/requireClient';
import { getClientServiceState } from '../../../lib/subscriptions/clientServiceState';
import {
  findDuplicateJobLink,
  normalizeJobLink,
  validateJobLink,
} from '../../../lib/jobs/jobLinkDeduplication';

function validateJobUrl(value) {
  try {
    return validateJobLink(
      value
    );
  } catch (error) {
    throw new ApiError(
      400,
      error?.message ||
        'Please enter a valid job link.'
    );
  }
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
        .eq('request_source', 'client')
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
          request_source,
          converted_application_id,
          reviewed_at,
          created_at,
          updated_at
        `)
        .eq('client_id', client.id)
        .order('created_at', {
          ascending: false,
        })
        .limit(100);

      if (requestsError) {
        throw new ApiError(
          500,
          'Your submitted job links could not be loaded.'
        );
      }

      const requestIds = (requestRows || []).map(
        (request) => request.id
      );

      let applicationsByJobRequestId =
        new Map();

      if (requestIds.length) {
        const {
          data: applicationRows,
          error: applicationsError,
        } = await supabase
          .from('applications')
          .select(`
            id,
            job_request_id,
            status
          `)
          .eq('client_id', client.id)
          .in('job_request_id', requestIds);

        if (applicationsError) {
          throw new ApiError(
            500,
            'Application progress for your job links could not be loaded.'
          );
        }

        applicationsByJobRequestId =
          new Map(
            (applicationRows || [])
              .filter(
                (application) =>
                  application.job_request_id
              )
              .map(
                (application) => [
                  application.job_request_id,
                  application,
                ]
              )
          );
      }

      let ratingsByJobRequestId =
        new Map();

      if (requestIds.length) {
        const {
          data: ratingRows,
          error: ratingsError,
        } = await supabase
          .from(
            'job_request_client_ratings'
          )
          .select(`
            job_request_id,
            rating,
            note,
            updated_at
          `)
          .eq(
            'client_id',
            client.id
          )
          .in(
            'job_request_id',
            requestIds
          );

        if (ratingsError) {
          throw new ApiError(
            500,
            'Ratings for your Job Links could not be loaded.'
          );
        }

        ratingsByJobRequestId =
          new Map(
            (ratingRows || []).map(
              (rating) => [
                rating.job_request_id,
                rating,
              ]
            )
          );
      }

      return res.status(200).json({
        requests: (requestRows || []).map(
          (request) => {
            const linkedApplication =
              applicationsByJobRequestId.get(
                request.id
              );

            const requestRating =
              ratingsByJobRequestId.get(
                request.id
              );

            return {
              id: request.id,
              jobLink: request.job_url,
              comment: request.comment,
              status: request.status,
              requestSource:
                request.request_source ||
                null,
              convertedApplicationId:
                request.converted_application_id,
              linkedApplicationId:
                linkedApplication?.id ||
                request.converted_application_id ||
                null,
              applicationStatus:
                linkedApplication?.status ||
                null,
              reviewedAt:
                request.reviewed_at,
              createdAt:
                request.created_at,
              updatedAt:
                request.updated_at,

              clientRating:
                requestRating?.rating ||
                0,

              clientRatingNote:
                requestRating?.note ||
                '',

              clientRatingUpdatedAt:
                requestRating?.updated_at ||
                null,
            };
          }
        ),
      });
    }

    const serviceState =
      await getClientServiceState({
        supabase,
        clientId:
          client.id,
      });

    if (!serviceState.canOperate) {
      throw new ApiError(
        409,
        'Your application service is currently paused or expired. Please renew or contact ApplyLoop before submitting new job links.'
      );
    }

    const rawJobLinks =
      Array.isArray(req.body?.jobLinks)
        ? req.body.jobLinks
        : req.body?.jobLink !== undefined
          ? [req.body.jobLink]
          : [];

    if (
      rawJobLinks.length < 1 ||
      rawJobLinks.length > 20
    ) {
      throw new ApiError(
        400,
        'Submit between 1 and 20 job links at a time.'
      );
    }

    const comment = validateComment(
      req.body?.comment
    );

    const results = [];
    const createdRequests = [];
    const batchNormalizedLinks = new Set();

    for (const rawJobLink of rawJobLinks) {
      let jobUrl;
      let normalizedJobLink;

      try {
        jobUrl = validateJobUrl(
          rawJobLink
        );

        normalizedJobLink =
          normalizeJobLink(
            jobUrl
          );
      } catch (validationError) {
        results.push({
          jobLink:
            typeof rawJobLink ===
            'string'
              ? rawJobLink.trim()
              : '',
          status: 'invalid',
          message:
            validationError instanceof
            ApiError
              ? validationError.message
              : 'Please enter a valid job link.',
        });

        continue;
      }

      if (
        batchNormalizedLinks.has(
          normalizedJobLink
        )
      ) {
        results.push({
          jobLink: jobUrl,
          status: 'duplicate',
          reason: 'repeated',
          message:
            'This link was repeated in the links you pasted.',
        });

        continue;
      }

      batchNormalizedLinks.add(
        normalizedJobLink
      );

      let duplicateCheck;

      try {
        duplicateCheck =
          await findDuplicateJobLink({
            supabase,
            clientId:
              client.id,
            jobLink: jobUrl,
          });
      } catch {
        results.push({
          jobLink: jobUrl,
          status: 'error',
          message:
            'This link could not be checked for duplicates.',
        });

        continue;
      }

      if (duplicateCheck.type) {
        results.push({
          jobLink: jobUrl,
          status: 'duplicate',
          reason:
            duplicateCheck.type ===
            'application'
              ? 'application'
              : 'existing',
          message:
            duplicateCheck.type ===
            'application'
              ? 'This link is already connected to an application.'
              : 'This link is already in ApplyLoop.',
        });

        continue;
      }

      const {
        data: request,
        error: requestError,
      } = await supabase
        .from(
          'client_job_requests'
        )
        .insert({
          client_id: client.id,
          submitted_by:
            profile.id,
          job_url: jobUrl,
          normalized_job_url:
            duplicateCheck
              .normalizedJobLink,
          comment,
          status: 'new',
          request_source:
            'client',
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
        const duplicateInsert =
          String(
            requestError?.message ||
              ''
          )
            .toLowerCase()
            .includes(
              'duplicate job link'
            );

        results.push({
          jobLink: jobUrl,
          status:
            duplicateInsert
              ? 'duplicate'
              : 'error',
          reason:
            duplicateInsert
              ? 'existing'
              : 'failed',
          message:
            duplicateInsert
              ? 'This link is already in ApplyLoop.'
              : 'This link could not be sent.',
        });

        continue;
      }

      const formattedRequest = {
        id: request.id,
        jobLink:
          request.job_url,
        comment:
          request.comment,
        status:
          request.status,
        requestSource:
          'client',
        createdAt:
          request.created_at,
      };

      createdRequests.push(
        formattedRequest
      );

      results.push({
        jobLink: jobUrl,
        status: 'created',
        message:
          'Job link added successfully.',
        request:
          formattedRequest,
      });
    }

    const repeatedCount =
      results.filter(
        (result) =>
          result.status ===
            'duplicate' &&
          result.reason ===
            'repeated'
      ).length;

    const existingCount =
      results.filter(
        (result) =>
          result.status ===
            'duplicate' &&
          [
            'existing',
            'application',
          ].includes(
            result.reason
          )
      ).length;

    const duplicateCount =
      repeatedCount +
      existingCount;

    const invalidCount =
      results.filter(
        (result) =>
          result.status ===
          'invalid'
      ).length;

    const failedCount =
      results.filter(
        (result) =>
          result.status ===
          'error'
      ).length;

    const summary = {
      submitted:
        rawJobLinks.length,
      created:
        createdRequests.length,
      duplicates:
        duplicateCount,
      repeated:
        repeatedCount,
      existing:
        existingCount,
      invalid:
        invalidCount,
      failed:
        failedCount,
    };

    const messageParts = [];

    if (summary.created) {
      messageParts.push(
        `${summary.created} ${
          summary.created === 1
            ? 'link'
            : 'links'
        } sent.`
      );
    }

    if (summary.repeated) {
      messageParts.push(
        `${summary.repeated} repeated ${
          summary.repeated === 1
            ? 'link'
            : 'links'
        } ignored.`
      );
    }

    if (summary.existing) {
      messageParts.push(
        summary.existing === 1
          ? '1 link was already in ApplyLoop.'
          : `${summary.existing} links were already in ApplyLoop.`
      );
    }

    if (summary.invalid) {
      messageParts.push(
        `${summary.invalid} invalid ${
          summary.invalid === 1
            ? 'link'
            : 'links'
        } rejected.`
      );
    }

    if (summary.failed) {
      messageParts.push(
        `${summary.failed} ${
          summary.failed === 1
            ? 'link'
            : 'links'
        } could not be sent.`
      );
    }

    const submissionMessage =
      messageParts.length
        ? messageParts.join(' ')
        : 'No new links were sent.';

    if (
      !createdRequests.length
    ) {
      const onlyDuplicates =
        duplicateCount > 0 &&
        invalidCount === 0 &&
        failedCount === 0;

      throw new ApiError(
        onlyDuplicates
          ? 409
          : 400,
        submissionMessage
      );
    }

    return res.status(201).json({
      message:
        submissionMessage,
      summary,
      requests:
        createdRequests,
      results,

      // Backward compatibility for
      // the previous single-link client.
      request:
        createdRequests[0] ||
        null,
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
