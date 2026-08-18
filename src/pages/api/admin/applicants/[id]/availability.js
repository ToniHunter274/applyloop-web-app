import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';

const ALLOWED_AVAILABILITY =
  new Set([
    'available',
    'inactive',
  ]);

function getApplicantId(req) {
  const applicantId =
    Array.isArray(req.query.id)
      ? req.query.id[0]
      : req.query.id;

  if (!applicantId) {
    throw new ApiError(
      400,
      'An applicant ID is required.'
    );
  }

  return applicantId;
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'PATCH') {
    res.setHeader(
      'Allow',
      'PATCH'
    );

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const { supabase } =
      await requireAdmin(req);

    const applicantId =
      getApplicantId(req);

    const availability =
      String(
        req.body?.availability ||
        ''
      )
        .trim()
        .toLowerCase();

    if (
      !ALLOWED_AVAILABILITY.has(
        availability
      )
    ) {
      throw new ApiError(
        400,
        'Select a valid applicant availability.'
      );
    }

    const {
      data: applicant,
      error: applicantError,
    } = await supabase
      .from('applicants')
      .update({
        availability,
      })
      .eq(
        'id',
        applicantId
      )
      .select(`
        id,
        user_id,
        availability,
        updated_at
      `)
      .maybeSingle();

    if (applicantError) {
      console.error(
        'Unable to update applicant availability:',
        applicantError
      );

      throw new ApiError(
        500,
        'The applicant availability could not be updated.'
      );
    }

    if (!applicant) {
      throw new ApiError(
        404,
        'The applicant could not be found.'
      );
    }

    return res.status(200).json({
      message:
        availability ===
        'available'
          ? 'Applicant is now available for Client assignments.'
          : 'Applicant is now inactive for new Client assignments.',
      applicant: {
        id: applicant.id,
        userId:
          applicant.user_id,
        availability:
          applicant.availability,
        updatedAt:
          applicant.updated_at,
      },
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Update applicant availability API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to update applicant availability right now.'
            : error.message,
      });
  }
}
