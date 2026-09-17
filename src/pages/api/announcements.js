import {
  ApiError,
} from '../../lib/auth/requireAdmin';
import {
  createAdminClient,
} from '../../lib/supabase/server';

const ALLOWED_ROLES = [
  'user_client',
  'applicant',
  'chief_applicant',
  'prompt_engineer',
  'team_auditor',
  'chief_auditor',
  'owner',
  'operations',
  'linker',
  'admin',
];

const MANAGER_ROLES =
  new Set([
    'owner',
    'operations',
    'admin',
  ]);

const ALLOWED_TONES =
  new Set([
    'info',
    'success',
    'warning',
    'critical',
  ]);

function getAccessToken(req) {
  const authorization =
    req.headers.authorization || '';

  const [
    scheme,
    token,
  ] =
    authorization.split(' ');

  if (
    scheme !== 'Bearer' ||
    !token
  ) {
    throw new ApiError(
      401,
      'Authentication is required.'
    );
  }

  return token;
}

async function requireActiveUser(req) {
  const accessToken =
    getAccessToken(req);

  const supabase =
    createAdminClient();

  const {
    data: {
      user,
    },
    error: userError,
  } =
    await supabase.auth
      .getUser(accessToken);

  if (
    userError ||
    !user
  ) {
    throw new ApiError(
      401,
      'Your session is invalid or has expired.'
    );
  }

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from('profiles')
      .select(
        'id, email, full_name, role, account_status'
      )
      .eq('id', user.id)
      .single();

  if (
    profileError ||
    !profile
  ) {
    throw new ApiError(
      403,
      'Your profile could not be verified.'
    );
  }

  if (
    profile.account_status !==
    'active'
  ) {
    throw new ApiError(
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

function canSeeAnnouncement(
  announcement,
  role
) {
  const audience =
    Array.isArray(
      announcement.audience_roles
    )
      ? announcement.audience_roles
      : [];

  return (
    audience.length === 0 ||
    audience.includes(role)
  );
}

function normalizeAudienceRoles(
  value
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((role) =>
          String(role || '')
            .trim()
        )
        .filter(Boolean)
    )
  );
}

function validateAudienceRoles(
  roles
) {
  const invalid =
    roles.find(
      (role) =>
        !ALLOWED_ROLES.includes(
          role
        )
    );

  if (invalid) {
    throw new ApiError(
      400,
      `Unsupported audience role: ${invalid}.`
    );
  }
}

function parseDate(
  value,
  fieldName
) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new ApiError(
      400,
      `${fieldName} must be a valid date.`
    );
  }

  return date;
}

