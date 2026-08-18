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

function getQueryValue(value) {
  if (Array.isArray(value)) {
    return String(value[0] || '')
      .trim();
  }

  return String(value || '')
    .trim();
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  return new Date(
    value
  ).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );
}

function formatTime(value) {
  if (!value) {
    return '';
  }

  return new Date(
    value
  ).toLocaleTimeString(
    'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
    }
  );
}

function getDashboardStatus(status) {
  if (
    status ===
    'Interview Scheduled'
  ) {
    return 'Interview';
  }

  if (
    status ===
    'Offer Received'
  ) {
    return 'Offered';
  }

  if (
    status === 'Rejected'
  ) {
    return 'Rejected';
  }

  return 'Pending';
}

function formatApplication(
  application,
  clientName = ''
) {
  return {
    id: application.id,
    number:
      `#${application.id
        .slice(0, 8)
        .toUpperCase()}`,
    clientId:
      application.client_id,
    client:
      clientName ||
      'Client',
    company:
      application.company,
    position:
      application.position,
    location:
      application.location ||
      '',
    status:
      application.status,
    dashboardStatus:
      getDashboardStatus(
        application.status
      ),
    linkSource:
      application.link_source,
    role:
      application.role ||
      application.position,
    appliedAt:
      application.applied_at,
    date:
      formatDate(
        application.applied_at
      ),
    applicationTime:
      formatTime(
        application.applied_at
      ),
    preferences:
      Array.isArray(
        application.preferences
      )
        ? application.preferences
        : [],
    jobLink:
      application.job_url ||
      '',
    resume:
      application.resume_name ||
      'N/A',
    coverLetter:
      application.cover_letter_name ||
      'N/A',
    feedback:
      application.feedback ||
      '',
    jobDetails:
      Array.isArray(
        application.job_details
      )
        ? application.job_details
        : [],
    qualities:
      Array.isArray(
        application.qualities
      )
        ? application.qualities
        : [],
    otherDetails:
      Array.isArray(
        application.other_details
      )
        ? application.other_details
        : [],
    createdAt:
      application.created_at,
    updatedAt:
      application.updated_at,
  };
}

async function getApplicantClientIds(
  supabase,
  applicantId
) {
  const {
    data: applicant,
    error: applicantError,
  } = await supabase
    .from('applicants')
    .select('id')
    .eq('id', applicantId)
    .single();

  if (
    applicantError ||
    !applicant
  ) {
    throw new PortalApiError(
      404,
      'The applicant could not be found.'
    );
  }

  const {
    data: assignments,
    error: assignmentsError,
  } = await supabase
    .from(
      'client_applicant_assignments'
    )
    .select('client_id')
    .eq(
      'applicant_id',
      applicant.id
    );

  if (assignmentsError) {
    throw new PortalApiError(
      500,
      'Assigned Clients could not be loaded.'
    );
  }

  return (
    assignments || []
  ).map(
    (assignment) =>
      assignment.client_id
  );
}

