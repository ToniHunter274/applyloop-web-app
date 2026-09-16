import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';

function getChiefApplicantId(req) {
  const value =
    Array.isArray(req.query.id)
      ? req.query.id[0]
      : req.query.id;

  const chiefApplicantId =
    String(value || '').trim();

  if (!chiefApplicantId) {
    throw new ApiError(
      400,
      'A Chief Applicant is required.'
    );
  }

  return chiefApplicantId;
}

function getApplicantId(req) {
  const applicantId =
    String(
      req.body?.applicantId ||
        ''
    ).trim();

  if (!applicantId) {
    throw new ApiError(
      400,
      'Select an Applicant.'
    );
  }

  return applicantId;
}

async function requireChiefApplicant(
  supabase,
  chiefApplicantId
) {
  const {
    data: chiefApplicant,
    error,
  } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      account_status
    `)
    .eq(
      'id',
      chiefApplicantId
    )
    .eq(
      'role',
      'chief_applicant'
    )
    .maybeSingle();

  if (error) {
    console.error(
      'Unable to verify Chief Applicant:',
      error
    );

    throw new ApiError(
      500,
      'The Chief Applicant could not be verified.'
    );
  }

  if (!chiefApplicant) {
    throw new ApiError(
      404,
      'The Chief Applicant could not be found.'
    );
  }

  return chiefApplicant;
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
    .select(`
      id,
      user_id,
      work_email,
      assigned_team,
      availability
    `)
    .eq(
      'id',
      applicantId
    )
    .maybeSingle();

  if (applicantError) {
    console.error(
      'Unable to verify Applicant for Chief supervision:',
      applicantError
    );

    throw new ApiError(
      500,
      'The Applicant could not be verified.'
    );
  }

  if (!applicant) {
    throw new ApiError(
      404,
      'The Applicant could not be found.'
    );
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      account_status
    `)
    .eq(
      'id',
      applicant.user_id
    )
    .eq(
      'role',
      'applicant'
    )
    .maybeSingle();

  if (profileError) {
    console.error(
      'Unable to verify Applicant profile for Chief supervision:',
      profileError
    );

    throw new ApiError(
      500,
      'The Applicant profile could not be verified.'
    );
  }

  if (!profile) {
    throw new ApiError(
      404,
      'The Applicant profile could not be found.'
    );
  }

  return {
    ...applicant,
    profile,
  };
}

function normalizeAssignmentError(
  error
) {
  const message =
    String(
      error?.message ||
        ''
    );

  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      'already has an active chief applicant'
    )
  ) {
    return new ApiError(
      409,
      'This Applicant already has an active Chief Applicant. Unassign the current Chief before reassigning the Applicant.'
    );
  }

  if (
    normalized.includes(
      'already assigned to this chief applicant'
    )
  ) {
    return new ApiError(
      409,
      'This Applicant is already assigned to this Chief Applicant.'
    );
  }

  if (
    normalized.includes(
      'only an active chief applicant'
    )
  ) {
    return new ApiError(
      409,
      'Only an active Chief Applicant can supervise Applicants.'
    );
  }

  if (
    normalized.includes(
      'only an active applicant'
    )
  ) {
    return new ApiError(
      409,
      'Only an active Applicant can receive Chief Applicant supervision.'
    );
  }

  if (
    normalized.includes(
      'chief applicant not found'
    )
  ) {
    return new ApiError(
      404,
      'The Chief Applicant could not be found.'
    );
  }

  if (
    normalized.includes(
      'applicant not found'
    ) ||
    normalized.includes(
      'applicant profile not found'
    )
  ) {
    return new ApiError(
      404,
      'The Applicant could not be found.'
    );
  }

  return null;
}

async function createAssignment(
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
      'Only Admin can manage Chief Applicant assignments.'
    );
  }

  const chiefApplicantId =
    getChiefApplicantId(req);

  const applicantId =
    getApplicantId(req);

  const chiefApplicant =
    await requireChiefApplicant(
      supabase,
      chiefApplicantId
    );

  if (
    chiefApplicant
      .account_status !==
    'active'
  ) {
    throw new ApiError(
      409,
      'Only active Chief Applicants can supervise Applicants.'
    );
  }

  const applicant =
    await requireApplicant(
      supabase,
      applicantId
    );

  if (
    applicant.profile
      .account_status !==
    'active'
  ) {
    throw new ApiError(
      409,
      'Only active Applicants can receive Chief Applicant supervision.'
    );
  }

  const {
    data: assignmentRows,
    error: assignmentError,
  } = await supabase.rpc(
    'create_chief_applicant_assignment',
    {
      p_chief_user_id:
        chiefApplicantId,
      p_applicant_id:
        applicantId,
      p_assigned_by:
        adminProfile.id,
    }
  );

  if (assignmentError) {
    const normalizedError =
      normalizeAssignmentError(
        assignmentError
      );

    if (normalizedError) {
      throw normalizedError;
    }

    console.error(
      'Unable to create Chief Applicant supervision assignment:',
      assignmentError
    );

    throw new ApiError(
      500,
      'The Applicant could not be assigned to the Chief Applicant.'
    );
  }

  const assignment =
    Array.isArray(
      assignmentRows
    )
      ? assignmentRows[0]
      : assignmentRows;

  if (!assignment) {
    throw new ApiError(
      500,
      'The Chief Applicant assignment could not be created.'
    );
  }

  return res.status(201).json({
    message:
      'Applicant assigned to Chief Applicant successfully.',
    assignment: {
      id:
        assignment
          .assignment_id ||
        assignment.id,
      chiefApplicantId:
        assignment
          .chief_user_id,
      applicantId:
        assignment
          .applicant_id,
      active:
        assignment
          .is_active,
      assignedBy:
        assignment
          .assigned_by,
      assignedAt:
        assignment
          .assigned_at,
      updatedAt:
        assignment
          .updated_at,
    },
  });
}

