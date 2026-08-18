import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';
import {
  generateTemporaryPassword,
} from '../../../../../lib/auth/generateTemporaryPassword';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const applicantId = Array.isArray(req.query.id)
      ? req.query.id[0]
      : req.query.id;

    if (!applicantId) {
      throw new ApiError(
        400,
        'An applicant ID is required.'
      );
    }

    const { supabase } = await requireAdmin(req);

    const {
      data: applicant,
      error: applicantError,
    } = await supabase
      .from('applicants')
      .select('id, user_id')
      .eq('id', applicantId)
      .single();

    if (applicantError || !applicant) {
      throw new ApiError(
        404,
        'The applicant could not be found.'
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', applicant.user_id)
      .single();

    if (profileError || !profile) {
      throw new ApiError(
        404,
        'The applicant profile could not be found.'
      );
    }

    const temporaryPassword =
      generateTemporaryPassword();

    const { error: passwordError } =
      await supabase.auth.admin.updateUserById(
        applicant.user_id,
        {
          password: temporaryPassword,
        }
      );

    if (passwordError) {
      console.error(
        'Unable to reset applicant password:',
        passwordError
      );

      throw new ApiError(
        500,
        'The applicant password could not be reset.'
      );
    }

    return res.status(200).json({
      message:
        'A new temporary password was generated.',
      credentials: {
        email: profile.email,
        temporaryPassword,
      },
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Reset applicant password API error:',
        error
      );
    }

    return res.status(statusCode).json({
      error:
        statusCode >= 500
          ? 'Unable to reset the password right now.'
          : error.message,
    });
  }
}
