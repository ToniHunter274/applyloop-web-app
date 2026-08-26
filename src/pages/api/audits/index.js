import {
  PortalApiError,
  requirePortalProfile,
} from '../../../lib/auth/requirePortalProfile';

const AUDIT_ROLES = new Set([
  'team_auditor',
  'chief_auditor',
  'owner',
]);

function getDisplayId(id) {
  return `AUD-${String(id)
    .slice(0, 8)
    .toUpperCase()}`;
}

function formatAudit({
  audit,
  application,
  client,
  clientProfile,
  auditor,
  creator,
}) {
  return {
    id: audit.id,
    displayId: getDisplayId(
      audit.id
    ),
    status: audit.status,
    priority: audit.priority,
    source: audit.source,
    qualityScore:
      audit.quality_score,
    comments: audit.comments,
    startedAt: audit.started_at,
    completedAt:
      audit.completed_at,
    createdAt: audit.created_at,
    updatedAt: audit.updated_at,
    auditor: {
      id:
        auditor?.id ||
        audit.auditor_user_id,
      name:
        auditor?.full_name ||
        'Auditor',
    },
    application: {
      id:
        application?.id ||
        audit.application_id,
      company:
        application?.company ||
        '',
      position:
        application?.position ||
        '',
      location:
        application?.location ||
        '',
      status:
        application?.status ||
        '',
      client: {
        id:
          client?.id ||
          application?.client_id ||
          null,
        name:
          clientProfile?.full_name ||
          'Client',
        plan:
          client?.plan ||
          '',
        priority:
          client?.priority ||
          '',
      },
      createdBy: creator
        ? {
            id: creator.id,
            name:
              creator.full_name ||
              'Applicant',
            role:
              creator.role,
          }
        : null,
    },
  };
}

async function getAudits(
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

  let query = supabase
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
    .in(
      'status',
      [
        'pending',
        'in_review',
      ]
    )
    .order(
      'created_at',
      {
        ascending: false,
      }
    );

  if (
    profile.role ===
    'team_auditor'
  ) {
    query = query.eq(
      'auditor_user_id',
      profile.id
    );
  }

  const {
    data: auditRows,
    error: auditsError,
  } = await query;

  if (auditsError) {
    throw new PortalApiError(
      500,
      'The audit queue could not be loaded.'
    );
  }

  if (
    !auditRows?.length
  ) {
    return res.status(200).json({
      audits: [],
    });
  }

  const applicationIds = [
    ...new Set(
      auditRows.map(
        (audit) =>
          audit.application_id
      )
    ),
  ];

  const {
    data: applicationRows,
    error: applicationsError,
  } = await supabase
    .from('applications')
    .select(`
      id,
      client_id,
      created_by,
      company,
      position,
      location,
      status
    `)
    .in(
      'id',
      applicationIds
    );

  if (applicationsError) {
    throw new PortalApiError(
      500,
      'The applications for this audit queue could not be loaded.'
    );
  }

  const applicationsById =
    new Map(
      (applicationRows || []).map(
        (application) => [
          application.id,
          application,
        ]
      )
    );

  const clientIds = [
    ...new Set(
      (applicationRows || [])
        .map(
          (application) =>
            application.client_id
        )
        .filter(Boolean)
    ),
  ];

  let clientRows = [];

  if (clientIds.length) {
    const {
      data,
      error,
    } = await supabase
      .from('clients')
      .select(`
        id,
        user_id,
        plan,
        priority
      `)
      .in(
        'id',
        clientIds
      );

    if (error) {
      throw new PortalApiError(
        500,
        'The clients for this audit queue could not be loaded.'
      );
    }

    clientRows = data || [];
  }

  const clientsById =
    new Map(
      clientRows.map(
        (client) => [
          client.id,
          client,
        ]
      )
    );

  const profileIds = [
    ...new Set(
      [
        ...auditRows.map(
          (audit) =>
            audit.auditor_user_id
        ),
        ...(applicationRows || [])
          .map(
            (application) =>
              application.created_by
          ),
        ...clientRows.map(
          (client) =>
            client.user_id
        ),
      ].filter(Boolean)
    ),
  ];

  let profileRows = [];

  if (profileIds.length) {
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
        profileIds
      );

    if (error) {
      throw new PortalApiError(
        500,
        'The people for this audit queue could not be loaded.'
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

  const audits =
    auditRows.map(
      (audit) => {
        const application =
          applicationsById.get(
            audit.application_id
          );

        const client =
          application
            ? clientsById.get(
                application.client_id
              )
            : null;

        return formatAudit({
          audit,
          application,
          client,
          clientProfile:
            client
              ? profilesById.get(
                  client.user_id
                )
              : null,
          auditor:
            profilesById.get(
              audit.auditor_user_id
            ),
          creator:
            application?.created_by
              ? profilesById.get(
                  application.created_by
                )
              : null,
        });
      }
    );

  return res.status(200).json({
    audits,
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
    return await getAudits(
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
        'Audit queue API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to load the audit queue right now.'
            : error.message,
      });
  }
}
