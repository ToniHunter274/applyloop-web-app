import {
  PortalApiError,
  requirePortalProfile,
} from '../../../lib/auth/requirePortalProfile';

const APPLICATION_STATUSES =
  new Set([
    'Interview Scheduled',
    'Waiting',
    'Offer Received',
    'Rejected',
    'Submitted',
  ]);

const LINK_SOURCES =
  new Set([
    'Client',
    'Finder',
    'Applicant',
  ]);

function sanitizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item) =>
        typeof item === 'string'
    )
    .map(
      (item) => item.trim()
    )
    .filter(Boolean);
}

function getApplicationId(req) {
  const value =
    Array.isArray(req.query.id)
      ? req.query.id[0]
      : req.query.id;

  const applicationId =
    String(value || '')
      .trim();

  if (!applicationId) {
    throw new PortalApiError(
      400,
      'An Application ID is required.'
    );
  }

  return applicationId;
}

async function canAccessApplication(
  profile,
  supabase,
  application,
  req
) {
  if (
    ['owner', 'admin'].includes(
      profile.role
    )
  ) {
    const previewClientId =
      String(
        Array.isArray(
          req.query.previewClientId
        )
          ? req.query
              .previewClientId[0]
          : req.query
              .previewClientId ||
            ''
      ).trim();

    if (
      previewClientId &&
      previewClientId !==
        application.client_id
    ) {
      return false;
    }

    return true;
  }

  if (
    profile.role ===
    'user_client'
  ) {
    const {
      data: client,
    } = await supabase
      .from('clients')
      .select('id')
      .eq(
        'user_id',
        profile.id
      )
      .maybeSingle();

    return (
      client?.id ===
      application.client_id
    );
  }

  if (
    profile.role ===
    'applicant'
  ) {
    const {
      data: applicant,
    } = await supabase
      .from('applicants')
      .select('id')
      .eq(
        'user_id',
        profile.id
      )
      .maybeSingle();

    if (!applicant) {
      return false;
    }

    const {
      data: assignment,
    } = await supabase
      .from(
        'client_applicant_assignments'
      )
      .select('id')
      .eq(
        'applicant_id',
        applicant.id
      )
      .eq(
        'client_id',
        application.client_id
      )
      .maybeSingle();

    return Boolean(
      assignment
    );
  }

  return false;
}

async function loadApplication(
  supabase,
  applicationId
) {
  const {
    data: application,
    error,
  } = await supabase
    .from('applications')
    .select(`
      id,
      client_id,
      company,
      position,
      location,
      status,
      link_source,
      role,
      applied_at,
      preferences,
      job_url,
      resume_name,
      cover_letter_name,
      feedback,
      job_details,
      qualities,
      other_details,
      created_at,
      updated_at
    `)
    .eq(
      'id',
      applicationId
    )
    .single();

  if (
    error ||
    !application
  ) {
    throw new PortalApiError(
      404,
      'The Application could not be found.'
    );
  }

  return application;
}

async function getApplication(
  req,
  res
) {
  const {
    profile,
    supabase,
  } =
    await requirePortalProfile(
      req
    );

  const applicationId =
    getApplicationId(req);

  const application =
    await loadApplication(
      supabase,
      applicationId
    );

  const allowed =
    await canAccessApplication(
      profile,
      supabase,
      application,
      req
    );

  if (!allowed) {
    throw new PortalApiError(
      403,
      'You do not have access to this Application.'
    );
  }

  return res.status(200).json({
    application: {
      id:
        application.id,
      clientId:
        application.client_id,
      company:
        application.company,
      position:
        application.position,
      location:
        application.location ||
        '',
      status:
        application.status,
      linkSource:
        application.link_source,
      role:
        application.role ||
        application.position,
      appliedAt:
        application.applied_at,
      preferences:
        sanitizeStringArray(
          application.preferences
        ),
      jobLink:
        application.job_url ||
        '',
      resumeName:
        application.resume_name ||
        '',
      coverLetterName:
        application.cover_letter_name ||
        '',
      feedback:
        application.feedback ||
        '',
      jobDetails:
        sanitizeStringArray(
          application.job_details
        ),
      qualities:
        sanitizeStringArray(
          application.qualities
        ),
      otherDetails:
        sanitizeStringArray(
          application.other_details
        ),
      createdAt:
        application.created_at,
      updatedAt:
        application.updated_at,
    },
  });
}

