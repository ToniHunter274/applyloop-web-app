import {
  ApiError,
} from '../../../lib/auth/requireAdmin';

import {
  requireLinker,
} from '../../../lib/auth/requireLinker';

function unique(values) {
  return [
    ...new Set(
      (values || []).filter(Boolean)
    ),
  ];
}

async function getAllocations(
  req,
  res
) {
  const {
    profile,
    supabase,
  } = await requireLinker(req);

  const {
    data: allocationRows,
    error: allocationError,
  } = await supabase
    .from(
      'linker_work_allocation_progress'
    )
    .select(`
      id,
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
      created_at
    `)
    .eq(
      'linker_user_id',
      profile.id
    )
    .eq('status', 'active')
    .order('created_at', {
      ascending: false,
    });

  if (allocationError) {
    console.error(
      'Unable to load Linker work allocations:',
      allocationError
    );

    throw new ApiError(
      500,
      'Your work allocations could not be loaded.'
    );
  }

  const allocations =
    allocationRows || [];

  if (allocations.length === 0) {
    res.setHeader(
      'Cache-Control',
      'no-store'
    );

    return res.status(200).json({
      allocations: [],
    });
  }

  const allocationIds =
    allocations.map(
      (allocation) =>
        allocation.id
    );

  const {
    data: allocationApplicantRows,
    error: allocationApplicantsError,
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

  if (allocationApplicantsError) {
    throw new ApiError(
      500,
      'Eligible Applicants could not be loaded.'
    );
  }

  const allocationApplicants =
    allocationApplicantRows || [];

  const applicantIds =
    unique(
      allocationApplicants.map(
        (row) =>
          row.applicant_id
      )
    );

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
        'Eligible Applicants could not be loaded.'
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

  const profilesById =
    new Map(
      applicantProfiles.map(
        (profileRow) => [
          profileRow.id,
          profileRow,
        ]
      )
    );

  const applicantsById =
    new Map(
      applicantRows.map(
        (applicant) => {
          const applicantProfile =
            profilesById.get(
              applicant.user_id
            );

          return [
            applicant.id,
            {
              id: applicant.id,
              userId:
                applicant.user_id,
              fullName:
                applicantProfile
                  ?.full_name ||
                'Unnamed Applicant',
              email:
                applicantProfile
                  ?.email ||
                '',
              team:
                applicant
                  .assigned_team ||
                '',
              availability:
                applicant.availability,
              accountStatus:
                applicantProfile
                  ?.account_status ||
                'unknown',
              canReceiveLinks:
                applicant.availability ===
                  'available' &&
                applicantProfile
                  ?.account_status ===
                  'active',
            },
          ];
        }
      )
    );

  const clientIds =
    unique(
      allocations.map(
        (allocation) =>
          allocation.client_id
      )
    );

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
    .in(
      'id',
      clientIds
    );

  if (clientsError) {
    throw new ApiError(
      500,
      'Allocated Clients could not be loaded.'
    );
  }

  const clients =
    clientRows || [];

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

    clientProfiles =
      data || [];
  }

  const clientProfilesById =
    new Map(
      clientProfiles.map(
        (clientProfile) => [
          clientProfile.id,
          clientProfile,
        ]
      )
    );

  const clientsById =
    new Map(
      clients.map(
        (client) => {
          const clientProfile =
            clientProfilesById.get(
              client.user_id
            );

          return [
            client.id,
            {
              id: client.id,
              fullName:
                clientProfile
                  ?.full_name ||
                'Unnamed Client',
              email:
                clientProfile
                  ?.email ||
                '',
              plan:
                client.plan || '',
              status:
                client.status,
              accountStatus:
                clientProfile
                  ?.account_status ||
                'unknown',
            },
          ];
        }
      )
    );

  const applicantIdsByAllocation =
    new Map();

  allocationApplicants.forEach(
    (row) => {
      const current =
        applicantIdsByAllocation.get(
          row.allocation_id
        ) || [];

      current.push(
        row.applicant_id
      );

      applicantIdsByAllocation.set(
        row.allocation_id,
        unique(current)
      );
    }
  );

  const results =
    allocations
      .map((allocation) => {
        const client =
          clientsById.get(
            allocation.client_id
          );

        const eligibleApplicantIds =
          applicantIdsByAllocation.get(
            allocation.id
          ) || [];

        const applicants =
          eligibleApplicantIds
            .map(
              (applicantId) =>
                applicantsById.get(
                  applicantId
                )
            )
            .filter(Boolean);

        return {
          id: allocation.id,
          clientId:
            allocation.client_id,
          clientName:
            client?.fullName ||
            'Unnamed Client',
          clientPlan:
            client?.plan || '',
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
          instructions:
            allocation.instructions ||
            '',
          startDate:
            allocation.start_date,
          dueDate:
            allocation.due_date,
          applicants,
          canSubmit:
            client?.status ===
              'active' &&
            client?.accountStatus ===
              'active' &&
            applicants.some(
              (applicant) =>
                applicant.canReceiveLinks
            ),
        };
      })
      .filter(
        (allocation) =>
          allocation.canSubmit
      );

  res.setHeader(
    'Cache-Control',
    'no-store'
  );

  return res.status(200).json({
    allocations: results,
  });
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');

    return res.status(405).json({
      error:
        'Method not allowed.',
    });
  }

  try {
    return await getAllocations(
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
        'Linker work allocations API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          error?.message ||
          'Your work allocations could not be loaded.',
      });
  }
}