async function getAllowedClientIds(
  profile,
  supabase,
  req
) {
  const requestedClientId =
    getQueryValue(
      req.query.clientId
    );

  const requestedApplicantId =
    getQueryValue(
      req.query.applicantId
    );

  if (
    ['owner', 'admin'].includes(
      profile.role
    )
  ) {
    if (requestedApplicantId) {
      const clientIds =
        await getApplicantClientIds(
          supabase,
          requestedApplicantId
        );

      if (
        requestedClientId &&
        !clientIds.includes(
          requestedClientId
        )
      ) {
        throw new PortalApiError(
          403,
          'This Client is not assigned to the selected Applicant.'
        );
      }

      return requestedClientId
        ? [requestedClientId]
        : clientIds;
    }

    if (requestedClientId) {
      const {
        data: client,
        error: clientError,
      } = await supabase
        .from('clients')
        .select('id')
        .eq(
          'id',
          requestedClientId
        )
        .single();

      if (
        clientError ||
        !client
      ) {
        throw new PortalApiError(
          404,
          'The Client could not be found.'
        );
      }

      return [client.id];
    }

    return null;
  }

  if (
    profile.role ===
    'user_client'
  ) {
    if (requestedApplicantId) {
      throw new PortalApiError(
        403,
        'You do not have access to Applicant previews.'
      );
    }

    const {
      data: client,
      error: clientError,
    } = await supabase
      .from('clients')
      .select('id')
      .eq(
        'user_id',
        profile.id
      )
      .single();

    if (
      clientError ||
      !client
    ) {
      throw new PortalApiError(
        404,
        'Your Client record could not be found.'
      );
    }

    if (
      requestedClientId &&
      requestedClientId !==
        client.id
    ) {
      throw new PortalApiError(
        403,
        'You do not have access to this Client.'
      );
    }

    return [client.id];
  }

  if (
    profile.role ===
    'applicant'
  ) {
    if (requestedApplicantId) {
      throw new PortalApiError(
        403,
        'You do not have access to Applicant previews.'
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

    const clientIds =
      await getApplicantClientIds(
        supabase,
        applicant.id
      );

    if (
      requestedClientId &&
      !clientIds.includes(
        requestedClientId
      )
    ) {
      throw new PortalApiError(
        403,
        'This Client is not assigned to you.'
      );
    }

    return requestedClientId
      ? [requestedClientId]
      : clientIds;
  }

  throw new PortalApiError(
    403,
    'You do not have access to Applications.'
  );
}

async function getClientNames(
  supabase,
  clientIds
) {
  if (
    !clientIds ||
    clientIds.length === 0
  ) {
    return new Map();
  }

  const {
    data: clients,
    error: clientsError,
  } = await supabase
    .from('clients')
    .select('id, user_id')
    .in('id', clientIds);

  if (clientsError) {
    throw new PortalApiError(
      500,
      'Client details could not be loaded.'
    );
  }

  const userIds =
    (clients || []).map(
      (client) =>
        client.user_id
    );

  let profiles = [];

  if (userIds.length > 0) {
    const {
      data: profileRows,
      error: profilesError,
    } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profilesError) {
      throw new PortalApiError(
        500,
        'Client profiles could not be loaded.'
      );
    }

    profiles =
      profileRows || [];
  }

  const namesByUserId =
    new Map(
      profiles.map(
        (profile) => [
          profile.id,
          profile.full_name,
        ]
      )
    );

  return new Map(
    (clients || []).map(
      (client) => [
        client.id,
        namesByUserId.get(
          client.user_id
        ) || 'Client',
      ]
    )
  );
}

async function listApplications(
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

  const allowedClientIds =
    await getAllowedClientIds(
      profile,
      supabase,
      req
    );

  if (
    Array.isArray(
      allowedClientIds
    ) &&
    allowedClientIds.length === 0
  ) {
    return res.status(200).json({
      applications: [],
    });
  }

  let query = supabase
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
    .order(
      'applied_at',
      {
        ascending: false,
      }
    );

  if (
    Array.isArray(
      allowedClientIds
    )
  ) {
    query = query.in(
      'client_id',
      allowedClientIds
    );
  }

  const {
    data: applicationRows,
    error: applicationsError,
  } = await query;

  if (applicationsError) {
    console.error(
      'Unable to load Applications:',
      applicationsError
    );

    throw new PortalApiError(
      500,
      'Applications could not be loaded.'
    );
  }

  const clientIds = [
    ...new Set(
      (
        applicationRows ||
        []
      ).map(
        (application) =>
          application.client_id
      )
    ),
  ];

  const clientNames =
    await getClientNames(
      supabase,
      clientIds
    );

  const applications =
    (
      applicationRows ||
      []
    ).map(
      (application) =>
        formatApplication(
          application,
          clientNames.get(
            application.client_id
          )
        )
    );

  return res.status(200).json({
    applications,
  });
}

async function createApplication(
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
    profile.role !==
    'applicant'
  ) {
    throw new PortalApiError(
      403,
      'Only Applicants can record Applications from the Applicant workspace.'
    );
  }

  const clientId =
    String(
      req.body?.clientId ||
      ''
    ).trim();

  const company =
    String(
      req.body?.company ||
      ''
    ).trim();

  const position =
    String(
      req.body?.position ||
      ''
    ).trim();

  if (!clientId) {
    throw new PortalApiError(
      400,
      'Select a Client.'
    );
  }

  if (!company) {
    throw new PortalApiError(
      400,
      'Enter the company name.'
    );
  }

  if (!position) {
    throw new PortalApiError(
      400,
      'Enter the position.'
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

  const status =
    APPLICATION_STATUSES.has(
      req.body?.status
    )
      ? req.body.status
      : 'Submitted';

  const linkSource =
    LINK_SOURCES.has(
      req.body?.linkSource
    )
      ? req.body.linkSource
      : 'Applicant';

  const preferences =
    Array.isArray(
      req.body?.preferences
    )
      ? req.body.preferences
      : [];

  const {
    data: applicationRows,
    error: insertError,
  } = await supabase.rpc(
    'create_applicant_application',
    {
      p_applicant_id:
        applicant.id,
      p_client_id:
        clientId,
      p_created_by:
        profile.id,
      p_company:
        company,
      p_position:
        position,
      p_location:
        String(
          req.body?.location ||
          ''
        ).trim(),
      p_status:
        status,
      p_link_source:
        linkSource,
      p_role:
        String(
          req.body?.role ||
          position
        ).trim(),
      p_preferences:
        preferences,
      p_job_url:
        String(
          req.body?.jobUrl ||
          ''
        ).trim() ||
        null,
      p_resume_name:
        String(
          req.body?.resumeName ||
          ''
        ).trim() ||
        null,
      p_cover_letter_name:
        String(
          req.body?.coverLetterName ||
          ''
        ).trim() ||
        null,
      p_job_details:
        Array.isArray(
          req.body?.jobDetails
        )
          ? req.body.jobDetails
          : [],
      p_qualities:
        Array.isArray(
          req.body?.qualities
        )
          ? req.body.qualities
          : [],
      p_other_details:
        Array.isArray(
          req.body?.otherDetails
        )
          ? req.body.otherDetails
          : [],
    }
  );

  const application =
    Array.isArray(
      applicationRows
    )
      ? applicationRows[0]
      : applicationRows;

  if (
    insertError ||
    !application
  ) {
    const normalizedMessage =
      String(
        insertError?.message ||
        ''
      ).toLowerCase();

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
        'paused or completed'
      )
    ) {
      throw new PortalApiError(
        409,
        'Applications cannot be recorded for a paused or completed Client.'
      );
    }

    if (
      normalizedMessage.includes(
        'application limit'
      )
    ) {
      throw new PortalApiError(
        409,
        'This Client has reached the application limit.'
      );
    }

    if (
      normalizedMessage.includes(
        'applicant account is not active'
      ) ||
      normalizedMessage.includes(
        'applicant identity mismatch'
      )
    ) {
      throw new PortalApiError(
        403,
        'Your Applicant account cannot record Applications.'
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
        'client not found'
      )
    ) {
      throw new PortalApiError(
        404,
        'The Client could not be found.'
      );
    }

    console.error(
      'Unable to create Application:',
      insertError
    );

    throw new PortalApiError(
      500,
      'The Application could not be recorded.'
    );
  }

  const {
    data: clientProfile,
  } = await supabase
    .from('profiles')
    .select('full_name')
    .eq(
      'id',
      application.client_user_id
    )
    .single();

  return res.status(201).json({
    message:
      'Application recorded successfully.',
    application:
      formatApplication(
        application,
        clientProfile?.full_name
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
    ].includes(req.method)
  ) {
    res.setHeader(
      'Allow',
      'GET, POST'
    );

    return res.status(405).json({
      error:
        'Method not allowed.',
    });
  }

  try {
    if (
      req.method === 'POST'
    ) {
      return await createApplication(
        req,
        res
      );
    }

    return await listApplications(
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
        'Applications API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to manage Applications right now.'
            : error.message,
      });
  }
}
