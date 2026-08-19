import {
  ApiError,
  requireAdmin,
} from '../../../../lib/auth/requireAdmin';
import {
  generateTemporaryPassword,
} from '../../../../lib/auth/generateTemporaryPassword';

const ALLOWED_AVAILABILITY = new Set([
  'available',
  'inactive',
]);

function validateRequired(
  value,
  label,
  maximumLength
) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    throw new ApiError(
      400,
      `${label} is required.`
    );
  }

  if (normalized.length > maximumLength) {
    throw new ApiError(
      400,
      `${label} must not exceed ${maximumLength} characters.`
    );
  }

  return normalized;
}

function validateOptional(
  value,
  label,
  maximumLength
) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length > maximumLength) {
    throw new ApiError(
      400,
      `${label} must not exceed ${maximumLength} characters.`
    );
  }

  return normalized;
}

function validateEmail(value, label = 'Email address') {
  const email = validateRequired(
    value,
    label,
    254
  ).toLowerCase();

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    throw new ApiError(
      400,
      `Enter a valid ${label.toLowerCase()}.`
    );
  }

  return email;
}

function validateActiveTasks(value) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    throw new ApiError(
      400,
      'Active Tasks is required.'
    );
  }

  const activeTasks = Number(normalized);

  if (
    !Number.isInteger(activeTasks) ||
    activeTasks < 0
  ) {
    throw new ApiError(
      400,
      'Active Tasks must be a whole number of 0 or more.'
    );
  }

  return activeTasks;
}

function normalizeAuthError(error) {
  const message =
    error?.message?.toLowerCase() || '';

  if (
    message.includes('already registered') ||
    message.includes(
      'already been registered'
    ) ||
    message.includes('already exists')
  ) {
    return new ApiError(
      409,
      'An account already exists for this email address.'
    );
  }

  return new ApiError(
    500,
    'The applicant login account could not be created.'
  );
}