async function updateApplication(
  req,
  res
) {
  const {
    profile,
    supabase,
  } =
    await requirePortalProfile(
      req
    );

  if (
    ![
      'applicant',
      'owner',
      'admin',
    ].includes(profile.role)
  ) {
    throw new PortalApiError(
      403,
      'You do not have permission to update this Application.'
    );
  }

  const applicationId =
    getApplicationId(req);

  const changes = {};

  if (
    Object.prototype
      .hasOwnProperty.call(
        req.body || {},
        'status'
      )
  ) {
    if (
      !APPLICATION_STATUSES.has(
        req.body.status
      )
    ) {
      throw new PortalApiError(
        400,
        'Select a valid Application status.'
      );
    }

    changes.status =
      req.body.status;
  }

  if (
    Object.prototype
      .hasOwnProperty.call(
        req.body || {},
        'linkSource'
      )
  ) {
    if (
      !LINK_SOURCES.has(
        req.body.linkSource
      )
    ) {
      throw new PortalApiError(
        400,
        'Select a valid link source.'
      );
    }

    changes.link_source =
      req.body.linkSource;
  }

  if (
    Object.keys(changes)
      .length === 0
  ) {
    throw new PortalApiError(
      400,
      'No supported Application changes were provided.'
    );
  }

  if (
    profile.role ===
    'applicant'
  ) {
    const {
      data: applicationRows,
      error: updateError,
    } = await supabase.rpc(
      'update_applicant_application',
      {
        p_actor_id:
          profile.id,
        p_application_id:
          applicationId,
        p_status:
          changes.status ||
          null,
        p_link_source:
          changes.link_source ||
          null,
      }
    );

    const application =
      Array.isArray(
        applicationRows
      )
        ? applicationRows[0]
        : applicationRows;

    if (
      updateError ||
      !application
    ) {
      const normalizedMessage =
        String(
          updateError?.message ||
          ''
        ).toLowerCase();

      if (
        normalizedMessage.includes(
          'paused or completed client'
        )
      ) {
        throw new PortalApiError(
          409,
          'Applications cannot be edited for a paused or completed Client.'
        );
      }

      if (
        normalizedMessage.includes(
          'not assigned to you'
        )
      ) {
        throw new PortalApiError(
          403,
          'This Client is not assigned to you.'
        );
      }

      if (
        normalizedMessage.includes(
          'applicant account is not active'
        )
      ) {
        throw new PortalApiError(
          403,
          'Your Applicant account cannot update Applications.'
        );
      }

      if (
        normalizedMessage.includes(
          'applicant not found'
        )
      ) {
        throw new PortalApiError(
          404,
          'Your Applicant record could not be found.'
        );
      }

      if (
        normalizedMessage.includes(
          'application not found'
        )
      ) {
        throw new PortalApiError(
          404,
          'The Application could not be found.'
        );
      }

      if (
        normalizedMessage.includes(
          'client not found'
        )
      ) {
        throw new PortalApiError(
          404,
          'The Client could not be found.'
        );
      }

      console.error(
        'Unable to update Application atomically:',
        updateError
      );

      throw new PortalApiError(
        500,
        'The Application could not be updated.'
      );
    }

    return res.status(200).json({
      message:
        'Application updated successfully.',
      application: {
        id:
          application.id,
        clientId:
          application.client_id,
        status:
          application.status,
        linkSource:
          application.link_source,
        updatedAt:
          application.updated_at,
      },
    });
  }

  const existing =
    await loadApplication(
      supabase,
      applicationId
    );

  const allowed =
    await canAccessApplication(
      profile,
      supabase,
      existing,
      req
    );

  if (!allowed) {
    throw new PortalApiError(
      403,
      'You do not have access to this Application.'
    );
  }

  const {
    data: application,
    error: updateError,
  } = await supabase
    .from('applications')
    .update(changes)
    .eq(
      'id',
      applicationId
    )
    .select(`
      id,
      client_id,
      company,
      position,
      location,
      status,
      link_source,
      role,
      applied_at,
      preferences,
      job_url,
      resume_name,
      cover_letter_name,
      feedback,
      job_details,
      qualities,
      other_details,
      created_at,
      updated_at
    `)
    .single();

  if (
    updateError ||
    !application
  ) {
    console.error(
      'Unable to update Application:',
      updateError
    );

    throw new PortalApiError(
      500,
      'The Application could not be updated.'
    );
  }

  return res.status(200).json({
    message:
      'Application updated successfully.',
    application: {
      id:
        application.id,
      clientId:
        application.client_id,
      status:
        application.status,
      linkSource:
        application.link_source,
      updatedAt:
        application.updated_at,
    },
  });
}

export default async function handler(
  req,
  res
) {
  if (
    ![
      'GET',
      'PATCH',
    ].includes(req.method)
  ) {
    res.setHeader(
      'Allow',
      'GET, PATCH'
    );

    return res.status(405).json({
      error:
        'Method not allowed.',
    });
  }

  try {
    if (
      req.method === 'PATCH'
    ) {
      return await updateApplication(
        req,
        res
      );
    }

    return await getApplication(
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
        'Application API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to manage this Application right now.'
            : error.message,
      });
  }
}
