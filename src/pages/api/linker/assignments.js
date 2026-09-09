import { ApiError } from '../../../lib/auth/requireAdmin';
import { requireLinker } from '../../../lib/auth/requireLinker';

function unique(values) {
  return [
    ...new Set(
      values.filter(Boolean)
    ),
  ];
}

async function getAssignments(req, res) {
  const {
    profile: linkerProfile,
    supabase,
  } = await requireLinker(req);

  const {
    data: assignmentRows,
    error: assignmentsError,
  } = await supabase
    .from(
      'linker_applicant_assignments'
    )
    .select(
      'id, applicant_id, assigned_at'
    )
    .eq(
      'linker_user_id',
      linkerProfile.id
    )
    .eq('is_active', true)
    .order('assigned_at', {
      ascending: false,
    });

  if (assignmentsError) {
    console.error(
      'Unable to load Linker assignments:',
      assignmentsError
    );

    throw new ApiError(
      500,
      'Your Linker assignments could not be loaded.'
    );
  }

  const assignments =
    assignmentRows || [];

  const {
    data: linkerRequestRows,
    error: linkerRequestsError,
  } = await supabase
    .from('client_job_requests')
    .select(
      'client_id, status, created_at'
    )
    .eq(
      'submitted_by',
      linkerProfile.id
    )
    .eq('request_source', 'linker');

  if (linkerRequestsError) {
    console.error(
      'Unable to load Linker request metrics:',
      linkerRequestsError
    );

    throw new ApiError(
      500,
      'Your Linker activity could not be loaded.'
    );
  }

  const linkerRequests =
    linkerRequestRows || [];

  const todayStart =
    new Date();

  todayStart.setUTCHours(
    0,
    0,
    0,
    0
  );

  const linksFoundToday =
    linkerRequests.filter(
      (request) =>
        new Date(
          request.created_at
        ).getTime() >=
        todayStart.getTime()
    ).length;

  const pendingReview =
    linkerRequests.filter(
      (request) =>
        ['new', 'in_review'].includes(
          request.status
        )
    ).length;

  const applicantIds =
    unique(
      assignments.map(
        (assignment) =>
          assignment.applicant_id
      )
    );

  if (applicantIds.length === 0) {
    res.setHeader(
      'Cache-Control',
      'no-store'
    );

    return res.status(200).json({
      applicants: [],
      clients: [],
      applications: [],
      summary: {
        assignedApplicants: 0,
        assignedClients: 0,
        linksFoundToday,
        activeClients: 0,
        linksSourced:
          linkerRequests.length,
        pendingReview,
      },
    });
  }

  const {
    data: applicantRows,
    error: applicantsError,
  } = await supabase
    .from('applicants')
    .select(
      [
        'id',
        'user_id',
        'work_email',
        'assigned_team',
        'availability',
        'active_tasks',
        'completed_tasks',
        'quality_rating',
        'completion_rate',
      ].join(', ')
    )
    .in('id', applicantIds);

  if (applicantsError) {
    console.error(
      'Unable to load assigned Applicants:',
      applicantsError
    );

    throw new ApiError(
      500,
      'Your assigned Applicants could not be loaded.'
    );
  }

  const applicants =
    applicantRows || [];

  const applicantUserIds =
    unique(
      applicants.map(
        (applicant) =>
          applicant.user_id
      )
    );

  let applicantProfiles = [];

  if (applicantUserIds.length > 0) {
    const {
      data: profileRows,
      error: profilesError,
    } = await supabase
      .from('profiles')
      .select(
        'id, email, full_name, account_status'
      )
      .in('id', applicantUserIds);

    if (profilesError) {
      console.error(
        'Unable to load assigned Applicant profiles:',
        profilesError
      );

      throw new ApiError(
        500,
        'Your assigned Applicant profiles could not be loaded.'
      );
    }

    applicantProfiles =
      profileRows || [];
  }

  const {
    data: clientAssignmentRows,
    error: clientAssignmentsError,
  } = await supabase
    .from(
      'client_applicant_assignments'
    )
    .select(
      'client_id, applicant_id, created_at'
    )
    .in('applicant_id', applicantIds);

  if (clientAssignmentsError) {
    console.error(
      'Unable to load Applicant client assignments:',
      clientAssignmentsError
    );

    throw new ApiError(
      500,
      'Assigned client relationships could not be loaded.'
    );
  }

  const clientAssignments =
    clientAssignmentRows || [];

  const clientIds =
    unique(
      clientAssignments.map(
        (assignment) =>
          assignment.client_id
      )
    );

  let clientRows = [];

  if (clientIds.length > 0) {
    const {
      data: clients,
      error: clientsError,
    } = await supabase
      .from('clients')
      .select(
        [
          'id',
          'user_id',
          'plan',
          'application_limit',
          'applications_completed',
          'state_province',
          'status',
        ].join(', ')
      )
      .in('id', clientIds);

    if (clientsError) {
      console.error(
        'Unable to load assigned Clients:',
        clientsError
      );

      throw new ApiError(
        500,
        'Your assigned Clients could not be loaded.'
      );
    }

    clientRows =
      clients || [];
  }

  const clientUserIds =
    unique(
      clientRows.map(
        (client) =>
          client.user_id
      )
    );

  let clientProfiles = [];

  if (clientUserIds.length > 0) {
    const {
      data: profileRows,
      error: profilesError,
    } = await supabase
      .from('profiles')
      .select(
        [
          'id',
          'email',
          'full_name',
          'country',
          'account_status',
        ].join(', ')
      )
      .in('id', clientUserIds);

    if (profilesError) {
      console.error(
        'Unable to load assigned Client profiles:',
        profilesError
      );

      throw new ApiError(
        500,
        'Your assigned Client profiles could not be loaded.'
      );
    }

    clientProfiles =
      profileRows || [];
  }

  let applicationRows = [];

  if (clientIds.length > 0) {
    const {
      data: applications,
      error: applicationsError,
    } = await supabase
      .from('applications')
      .select(
        [
          'id',
          'client_id',
          'company',
          'position',
          'status',
          'link_source',
          'applied_at',
          'job_url',
        ].join(', ')
      )
      .in('client_id', clientIds)
      .in(
        'created_by',
        applicantUserIds
      )
      .order('applied_at', {
        ascending: false,
      })
      .limit(100);

    if (applicationsError) {
      console.error(
        'Unable to load assigned Client applications:',
        applicationsError
      );

      throw new ApiError(
        500,
        'Assigned Client applications could not be loaded.'
      );
    }

    applicationRows =
      applications || [];
  }

  const assignmentsByApplicantId =
    new Map(
      assignments.map(
        (assignment) => [
          assignment.applicant_id,
          assignment,
        ]
      )
    );

  const applicantProfilesById =
    new Map(
      applicantProfiles.map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    );

  const applicantsById =
    new Map(
      applicants.map(
        (applicant) => [
          applicant.id,
          applicant,
        ]
      )
    );

  const applicantResults =
    applicantIds
      .map((applicantId) => {
        const applicant =
          applicantsById.get(
            applicantId
          );

        if (!applicant) {
          return null;
        }

        const profile =
          applicantProfilesById.get(
            applicant.user_id
          );

        const assignment =
          assignmentsByApplicantId.get(
            applicant.id
          );

        return {
          id: applicant.id,
          userId: applicant.user_id,
          assignmentId:
            assignment?.id || '',
          assignedAt:
            assignment?.assigned_at ||
            null,
          fullName:
            profile?.full_name ||
            'Unnamed Applicant',
          email:
            profile?.email ||
            applicant.work_email ||
            '',
          workEmail:
            applicant.work_email || '',
          team:
            applicant.assigned_team || '',
          availability:
            applicant.availability,
          accountStatus:
            profile?.account_status ||
            'unknown',
          activeTasks:
            Number(
              applicant.active_tasks || 0
            ),
          completedTasks:
            Number(
              applicant.completed_tasks ||
                0
            ),
          qualityRating:
            Number(
              applicant.quality_rating ||
                0
            ),
          completionRate:
            Number(
              applicant.completion_rate ||
                0
            ),
          canReceiveLinks:
            applicant.availability ===
              'available' &&
            profile?.account_status ===
              'active',
        };
      })
      .filter(Boolean);

  const clientProfilesById =
    new Map(
      clientProfiles.map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    );

  const applicantIdsByClientId =
    new Map();

  clientAssignments.forEach(
    (assignment) => {
      const current =
        applicantIdsByClientId.get(
          assignment.client_id
        ) || [];

      current.push(
        assignment.applicant_id
      );

      applicantIdsByClientId.set(
        assignment.client_id,
        unique(current)
      );
    }
  );

  const requestsByClientId =
    new Map();

  linkerRequests.forEach(
    (request) => {
      const current =
        requestsByClientId.get(
          request.client_id
        ) || [];

      current.push(request);

      requestsByClientId.set(
        request.client_id,
        current
      );
    }
  );

  const applicationsByClientId =
    new Map();

  applicationRows.forEach(
    (application) => {
      const current =
        applicationsByClientId.get(
          application.client_id
        ) || [];

      current.push(application);

      applicationsByClientId.set(
        application.client_id,
        current
      );
    }
  );

  const clientResults =
    clientRows.map((client) => {
      const profile =
        clientProfilesById.get(
          client.user_id
        );

      const assignedApplicantIds =
        applicantIdsByClientId.get(
          client.id
        ) || [];

      const clientRequests =
        requestsByClientId.get(
          client.id
        ) || [];

      const clientApplications =
        applicationsByClientId.get(
          client.id
        ) || [];

      const countStatus =
        (status) =>
          clientApplications.filter(
            (application) =>
              application.status ===
              status
          ).length;

      const latestActivity =
        [
          ...clientRequests.map(
            (request) =>
              request.created_at
          ),
          ...clientApplications.map(
            (application) =>
              application.applied_at
          ),
        ]
          .filter(Boolean)
          .sort()
          .reverse()[0] || null;

      return {
        id: client.id,
        userId: client.user_id,
        fullName:
          profile?.full_name ||
          'Unnamed Client',
        email:
          profile?.email || '',
        country:
          profile?.country ||
          'Not provided',
        state:
          client.state_province || '',
        plan: client.plan,
        status: client.status,
        accountStatus:
          profile?.account_status ||
          'unknown',
        applicationLimit:
          Number(
            client.application_limit || 0
          ),
        applicationsCompleted:
          Number(
            client.applications_completed ||
              0
          ),
        linksSourced:
          clientRequests.length,
        completedLinks:
          clientRequests.filter(
            (request) =>
              request.status ===
              'converted'
          ).length,
        upcomingInterviews:
          countStatus(
            'Interview Scheduled'
          ),
        offersReceived:
          countStatus(
            'Offer Received'
          ),
        rejectedApplications:
          countStatus('Rejected'),
        lastActivity:
          latestActivity,
        applicantIds:
          assignedApplicantIds,
        canReceiveLinks:
          client.status === 'active' &&
          profile?.account_status ===
            'active' &&
          assignedApplicantIds.some(
            (applicantId) =>
              applicantResults.some(
                (applicant) =>
                  applicant.id ===
                    applicantId &&
                  applicant.canReceiveLinks
              )
          ),
      };
    });

  const clientNamesById =
    new Map(
      clientResults.map(
        (client) => [
          client.id,
          client.fullName,
        ]
      )
    );

  const applicationResults =
    applicationRows.map(
      (application) => ({
        id: application.id,
        clientId:
          application.client_id,
        clientName:
          clientNamesById.get(
            application.client_id
          ) || 'Unnamed Client',
        company:
          application.company,
        position:
          application.position,
        status:
          application.status,
        linkSource:
          application.link_source,
        appliedAt:
          application.applied_at,
        jobLink:
          application.job_url || '',
      })
    );

  const activeClients =
    clientResults.filter(
      (client) =>
        client.status === 'active' &&
        client.accountStatus ===
          'active'
    ).length;

  res.setHeader(
    'Cache-Control',
    'no-store'
  );

  return res.status(200).json({
    applicants: applicantResults,
    clients: clientResults,
    applications:
      applicationResults,
    summary: {
      assignedApplicants:
        applicantResults.length,
      assignedClients:
        clientResults.length,
      linksFoundToday,
      activeClients,
      linksSourced:
        linkerRequests.length,
      pendingReview,
    },
  });
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    return await getAssignments(
      req,
      res
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({
          error: error.message,
        });
    }

    console.error(
      'Unexpected Linker assignments error:',
      error
    );

    return res.status(500).json({
      error:
        'The Linker workspace could not be loaded.',
    });
  }
}
