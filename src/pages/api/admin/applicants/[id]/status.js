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

    if (
      accountStatus === 'suspended'
    ) {
      const {
        error: assignmentDeleteError,
      } = await supabase
        .from(
          'client_applicant_assignments'
        )
        .delete()
        .eq(
          'applicant_id',
          applicant.id
        );

      if (assignmentDeleteError) {
        console.error(
          'Unable to remove paused Applicant assignments:',
          assignmentDeleteError
        );

        throw new ApiError(
          500,
          'The Applicant assignments could not be removed.'
        );
      }
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .update({
        account_status: accountStatus,
      })
      .eq('id', applicant.user_id)
      .eq('role', 'applicant')
      .select(`
        id,
        account_status,
        updated_at
      `)
      .single();

    if (
      profileError ||
      !profile
    ) {
      console.error(
        'Unable to update applicant account status:',
        profileError
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
          profile.account_status,
        updatedAt:
          profile.updated_at,
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
