import {
  createAdminClient,
} from '../supabase/server';

export class PortalApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'PortalApiError';
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
    throw new PortalApiError(
      401,
      'Authentication is required.'
    );
  }

  return token;
}

export async function requirePortalProfile(
  req
) {
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

  if (
    userError ||
    !user
  ) {
    throw new PortalApiError(
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
      email,
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
    throw new PortalApiError(
      403,
      'Your profile could not be verified.'
    );
  }

  if (
    profile.account_status !== 'active'
  ) {
    throw new PortalApiError(
      403,
      'Your account is not active.'
    );
  }

  return {
    accessToken,
    profile,
    supabase,
    user,
  };
}
