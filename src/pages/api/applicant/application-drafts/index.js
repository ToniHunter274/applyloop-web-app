import {
  PortalApiError,
} from '../../../../lib/auth/requirePortalProfile';
import {
  cleanDraftValue,
  requireApplicantDraftContext,
  serializeApplicationDraft,
  verifyAssignedClient,
} from '../../../../lib/applicants/applicationDrafts';

async function listDrafts(
  req,
  res
) {
  const {
    applicant,
    supabase,
  } =
    await requireApplicantDraftContext(
      req
    );

  const {
    data,
    error,
  } = await supabase
    .from(
      'application_drafts'
    )
    .select('*')
    .eq(
      'applicant_id',
      applicant.id
    )
    .in(
      'status',
      [
        'active',
        'ready_to_apply',
      ]
    )
    .order(
      'updated_at',
      {
        ascending: false,
      }
    );

  if (error) {
    console.error(
      'Unable to load Application Drafts:',
      error
    );

    throw new PortalApiError(
      500,
      'Applications in progress could not be loaded.'
    );
  }

  return res
    .status(200)
    .json({
      drafts:
        (data || []).map(
          serializeApplicationDraft
        ),
    });
}

async function createDraft(
  req,
  res
) {
  const {
    profile,
    applicant,
    supabase,
  } =
    await requireApplicantDraftContext(
      req
    );

  const clientId =
    cleanDraftValue(
      req.body?.clientId,
      100
    );

  const jobRequestId =
    cleanDraftValue(
      req.body?.jobRequestId,
      100
    ) || null;

  if (!clientId) {
    throw new PortalApiError(
      400,
      'Choose a Client to start an application.'
    );
  }

  await verifyAssignedClient({
    supabase,
    applicantId:
      applicant.id,
    clientId,
  });

  const {
    data: client,
    error: clientError,
  } = await supabase
    .from('clients')
    .select(`
      id,
      status
    `)
    .eq(
      'id',
      clientId
    )
    .maybeSingle();

  if (
    clientError ||
    !client
  ) {
    throw new PortalApiError(
      404,
      'The Client could not be found.'
    );
  }

  if (
    client.status !==
    'active'
  ) {
    throw new PortalApiError(
      400,
      'New applications can only be prepared for active Clients.'
    );
  }

  let requestJobUrl = '';

  if (jobRequestId) {
    const {
      data: request,
      error: requestError,
    } = await supabase
      .from(
        'client_job_requests'
      )
      .select(`
        id,
        client_id,
        job_url,
        status
      `)
      .eq(
        'id',
        jobRequestId
      )
      .maybeSingle();

    if (
      requestError ||
      !request
    ) {
      throw new PortalApiError(
        404,
        'The Job Link could not be found.'
      );
    }

    if (
      request.client_id !==
      clientId
    ) {
      throw new PortalApiError(
        400,
        'This Job Link belongs to a different Client.'
      );
    }

    if (
      ![
        'new',
        'in_review',
      ].includes(
        request.status
      )
    ) {
      throw new PortalApiError(
        409,
        'This Job Link is no longer available for a new application.'
      );
    }

    requestJobUrl =
      request.job_url || '';

    const {
      data: existingDraft,
      error: existingError,
    } = await supabase
      .from(
        'application_drafts'
      )
      .select('*')
      .eq(
        'job_request_id',
        jobRequestId
      )
      .maybeSingle();

    if (existingError) {
      throw new PortalApiError(
        500,
        'The existing application draft could not be checked.'
      );
    }

    if (existingDraft) {
      if (
        existingDraft.applicant_id ===
        applicant.id
      ) {
        return res
          .status(200)
          .json({
            draft:
              serializeApplicationDraft(
                existingDraft
              ),

            reused: true,
          });
      }

      throw new PortalApiError(
        409,
        'This Job Link is already being prepared by another Applicant.'
      );
    }
  }

  const jobUrl =
    cleanDraftValue(
      req.body?.jobUrl,
      2000
    ) ||
    requestJobUrl;

  const {
    data: draft,
    error,
  } = await supabase
    .from(
      'application_drafts'
    )
    .insert({
      applicant_id:
        applicant.id,

      client_id:
        clientId,

      job_request_id:
        jobRequestId,

      created_by:
        profile.id,

      origin:
        jobRequestId
          ? 'job_request'
          : 'applicant',

      company:
        cleanDraftValue(
          req.body?.company,
          300
        ),

      position:
        cleanDraftValue(
          req.body?.position,
          300
        ),

      location:
        cleanDraftValue(
          req.body?.location,
          300
        ),

      job_url:
        jobUrl,

      job_description:
        cleanDraftValue(
          req.body
            ?.jobDescription,
          30000
        ),
    })
    .select('*')
    .single();

  if (
    error ||
    !draft
  ) {
    console.error(
      'Unable to create Application Draft:',
      error
    );

    if (
      error?.code ===
      '23505'
    ) {
      throw new PortalApiError(
        409,
        'An application is already in progress for this Job Link.'
      );
    }

    throw new PortalApiError(
      500,
      'The application could not be started.'
    );
  }

  return res
    .status(201)
    .json({
      draft:
        serializeApplicationDraft(
          draft
        ),
    });
}

export default async function handler(
  req,
  res
) {
  if (
    ![
      'GET',
      'POST',
    ].includes(
      req.method
    )
  ) {
    res.setHeader(
      'Allow',
      'GET, POST'
    );

    return res
      .status(405)
      .json({
        error:
          'Method not allowed.',
      });
  }

  try {
    if (
      req.method === 'GET'
    ) {
      return await listDrafts(
        req,
        res
      );
    }

    return await createDraft(
      req,
      res
    );
  } catch (error) {
    const statusCode =
      error instanceof
      PortalApiError
        ? error.statusCode
        : 500;

    if (
      statusCode >= 500
    ) {
      console.error(
        'Application Draft API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Applications in progress are temporarily unavailable.'
            : error.message,
      });
  }
}
