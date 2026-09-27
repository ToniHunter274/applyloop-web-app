import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';

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

function validateTarget(value) {
  const target =
    Number(value);

  if (
    !Number.isInteger(target) ||
    target < 1
  ) {
    throw new ApiError(
      400,
      'Daily Application Target must be a whole number of 1 or more.'
    );
  }

  return target;
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

    const dailyApplicationTarget =
      validateTarget(
        req.body
          ?.dailyApplicationTarget
      );

    const {
      data: applicant,
      error,
    } = await supabase
      .from('applicants')
      .update({
        active_tasks:
          dailyApplicationTarget,
      })
      .eq(
        'id',
        applicantId
      )
      .select(`
        id,
        active_tasks,
        updated_at
      `)
      .maybeSingle();

    if (error) {
      console.error(
        'Unable to update Daily Application Target:',
        error
      );

      throw new ApiError(
        500,
        'The Daily Application Target could not be updated.'
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
        'Daily Application Target updated.',
      applicant: {
        id: applicant.id,
        activeTasks:
          applicant.active_tasks,
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
        'Update Daily Application Target API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to update the Daily Application Target right now.'
            : error.message,
      });
  }
}
