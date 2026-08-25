import {
  PortalApiError,
  requirePortalProfile,
} from '../../../lib/auth/requirePortalProfile';

function validateRating(value) {
  const rating = Number(value);

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new PortalApiError(
      400,
      'Rating must be a whole number from 1 to 5.'
    );
  }

  return rating;
}

async function getClient(
  supabase,
  profileId
) {
  const {
    data: client,
    error,
  } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', profileId)
    .single();

  if (
    error ||
    !client
  ) {
    throw new PortalApiError(
      404,
      'Your Client account could not be found.'
    );
  }

  return client;
}

async function requireClientAccess(req) {
  const {
    profile,
    supabase,
  } = await requirePortalProfile(req);

  if (
    profile.role !==
    'user_client'
  ) {
    throw new PortalApiError(
      403,
      'Only Clients can rate Applicants.'
    );
  }

  const client =
    await getClient(
      supabase,
      profile.id
    );

  return {
    client,
    profile,
    supabase,
  };
}

async function listRatings(
  req,
  res
) {
  const {
    client,
    supabase,
  } = await requireClientAccess(
    req
  );

  const {
    data: assignments,
    error: assignmentsError,
  } = await supabase
    .from(
      'client_applicant_assignments'
    )
    .select('applicant_id')
    .eq(
      'client_id',
      client.id
    );

  if (assignmentsError) {
    throw new PortalApiError(
      500,
      'Assigned Applicants could not be loaded.'
    );
  }

  const applicantIds = [
    ...new Set(
      (assignments || []).map(
        (assignment) =>
          assignment.applicant_id
      )
    ),
  ];

  if (
    applicantIds.length === 0
  ) {
    return res.status(200).json({
      applicants: [],
    });
  }

  const {
    data: applicantRows,
    error: applicantsError,
  } = await supabase
    .from('applicants')
    .select(`
      id,
      user_id
    `)
    .in(
      'id',
      applicantIds
    );

  if (applicantsError) {
    throw new PortalApiError(
      500,
      'Applicant details could not be loaded.'
    );
  }

  const userIds = [
    ...new Set(
      (applicantRows || []).map(
        (applicant) =>
          applicant.user_id
      )
    ),
  ];

  let profileRows = [];

  if (userIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name
      `)
      .in(
        'id',
        userIds
      );

    if (error) {
      throw new PortalApiError(
        500,
        'Applicant profiles could not be loaded.'
      );
    }

    profileRows = data || [];
  }

  const {
    data: ratingRows,
    error: ratingsError,
  } = await supabase
    .from(
      'applicant_client_ratings'
    )
    .select(`
      applicant_id,
      rating,
      updated_at
    `)
    .eq(
      'client_id',
      client.id
    )
    .in(
      'applicant_id',
      applicantIds
    );

  if (ratingsError) {
    throw new PortalApiError(
      500,
      'Applicant ratings could not be loaded.'
    );
  }

  const profilesById =
    new Map(
      profileRows.map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    );

  const ratingsByApplicantId =
    new Map(
      (ratingRows || []).map(
        (rating) => [
          rating.applicant_id,
          rating,
        ]
      )
    );

  const applicants =
    (applicantRows || []).map(
      (applicant) => {
        const profile =
          profilesById.get(
            applicant.user_id
          );

        const rating =
          ratingsByApplicantId.get(
            applicant.id
          );

        return {
          id: applicant.id,
          fullName:
            profile?.full_name ||
            'Applicant',
          rating:
            rating?.rating || 0,
          ratingUpdatedAt:
            rating?.updated_at ||
            null,
        };
      }
    );

  return res.status(200).json({
    applicants,
  });
}

async function saveRating(
  req,
  res
) {
  const {
    client,
    supabase,
  } = await requireClientAccess(
    req
  );

  const applicantId =
    String(
      req.body?.applicantId ||
      ''
    ).trim();

  if (!applicantId) {
    throw new PortalApiError(
      400,
      'Applicant is required.'
    );
  }

  const rating =
    validateRating(
      req.body?.rating
    );

  const {
    data: assignment,
    error: assignmentError,
  } = await supabase
    .from(
      'client_applicant_assignments'
    )
    .select(`
      client_id,
      applicant_id
    `)
    .eq(
      'client_id',
      client.id
    )
    .eq(
      'applicant_id',
      applicantId
    )
    .maybeSingle();

  if (assignmentError) {
    throw new PortalApiError(
      500,
      'The Applicant assignment could not be verified.'
    );
  }

  if (!assignment) {
    throw new PortalApiError(
      403,
      'You can only rate an Applicant currently assigned to your account.'
    );
  }

  const {
    data: savedRating,
    error: ratingError,
  } = await supabase
    .from(
      'applicant_client_ratings'
    )
    .upsert(
      {
        client_id:
          client.id,
        applicant_id:
          applicantId,
        rating,
      },
      {
        onConflict:
          'client_id,applicant_id',
      }
    )
    .select(`
      applicant_id,
      rating,
      updated_at
    `)
    .single();

  if (
    ratingError ||
    !savedRating
  ) {
    throw new PortalApiError(
      500,
      'Your Applicant rating could not be saved.'
    );
  }

  return res.status(200).json({
    message:
      'Applicant rating saved.',
    rating: {
      applicantId:
        savedRating.applicant_id,
      rating:
        savedRating.rating,
      updatedAt:
        savedRating.updated_at,
    },
  });
}

export default async function handler(
  req,
  res
) {
  if (
    !['GET', 'PUT'].includes(
      req.method
    )
  ) {
    res.setHeader(
      'Allow',
      'GET, PUT'
    );

    return res.status(405).json({
      error:
        'Method not allowed.',
    });
  }

  try {
    if (
      req.method === 'GET'
    ) {
      return await listRatings(
        req,
        res
      );
    }

    return await saveRating(
      req,
      res
    );
  } catch (error) {
    const statusCode =
      error instanceof
      PortalApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Applicant rating API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Applicant ratings are unavailable right now.'
            : error.message,
      });
  }
}
