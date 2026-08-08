import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';

function getApplicantId(req) {
  const applicantId = Array.isArray(req.query.id)
    ? req.query.id[0]
    : req.query.id;

  if (!applicantId) {
    throw new ApiError(
      400,
      'An applicant ID is required.'
    );
  }

  return applicantId;
}

async function requireApplicant(
  supabase,
  applicantId
) {
  const {
    data: applicant,
    error: applicantError,
  } = await supabase
    .from('applicants')
    .select('id, user_id')
    .eq('id', applicantId)
    .single();

  if (applicantError || !applicant) {
    throw new ApiError(
      404,
      'The applicant could not be found.'
    );
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select('account_status')
    .eq('id', applicant.user_id)
    .single();

  if (profileError || !profile) {
    throw new ApiError(
      404,
      'The applicant profile could not be found.'
    );
  }

  return {
    ...applicant,
    accountStatus:
      profile.account_status,
  };
}

async function listAssignments(req, res) {
  const { supabase } = await requireAdmin(req);
  const applicantId = getApplicantId(req);

  await requireApplicant(
    supabase,
    applicantId
  );

  const {
    data: clientRows,
    error: clientsError,
  } = await supabase
    .from('clients')
    .select(`
      id,
      user_id,
      plan,
      assigned_team,
      status,
      created_at
    `)
    .order('created_at', {
      ascending: false,
    });

  if (clientsError) {
    console.error(
      'Unable to load clients for assignment:',
      clientsError
    );

    throw new ApiError(
      500,
      'The client list could not be loaded.'
    );
  }

  const clientIds = (clientRows || []).map(
    (client) => client.id
  );

  const userIds = [
    ...new Set(
      (clientRows || []).map(
        (client) => client.user_id
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
        phone
      `)
      .in('id', userIds);

    if (profilesError) {
      console.error(
        'Unable to load client profiles for assignment:',
        profilesError
      );

      throw new ApiError(
        500,
        'The client profiles could not be loaded.'
      );
    }

    profiles = profileRows || [];
  }

  let assignmentRows = [];

  if (clientIds.length > 0) {
    const {
      data: assignments,
      error: assignmentsError,
    } = await supabase
      .from('client_applicant_assignments')
      .select(`
        id,
        client_id,
        applicant_id,
        created_at
      `)
      .in('client_id', clientIds);

    if (assignmentsError) {
      console.error(
        'Unable to load client applicant assignments:',
        assignmentsError
      );

      throw new ApiError(
        500,
        'The client assignments could not be loaded.'
      );
    }

    assignmentRows = assignments || [];
  }

  const profilesById = new Map(
    profiles.map((profile) => [
      profile.id,
      profile,
    ])
  );

  const assignmentCountByClientId =
    new Map();

  const assignedClientIds =
    new Set();

  assignmentRows.forEach((assignment) => {
    assignmentCountByClientId.set(
      assignment.client_id,
      (
        assignmentCountByClientId.get(
          assignment.client_id
        ) || 0
      ) + 1
    );

    if (
      assignment.applicant_id ===
      applicantId
    ) {
      assignedClientIds.add(
        assignment.client_id
      );
    }
  });

  const clients = (clientRows || []).map(
    (client) => {
      const profile = profilesById.get(
        client.user_id
      );

      const assignmentCount =
        assignmentCountByClientId.get(
          client.id
        ) || 0;

      const isAssigned =
        assignedClientIds.has(client.id);

      return {
        id: client.id,
        fullName:
          profile?.full_name ||
          'Unnamed Client',
        email: profile?.email || '',
        phone: profile?.phone || '',
        plan: client.plan,
        assignedTeam:
          client.assigned_team || '',
        status: client.status,
        assignmentCount,
        assignmentLimit: 2,
        remainingSlots: Math.max(
          0,
          2 - assignmentCount
        ),
        isAssigned,
        canAssign:
          !isAssigned &&
          assignmentCount < 2,
      };
    }
  );

  return res.status(200).json({
    applicantId,
    clients,
  });
}

async function createAssignment(req, res) {
  const {
    profile: adminProfile,
    supabase,
  } = await requireAdmin(req);

  const applicantId = getApplicantId(req);

  const applicant =
    await requireApplicant(
      supabase,
      applicantId
    );

  if (
    applicant.accountStatus !== 'active'
  ) {
    throw new ApiError(
      409,
      'Reactivate this applicant before assigning another client.'
    );
  }

  const clientId = String(
    req.body?.clientId || ''
  ).trim();

  if (!clientId) {
    throw new ApiError(
      400,
      'Select a client to assign.'
    );
  }

  const {
    data: client,
    error: clientError,
  } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    throw new ApiError(
      404,
      'The client could not be found.'
    );
  }

  const {
    data: existingAssignment,
  } = await supabase
    .from('client_applicant_assignments')
    .select('id')
    .eq('client_id', clientId)
    .eq('applicant_id', applicantId)
    .maybeSingle();

  if (existingAssignment) {
    throw new ApiError(
      409,
      'This client is already assigned to this applicant.'
    );
  }

  const {
    data: assignment,
    error: assignmentError,
  } = await supabase
    .from('client_applicant_assignments')
    .insert({
      client_id: clientId,
      applicant_id: applicantId,
      assigned_by: adminProfile.id,
    })
    .select(`
      id,
      client_id,
      applicant_id,
      assigned_by,
      created_at
    `)
    .single();

  if (assignmentError) {
    if (
      assignmentError.code === '23505'
    ) {
      throw new ApiError(
        409,
        'This client is already assigned to this applicant.'
      );
    }

    if (
      assignmentError.message
        ?.toLowerCase()
        .includes(
          'maximum of 2 applicants'
        )
    ) {
      throw new ApiError(
        409,
        'This client already has the maximum of 2 applicants assigned.'
      );
    }

    console.error(
      'Unable to assign client to applicant:',
      assignmentError
    );

    throw new ApiError(
      500,
      'The client could not be assigned.'
    );
  }

  return res.status(201).json({
    message:
      'Client assigned successfully.',
    assignment: {
      id: assignment.id,
      clientId:
        assignment.client_id,
      applicantId:
        assignment.applicant_id,
      assignedBy:
        assignment.assigned_by,
      createdAt:
        assignment.created_at,
    },
  });
}

async function deleteAssignment(req, res) {
  const { supabase } =
    await requireAdmin(req);

  const applicantId =
    getApplicantId(req);

  await requireApplicant(
    supabase,
    applicantId
  );

  const clientId = String(
    req.body?.clientId || ''
  ).trim();

  if (!clientId) {
    throw new ApiError(
      400,
      'Select a client to unassign.'
    );
  }

  const {
    data: assignment,
    error: assignmentError,
  } = await supabase
    .from(
      'client_applicant_assignments'
    )
    .select(`
      id,
      client_id,
      applicant_id
    `)
    .eq(
      'client_id',
      clientId
    )
    .eq(
      'applicant_id',
      applicantId
    )
    .maybeSingle();

  if (assignmentError) {
    console.error(
      'Unable to find client assignment:',
      assignmentError
    );

    throw new ApiError(
      500,
      'The client assignment could not be checked.'
    );
  }

  if (!assignment) {
    throw new ApiError(
      404,
      'This client is not assigned to this applicant.'
    );
  }

  const {
    error: deleteError,
  } = await supabase
    .from(
      'client_applicant_assignments'
    )
    .delete()
    .eq(
      'id',
      assignment.id
    );

  if (deleteError) {
    console.error(
      'Unable to unassign client from applicant:',
      deleteError
    );

    throw new ApiError(
      500,
      'The client could not be unassigned.'
    );
  }

  return res.status(200).json({
    message:
      'Client unassigned successfully.',
    assignment: {
      id: assignment.id,
      clientId:
        assignment.client_id,
      applicantId:
        assignment.applicant_id,
    },
  });
}

export default async function handler(
  req,
  res
) {
  if (
    !['GET', 'POST', 'DELETE'].includes(
      req.method
    )
  ) {
    res.setHeader(
      'Allow',
      'GET, POST, DELETE'
    );

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    if (req.method === 'GET') {
      return await listAssignments(
        req,
        res
      );
    }

    if (req.method === 'DELETE') {
      return await deleteAssignment(
        req,
        res
      );
    }

    return await createAssignment(
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
        `${req.method} applicant assignments API error:`,
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to manage client assignments right now.'
            : error.message,
      });
  }
}
