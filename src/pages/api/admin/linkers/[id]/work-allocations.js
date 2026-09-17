import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';

function unique(values) {
  return [
    ...new Set(
      (values || []).filter(Boolean)
    ),
  ];
}

async function requireLinker(
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

  if (error || !linker) {
    throw new ApiError(
      404,
      'The Linker could not be found.'
    );
  }

  return linker;
}

async function listAllocations(
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
    await requireLinker(
      supabase,
      linkerId
    );

  const {
    data: allocationRows,
    error: allocationsError,
  } = await supabase
    .from(
      'linker_work_allocation_progress'
    )
    .select(`
      id,
      linker_user_id,
      client_id,
      target_links,
      priority,
      status,
      instructions,
      start_date,
      due_date,
      links_submitted,
      links_remaining,
      progress_percent,
      created_at,
      updated_at
    `)
    .eq(
      'linker_user_id',
      linkerId
    )
    .order(
      'created_at',
      {
        ascending: false,
      }
    );

  if (allocationsError) {
    console.error(
      'Unable to load Linker work allocations:',
      allocationsError
    );

    throw new ApiError(
      500,
      'Work allocations could not be loaded.'
    );
  }

  const allocations =
    allocationRows || [];

  const allocationIds =
    allocations.map(
      (allocation) =>
        allocation.id
    );

  let allocationApplicantRows = [];

  if (allocationIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from(
        'linker_work_allocation_applicants'
      )
      .select(`
        allocation_id,
        applicant_id
      `)
      .in(
        'allocation_id',
        allocationIds
      );

    if (error) {
      throw new ApiError(
        500,
        'Allocation Applicants could not be loaded.'
      );
    }

    allocationApplicantRows =
      data || [];
  }

  const {
    data: clientRows,
    error: clientsError,
  } = await supabase
    .from('clients')
    .select(`
      id,
      user_id,
      status,
      plan
    `)
    .eq('status', 'active');

  if (clientsError) {
    throw new ApiError(
      500,
      'Clients could not be loaded.'
    );
  }

  const clients =
    clientRows || [];

  const clientIds =
    clients.map(
      (client) => client.id
    );

  const clientUserIds =
    unique(
      clients.map(
        (client) =>
          client.user_id
      )
    );

  let clientProfiles = [];

  if (clientUserIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        account_status
      `)
      .in(
        'id',
        clientUserIds
      );

    if (error) {
      throw new ApiError(
        500,
        'Client profiles could not be loaded.'
      );
    }

    clientProfiles = data || [];
  }

  let clientApplicantRows = [];

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
      throw new ApiError(
        500,
        'Client Applicant relationships could not be loaded.'
      );
    }

    clientApplicantRows =
      data || [];
  }

  const applicantIds =
    unique([
      ...clientApplicantRows.map(
        (assignment) =>
          assignment.applicant_id
      ),
      ...allocationApplicantRows.map(
        (assignment) =>
          assignment.applicant_id
      ),
    ]);

  let applicantRows = [];

  if (applicantIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from('applicants')
      .select(`
        id,
        user_id,
        availability,
        assigned_team
      `)
      .in(
        'id',
        applicantIds
      );

    if (error) {
      throw new ApiError(
        500,
        'Applicants could not be loaded.'
      );
    }

    applicantRows = data || [];
  }

  const applicantUserIds =
    unique(
      applicantRows.map(
        (applicant) =>
          applicant.user_id
      )
    );

  let applicantProfiles = [];

  if (applicantUserIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        account_status
      `)
      .in(
        'id',
        applicantUserIds
      );

    if (error) {
      throw new ApiError(
        500,
        'Applicant profiles could not be loaded.'
      );
    }

    applicantProfiles =
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
      applicantRows.map(
        (applicant) => {
          const profile =
            applicantProfilesById.get(
              applicant.user_id
            );

          return [
            applicant.id,
            {
              id: applicant.id,
              userId:
                applicant.user_id,
              fullName:
                profile?.full_name ||
                'Unnamed Applicant',
              email:
                profile?.email || '',
              availability:
                applicant.availability,
              assignedTeam:
                applicant.assigned_team ||
                '',
              accountStatus:
                profile?.account_status ||
                'unknown',
            },
          ];
        }
      )
    );

  const applicantIdsByClientId =
    new Map();

  clientApplicantRows.forEach(
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

  const clientsForAdmin =
    clients.map((client) => {
      const profile =
        clientProfilesById.get(
          client.user_id
        );

      const ids =
        applicantIdsByClientId.get(
          client.id
        ) || [];

      return {
        id: client.id,
        fullName:
          profile?.full_name ||
          'Unnamed Client',
        email:
          profile?.email || '',
        plan:
          client.plan || '',
        accountStatus:
          profile?.account_status ||
          'unknown',
        applicants:
          ids
            .map(
              (id) =>
                applicantsById.get(id)
            )
            .filter(Boolean)
            .filter(
              (applicant) =>
                applicant.accountStatus ===
                'active'
            ),
      };
    });

  const clientNamesById =
    new Map(
      clientsForAdmin.map(
        (client) => [
          client.id,
          client.fullName,
        ]
      )
    );

  const applicantIdsByAllocationId =
    new Map();

  allocationApplicantRows.forEach(
    (assignment) => {
      const current =
        applicantIdsByAllocationId.get(
          assignment.allocation_id
        ) || [];

      current.push(
        assignment.applicant_id
      );

      applicantIdsByAllocationId.set(
        assignment.allocation_id,
        unique(current)
      );
    }
  );

  const formattedAllocations =
    allocations.map(
      (allocation) => {
        const ids =
          applicantIdsByAllocationId.get(
            allocation.id
          ) || [];

        return {
          id: allocation.id,
          clientId:
            allocation.client_id,
          clientName:
            clientNamesById.get(
              allocation.client_id
            ) || 'Unnamed Client',
          applicantIds: ids,
          applicants:
            ids
              .map(
                (id) =>
                  applicantsById.get(id)
              )
              .filter(Boolean),
          targetLinks:
            Number(
              allocation.target_links ||
                0
            ),
          linksSubmitted:
            Number(
              allocation.links_submitted ||
                0
            ),
          linksRemaining:
            Number(
              allocation.links_remaining ||
                0
            ),
          progressPercent:
            Number(
              allocation.progress_percent ||
                0
            ),
          priority:
            allocation.priority,
          status:
            allocation.status,
          instructions:
            allocation.instructions ||
            '',
          startDate:
            allocation.start_date,
          dueDate:
            allocation.due_date,
          createdAt:
            allocation.created_at,
          updatedAt:
            allocation.updated_at,
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
        linker.account_status ||
        '',
    },
    allocations:
      formattedAllocations,
    clients:
      clientsForAdmin.filter(
        (client) =>
          client.applicants.length > 0
      ),
  });
}

