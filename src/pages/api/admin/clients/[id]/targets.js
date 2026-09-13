import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';


function normalizeClientId(value) {
  const clientId =
    Array.isArray(value)
      ? value[0]
      : value;

  if (!clientId) {
    throw new ApiError(
      400,
      'Client ID is required.'
    );
  }

  return clientId;
}


async function loadTargetAllocation(
  supabase,
  clientId
) {
  const {
    data: client,
    error: clientError,
  } = await supabase
    .from('clients')
    .select(`
      id,
      user_id,
      plan,
      application_limit,
      status
    `)
    .eq('id', clientId)
    .single();

  if (
    clientError ||
    !client
  ) {
    throw new ApiError(
      404,
      'The Client could not be found.'
    );
  }


  const {
    data: subscription,
    error: subscriptionError,
  } = await supabase
    .from('client_subscriptions')
    .select(`
      id,
      status,
      current_period_start,
      current_period_end,
      grace_period_ends_at
    `)
    .eq(
      'client_id',
      client.id
    )
    .single();

  if (
    subscriptionError ||
    !subscription
  ) {
    throw new ApiError(
      404,
      'The Client subscription could not be found.'
    );
  }


  const {
    data: assignmentRows,
    error: assignmentError,
  } = await supabase
    .from(
      'client_applicant_assignments'
    )
    .select(`
      applicant_id
    `)
    .eq(
      'client_id',
      client.id
    );

  if (assignmentError) {
    throw new ApiError(
      500,
      'Assigned Applicants could not be loaded.'
    );
  }


  const applicantIds =
    (assignmentRows || []).map(
      (assignment) =>
        assignment.applicant_id
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
        availability
      `)
      .in(
        'id',
        applicantIds
      );

    if (error) {
      throw new ApiError(
        500,
        'Applicant information could not be loaded.'
      );
    }

    applicantRows = data || [];
  }


  const applicantUserIds =
    applicantRows.map(
      (applicant) =>
        applicant.user_id
    );

  let profiles = [];

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

    profiles = data || [];
  }


  const {
    data: targetRows,
    error: targetError,
  } = await supabase
    .from(
      'client_applicant_targets'
    )
    .select(`
      applicant_id,
      application_target
    `)
    .eq(
      'subscription_id',
      subscription.id
    )
    .eq(
      'period_start',
      subscription.current_period_start
    );

  if (targetError) {
    throw new ApiError(
      500,
      'Applicant targets could not be loaded.'
    );
  }


  const {
    data: applicationRows,
    error: applicationError,
  } = await supabase
    .from('applications')
    .select(`
      created_by
    `)
    .eq(
      'client_id',
      client.id
    )
    .gte(
      'applied_at',
      `${subscription.current_period_start}T00:00:00Z`
    )
    .lt(
      'applied_at',
      `${subscription.current_period_end}T00:00:00Z`
    );

  if (applicationError) {
    throw new ApiError(
      500,
      'Current-period application progress could not be loaded.'
    );
  }


  const profilesById =
    new Map(
      profiles.map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    );

  const targetsByApplicantId =
    new Map(
      (targetRows || []).map(
        (target) => [
          target.applicant_id,
          Number(
            target.application_target ||
              0
          ),
        ]
      )
    );


  const completedByUserId =
    new Map();

  (applicationRows || []).forEach(
    (application) => {
      const userId =
        application.created_by;

      if (!userId) {
        return;
      }

      completedByUserId.set(
        userId,
        (
          completedByUserId.get(
            userId
          ) || 0
        ) + 1
      );
    }
  );


  const applicants =
    applicantRows
      .map((applicant) => {
        const profile =
          profilesById.get(
            applicant.user_id
          );

        const target =
          targetsByApplicantId.get(
            applicant.id
          ) || 0;

        const completed =
          completedByUserId.get(
            applicant.user_id
          ) || 0;

        const remaining =
          Math.max(
            0,
            target - completed
          );

        const progressPercent =
          target > 0
            ? Math.min(
                100,
                Math.round(
                  (
                    completed /
                    target
                  ) * 100
                )
              )
            : 0;

        return {
          id: applicant.id,
          fullName:
            profile?.full_name ||
            'Unnamed Applicant',
          email:
            profile?.email || '',
          availability:
            applicant.availability,
          accountStatus:
            profile?.account_status ||
            'active',
          target,
          completed,
          remaining,
          progressPercent,
        };
      })
      .sort(
        (first, second) =>
          first.fullName.localeCompare(
            second.fullName
          )
      );


  const allocated =
    applicants.reduce(
      (total, applicant) =>
        total +
        Number(
          applicant.target || 0
        ),
      0
    );

  const allowance =
    Number(
      client.application_limit || 0
    );


  return {
    clientId: client.id,
    plan: client.plan,
    serviceStatus:
      client.status,
    subscriptionStatus:
      subscription.status,
    periodStart:
      subscription.current_period_start,
    periodEnd:
      subscription.current_period_end,
    gracePeriodEndsAt:
      subscription.grace_period_ends_at,
    allowance,
    allocated,
    unallocated:
      Math.max(
        0,
        allowance - allocated
      ),
    applicants,
  };
}


function normalizeTargets(
  value
) {
  if (!Array.isArray(value)) {
    throw new ApiError(
      400,
      'Applicant targets are required.'
    );
  }

  return value.map(
    (target) => {
      const applicantId =
        String(
          target?.applicantId || ''
        ).trim();

      const applicationTarget =
        Number(
          target?.applicationTarget
        );

      if (!applicantId) {
        throw new ApiError(
          400,
          'Each target must include an Applicant.'
        );
      }

      if (
        !Number.isInteger(
          applicationTarget
        ) ||
        applicationTarget < 0
      ) {
        throw new ApiError(
          400,
          'Applicant targets must be whole numbers of zero or more.'
        );
      }

      return {
        applicant_id:
          applicantId,
        application_target:
          applicationTarget,
      };
    }
  );
}


export default async function handler(
  req,
  res
) {
  if (
    ![
      'GET',
      'PATCH',
    ].includes(req.method)
  ) {
    res.setHeader(
      'Allow',
      'GET, PATCH'
    );

    return res.status(405).json({
      error:
        'Method not allowed.',
    });
  }

  try {
    const {
      supabase,
    } = await requireAdmin(req);

    const clientId =
      normalizeClientId(
        req.query.id
      );


    if (req.method === 'GET') {
      const allocation =
        await loadTargetAllocation(
          supabase,
          clientId
        );

      return res
        .status(200)
        .json({
          allocation,
        });
    }


    const targets =
      normalizeTargets(
        req.body?.targets
      );

    const current =
      await loadTargetAllocation(
        supabase,
        clientId
      );

    const expectedApplicantIds =
      new Set(
        current.applicants.map(
          (applicant) =>
            applicant.id
        )
      );

    const suppliedApplicantIds =
      new Set(
        targets.map(
          (target) =>
            target.applicant_id
        )
      );

    if (
      expectedApplicantIds.size !==
        suppliedApplicantIds.size ||
      [
        ...expectedApplicantIds,
      ].some(
        (applicantId) =>
          !suppliedApplicantIds.has(
            applicantId
          )
      )
    ) {
      throw new ApiError(
        400,
        'A target must be supplied for every Applicant currently assigned to this Client.'
      );
    }


    const totalTarget =
      targets.reduce(
        (total, target) =>
          total +
          target.application_target,
        0
      );

    if (
      totalTarget >
      current.allowance
    ) {
      throw new ApiError(
        400,
        `Targets exceed the Client allowance by ${
          totalTarget -
          current.allowance
        } applications.`
      );
    }


    const {
      error: updateError,
    } = await supabase.rpc(
      'set_client_applicant_targets',
      {
        p_client_id:
          clientId,
        p_targets:
          targets,
      }
    );

    if (updateError) {
      console.error(
        'Unable to update Applicant targets:',
        updateError
      );

      throw new ApiError(
        400,
        updateError.message ||
          'Applicant targets could not be updated.'
      );
    }


    const allocation =
      await loadTargetAllocation(
        supabase,
        clientId
      );

    return res
      .status(200)
      .json({
        message:
          'Applicant targets updated successfully.',
        allocation,
      });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Client target API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to manage Applicant targets right now.'
            : error.message,
      });
  }
}
