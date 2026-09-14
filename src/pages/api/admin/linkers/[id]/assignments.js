import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';

function getLinkerId(req) {
  const linkerId =
    Array.isArray(req.query.id)
      ? req.query.id[0]
      : req.query.id;

  if (!linkerId) {
    throw new ApiError(
      400,
      'A Linker ID is required.'
    );
  }

  return linkerId;
}

async function requireLinkerProfile(
  supabase,
  linkerId
) {
  const {
    data: linker,
    error,
  } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      account_status,
      role
    `)
    .eq('id', linkerId)
    .single();

  if (
    error ||
    !linker ||
    linker.role !== 'linker'
  ) {
    throw new ApiError(
      404,
      'The Linker could not be found.'
    );
  }

  return linker;
}

async function listAssignments(
  req,
  res
) {
  const { supabase } =
    await requireAdmin(req);

  const linkerId =
    getLinkerId(req);

  const linker =
    await requireLinkerProfile(
      supabase,
      linkerId
    );

  const {
    data: applicantRows,
    error: applicantsError,
  } = await supabase
    .from('applicants')
    .select(`
      id,
      user_id,
      assigned_team,
      availability
    `)
    .order('created_at', {
      ascending: false,
    });

  if (applicantsError) {
    console.error(
      'Unable to load Applicants for Linker assignment:',
      applicantsError
    );

    throw new ApiError(
      500,
      'The Applicant list could not be loaded.'
    );
  }

  const applicants =
    applicantRows || [];

  const applicantUserIds =
    applicants.map(
      (applicant) =>
        applicant.user_id
    );

  let applicantProfiles = [];

  if (
    applicantUserIds.length > 0
  ) {
    const {
      data: profiles,
      error: profilesError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        account_status
      `)
      .in(
        'id',
        applicantUserIds
      );

    if (profilesError) {
      console.error(
        'Unable to load Applicant profiles:',
        profilesError
      );

      throw new ApiError(
        500,
        'Applicant profiles could not be loaded.'
      );
    }

    applicantProfiles =
      profiles || [];
  }

  const applicantIds =
    applicants.map(
      (applicant) =>
        applicant.id
    );

  let assignmentRows = [];

  if (
    applicantIds.length > 0
  ) {
    const {
      data: assignments,
      error: assignmentsError,
    } = await supabase
      .from(
        'linker_applicant_assignments'
      )
      .select(`
        id,
        linker_user_id,
        applicant_id,
        assigned_at
      `)
      .in(
        'applicant_id',
        applicantIds
      )
      .eq('is_active', true);

    if (assignmentsError) {
      console.error(
        'Unable to load active Linker assignments:',
        assignmentsError
      );

      throw new ApiError(
        500,
        'Active Linker assignments could not be loaded.'
      );
    }

    assignmentRows =
      assignments || [];
  }

  const assignedLinkerIds = [
    ...new Set(
      assignmentRows.map(
        (assignment) =>
          assignment.linker_user_id
      )
    ),
  ];

  let assignedLinkerProfiles = [];

  if (
    assignedLinkerIds.length > 0
  ) {
    const {
      data: profiles,
      error: profilesError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email
      `)
      .in(
        'id',
        assignedLinkerIds
      );

    if (profilesError) {
      console.error(
        'Unable to load assigned Linker profiles:',
        profilesError
      );

      throw new ApiError(
        500,
        'Assigned Linker details could not be loaded.'
      );
    }

    assignedLinkerProfiles =
      profiles || [];
  }

  const profilesById =
    new Map(
      applicantProfiles.map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    );

  const linkerProfilesById =
    new Map(
      assignedLinkerProfiles.map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    );

  const assignmentByApplicantId =
    new Map(
      assignmentRows.map(
        (assignment) => [
          assignment.applicant_id,
          assignment,
        ]
      )
    );

  const results =
    applicants.map(
      (applicant) => {
        const profile =
          profilesById.get(
            applicant.user_id
          );

        const assignment =
          assignmentByApplicantId.get(
            applicant.id
          );

        const assignedLinker =
          assignment
            ? linkerProfilesById.get(
                assignment
                  .linker_user_id
              )
            : null;

        const isAssignedToThisLinker =
          assignment
            ?.linker_user_id ===
          linkerId;

        const accountStatus =
          profile?.account_status ||
          'unknown';

        return {
          id: applicant.id,
          userId:
            applicant.user_id,
          fullName:
            profile?.full_name ||
            'Unnamed Applicant',
          email:
            profile?.email || '',
          assignedTeam:
            applicant
              .assigned_team || '',
          availability:
            applicant.availability,
          accountStatus,
          isAssignedToThisLinker,
          canAssign:
            linker.account_status ===
              'active' &&
            accountStatus ===
              'active' &&
            applicant.availability ===
              'available' &&
            !assignment,
          currentAssignment:
            assignment
              ? {
                  id:
                    assignment.id,
                  linkerUserId:
                    assignment
                      .linker_user_id,
                  linkerName:
                    assignedLinker
                      ?.full_name ||
                    'Assigned Linker',
                  linkerEmail:
                    assignedLinker
                      ?.email || '',
                  assignedAt:
                    assignment
                      .assigned_at,
                }
              : null,
        };
      }
    );

  res.setHeader(
    'Cache-Control',
    'no-store'
  );

  return res.status(200).json({
    linker: {
      id: linker.id,
      fullName:
        linker.full_name ||
        'Unnamed Linker',
      email:
        linker.email || '',
      accountStatus:
        linker.account_status,
    },
    applicants: results,
  });
}

async function createAssignment(
  req,
  res
) {
  const {
    profile: adminProfile,
    supabase,
  } = await requireAdmin(req);

  const linkerId =
    getLinkerId(req);

  const linker =
    await requireLinkerProfile(
      supabase,
      linkerId
    );

  if (
    linker.account_status !==
    'active'
  ) {
    throw new ApiError(
      409,
      'Reactivate this Linker before assigning Applicants.'
    );
  }

  const applicantId =
    String(
      req.body?.applicantId || ''
    ).trim();

  if (!applicantId) {
    throw new ApiError(
      400,
      'Select an Applicant to assign.'
    );
  }

  const {
    data: assignmentRows,
    error: assignmentError,
  } = await supabase.rpc(
    'create_linker_applicant_assignment',
    {
      p_linker_user_id:
        linkerId,
      p_applicant_id:
        applicantId,
      p_assigned_by:
        adminProfile.id,
    }
  );

  const assignment =
    Array.isArray(
      assignmentRows
    )
      ? assignmentRows[0]
      : assignmentRows;

  if (
    assignmentError ||
    !assignment
  ) {
    const message =
      assignmentError?.message ||
      '';

    const normalized =
      message.toLowerCase();

    if (
      normalized.includes(
        'already has an active linker'
      )
    ) {
      throw new ApiError(
        409,
        'This Applicant already has an active Linker.'
      );
    }

    if (
      normalized.includes(
        'already assigned to this applicant'
      )
    ) {
      throw new ApiError(
        409,
        'This Linker is already assigned to this Applicant.'
      );
    }

    if (
      normalized.includes(
        'set this applicant to available'
      )
    ) {
      throw new ApiError(
        409,
        'Set this Applicant to Available before assigning a Linker.'
      );
    }

    if (
      normalized.includes(
        'only an active applicant'
      )
    ) {
      throw new ApiError(
        409,
        'Only an active Applicant can receive a Linker assignment.'
      );
    }

    console.error(
      'Unable to create Linker assignment:',
      assignmentError
    );

    throw new ApiError(
      500,
      'The Linker assignment could not be created.'
    );
  }

  return res.status(201).json({
    message:
      'Applicant assigned to Linker successfully.',
    assignment: {
      id:
        assignment
          .assignment_id ||
        assignment.id,
      linkerUserId:
        assignment
          .linker_user_id,
      applicantId:
        assignment
          .applicant_id,
      assignedAt:
        assignment
          .assigned_at,
    },
  });
}

async function deleteAssignment(
  req,
  res
) {
  const {
    profile: adminProfile,
    supabase,
  } = await requireAdmin(req);

  const linkerId =
    getLinkerId(req);

  await requireLinkerProfile(
    supabase,
    linkerId
  );

  const assignmentId =
    String(
      req.body?.assignmentId ||
        ''
    ).trim();

  if (!assignmentId) {
    throw new ApiError(
      400,
      'An assignment ID is required.'
    );
  }

  const {
    data: existingAssignment,
    error: existingError,
  } = await supabase
    .from(
      'linker_applicant_assignments'
    )
    .select(`
      id,
      linker_user_id,
      applicant_id,
      is_active
    `)
    .eq('id', assignmentId)
    .eq(
      'linker_user_id',
      linkerId
    )
    .maybeSingle();

  if (existingError) {
    console.error(
      'Unable to check Linker assignment:',
      existingError
    );

    throw new ApiError(
      500,
      'The Linker assignment could not be checked.'
    );
  }

  if (!existingAssignment) {
    throw new ApiError(
      404,
      'The Linker assignment could not be found.'
    );
  }

  if (
    !existingAssignment.is_active
  ) {
    throw new ApiError(
      409,
      'This Linker assignment is already inactive.'
    );
  }

  const {
    data: deactivatedRows,
    error: deactivateError,
  } = await supabase.rpc(
    'deactivate_linker_applicant_assignment',
    {
      p_assignment_id:
        assignmentId,
      p_unassigned_by:
        adminProfile.id,
    }
  );

  const deactivated =
    Array.isArray(
      deactivatedRows
    )
      ? deactivatedRows[0]
      : deactivatedRows;

  if (
    deactivateError ||
    !deactivated
  ) {
    console.error(
      'Unable to deactivate Linker assignment:',
      deactivateError
    );

    throw new ApiError(
      500,
      'The Applicant could not be unassigned from this Linker.'
    );
  }

  return res.status(200).json({
    message:
      'Applicant unassigned from Linker successfully.',
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
      'DELETE',
    ].includes(req.method)
  ) {
    res.setHeader(
      'Allow',
      'GET, POST, DELETE'
    );

    return res.status(405).json({
      error:
        'Method not allowed.',
    });
  }

  try {
    if (req.method === 'GET') {
      return await listAssignments(
        req,
        res
      );
    }

    if (
      req.method === 'DELETE'
    ) {
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
        : error.httpCode || 500;

    if (statusCode >= 500) {
      console.error(
        `${req.method} Linker assignment API error:`,
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to manage the Linker assignment right now.'
            : error.message,
      });
  }
}