async function listApplicants(req, res) {
  const { supabase } = await requireAdmin(req);

  const {
    data: applicantRows,
    error: applicantsError,
  } = await supabase
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
    .order('created_at', {
      ascending: false,
    });

  if (applicantsError) {
    console.error(
      'Unable to load applicants:',
      applicantsError
    );

    throw new ApiError(
      500,
      'The applicant list could not be loaded.'
    );
  }

  const {
    data: performanceRows,
    error: performanceError,
  } = await supabase.rpc(
    'get_applicant_performance'
  );

  if (performanceError) {
    console.error(
      'Unable to load Applicant performance:',
      performanceError
    );

    throw new ApiError(
      500,
      'Applicant performance could not be loaded.'
    );
  }

  const performanceByApplicantId =
    new Map(
      (performanceRows || []).map(
        (performance) => [
          performance.applicant_id,
          performance,
        ]
      )
    );

  const userIds = [
    ...new Set(
      (applicantRows || []).map(
        (applicant) => applicant.user_id
      )
    ),
  ];

  let profiles = [];

  if (userIds.length > 0) {
    const {
      data: profileRows,
      error: profilesError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        account_status
      `)
      .in('id', userIds);

    if (profilesError) {
      console.error(
        'Unable to load applicant profiles:',
        profilesError
      );

      throw new ApiError(
        500,
        'The applicant profiles could not be loaded.'
      );
    }

    profiles = profileRows || [];
  }

  const profilesById = new Map(
    profiles.map((profile) => [
      profile.id,
      profile,
    ])
  );

  const applicantIds = (
    applicantRows || []
  ).map((applicant) => applicant.id);

  let assignmentRows = [];

  if (applicantIds.length > 0) {
    const {
      data: assignments,
      error: assignmentsError,
    } = await supabase
      .from(
        'client_applicant_assignments'
      )
      .select(`
        client_id,
        applicant_id
      `)
      .in(
        'applicant_id',
        applicantIds
      );

    if (assignmentsError) {
      console.error(
        'Unable to load applicant client assignments:',
        assignmentsError
      );

      throw new ApiError(
        500,
        'The applicant assignments could not be loaded.'
      );
    }

    assignmentRows =
      assignments || [];
  }

  const assignedClientIds = [
    ...new Set(
      assignmentRows.map(
        (assignment) =>
          assignment.client_id
      )
    ),
  ];

  let assignedClientRows = [];

  if (assignedClientIds.length > 0) {
    const {
      data: clients,
      error: clientsError,
    } = await supabase
      .from('clients')
      .select(`
        id,
        user_id,
        plan,
        status
      `)
      .in('id', assignedClientIds);

    if (clientsError) {
      console.error(
        'Unable to load assigned clients:',
        clientsError
      );

      throw new ApiError(
        500,
        'The assigned clients could not be loaded.'
      );
    }

    assignedClientRows =
      clients || [];
  }

  const assignedClientUserIds = [
    ...new Set(
      assignedClientRows.map(
        (client) => client.user_id
      )
    ),
  ];

  let assignedClientProfiles = [];

  if (
    assignedClientUserIds.length > 0
  ) {
    const {
      data: clientProfiles,
      error: clientProfilesError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name
      `)
      .in(
        'id',
        assignedClientUserIds
      );

    if (clientProfilesError) {
      console.error(
        'Unable to load assigned client profiles:',
        clientProfilesError
      );

      throw new ApiError(
        500,
        'The assigned client profiles could not be loaded.'
      );
    }

    assignedClientProfiles =
      clientProfiles || [];
  }

  const assignedClientRowsById =
    new Map(
      assignedClientRows.map(
        (client) => [
          client.id,
          client,
        ]
      )
    );

  const assignedClientProfilesById =
    new Map(
      assignedClientProfiles.map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    );

  const assignedClientsByApplicantId =
    new Map();

  assignmentRows.forEach(
    (assignment) => {
      const client =
        assignedClientRowsById.get(
          assignment.client_id
        );

      if (!client) {
        return;
      }

      const profile =
        assignedClientProfilesById.get(
          client.user_id
        );

      const currentClients =
        assignedClientsByApplicantId.get(
          assignment.applicant_id
        ) || [];

      currentClients.push({
        id: client.id,
        fullName:
          profile?.full_name ||
          'Unnamed Client',
        email: profile?.email || '',
        plan: client.plan,
        status: client.status,
      });

      assignedClientsByApplicantId.set(
        assignment.applicant_id,
        currentClients
      );
    }
  );

  const applicants = (applicantRows || []).map(
    (applicant) => {
      const profile = profilesById.get(
        applicant.user_id
      );

      const performance =
        performanceByApplicantId.get(
          applicant.id
        ) || {};

      return {
        id: applicant.id,
        userId: applicant.user_id,
        fullName:
          profile?.full_name ||
          'Unnamed Applicant',
        email: profile?.email || '',
        phone: profile?.phone || '',
        assignedTeam:
          applicant.assigned_team || '',
        availability:
          applicant.availability,
        activeTasks:
          applicant.active_tasks,
        completedTasks: Number(
          performance.completed_tasks || 0
        ),
        qualityRating: Number(
          performance.quality_rating || 0
        ),
        ratingCount: Number(
          performance.rating_count || 0
        ),
        completionRate: Number(
          performance.completion_rate || 0
        ),
        monitoredWorkdays: Number(
          performance.monitored_workdays || 0
        ),
        todayCompleted: Number(
          performance.today_completed || 0
        ),
        todayCompletionRate: Number(
          performance.today_completion_rate || 0
        ),
        accountStatus:
          profile?.account_status || 'active',
        assignedClients:
          assignedClientsByApplicantId.get(
            applicant.id
          ) || [],
        createdAt: applicant.created_at,
        updatedAt: applicant.updated_at,
      };
    }
  );

  return res.status(200).json({
    applicants,
  });
}

