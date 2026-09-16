import { randomBytes } from 'crypto';

import {
  ApiError,
  requireAdmin,
} from '../../../lib/auth/requireAdmin';

function validateRequired(
  value,
  label,
  maxLength
) {
  const normalized =
    String(value || '').trim();

  if (!normalized) {
    throw new ApiError(
      400,
      `${label} is required.`
    );
  }

  if (
    normalized.length >
    maxLength
  ) {
    throw new ApiError(
      400,
      `${label} is too long.`
    );
  }

  return normalized;
}

function validateOptional(
  value,
  label,
  maxLength
) {
  const normalized =
    String(value || '').trim();

  if (
    normalized.length >
    maxLength
  ) {
    throw new ApiError(
      400,
      `${label} is too long.`
    );
  }

  return normalized;
}

function validateEmail(value) {
  const email =
    validateRequired(
      value,
      'Email address',
      320
    ).toLowerCase();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    throw new ApiError(
      400,
      'Enter a valid email address.'
    );
  }

  return email;
}

function generateTemporaryPassword() {
  return `Loop!${randomBytes(10)
    .toString('hex')}A1`;
}

function normalizeAuthError(error) {
  const message =
    String(
      error?.message || ''
    ).toLowerCase();

  if (
    message.includes(
      'already'
    ) ||
    message.includes(
      'registered'
    ) ||
    message.includes(
      'exists'
    )
  ) {
    return new ApiError(
      409,
      'An account already exists for this email address.'
    );
  }

  return new ApiError(
    500,
    'The Chief Applicant account could not be created.'
  );
}

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