async function resolveAssignmentId(
  supabase,
  chiefApplicantId,
  body
) {
  const explicitId =
    String(
      body?.assignmentId ||
        ''
    ).trim();

  if (explicitId) {
    return explicitId;
  }

  const applicantId =
    String(
      body?.applicantId ||
        ''
    ).trim();

  if (!applicantId) {
    throw new ApiError(
      400,
      'An Applicant assignment is required.'
    );
  }

  const {
    data: assignment,
    error,
  } = await supabase
    .from(
      'chief_applicant_assignments'
    )
    .select(`
      id
    `)
    .eq(
      'chief_user_id',
      chiefApplicantId
    )
    .eq(
      'applicant_id',
      applicantId
    )
    .eq(
      'is_active',
      true
    )
    .maybeSingle();

  if (error) {
    console.error(
      'Unable to find Chief Applicant assignment:',
      error
    );

    throw new ApiError(
      500,
      'The Chief Applicant assignment could not be checked.'
    );
  }

  if (!assignment) {
    throw new ApiError(
      404,
      'This Applicant is not assigned to this Chief Applicant.'
    );
  }

  return assignment.id;
}

async function deleteAssignment(
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
      'Only Admin can manage Chief Applicant assignments.'
    );
  }

  const chiefApplicantId =
    getChiefApplicantId(req);

  await requireChiefApplicant(
    supabase,
    chiefApplicantId
  );

  const assignmentId =
    await resolveAssignmentId(
      supabase,
      chiefApplicantId,
      req.body || {}
    );

  const {
    data: assignmentRows,
    error: assignmentError,
  } = await supabase.rpc(
    'deactivate_chief_applicant_assignment',
    {
      p_assignment_id:
        assignmentId,
      p_chief_user_id:
        chiefApplicantId,
    }
  );

  if (assignmentError) {
    const message =
      String(
        assignmentError
          ?.message ||
          ''
      ).toLowerCase();

    if (
      message.includes(
        'assignment not found'
      )
    ) {
      throw new ApiError(
        404,
        'The Chief Applicant assignment could not be found.'
      );
    }

    if (
      message.includes(
        'already inactive'
      )
    ) {
      throw new ApiError(
        409,
        'This Chief Applicant assignment is already inactive.'
      );
    }

    console.error(
      'Unable to deactivate Chief Applicant supervision assignment:',
      assignmentError
    );

    throw new ApiError(
      500,
      'The Applicant could not be unassigned from the Chief Applicant.'
    );
  }

  const assignment =
    Array.isArray(
      assignmentRows
    )
      ? assignmentRows[0]
      : assignmentRows;

  if (!assignment) {
    throw new ApiError(
      500,
      'The Chief Applicant assignment could not be updated.'
    );
  }

  return res.status(200).json({
    message:
      'Applicant unassigned from Chief Applicant successfully.',
    assignment: {
      id:
        assignment
          .assignment_id ||
        assignment.id,
      chiefApplicantId:
        assignment
          .chief_user_id,
      applicantId:
        assignment
          .applicant_id,
      active:
        assignment
          .is_active,
      updatedAt:
        assignment
          .updated_at,
    },
  });
}

export default async function handler(
  req,
  res
) {
  if (
    ![
      'POST',
      'DELETE',
    ].includes(
      req.method
    )
  ) {
    res.setHeader(
      'Allow',
      'POST, DELETE'
    );

    return res.status(405).json({
      error:
        'Method not allowed.',
    });
  }

  try {
    if (
      req.method ===
      'POST'
    ) {
      return await createAssignment(
        req,
        res
      );
    }

    return await deleteAssignment(
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
        `${req.method} Chief Applicant assignments API error:`,
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to manage the Chief Applicant assignment right now.'
            : error.message,
      });
  }
}
