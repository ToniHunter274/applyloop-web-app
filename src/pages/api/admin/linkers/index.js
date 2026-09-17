import {
  ApiError,
  requireAdmin,
} from '../../../../lib/auth/requireAdmin';
import {
  generateTemporaryPassword,
} from '../../../../lib/auth/generateTemporaryPassword';

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

function validateEmail(value) {
  const email = validateRequired(
    value,
    'Email address',
    254
  ).toLowerCase();

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    throw new ApiError(
      400,
      'Enter a valid email address.'
    );
  }

  return email;
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
    'The Linker login account could not be created.'
  );
}

async function listLinkers(req, res) {
  const { supabase } =
    await requireAdmin(req);

  const {
    data: linkerProfiles,
    error: linkersError,
  } = await supabase
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
    .eq('role', 'linker')
    .order('created_at', {
      ascending: false,
    });

  if (linkersError) {
    console.error(
      'Unable to load Linkers:',
      linkersError
    );

    throw new ApiError(
      500,
      'The Linker list could not be loaded.'
    );
  }

  const linkerIds = (
    linkerProfiles || []
  ).map((linker) => linker.id);

  const {
    data: linkerPerformanceRows,
    error: linkerPerformanceError,
  } = await supabase.rpc(
    'get_linker_performance'
  );

  if (linkerPerformanceError) {
    console.error(
      'Unable to load Linker performance:',
      linkerPerformanceError
    );

    throw new ApiError(
      500,
      'Linker performance could not be loaded.'
    );
  }

  const linkerPerformanceById =
    new Map(
      (
        linkerPerformanceRows || []
      ).map(
        (performance) => [
          performance.linker_user_id,
          performance,
        ]
      )
    );

  let assignmentRows = [];

  if (linkerIds.length > 0) {
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
        'linker_user_id',
        linkerIds
      )
      .eq('is_active', true);

    if (assignmentsError) {
      console.error(
        'Unable to load Linker assignments:',
        assignmentsError
      );

      throw new ApiError(
        500,
        'Linker assignments could not be loaded.'
      );
    }

    assignmentRows = assignments || [];
  }

  let allocationRows = [];

  if (linkerIds.length > 0) {
    const {
      data: allocations,
      error: allocationsError,
    } = await supabase
      .from(
        'linker_work_allocations'
      )
      .select(`
        id,
        linker_user_id,
        status
      `)
      .in(
        'linker_user_id',
        linkerIds
      )
      .eq('status', 'active');

    if (allocationsError) {
      console.error(
        'Unable to load Linker work allocations:',
        allocationsError
      );

      throw new ApiError(
        500,
        'Linker work allocations could not be loaded.'
      );
    }

    allocationRows =
      allocations || [];
  }

  const allocationCountByLinkerId =
    new Map();

  allocationRows.forEach(
    (allocation) => {
      allocationCountByLinkerId.set(
        allocation.linker_user_id,
        (
          allocationCountByLinkerId.get(
            allocation.linker_user_id
          ) || 0
        ) + 1
      );
    }
  );

  const assignmentCountByLinkerId =
    new Map();

  assignmentRows.forEach(
    (assignment) => {
      assignmentCountByLinkerId.set(
        assignment.linker_user_id,
        (
          assignmentCountByLinkerId.get(
            assignment.linker_user_id
          ) || 0
        ) + 1
      );
    }
  );

  const linkers = (
    linkerProfiles || []
  ).map((linker) => ({
    id: linker.id,
    userId: linker.id,
    fullName:
      linker.full_name ||
      'Unnamed Linker',
    email: linker.email || '',
    phone: linker.phone || '',
    accountStatus:
      linker.account_status ||
      'active',
    activeAssignments:
      assignmentCountByLinkerId.get(
        linker.id
      ) || 0,
    activeAllocations:
      allocationCountByLinkerId.get(
        linker.id
      ) || 0,
    qualityRating:
      Number(
        linkerPerformanceById.get(
          linker.id
        )?.quality_rating || 0
      ),
    ratingCount:
      Number(
        linkerPerformanceById.get(
          linker.id
        )?.rating_count || 0
      ),
    createdAt: linker.created_at,
    updatedAt: linker.updated_at,
  }));

  res.setHeader(
    'Cache-Control',
    'no-store'
  );

  return res.status(200).json({
    linkers,
  });
}

async function createLinker(req, res) {
  const {
    supabase,
  } = await requireAdmin(req);

  let createdUserId = null;

  try {
    const body = req.body || {};

    const fullName = validateRequired(
      body.fullName,
      'Linker name',
      120
    );

    const email = validateEmail(
      body.email
    );

    const phone = validateOptional(
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
      await supabase.auth.admin.createUser({
        email,
        password:
          temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'linker',
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
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .insert({
        id: createdUserId,
        email,
        full_name: fullName,
        phone,
        role: 'linker',
        account_status: 'active',
      })
      .select(`
        id,
        email,
        full_name,
        phone,
        account_status,
        created_at,
        updated_at
      `)
      .single();

    if (
      profileError ||
      !profile
    ) {
      console.error(
        'Unable to create Linker profile:',
        profileError
      );

      if (
        profileError?.code ===
        '23505'
      ) {
        throw new ApiError(
          409,
          'A Linker profile already exists for this email address.'
        );
      }

      throw new ApiError(
        500,
        'The Linker profile could not be created.'
      );
    }

    return res.status(201).json({
      message:
        'Linker created successfully.',
      linker: {
        id: profile.id,
        userId: profile.id,
        fullName:
          profile.full_name,
        email: profile.email,
        phone:
          profile.phone || '',
        accountStatus:
          profile.account_status,
        activeAssignments: 0,
        activeAllocations: 0,
        qualityRating: 0,
        ratingCount: 0,
        createdAt:
          profile.created_at,
        updatedAt:
          profile.updated_at,
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
        await supabase.auth.admin
          .deleteUser(
            createdUserId
          );

      if (deleteUserError) {
        console.error(
          'Unable to remove Linker user during rollback:',
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

  try {
    if (req.method === 'GET') {
      return await listLinkers(
        req,
        res
      );
    }

    return await createLinker(
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
        `${req.method} Linkers API error:`,
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? req.method ===
              'GET'
              ? 'Unable to load the Linker list right now.'
              : 'Unable to create the Linker right now.'
            : error.message,
      });
  }
}
