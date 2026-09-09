import {
  PortalApiError,
  requirePortalProfile,
} from '../../../../lib/auth/requirePortalProfile';

const ALLOWED_STATUSES = new Set(['in_review']);

function formatRequest(request) {
  return {
    id: request.id,
    clientId:
      request.client_id,
    jobLink:
      request.job_url,
    comment:
      request.comment,
    status:
      request.status,
    source:
      request.request_source ===
      'linker'
        ? 'Linker'
        : 'Client',
    targetApplicantId:
      request.target_applicant_id ||
      null,
    convertedApplicationId:
      request.converted_application_id,
    reviewedAt:
      request.reviewed_at,
    createdAt:
      request.created_at,
    updatedAt:
      request.updated_at,
  };
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'PATCH') {
    res.setHeader(
      'Allow',
      'PATCH'
    );

    return res.status(405).json({
      error:
        'Method not allowed.',
    });
  }

  try {
    const {
      profile,
      supabase,
    } =
      await requirePortalProfile(
        req
      );

    if (
      profile.role !==
      'applicant'
    ) {
      throw new PortalApiError(
        403,
        'Only Applicants can update Client job requests.'
      );
    }

    const requestId =
      String(
        Array.isArray(req.query.id)
          ? req.query.id[0]
          : req.query.id || ''
      ).trim();

    const status =
      String(
        req.body?.status || ''
      ).trim();

    if (!requestId) {
      throw new PortalApiError(
        400,
        'A job request is required.'
      );
    }

    if (
      !ALLOWED_STATUSES.has(
        status
      )
    ) {
      throw new PortalApiError(
        400,
        'Applicants can only start reviewing a job request. Only the submitting client can withdraw it.'
      );
    }

    const {
      data: applicant,
      error: applicantError,
    } = await supabase
      .from('applicants')
      .select('id')
      .eq(
        'user_id',
        profile.id
      )
      .single();

    if (
      applicantError ||
      !applicant
    ) {
      throw new PortalApiError(
        404,
        'Your Applicant record could not be found.'
      );
    }

    const {
      data: jobRequest,
      error: requestError,
    } = await supabase
      .from(
        'client_job_requests'
      )
      .select(`
        id,
        client_id,
        job_url,
        comment,
        status,
        request_source,
        target_applicant_id,
        converted_application_id,
        reviewed_at,
        created_at,
        updated_at
      `)
      .eq('id', requestId)
      .single();

    if (
      requestError ||
      !jobRequest
    ) {
      throw new PortalApiError(
        404,
        'The Client job request could not be found.'
      );
    }

    if (
      jobRequest.request_source ===
        'linker' &&
      jobRequest.target_applicant_id !==
        applicant.id
    ) {
      throw new PortalApiError(
        403,
        'This Linker job request is assigned to another Applicant.'
      );
    }

    const {
      data: assignment,
      error: assignmentError,
    } = await supabase
      .from(
        'client_applicant_assignments'
      )
      .select('client_id')
      .eq(
        'applicant_id',
        applicant.id
      )
      .eq(
        'client_id',
        jobRequest.client_id
      )
      .maybeSingle();

    if (
      assignmentError ||
      !assignment
    ) {
      throw new PortalApiError(
        403,
        'This Client is not assigned to you.'
      );
    }

    if (
      [
        'converted',
        'dismissed',
        'withdrawn',
      ].includes(
        jobRequest.status
      )
    ) {
      throw new PortalApiError(
        409,
        jobRequest.status === 'withdrawn'
          ? 'This job link was withdrawn by the client.'
          : 'This job request has already been completed.'
      );
    }

    const {
      data: updatedRequest,
      error: updateError,
    } = await supabase
      .from(
        'client_job_requests'
      )
      .update({
        status,
        reviewed_by:
          profile.id,
        reviewed_at:
          new Date()
            .toISOString(),
      })
      .eq('id', requestId)
      .in(
        'status',
        [
          'new',
          'in_review',
        ]
      )
      .select(`
        id,
        client_id,
        job_url,
        comment,
        status,
        request_source,
        target_applicant_id,
        converted_application_id,
        reviewed_at,
        created_at,
        updated_at
      `)
      .maybeSingle();

    if (updateError) {
      throw new PortalApiError(
        500,
        'The Client job request could not be updated.'
      );
    }

    if (!updatedRequest) {
      throw new PortalApiError(
        409,
        'This job request has already been completed.'
      );
    }

    return res.status(200).json({
      message:
        'Job request is now in review.',
      request:
        formatRequest(
          updatedRequest
        ),
    });
  } catch (error) {
    const statusCode =
      error instanceof
      PortalApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Applicant job request API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to update the Client job request right now.'
            : error.message,
      });
  }
}
