import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';

import {
  getLinkerEmployment,
} from '../../../../../lib/linkers/getLinkerEmployment';

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
      full_name,
      email,
      account_status
    `)
    .eq('id', linkerId)
    .eq('role', 'linker')
    .maybeSingle();

  if (
    error ||
    !linker
  ) {
    throw new ApiError(
      404,
      'The Linker could not be found.'
    );
  }

  return linker;
}

async function getEmployment(
  req,
  res
) {
  const {
    supabase,
  } = await requireAdmin(req);

  const linkerId =
    Array.isArray(req.query.id)
      ? req.query.id[0]
      : req.query.id;

  const linker =
    await requireLinkerProfile(
      supabase,
      linkerId
    );

  const employment =
    await getLinkerEmployment(
      supabase,
      linker.id
    );

  const {
    data: chiefRows,
    error: chiefsError,
  } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      account_status
    `)
    .eq(
      'role',
      'chief_applicant'
    )
    .eq(
      'account_status',
      'active'
    )
    .order(
      'full_name',
      {
        ascending: true,
      }
    );

  if (chiefsError) {
    console.error(
      'Unable to load Chief Applicants for Linker employment:',
      chiefsError
    );

    throw new ApiError(
      500,
      'Chief Applicants could not be loaded.'
    );
  }

  return res.status(200).json({
    linker: {
      id: linker.id,
      fullName:
        linker.full_name ||
        'Unnamed Linker',
      email:
        linker.email || '',
      accountStatus:
        linker.account_status ||
        '',
    },
    employment,
    chiefApplicants:
      (chiefRows || []).map(
        (chief) => ({
          id: chief.id,
          fullName:
            chief.full_name ||
            'Chief Applicant',
          email:
            chief.email || '',
          accountStatus:
            chief.account_status ||
            '',
        })
      ),
  });
}

async function assignChief(
  req,
  res
) {
  const {
    supabase,
    profile: adminProfile,
  } = await requireAdmin(req);

  const linkerId =
    Array.isArray(req.query.id)
      ? req.query.id[0]
      : req.query.id;

  await requireLinkerProfile(
    supabase,
    linkerId
  );

  const chiefUserId =
    String(
      req.body?.chiefUserId ||
      ''
    ).trim();

  if (!chiefUserId) {
    throw new ApiError(
      400,
      'Choose a Chief Applicant.'
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    'create_chief_linker_assignment',
    {
      p_chief_user_id:
        chiefUserId,
      p_linker_user_id:
        linkerId,
      p_assigned_by:
        adminProfile.id,
    }
  );

  if (error) {
    console.error(
      'Unable to assign Chief Applicant to Linker:',
      error
    );

    throw new ApiError(
      409,
      error.message ||
        'The Chief Applicant could not be assigned.'
    );
  }

  return res.status(201).json({
    message:
      'Chief Applicant assigned to Linker.',
    assignment:
      Array.isArray(data)
        ? data[0] || null
        : data || null,
  });
}

async function unassignChief(
  req,
  res
) {
  const {
    supabase,
  } = await requireAdmin(req);

  const linkerId =
    Array.isArray(req.query.id)
      ? req.query.id[0]
      : req.query.id;

  await requireLinkerProfile(
    supabase,
    linkerId
  );

  let assignmentId =
    String(
      req.body?.assignmentId ||
      ''
    ).trim();

  let chiefUserId =
    String(
      req.body?.chiefUserId ||
      ''
    ).trim();

  if (
    !assignmentId ||
    !chiefUserId
  ) {
    const {
      data: assignment,
      error,
    } = await supabase
      .from(
        'chief_linker_assignments'
      )
      .select(`
        id,
        chief_user_id
      `)
      .eq(
        'linker_user_id',
        linkerId
      )
      .eq(
        'is_active',
        true
      )
      .maybeSingle();

    if (
      error ||
      !assignment
    ) {
      throw new ApiError(
        404,
        'The active Line Manager assignment could not be found.'
      );
    }

    assignmentId =
      assignment.id;

    chiefUserId =
      assignment.chief_user_id;
  }

  const {
    error,
  } = await supabase.rpc(
    'deactivate_chief_linker_assignment',
    {
      p_assignment_id:
        assignmentId,
      p_chief_user_id:
        chiefUserId,
    }
  );

  if (error) {
    console.error(
      'Unable to remove Linker Line Manager:',
      error
    );

    throw new ApiError(
      500,
      'The Line Manager assignment could not be removed.'
    );
  }

  return res.status(200).json({
    message:
      'Line Manager removed from Linker.',
  });
}

export default async function handler(
  req,
  res
) {
  try {
    if (req.method === 'GET') {
      return await getEmployment(
        req,
        res
      );
    }

    if (req.method === 'POST') {
      return await assignChief(
        req,
        res
      );
    }

    if (req.method === 'DELETE') {
      return await unassignChief(
        req,
        res
      );
    }

    res.setHeader(
      'Allow',
      'GET, POST, DELETE'
    );

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Linker employment API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          error?.message ||
          'Linker employment could not be updated.',
      });
  }
}
