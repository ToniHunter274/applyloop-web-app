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
    const clientId = Array.isArray(req.query.id)
      ? req.query.id[0]
      : req.query.id;

    if (!clientId) {
      throw new ApiError(
        400,
        'A client ID is required.'
      );
    }

    const { supabase } = await requireAdmin(req);

    const {
      data: client,
      error: clientError,
    } = await supabase
      .from('clients')
      .select('id, user_id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      throw new ApiError(
        404,
        'The client could not be found.'
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', client.user_id)
      .single();

    if (profileError || !profile) {
      throw new ApiError(
        404,
        'The client profile could not be found.'
      );
    }

    const temporaryPassword =
      generateTemporaryPassword();

    const { error: passwordError } =
      await supabase.auth.admin.updateUserById(
        client.user_id,
        {
          password: temporaryPassword,
        }
      );

    if (passwordError) {
      console.error(
        'Unable to reset client password:',
        passwordError
      );

      throw new ApiError(
        500,
        'The client password could not be reset.'
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
        'Reset client password API error:',
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
