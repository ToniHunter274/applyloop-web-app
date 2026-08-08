import {
  createAdminClient,
} from '../../../lib/supabase/server';

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

function getAccessToken(req) {
  const authorization =
    req.headers.authorization || '';

  const [scheme, token] =
    authorization.split(' ');

  if (
    scheme !== 'Bearer' ||
    !token
  ) {
    throw new ApiError(
      401,
      'Authentication is required.'
    );
  }

  return token;
}

async function requireApplicant(req) {
  const accessToken =
    getAccessToken(req);

  const supabase =
    createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(
    accessToken
  );

  if (userError || !user) {
    throw new ApiError(
      401,
      'Your session is invalid or has expired.'
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
      role,
      account_status
    `)
    .eq('id', user.id)
    .single();

  if (
    profileError ||
    !profile
  ) {
    throw new ApiError(
      403,
      'Your profile could not be verified.'
    );
  }

  if (
    profile.role !== 'applicant' ||
    profile.account_status !==
      'active'
  ) {
    throw new ApiError(
      403,
      'You do not have access to Applicant clients.'
    );
  }

  const {
    data: applicant,
    error: applicantError,
  } = await supabase
    .from('applicants')
    .select('id, user_id')
    .eq('user_id', user.id)
    .single();

  if (
    applicantError ||
    !applicant
  ) {
    throw new ApiError(
      404,
      'Your Applicant record could not be found.'
    );
  }

  return {
    applicant,
    supabase,
  };
}

async function getClients(req, res) {
  const {
    applicant,
    supabase,
  } = await requireApplicant(req);

  const {
    data: assignmentRows,
    error: assignmentsError,
  } = await supabase
    .from(
      'client_applicant_assignments'
    )
    .select(`
      client_id,
      created_at
    `)
    .eq(
      'applicant_id',
      applicant.id
    )
    .order('created_at', {
      ascending: false,
    });

  if (assignmentsError) {
    console.error(
      'Unable to load Applicant client assignments:',
      assignmentsError
    );

    throw new ApiError(
      500,
      'Your assigned clients could not be loaded.'
    );
  }

  const clientIds =
    (assignmentRows || []).map(
      (assignment) =>
        assignment.client_id
    );

  if (clientIds.length === 0) {
    return res.status(200).json({
      clients: [],
    });
  }

  const {
    data: clientRows,
    error: clientsError,
  } = await supabase
    .from('clients')
    .select(`
      id,
      user_id,
      plan,
      application_limit,
      applications_completed,
      interviews,
      gender,
      notes,
      status
    `)
    .in('id', clientIds);

  if (clientsError) {
    console.error(
      'Unable to load assigned Clients:',
      clientsError
    );

    throw new ApiError(
      500,
      'Your assigned clients could not be loaded.'
    );
  }

  const userIds =
    (clientRows || []).map(
      (client) => client.user_id
    );

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
        country
      `)
      .in('id', userIds);

    if (profilesError) {
      console.error(
        'Unable to load assigned Client profiles:',
        profilesError
      );

      throw new ApiError(
        500,
        'Your assigned client profiles could not be loaded.'
      );
    }

    profiles =
      profileRows || [];
  }

  const profilesById = new Map(
    profiles.map((profile) => [
      profile.id,
      profile,
    ])
  );

  const clientsById = new Map(
    (clientRows || []).map(
      (client) => [
        client.id,
        client,
      ]
    )
  );

  const clients =
    clientIds
      .map((clientId) => {
        const client =
          clientsById.get(
            clientId
          );

        if (!client) {
          return null;
        }

        const profile =
          profilesById.get(
            client.user_id
          );

        const applicationLimit =
          Number(
            client.application_limit ||
              0
          );

        const applicationsCompleted =
          Number(
            client.applications_completed ||
              0
          );

        const progress =
          applicationLimit > 0
            ? Math.min(
                100,
                Math.round(
                  (
                    applicationsCompleted /
                    applicationLimit
                  ) * 100
                )
              )
            : 0;

        return {
          id: client.id,
          name:
            profile?.full_name ||
            'Unnamed Client',
          role: 'Client',
          email:
            profile?.email || '',
          phone:
            profile?.phone || '',
          nationality:
            profile?.country ||
            'Not provided',
          state: '',
          gender:
            client.gender ||
            'Not provided',
          disability:
            'Not provided',
          veteran:
            'Not provided',
          workType:
            'Not provided',
          schedule:
            'Not provided',
          contract:
            client.plan ||
            'Not provided',
          locations: [],
          targetCountries:
            profile?.country ||
            'Not provided',
          progress,
          rejectedRoles: 0,
          selectedRoles: 0,
          interviews:
            Number(
              client.interviews ||
                0
            ),
          feedbacks: 0,
          offers: 0,
          applications:
            applicationsCompleted,
          status:
            client.status ||
            'active',
          notes:
            client.notes ||
            'No admin notes available.',
        };
      })
      .filter(Boolean);

  return res.status(200).json({
    clients,
  });
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'GET') {
    res.setHeader(
      'Allow',
      'GET'
    );

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    return await getClients(
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
        'Applicant clients API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to load your assigned clients right now.'
            : error.message,
      });
  }
}