async function createApplicant(req, res) {
  const {
    profile: adminProfile,
    supabase,
  } = await requireAdmin(req);

  let createdUserId = null;

  try {
    const body = req.body || {};

    const fullName = validateRequired(
      body.fullName,
      'Applicant name',
      120
    );

    const email = validateEmail(body.email);

    const phone = validateRequired(
      body.phone,
      'Phone number',
      30
    );

    const assignedTeam = validateOptional(
      body.assignedTeam,
      'Assigned team',
      100
    );

    const availability = validateRequired(
      body.availability,
      'Availability',
      30
    ).toLowerCase();

    if (
      !ALLOWED_AVAILABILITY.has(
        availability
      )
    ) {
      throw new ApiError(
        400,
        'Select a valid availability.'
      );
    }

    const activeTasks =
      validateActiveTasks(body.activeTasks);

    const temporaryPassword =
      generateTemporaryPassword();

    const {
      data: authData,
      error: authError,
    } =
      await supabase.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'applicant',
        },
      });

    if (
      authError ||
      !authData.user
    ) {
      throw normalizeAuthError(authError);
    }

    createdUserId = authData.user.id;

    const { error: profileError } =
      await supabase
        .from('profiles')
        .insert({
          id: createdUserId,
          email,
          full_name: fullName,
          phone,
          role: 'applicant',
          account_status: 'active',
        });

    if (profileError) {
      console.error(
        'Unable to create applicant profile:',
        profileError
      );

      if (profileError.code === '23505') {
        throw new ApiError(
          409,
          'An applicant profile already exists for this email address.'
        );
      }

      throw new ApiError(
        500,
        'The applicant profile could not be created.'
      );
    }

    const {
      data: applicant,
      error: applicantError,
    } = await supabase
      .from('applicants')
      .insert({
        user_id: createdUserId,
        assigned_team: assignedTeam,
        availability,
        active_tasks: activeTasks,
        completed_tasks: 0,
        quality_rating: 0,
        completion_rate: 0,
        created_by: adminProfile.id,
      })
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
      .single();

    if (
      applicantError ||
      !applicant
    ) {
      console.error(
        'Unable to create applicant record:',
        applicantError
      );

      throw new ApiError(
        500,
        'The applicant record could not be created.'
      );
    }

    return res.status(201).json({
      message:
        'Applicant created successfully.',
      applicant: {
        id: applicant.id,
        userId: applicant.user_id,
        fullName,
        email,
        phone: phone || '',
        assignedTeam:
          applicant.assigned_team || '',
        availability:
          applicant.availability,
        activeTasks:
          applicant.active_tasks,
        completedTasks:
          applicant.completed_tasks,
        qualityRating: Number(
          applicant.quality_rating || 0
        ),
        completionRate: Number(
          applicant.completion_rate || 0
        ),
        accountStatus: 'active',
        assignedClients: [],
        createdAt: applicant.created_at,
        updatedAt: applicant.updated_at,
      },
      credentials: {
        email,
        temporaryPassword,
      },
    });
  } catch (error) {
    if (createdUserId) {
      const {
        error: deleteUserError,
      } =
        await supabase.auth.admin.deleteUser(
          createdUserId
        );

      if (deleteUserError) {
        console.error(
          'Unable to remove applicant user during rollback:',
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
    !['GET', 'POST'].includes(req.method)
  ) {
    res.setHeader(
      'Allow',
      'GET, POST'
    );

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    if (req.method === 'GET') {
      return await listApplicants(
        req,
        res
      );
    }

    return await createApplicant(
      req,
      res
    );
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : error.httpCode || 500;

    const serverErrorMessage =
      req.method === 'GET'
        ? 'Unable to load the applicant list right now.'
        : 'Unable to create the applicant right now.';

    if (statusCode >= 500) {
      console.error(
        `${req.method} applicants API error:`,
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? serverErrorMessage
            : error.message,
      });
  }
}