export default async function handler(
  req,
  res
) {
  try {
    const {
      profile,
      supabase,
    } =
      await requireActiveUser(req);

    if (req.method === 'GET') {
      const manage =
        req.query.manage === '1';

      if (
        manage &&
        !MANAGER_ROLES.has(
          profile.role
        )
      ) {
        throw new ApiError(
          403,
          'You do not have permission to manage announcements.'
        );
      }

      let query =
        supabase
          .from(
            'platform_announcements'
          )
          .select(`
            id,
            title,
            message,
            tone,
            audience_roles,
            is_active,
            published_at,
            expires_at,
            created_by,
            created_at,
            updated_at
          `)
          .order(
            'published_at',
            {
              ascending: false,
            }
          )
          .limit(
            manage
              ? 100
              : 50
          );

      if (!manage) {
        query =
          query
            .eq(
              'is_active',
              true
            )
            .lte(
              'published_at',
              new Date()
                .toISOString()
            );
      }

      const {
        data,
        error,
      } =
        await query;

      if (error) {
        throw new ApiError(
          500,
          'Announcements could not be loaded.'
        );
      }

      const now =
        Date.now();

      const announcements =
        manage
          ? data || []
          : (data || [])
              .filter(
                (announcement) => {
                  if (
                    !canSeeAnnouncement(
                      announcement,
                      profile.role
                    )
                  ) {
                    return false;
                  }

                  if (
                    !announcement
                      .expires_at
                  ) {
                    return true;
                  }

                  return (
                    new Date(
                      announcement
                        .expires_at
                    ).getTime() >
                    now
                  );
                }
              )
              .slice(0, 10);

      return res
        .status(200)
        .json({
          announcements,
        });
    }

    if (req.method === 'POST') {
      if (
        !MANAGER_ROLES.has(
          profile.role
        )
      ) {
        throw new ApiError(
          403,
          'You do not have permission to publish announcements.'
        );
      }

      const title =
        String(
          req.body?.title ||
            ''
        ).trim();

      const message =
        String(
          req.body?.message ||
            ''
        ).trim();

      const tone =
        String(
          req.body?.tone ||
            'info'
        ).trim();

      const audienceRoles =
        normalizeAudienceRoles(
          req.body
            ?.audienceRoles
        );

      validateAudienceRoles(
        audienceRoles
      );

      if (
        title.length < 1 ||
        title.length > 200
      ) {
        throw new ApiError(
          400,
          'Title must contain between 1 and 200 characters.'
        );
      }

      if (
        message.length < 1 ||
        message.length > 3000
      ) {
        throw new ApiError(
          400,
          'Message must contain between 1 and 3000 characters.'
        );
      }

      if (
        !ALLOWED_TONES.has(
          tone
        )
      ) {
        throw new ApiError(
          400,
          'Announcement tone is invalid.'
        );
      }

      const publishedAt =
        parseDate(
          req.body
            ?.publishedAt,
          'Published date'
        ) ||
        new Date();

      const expiresAt =
        parseDate(
          req.body
            ?.expiresAt,
          'Expiry date'
        );

      if (
        expiresAt &&
        expiresAt <=
          publishedAt
      ) {
        throw new ApiError(
          400,
          'Expiry date must be after the published date.'
        );
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'platform_announcements'
          )
          .insert({
            title,
            message,
            tone,
            audience_roles:
              audienceRoles,
            is_active: true,
            published_at:
              publishedAt
                .toISOString(),
            expires_at:
              expiresAt
                ? expiresAt
                    .toISOString()
                : null,
            created_by:
              profile.id,
          })
          .select(`
            id,
            title,
            message,
            tone,
            audience_roles,
            is_active,
            published_at,
            expires_at,
            created_by,
            created_at,
            updated_at
          `)
          .single();

      if (error) {
        throw new ApiError(
          500,
          'Announcement could not be published.'
        );
      }

      return res
        .status(201)
        .json({
          announcement: data,
        });
    }

    if (req.method === 'PATCH') {
      if (
        !MANAGER_ROLES.has(
          profile.role
        )
      ) {
        throw new ApiError(
          403,
          'You do not have permission to update announcements.'
        );
      }

      const id =
        String(
          req.body?.id ||
            ''
        ).trim();

      const isActive =
        req.body?.isActive;

      if (!id) {
        throw new ApiError(
          400,
          'Announcement ID is required.'
        );
      }

      if (
        typeof isActive !==
        'boolean'
      ) {
        throw new ApiError(
          400,
          'isActive must be true or false.'
        );
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'platform_announcements'
          )
          .update({
            is_active:
              isActive,
          })
          .eq(
            'id',
            id
          )
          .select(`
            id,
            title,
            message,
            tone,
            audience_roles,
            is_active,
            published_at,
            expires_at,
            created_at,
            updated_at
          `)
          .single();

      if (error) {
        throw new ApiError(
          500,
          'Announcement could not be updated.'
        );
      }

      return res
        .status(200)
        .json({
          announcement: data,
        });
    }

    res.setHeader(
      'Allow',
      'GET, POST, PATCH'
    );

    return res
      .status(405)
      .json({
        error:
          'Method not allowed.',
      });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (
      statusCode >= 500
    ) {
      console.error(
        'Announcements API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to process announcements right now.'
            : error.message,
      });
  }
}
