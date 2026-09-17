import {
  ApiError,
} from '../../../../../lib/auth/requireAdmin';
import {
  requireClient,
} from '../../../../../lib/auth/requireClient';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateId(value) {
  const id =
    Array.isArray(value)
      ? value[0]
      : value;

  if (
    typeof id !== 'string' ||
    !UUID_PATTERN.test(id)
  ) {
    throw new ApiError(
      400,
      'The Application ID is invalid.'
    );
  }

  return id;
}

function validateRating(value) {
  const rating =
    Number(value);

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new ApiError(
      400,
      'Rating must be a whole number from 1 to 5.'
    );
  }

  return rating;
}

function validateNote(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const note =
    String(value).trim();

  if (
    note.length > 1000
  ) {
    throw new ApiError(
      400,
      'Rating feedback must be 1000 characters or fewer.'
    );
  }

  return note || null;
}

async function getClient(
  supabase,
  profileId
) {
  const {
    data,
    error,
  } =
    await supabase
      .from('clients')
      .select('id')
      .eq(
        'user_id',
        profileId
      )
      .single();

  if (
    error ||
    !data
  ) {
    throw new ApiError(
      404,
      'Your Client account could not be found.'
    );
  }

  return data;
}

export default async function handler(
  req,
  res
) {
  if (
    ![
      'GET',
      'PUT',
    ].includes(req.method)
  ) {
    res.setHeader(
      'Allow',
      'GET, PUT'
    );

    return res
      .status(405)
      .json({
        error:
          'Method not allowed.',
      });
  }

  try {
    const applicationId =
      validateId(req.query.id);

    const {
      profile,
      supabase,
    } =
      await requireClient(req);

    const client =
      await getClient(
        supabase,
        profile.id
      );

    const {
      data: application,
      error: applicationError,
    } =
      await supabase
        .from('applications')
        .select(`
          id,
          client_id,
          created_by
        `)
        .eq(
          'id',
          applicationId
        )
        .eq(
          'client_id',
          client.id
        )
        .maybeSingle();

    if (applicationError) {
      throw new ApiError(
        500,
        'The Application could not be verified.'
      );
    }

    if (!application) {
      throw new ApiError(
        404,
        'Application not found.'
      );
    }

    let applicantId =
      null;

    if (
      application.created_by
    ) {
      const {
        data: applicant,
        error: applicantError,
      } =
        await supabase
          .from('applicants')
          .select('id')
          .eq(
            'user_id',
            application.created_by
          )
          .maybeSingle();

      if (applicantError) {
        throw new ApiError(
          500,
          'The Applicant could not be identified.'
        );
      }

      applicantId =
        applicant?.id ||
        null;
    }

    if (
      req.method === 'GET'
    ) {
      const {
        data: rating,
        error: ratingError,
      } =
        await supabase
          .from(
            'application_client_ratings'
          )
          .select(`
            rating,
            note,
            updated_at
          `)
          .eq(
            'client_id',
            client.id
          )
          .eq(
            'application_id',
            application.id
          )
          .maybeSingle();

      if (ratingError) {
        throw new ApiError(
          500,
          'The Application rating could not be loaded.'
        );
      }

      return res
        .status(200)
        .json({
          rating: rating
            ? {
                value:
                  rating.rating,
                note:
                  rating.note ||
                  '',
                updatedAt:
                  rating.updated_at,
              }
            : null,
        });
    }

    const rating =
      validateRating(
        req.body?.rating
      );

    const note =
      validateNote(
        req.body?.note
      );

    const {
      data: saved,
      error: saveError,
    } =
      await supabase
        .from(
          'application_client_ratings'
        )
        .upsert(
          {
            client_id:
              client.id,
            application_id:
              application.id,
            applicant_id:
              applicantId,
            rating,
            note,
          },
          {
            onConflict:
              'client_id,application_id',
          }
        )
        .select(`
          rating,
          note,
          updated_at
        `)
        .single();

    if (
      saveError ||
      !saved
    ) {
      throw new ApiError(
        500,
        'The Application rating could not be saved.'
      );
    }

    return res
      .status(200)
      .json({
        message:
          'Application rating saved.',
        rating: {
          value:
            saved.rating,
          note:
            saved.note ||
            '',
          updatedAt:
            saved.updated_at,
        },
      });
  } catch (error) {
    const statusCode =
      error instanceof
      ApiError
        ? error.statusCode
        : 500;

    if (
      statusCode >= 500
    ) {
      console.error(
        'Application rating API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'The Application rating is unavailable right now.'
            : error.message,
      });
  }
}
