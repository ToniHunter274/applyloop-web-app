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
      summary: {
        assignedApplicants: 0,
        assignedClients: 0,
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

  res.setHeader(
    'Cache-Control',
    'no-store'
  );

  return res.status(200).json({
    applicants: applicantResults,
    clients: clientResults,
    summary: {
      assignedApplicants:
        applicantResults.length,
      assignedClients:
        clientResults.length,
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
