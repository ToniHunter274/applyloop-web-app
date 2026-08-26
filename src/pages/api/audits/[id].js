import {
  PortalApiError,
  requirePortalProfile,
} from '../../../lib/auth/requirePortalProfile';

const AUDIT_ROLES = new Set([
  'team_auditor',
  'chief_auditor',
  'owner',
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getDisplayId(id) {
  return `AUD-${String(id)
    .slice(0, 8)
    .toUpperCase()}`;
}

async function getAuditDetail(
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
    !AUDIT_ROLES.has(
      profile.role
    )
  ) {
    throw new PortalApiError(
      403,
      'You do not have access to audits.'
    );
  }

  const id =
    Array.isArray(req.query.id)
      ? req.query.id[0]
      : req.query.id;

  if (
    !id ||
    !UUID_PATTERN.test(id)
  ) {
    throw new PortalApiError(
      400,
      'A valid audit ID is required.'
    );
  }

  const {
    data: audit,
    error: auditError,
  } = await supabase
    .from('application_audits')
    .select(`
      id,
      application_id,
      auditor_user_id,
      status,
      priority,
      source,
      quality_score,
      comments,
      started_at,
      completed_at,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .maybeSingle();

  if (auditError) {
    throw new PortalApiError(
      500,
      'The audit could not be loaded.'
    );
  }

  if (!audit) {
    throw new PortalApiError(
      404,
      'The audit could not be found.'
    );
  }

  if (
    profile.role ===
      'team_auditor' &&
    audit.auditor_user_id !==
      profile.id
  ) {
    throw new PortalApiError(
      403,
      'This audit is assigned to another auditor.'
    );
  }

  const {
    data: application,
    error: applicationError,
  } = await supabase
    .from('applications')
    .select(`
      id,
      client_id,
      created_by,
      company,
      position,
      location,
      status,
      role,
      applied_at,
      preferences,
      job_url,
      resume_name,
      resume_path,
      cover_letter_name,
      cover_letter_path,
      feedback,
      job_details,
      qualities,
      other_details,
      created_at,
      updated_at
    `)
    .eq(
      'id',
      audit.application_id
    )
    .maybeSingle();

  if (applicationError) {
    throw new PortalApiError(
      500,
      'The application for this audit could not be loaded.'
    );
  }

  if (!application) {
    throw new PortalApiError(
      404,
      'The application for this audit could not be found.'
    );
  }

  const {
    data: client,
    error: clientError,
  } = await supabase
    .from('clients')
    .select(`
      id,
      user_id,
      plan,
      priority,
      status
    `)
    .eq(
      'id',
      application.client_id
    )
    .maybeSingle();

  if (clientError) {
    throw new PortalApiError(
      500,
      'The client for this audit could not be loaded.'
    );
  }

  let chiefAssignment = null;

  if (client) {
    const {
      data,
      error,
    } = await supabase
      .from(
        'client_staff_assignments'
      )
      .select(`
        staff_user_id,
        assignment_role
      `)
      .eq(
        'client_id',
        client.id
      )
      .eq(
        'assignment_role',
        'chief_applicant'
      )
      .eq(
        'is_active',
        true
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new PortalApiError(
        500,
        'The application team could not be loaded.'
      );
    }

    chiefAssignment = data;
  }

  const profileIds = [
    audit.auditor_user_id,
    application.created_by,
    client?.user_id,
    chiefAssignment
      ?.staff_user_id,
  ].filter(Boolean);

  const uniqueProfileIds = [
    ...new Set(profileIds),
  ];

  let profileRows = [];

  if (uniqueProfileIds.length) {
    const {
      data,
      error,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role
      `)
      .in(
        'id',
        uniqueProfileIds
      );

    if (error) {
      throw new PortalApiError(
        500,
        'The people for this audit could not be loaded.'
      );
    }

    profileRows = data || [];
  }

  const profilesById =
    new Map(
      profileRows.map(
        (item) => [
          item.id,
          item,
        ]
      )
    );

  const auditor =
    profilesById.get(
      audit.auditor_user_id
    );

  const applicant =
    application.created_by
      ? profilesById.get(
          application.created_by
        )
      : null;

  const clientProfile =
    client?.user_id
      ? profilesById.get(
          client.user_id
        )
      : null;

  const chiefApplicant =
    chiefAssignment
      ?.staff_user_id
      ? profilesById.get(
          chiefAssignment
            .staff_user_id
        )
      : null;

  return res.status(200).json({
    audit: {
      id: audit.id,
      displayId:
        getDisplayId(
          audit.id
        ),
      status: audit.status,
      priority:
        audit.priority,
      source: audit.source,
      qualityScore:
        audit.quality_score,
      comments:
        audit.comments,
      startedAt:
        audit.started_at,
      completedAt:
        audit.completed_at,
      createdAt:
        audit.created_at,
      updatedAt:
        audit.updated_at,
      auditor: {
        id:
          auditor?.id ||
          audit.auditor_user_id,
        name:
          auditor
            ?.full_name ||
          'Auditor',
      },
      application: {
        id:
          application.id,
        company:
          application.company,
        position:
          application.position,
        location:
          application.location,
        status:
          application.status,
        role:
          application.role,
        appliedAt:
          application.applied_at,
        jobUrl:
          application.job_url,
        preferences:
          application.preferences ||
          [],
        jobDetails:
          application.job_details ||
          [],
        qualities:
          application.qualities ||
          [],
        otherDetails:
          application.other_details ||
          [],
        feedback:
          application.feedback,
        createdAt:
          application.created_at,
        updatedAt:
          application.updated_at,
        resume: {
          name:
            application.resume_name,
          path:
            application.resume_path,
        },
        coverLetter: {
          name:
            application
              .cover_letter_name,
          path:
            application
              .cover_letter_path,
        },
        client: client
          ? {
              id: client.id,
              name:
                clientProfile
                  ?.full_name ||
                'Client',
              plan:
                client.plan,
              priority:
                client.priority,
              status:
                client.status,
            }
          : null,
        applicant: applicant
          ? {
              id:
                applicant.id,
              name:
                applicant
                  .full_name ||
                'Applicant',
              role:
                applicant.role,
            }
          : null,
        chiefApplicant:
          chiefApplicant
            ? {
                id:
                  chiefApplicant.id,
                name:
                  chiefApplicant
                    .full_name,
                role:
                  chiefApplicant.role,
              }
            : null,
      },
    },
  });
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'GET') {
    res.setHeader(
      'Allow',
      'GET'
    );

    return res.status(405).json({
      error:
        'Method not allowed.',
    });
  }

  try {
    return await getAuditDetail(
      req,
      res
    );
  } catch (error) {
    const statusCode =
      error instanceof
      PortalApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Audit detail API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to load the audit right now.'
            : error.message,
      });
  }
}
