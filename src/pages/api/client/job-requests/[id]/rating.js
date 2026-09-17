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
      'The Job Link ID is invalid.'
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
    const requestId =
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
      data: request,
      error: requestError,
    } =
      await supabase
        .from(
          'client_job_requests'
        )
        .select(`
          id,
          client_id,
          request_source
        `)
        .eq(
          'id',
          requestId
        )
        .eq(
          'client_id',
          client.id
        )
        .maybeSingle();

    if (requestError) {
      throw new ApiError(
        500,
        'The Job Link could not be verified.'
      );
    }

    if (!request) {
      throw new ApiError(
        404,
        'Job Link not found.'
      );
    }

    if (
      request.request_source ===
      'client'
    ) {
      throw new ApiError(
        400,
        'You cannot rate a Job Link that you submitted yourself.'
      );
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
            'job_request_client_ratings'
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
            'job_request_id',
            request.id
          )
          .maybeSingle();

      if (ratingError) {
        throw new ApiError(
          500,
          'The Job Link rating could not be loaded.'
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
          'job_request_client_ratings'
        )
        .upsert(
          {
            client_id:
              client.id,
            job_request_id:
              request.id,
            rating,
            note,
          },
          {
            onConflict:
              'client_id,job_request_id',
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
        'The Job Link rating could not be saved.'
      );
    }

    return res
      .status(200)
      .json({
        message:
          'Job Link rating saved.',
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
        'Job Link rating API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'The Job Link rating is unavailable right now.'
            : error.message,
      });
  }
}
