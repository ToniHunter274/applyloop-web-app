import { ApiError } from '../../../lib/auth/requireAdmin';
import { requireClient } from '../../../lib/auth/requireClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const { supabase } = await requireClient(req);
    const now = new Date();

    const {
      data,
      error,
    } = await supabase
      .from('platform_announcements')
      .select(`
        id,
        title,
        message,
        tone,
        audience_roles,
        published_at,
        expires_at
      `)
      .eq('is_active', true)
      .lte('published_at', now.toISOString())
      .order('published_at', {
        ascending: false,
      })
      .limit(50);

    if (error) {
      throw new ApiError(
        500,
        'Important updates could not be loaded.'
      );
    }

    const announcements = (data || [])
      .filter((announcement) => {
        const audienceRoles =
          Array.isArray(
            announcement.audience_roles
          )
            ? announcement.audience_roles
            : [];

        const visibleToClient =
          audienceRoles.length === 0 ||
          audienceRoles.includes(
            'user_client'
          );

        if (!visibleToClient) {
          return false;
        }

        if (!announcement.expires_at) {
          return true;
        }

        return (
          new Date(announcement.expires_at) >
          now
        );
      })
      .slice(0, 10);

    return res.status(200).json({
      announcements,
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Client announcements API error:',
        error
      );
    }

    return res.status(statusCode).json({
      error:
        statusCode >= 500
          ? 'Unable to load important updates right now.'
          : error.message,
    });
  }
}
