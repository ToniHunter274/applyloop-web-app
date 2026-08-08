import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';

const ALLOWED_STATUSES = new Set([
  'active',
  'suspended',
]);

function getApplicantId(req) {
  const applicantId = Array.isArray(req.query.id)
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
    res.setHeader('Allow', 'PATCH');

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const { supabase } =
      await requireAdmin(req);

    const applicantId =
      getApplicantId(req);

    const accountStatus = String(
      req.body?.accountStatus || ''
    )
      .trim()
      .toLowerCase();

    if (
      !ALLOWED_STATUSES.has(
        accountStatus
      )
    ) {
      throw new ApiError(
        400,
        'Select a valid applicant account status.'
      );
    }

    const {
      data: applicant,
      error: applicantError,
    } = await supabase
      .from('applicants')
      .select('id, user_id')
      .eq('id', applicantId)
      .single();

    if (
      applicantError ||
      !applicant
    ) {
      throw new ApiError(
        404,
        'The applicant could not be found.'
      );
    }

    const {
      data: statusRows,
      error: statusError,
    } = await supabase.rpc(
      'set_applicant_account_status',
      {
        p_applicant_id:
          applicant.id,
        p_account_status:
          accountStatus,
      }
    );

    const statusResult =
      Array.isArray(statusRows)
        ? statusRows[0]
        : statusRows;

    if (
      statusError ||
      !statusResult
    ) {
      console.error(
        'Unable to update applicant account status:',
        statusError
      );

      throw new ApiError(
        500,
        'The applicant account status could not be updated.'
      );
    }

    return res.status(200).json({
      message:
        accountStatus === 'suspended'
          ? 'Applicant paused and client assignments removed successfully.'
          : 'Applicant account reactivated successfully.',
      applicant: {
        id: applicant.id,
        userId: applicant.user_id,
        accountStatus:
          statusResult.account_status,
        updatedAt:
          statusResult.updated_at,
      },
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Update applicant status API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to update the applicant account right now.'
            : error.message,
      });
  }
}