async function createAllocation(
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

  const linker =
    await requireLinker(
      supabase,
      linkerId
    );

  if (
    linker.account_status !==
    'active'
  ) {
    throw new ApiError(
      409,
      'Reactivate this Linker before creating work allocations.'
    );
  }

  const clientId =
    String(
      req.body?.clientId || ''
    ).trim();

  const applicantIds =
    unique(
      Array.isArray(
        req.body?.applicantIds
      )
        ? req.body.applicantIds
            .map((value) =>
              String(value || '')
                .trim()
            )
            .filter(Boolean)
        : []
    );

  const targetLinks =
    Number.parseInt(
      req.body?.targetLinks,
      10
    );

  const priority =
    String(
      req.body?.priority ||
      'normal'
    ).trim();

  const allowedPriorities =
    new Set([
      'low',
      'normal',
      'high',
      'urgent',
    ]);

  if (!clientId) {
    throw new ApiError(
      400,
      'Choose a Client.'
    );
  }

  if (applicantIds.length === 0) {
    throw new ApiError(
      400,
      'Choose at least one Applicant.'
    );
  }

  if (
    !Number.isInteger(
      targetLinks
    ) ||
    targetLinks <= 0
  ) {
    throw new ApiError(
      400,
      'Target links must be greater than zero.'
    );
  }

  if (
    !allowedPriorities.has(
      priority
    )
  ) {
    throw new ApiError(
      400,
      'Choose a valid priority.'
    );
  }

  const startDate =
    req.body?.startDate ||
    null;

  const dueDate =
    req.body?.dueDate ||
    null;

  const instructions =
    String(
      req.body?.instructions || ''
    ).trim();

  const {
    data,
    error,
  } = await supabase.rpc(
    'create_linker_work_allocation',
    {
      p_linker_user_id:
        linkerId,
      p_client_id:
        clientId,
      p_applicant_ids:
        applicantIds,
      p_target_links:
        targetLinks,
      p_priority:
        priority,
      p_start_date:
        startDate,
      p_due_date:
        dueDate,
      p_instructions:
        instructions || null,
      p_created_by:
        adminProfile.id,
    }
  );

  if (error) {
    console.error(
      'Unable to create Linker work allocation:',
      error
    );

    throw new ApiError(
      409,
      error.message ||
        'The work allocation could not be created.'
    );
  }

  return res.status(201).json({
    message:
      'Work allocation created successfully.',
    allocationId:
      data || null,
  });
}

async function updateAllocation(
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

  await requireLinker(
    supabase,
    linkerId
  );

  const allocationId =
    String(
      req.body?.allocationId ||
      ''
    ).trim();

  const status =
    String(
      req.body?.status ||
      ''
    ).trim();

  const allowedStatuses =
    new Set([
      'active',
      'paused',
      'completed',
      'cancelled',
    ]);

  if (!allocationId) {
    throw new ApiError(
      400,
      'A work allocation ID is required.'
    );
  }

  if (
    !allowedStatuses.has(status)
  ) {
    throw new ApiError(
      400,
      'Choose a valid allocation status.'
    );
  }

  const {
    data: existing,
    error: existingError,
  } = await supabase
    .from(
      'linker_work_allocations'
    )
    .select('id, linker_user_id')
    .eq('id', allocationId)
    .eq(
      'linker_user_id',
      linkerId
    )
    .maybeSingle();

  if (
    existingError ||
    !existing
  ) {
    throw new ApiError(
      404,
      'The work allocation could not be found.'
    );
  }

  const {
    error,
  } = await supabase
    .from(
      'linker_work_allocations'
    )
    .update({
      status,
      completed_at:
        status === 'completed'
          ? new Date().toISOString()
          : null,
      updated_at:
        new Date().toISOString(),
    })
    .eq('id', allocationId)
    .eq(
      'linker_user_id',
      linkerId
    );

  if (error) {
    console.error(
      'Unable to update work allocation:',
      error
    );

    throw new ApiError(
      500,
      'The work allocation could not be updated.'
    );
  }

  return res.status(200).json({
    message:
      'Work allocation updated successfully.',
  });
}

export default async function handler(
  req,
  res
) {
  try {
    if (req.method === 'GET') {
      return await listAllocations(
        req,
        res
      );
    }

    if (req.method === 'POST') {
      return await createAllocation(
        req,
        res
      );
    }

    if (req.method === 'PATCH') {
      return await updateAllocation(
        req,
        res
      );
    }

    res.setHeader(
      'Allow',
      'GET, POST, PATCH'
    );

    return res.status(405).json({
      error:
        'Method not allowed.',
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Linker work allocation API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          error?.message ||
          'The work allocation could not be managed.',
      });
  }
}
