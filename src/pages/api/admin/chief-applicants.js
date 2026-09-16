import {
  ApiError,
  requireAdmin,
} from '../../../lib/auth/requireAdmin';

function unique(values) {
  return [
    ...new Set(
      values.filter(Boolean)
    ),
  ];
}

function addToSetMap(
  map,
  key,
  value
) {
  if (!key || !value) {
    return;
  }

  const values =
    map.get(key) ||
    new Set();

  values.add(value);
  map.set(key, values);
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'GET') {
    res.setHeader(
      'Allow',
      ['GET']
    );

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const { supabase } =
      await requireAdmin(req);

    const {
      data: chiefRows,
      error: chiefsError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        account_status
      `)
      .eq(
        'role',
        'chief_applicant'
      )
      .order(
        'full_name',
        {
          ascending: true,
        }
      );

    if (chiefsError) {
      console.error(
        'Unable to load Chief Applicants:',
        chiefsError
      );

      throw new ApiError(
        500,
        'The Chief Applicant list could not be loaded.'
      );
    }

    const {
      data: clientRows,
      error: clientsError,
    } = await supabase
      .from('clients')
      .select(`
        id,
        user_id,
        assigned_team,
        status
      `);

    if (clientsError) {
      console.error(
        'Unable to load Chief Applicant clients:',
        clientsError
      );

      throw new ApiError(
        500,
        'The Chief Applicant client coverage could not be loaded.'
      );
    }

    const {
      data: assignmentRows,
      error: assignmentsError,
    } = await supabase
      .from(
        'client_staff_assignments'
      )
      .select(`
        id,
        client_id,
        staff_user_id,
        is_active,
        created_at
      `)
      .eq(
        'assignment_role',
        'chief_applicant'
      )
      .eq(
        'is_active',
        true
      );

    if (assignmentsError) {
      console.error(
        'Unable to load Chief Applicant assignments:',
        assignmentsError
      );

      throw new ApiError(
        500,
        'The Chief Applicant assignments could not be loaded.'
      );
    }

    const chiefs =
      chiefRows || [];

    const clients =
      clientRows || [];

    const chiefIds =
      new Set(
        chiefs.map(
          (chief) =>
            chief.id
        )
      );

    const clientIds =
      clients.map(
        (client) =>
          client.id
      );

    const clientUserIds =
      unique(
        clients.map(
          (client) =>
            client.user_id
        )
      );

    let clientProfiles = [];

    if (
      clientUserIds.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name
        `)
        .in(
          'id',
          clientUserIds
        );

      if (error) {
        console.error(
          'Unable to load Chief Applicant client profiles:',
          error
        );

        throw new ApiError(
          500,
          'The Chief Applicant client profiles could not be loaded.'
        );
      }

      clientProfiles =
        data || [];
    }

    let applicantAssignments = [];

    if (clientIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from(
          'client_applicant_assignments'
        )
        .select(`
          client_id,
          applicant_id
        `)
        .in(
          'client_id',
          clientIds
        );

      if (error) {
        console.error(
          'Unable to load Applicant coverage for Chief Applicants:',
          error
        );

        throw new ApiError(
          500,
          'The Chief Applicant team coverage could not be loaded.'
        );
      }

      applicantAssignments =
        data || [];
    }

    let applications = [];

    if (clientIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from('applications')
        .select(`
          id,
          client_id
        `)
        .in(
          'client_id',
          clientIds
        );

      if (error) {
        console.error(
          'Unable to load applications for Chief Applicant coverage:',
          error
        );

        throw new ApiError(
          500,
          'The Chief Applicant application coverage could not be loaded.'
        );
      }

      applications =
        data || [];
    }

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

    applicantAssignments.forEach(
      (assignment) => {
        addToSetMap(
          applicantIdsByClientId,
          assignment.client_id,
          assignment.applicant_id
        );
      }
    );

    const applicationCountByClientId =
      new Map();

    applications.forEach(
      (application) => {
        applicationCountByClientId.set(
          application.client_id,
          (
            applicationCountByClientId.get(
              application.client_id
            ) || 0
          ) + 1
        );
      }
    );

    const validAssignments =
      (assignmentRows || [])
        .filter(
          (assignment) =>
            chiefIds.has(
              assignment
                .staff_user_id
            )
        );

    const chiefIdsByClientId =
      new Map();

    validAssignments.forEach(
      (assignment) => {
        addToSetMap(
          chiefIdsByClientId,
          assignment.client_id,
          assignment.staff_user_id
        );
      }
    );

    const formattedClients =
      clients.map(
        (client) => {
          const profile =
            clientProfilesById.get(
              client.user_id
            );

          const assignedChiefIds =
            [
              ...(
                chiefIdsByClientId.get(
                  client.id
                ) ||
                new Set()
              ),
            ];

          return {
            id: client.id,
            fullName:
              profile
                ?.full_name ||
              'Unnamed Client',
            email:
              profile?.email ||
              '',
            assignedTeam:
              client
                .assigned_team ||
              '',
            status:
              client.status,
            applicantCount:
              applicantIdsByClientId.get(
                client.id
              )?.size || 0,
            applicationCount:
              applicationCountByClientId.get(
                client.id
              ) || 0,
            chiefApplicantIds:
              assignedChiefIds,
            hasChiefApplicant:
              assignedChiefIds.length >
              0,
          };
        }
      );

    const clientsById =
      new Map(
        formattedClients.map(
          (client) => [
            client.id,
            client,
          ]
        )
      );

    const formattedChiefs =
      chiefs.map(
        (chief) => {
          const assignedClientIds =
            unique(
              validAssignments
                .filter(
                  (assignment) =>
                    assignment
                      .staff_user_id ===
                    chief.id
                )
                .map(
                  (assignment) =>
                    assignment
                      .client_id
                )
            );

          const assignedClients =
            assignedClientIds
              .map(
                (clientId) =>
                  clientsById.get(
                    clientId
                  )
              )
              .filter(Boolean);

          const teamApplicantIds =
            new Set();

          assignedClientIds.forEach(
            (clientId) => {
              const applicantIds =
                applicantIdsByClientId.get(
                  clientId
                );

              applicantIds
                ?.forEach(
                  (applicantId) =>
                    teamApplicantIds.add(
                      applicantId
                    )
                );
            }
          );

          const applicationCount =
            assignedClientIds.reduce(
              (
                total,
                clientId
              ) =>
                total +
                (
                  applicationCountByClientId.get(
                    clientId
                  ) || 0
                ),
              0
            );

          return {
            id: chief.id,
            fullName:
              chief.full_name ||
              'Unnamed Chief Applicant',
            email:
              chief.email || '',
            phone:
              chief.phone || '',
            accountStatus:
              chief
                .account_status,
            clientCount:
              assignedClients.length,
            teamSize:
              teamApplicantIds.size,
            applicationCount,
            assignedClients,
          };
        }
      );

    const coveredClientIds =
      new Set(
        validAssignments.map(
          (assignment) =>
            assignment.client_id
        )
      );

    const coveredApplicantIds =
      new Set();

    coveredClientIds.forEach(
      (clientId) => {
        applicantIdsByClientId
          .get(clientId)
          ?.forEach(
            (applicantId) =>
              coveredApplicantIds.add(
                applicantId
              )
          );
      }
    );

    const coveredApplications =
      [
        ...coveredClientIds,
      ].reduce(
        (
          total,
          clientId
        ) =>
          total +
          (
            applicationCountByClientId.get(
              clientId
            ) || 0
          ),
        0
      );

    res.setHeader(
      'Cache-Control',
      'no-store'
    );

    return res.status(200).json({
      summary: {
        totalChiefs:
          formattedChiefs.length,
        activeChiefs:
          formattedChiefs.filter(
            (chief) =>
              chief.accountStatus ===
              'active'
          ).length,
        assignedClients:
          coveredClientIds.size,
        unassignedClients:
          formattedClients.filter(
            (client) =>
              !client
                .hasChiefApplicant
          ).length,
        teamApplicants:
          coveredApplicantIds.size,
        applications:
          coveredApplications,
      },
      chiefs: formattedChiefs,
      clients: formattedClients,
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : error.httpCode || 500;

    if (statusCode >= 500) {
      console.error(
        'Chief Applicants management API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to load Chief Applicant management right now.'
            : error.message,
      });
  }
}
