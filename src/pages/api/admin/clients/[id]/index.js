import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';

const ALLOWED_STATUSES = new Set([
  'active',
  'paused',
  'completed',
]);

const ALLOWED_PRIORITIES = new Set([
  'high',
  'urgent',
  'critical',
]);

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');

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
    const requestedChanges = req.body || {};
    const changes = {};

    if (
      Object.prototype.hasOwnProperty.call(
        requestedChanges,
        'status'
      )
    ) {
      const status = String(
        requestedChanges.status
      ).toLowerCase();

      if (!ALLOWED_STATUSES.has(status)) {
        throw new ApiError(
          400,
          'Select a valid client status.'
        );
      }

      changes.status = status;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        requestedChanges,
        'priority'
      )
    ) {
      const priority = String(
        requestedChanges.priority
      ).toLowerCase();

      if (!ALLOWED_PRIORITIES.has(priority)) {
        throw new ApiError(
          400,
          'Select a valid client priority.'
        );
      }

      changes.priority = priority;
    }

    if (Object.keys(changes).length === 0) {
      throw new ApiError(
        400,
        'No supported client changes were provided.'
      );
    }

    const {
      data: client,
      error: updateError,
    } = await supabase
      .from('clients')
      .update(changes)
      .eq('id', clientId)
      .select('id, status, priority, updated_at')
      .single();

    if (updateError || !client) {
      console.error(
        'Unable to update client:',
        updateError
      );

      throw new ApiError(
        500,
        'The client could not be updated.'
      );
    }

    return res.status(200).json({
      message: 'Client updated successfully.',
      client: {
        id: client.id,
        status: client.status,
        priority: client.priority,
        updatedAt: client.updated_at,
      },
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error('Update client API error:', error);
    }

    return res.status(statusCode).json({
      error:
        statusCode >= 500
          ? 'Unable to update the client right now.'
          : error.message,
    });
  }
}