async function listChiefApplicants(
  req,
  res
) {
  const { supabase } =
    await requireAdmin(req);

  try {
    const [
      chiefsResult,
      applicantsResult,
      supervisionResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          account_status,
          created_at,
          updated_at
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
        ),

      supabase
        .from('applicants')
        .select(`
          id,
          user_id,
          assigned_team,
          availability,
          active_tasks,
          completed_tasks,
          quality_rating,
          completion_rate,
          created_at,
          updated_at
        `)
        .order(
          'created_at',
          {
            ascending: false,
          }
        ),

      supabase
        .from(
          'chief_applicant_assignments'
        )
        .select(`
          id,
          chief_user_id,
          applicant_id,
          assigned_by,
          is_active,
          assigned_at,
          updated_at
        `)
        .eq(
          'is_active',
          true
        ),
    ]);

    if (chiefsResult.error) {
      console.error(
        'Unable to load Chief Applicants:',
        chiefsResult.error
      );

      throw new ApiError(
        500,
        'The Chief Applicant list could not be loaded.'
      );
    }

    if (applicantsResult.error) {
      console.error(
        'Unable to load Applicants for Chief Applicant management:',
        applicantsResult.error
      );

      throw new ApiError(
        500,
        'The Applicant list could not be loaded.'
      );
    }

    if (supervisionResult.error) {
      console.error(
        'Unable to load Chief Applicant supervision assignments:',
        supervisionResult.error
      );

      throw new ApiError(
        500,
        'Chief Applicant assignments could not be loaded.'
      );
    }

    const chiefs =
      chiefsResult.data || [];

    const applicantRows =
      applicantsResult.data || [];

    const supervisionRows =
      supervisionResult.data || [];

    const chiefIds =
      new Set(
        chiefs.map(
          (chief) =>
            chief.id
        )
      );

    const applicantIds =
      applicantRows.map(
        (applicant) =>
          applicant.id
      );

    const applicantUserIds =
      [
        ...new Set(
          applicantRows
            .map(
              (applicant) =>
                applicant.user_id
            )
            .filter(Boolean)
        ),
      ];

    let applicantProfiles = [];

    if (
      applicantUserIds.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          account_status
        `)
        .in(
          'id',
          applicantUserIds
        );

      if (error) {
        console.error(
          'Unable to load Applicant profiles for Chief Applicant management:',
          error
        );

        throw new ApiError(
          500,
          'Applicant profiles could not be loaded.'
        );
      }

      applicantProfiles =
        data || [];
    }

    let clientApplicantRows = [];

    if (
      applicantIds.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from(
          'client_applicant_assignments'
        )
        .select(`
          id,
          client_id,
          applicant_id,
          created_at
        `)
        .in(
          'applicant_id',
          applicantIds
        );

      if (error) {
        console.error(
          'Unable to load Applicant Client workload:',
          error
        );

        throw new ApiError(
          500,
          'Applicant Client workload could not be loaded.'
        );
      }

      clientApplicantRows =
        data || [];
    }

    const clientIds =
      [
        ...new Set(
          clientApplicantRows
            .map(
              (assignment) =>
                assignment.client_id
            )
            .filter(Boolean)
        ),
      ];

    let clientRows = [];

    if (clientIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from('clients')
        .select(`
          id,
          user_id,
          assigned_team,
          status
        `)
        .in(
          'id',
          clientIds
        );

      if (error) {
        console.error(
          'Unable to load supervised Applicant Clients:',
          error
        );

        throw new ApiError(
          500,
          'Applicant Client information could not be loaded.'
        );
      }

      clientRows =
        data || [];
    }

    const clientUserIds =
      [
        ...new Set(
          clientRows
            .map(
              (client) =>
                client.user_id
            )
            .filter(Boolean)
        ),
      ];

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
          'Unable to load Client profiles for Chief Applicant coverage:',
          error
        );

        throw new ApiError(
          500,
          'Client profile information could not be loaded.'
        );
      }

      clientProfiles =
        data || [];
    }

    let applicationRows = [];

    if (
      applicantUserIds.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from('applications')
        .select(`
          id,
          client_id,
          created_by,
          status,
          applied_at,
          created_at
        `)
        .in(
          'created_by',
          applicantUserIds
        );

      if (error) {
        console.error(
          'Unable to load Applicant application workload:',
          error
        );

        throw new ApiError(
          500,
          'Applicant application workload could not be loaded.'
        );
      }

      applicationRows =
        data || [];
    }

    const applicantProfilesById =
      new Map(
        applicantProfiles.map(
          (profile) => [
            profile.id,
            profile,
          ]
        )
      );

    const clientProfilesById =
      new Map(
        clientProfiles.map(
          (profile) => [
            profile.id,
            profile,
          ]
        )
      );

    const clientsById =
      new Map(
        clientRows.map(
          (client) => [
            client.id,
            client,
          ]
        )
      );

    const supervisionByApplicantId =
      new Map();

    supervisionRows
      .filter(
        (assignment) =>
          chiefIds.has(
            assignment
              .chief_user_id
          )
      )
      .forEach(
        (assignment) => {
          supervisionByApplicantId.set(
            assignment.applicant_id,
            assignment
          );
        }
      );

    const clientIdsByApplicantId =
      new Map();

    clientApplicantRows.forEach(
      (assignment) => {
        const current =
          clientIdsByApplicantId.get(
            assignment.applicant_id
          ) ||
          new Set();

        current.add(
          assignment.client_id
        );

        clientIdsByApplicantId.set(
          assignment.applicant_id,
          current
        );
      }
    );

    const applicationCountByUserId =
      new Map();

    const applicationCountByClientId =
      new Map();

    applicationRows.forEach(
      (application) => {
        if (
          application.created_by
        ) {
          applicationCountByUserId.set(
            application.created_by,
            (
              applicationCountByUserId.get(
                application.created_by
              ) || 0
            ) + 1
          );
        }

        if (
          application.client_id
        ) {
          applicationCountByClientId.set(
            application.client_id,
            (
              applicationCountByClientId.get(
                application.client_id
              ) || 0
            ) + 1
          );
        }
      }
    );

    const formattedApplicants =
      applicantRows.map(
        (applicant) => {
          const profile =
            applicantProfilesById.get(
              applicant.user_id
            );

          const supervision =
            supervisionByApplicantId.get(
              applicant.id
            ) || null;

          const chief =
            supervision
              ? chiefs.find(
                  (record) =>
                    record.id ===
                    supervision
                      .chief_user_id
                )
              : null;

          const assignedClientIds =
            [
              ...(
                clientIdsByApplicantId.get(
                  applicant.id
                ) ||
                new Set()
              ),
            ];

          const assignedClients =
            assignedClientIds
              .map(
                (clientId) => {
                  const client =
                    clientsById.get(
                      clientId
                    );

                  if (!client) {
                    return null;
                  }

                  const clientProfile =
                    clientProfilesById.get(
                      client.user_id
                    );

                  return {
                    id:
                      client.id,
                    fullName:
                      clientProfile
                        ?.full_name ||
                      'Unnamed Client',
                    email:
                      clientProfile
                        ?.email ||
                      '',
                    assignedTeam:
                      client
                        .assigned_team ||
                      '',
                    status:
                      client.status,
                    applicationCount:
                      applicationCountByClientId.get(
                        client.id
                      ) || 0,
                  };
                }
              )
              .filter(Boolean);

          return {
            id:
              applicant.id,
            userId:
              applicant.user_id,
            fullName:
              profile?.full_name ||
              'Unnamed Applicant',
            email:
              profile?.email ||
              '',
            phone:
              profile?.phone ||
              '',
            assignedTeam:
              applicant
                .assigned_team ||
              '',
            availability:
              applicant.availability,
            accountStatus:
              profile
                ?.account_status ||
              'active',
            activeTasks:
              Number(
                applicant
                  .active_tasks ||
                0
              ),
            completedTasks:
              Number(
                applicant
                  .completed_tasks ||
                0
              ),
            qualityRating:
              Number(
                applicant
                  .quality_rating ||
                0
              ),
            completionRate:
              Number(
                applicant
                  .completion_rate ||
                0
              ),
            clientCount:
              assignedClients.length,
            applicationCount:
              applicationCountByUserId.get(
                applicant.user_id
              ) || 0,
            assignedClients,
            assignmentId:
              supervision?.id ||
              null,
            chiefApplicantId:
              supervision
                ?.chief_user_id ||
              null,
            chiefApplicantName:
              chief?.full_name ||
              '',
            assignedAt:
              supervision
                ?.assigned_at ||
              null,
            hasChiefApplicant:
              Boolean(
                supervision
              ),
          };
        }
      );

    const applicantsById =
      new Map(
        formattedApplicants.map(
          (applicant) => [
            applicant.id,
            applicant,
          ]
        )
      );

    const formattedChiefs =
      chiefs.map(
        (chief) => {
          const assignedApplicants =
            supervisionRows
              .filter(
                (assignment) =>
                  assignment
                    .chief_user_id ===
                    chief.id
              )
              .map(
                (assignment) =>
                  applicantsById.get(
                    assignment
                      .applicant_id
                  )
              )
              .filter(Boolean);

          const clientIdsForChief =
            new Set();

          assignedApplicants.forEach(
            (applicant) => {
              (
                applicant
                  .assignedClients ||
                []
              ).forEach(
                (client) =>
                  clientIdsForChief.add(
                    client.id
                  )
              );
            }
          );

          const assignedClients =
            [
              ...clientIdsForChief,
            ]
              .map(
                (clientId) => {
                  const client =
                    clientsById.get(
                      clientId
                    );

                  if (!client) {
                    return null;
                  }

                  const profile =
                    clientProfilesById.get(
                      client.user_id
                    );

                  return {
                    id:
                      client.id,
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
                  };
                }
              )
              .filter(Boolean);

          const applicationCount =
            assignedApplicants.reduce(
              (
                total,
                applicant
              ) =>
                total +
                Number(
                  applicant
                    .applicationCount ||
                  0
                ),
              0
            );

          return {
            id:
              chief.id,
            fullName:
              chief.full_name ||
              'Unnamed Chief Applicant',
            email:
              chief.email ||
              '',
            phone:
              chief.phone ||
              '',
            accountStatus:
              chief
                .account_status,
            applicantCount:
              assignedApplicants.length,
            teamSize:
              assignedApplicants.length,
            clientCount:
              assignedClients.length,
            applicationCount,
            assignedApplicants,
            assignedClients,
            createdAt:
              chief.created_at,
            updatedAt:
              chief.updated_at,
          };
        }
      );

    const assignedApplicantIds =
      new Set(
        formattedApplicants
          .filter(
            (applicant) =>
              applicant
                .hasChiefApplicant
          )
          .map(
            (applicant) =>
              applicant.id
          )
      );

    const coveredClientIds =
      new Set();

    formattedApplicants
      .filter(
        (applicant) =>
          applicant
            .hasChiefApplicant
      )
      .forEach(
        (applicant) => {
          (
            applicant
              .assignedClients ||
            []
          ).forEach(
            (client) =>
              coveredClientIds.add(
                client.id
              )
          );
        }
      );

    const coveredApplications =
      formattedApplicants
        .filter(
          (applicant) =>
            applicant
              .hasChiefApplicant
        )
        .reduce(
          (
            total,
            applicant
          ) =>
            total +
            Number(
              applicant
                .applicationCount ||
              0
            ),
          0
        );

    /*
     * Compatibility Client coverage.
     *
     * A Client is NOT assigned directly to a Chief Applicant.
     * chiefApplicantIds below are derived from the Applicants
     * serving that Client.
     */
    const formattedClients =
      clientRows.map(
        (client) => {
          const profile =
            clientProfilesById.get(
              client.user_id
            );

          const assignedApplicantIdsForClient =
            clientApplicantRows
              .filter(
                (assignment) =>
                  assignment
                    .client_id ===
                  client.id
              )
              .map(
                (assignment) =>
                  assignment
                    .applicant_id
              );

          const derivedChiefIds =
            [
              ...new Set(
                assignedApplicantIdsForClient
                  .map(
                    (applicantId) =>
                      supervisionByApplicantId.get(
                        applicantId
                      )
                      ?.chief_user_id
                  )
                  .filter(Boolean)
              ),
            ];

          return {
            id:
              client.id,
            fullName:
              profile?.full_name ||
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
              assignedApplicantIdsForClient
                .length,
            applicationCount:
              applicationCountByClientId.get(
                client.id
              ) || 0,
            chiefApplicantIds:
              derivedChiefIds,
            hasChiefApplicant:
              derivedChiefIds.length >
              0,
          };
        }
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
        assignedApplicants:
          assignedApplicantIds.size,
        unassignedApplicants:
          formattedApplicants.filter(
            (applicant) =>
              !applicant
                .hasChiefApplicant
          ).length,
        teamApplicants:
          assignedApplicantIds.size,
        coveredClients:
          coveredClientIds.size,
        applications:
          coveredApplications,

        // Temporary compatibility aliases.
        assignedClients:
          coveredClientIds.size,
        unassignedClients:
          0,
      },
      chiefs:
        formattedChiefs,
      applicants:
        formattedApplicants,

      // Derived compatibility data only.
      clients:
        formattedClients,
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : error.httpCode ||
          500;

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

async function createChiefApplicant(
  req,
  res
) {
  const {
    profile: adminProfile,
    supabase,
  } = await requireAdmin(req);

  if (
    adminProfile.role !==
    'admin'
  ) {
    throw new ApiError(
      403,
      'Only Admin can create Chief Applicant accounts.'
    );
  }

  let createdUserId = null;

  try {
    const body =
      req.body || {};

    const fullName =
      validateRequired(
        body.fullName,
        'Chief Applicant name',
        120
      );

    const email =
      validateEmail(
        body.email
      );

    const phone =
      validateOptional(
        body.phone,
        'Phone number',
        30
      );

    const temporaryPassword =
      generateTemporaryPassword();

    const {
      data: authData,
      error: authError,
    } =
      await supabase
        .auth
        .admin
        .createUser({
          email,
          password:
            temporaryPassword,
          email_confirm: true,
          user_metadata: {
            full_name:
              fullName,
            role:
              'chief_applicant',
          },
        });

    if (
      authError ||
      !authData.user
    ) {
      throw normalizeAuthError(
        authError
      );
    }

    createdUserId =
      authData.user.id;

    const {
      error: profileError,
    } = await supabase
      .from('profiles')
      .insert({
        id: createdUserId,
        email,
        full_name:
          fullName,
        phone,
        role:
          'chief_applicant',
        account_status:
          'active',
      });

    if (profileError) {
      console.error(
        'Unable to create Chief Applicant profile:',
        profileError
      );

      if (
        profileError.code ===
        '23505'
      ) {
        throw new ApiError(
          409,
          'A Chief Applicant profile already exists for this email address.'
        );
      }

      throw new ApiError(
        500,
        'The Chief Applicant profile could not be created.'
      );
    }

    return res.status(201).json({
      message:
        'Chief Applicant created successfully.',
      chiefApplicant: {
        id:
          createdUserId,
        fullName,
        email,
        phone,
        accountStatus:
          'active',
        applicantCount: 0,
        teamSize: 0,
        clientCount: 0,
        applicationCount: 0,
        assignedApplicants: [],
        assignedClients: [],
      },
      credentials: {
        email,
        temporaryPassword,
      },
    });
  } catch (error) {
    if (createdUserId) {
      const {
        error:
          deleteUserError,
      } =
        await supabase
          .auth
          .admin
          .deleteUser(
            createdUserId
          );

      if (deleteUserError) {
        console.error(
          'Unable to remove Chief Applicant user during rollback:',
          deleteUserError
        );
      }
    }

    throw error;
  }
}

export default async function handler(
  req,
  res
) {
  if (
    !['GET', 'POST'].includes(
      req.method
    )
  ) {
    res.setHeader(
      'Allow',
      'GET, POST'
    );

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  if (req.method === 'GET') {
    return listChiefApplicants(
      req,
      res
    );
  }

  try {
    return await createChiefApplicant(
      req,
      res
    );
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'POST Chief Applicants API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to create the Chief Applicant right now.'
            : error.message,
      });
  }
}
