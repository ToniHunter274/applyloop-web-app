import {
  ApiError,
} from '../../../lib/auth/requireAdmin';

import {
  requireClient,
} from '../../../lib/auth/requireClient';

import {
  ensureCurrentSubscriptionNotification,
  loadClientSubscription,
  serializeSubscription,
  syncClientSubscriptionLifecycle,
} from '../../../lib/subscriptions/clientSubscription';

export default async function handler(
  req,
  res
) {
  if (req.method !== 'GET') {
    res.setHeader(
      'Allow',
      'GET'
    );

    return res.status(405).json({
      error:
        'Method not allowed.',
    });
  }

  try {
    const {
      profile,
      supabase,
    } = await requireClient(req);

    const {
      data: client,
      error: clientError,
    } = await supabase
      .from('clients')
      .select(`
        id,
        user_id,
        plan,
        application_limit,
        applications_completed,
        status,
        created_at
      `)
      .eq(
        'user_id',
        profile.id
      )
      .single();

    if (
      clientError ||
      !client
    ) {
      throw new ApiError(
        404,
        'Your Client subscription could not be found.'
      );
    }

    let subscription =
      await loadClientSubscription(
        supabase,
        client
      );

    subscription =
      await syncClientSubscriptionLifecycle(
        supabase,
        subscription,
        client
      );

    const clientForSubscription = {
      ...client,
      status:
        subscription.status ===
          'paused'
          ? 'paused'
          : client.status,
    };

    await ensureCurrentSubscriptionNotification(
      supabase,
      subscription,
      clientForSubscription
    );

    const clientSubscription =
      serializeSubscription(
        subscription,
        clientForSubscription
      );

    // Delivery quota and Applicant target
    // progress are internal operational data.
    // Clients should not receive them.
    delete clientSubscription.usage;

    const {
      data: events,
      error: eventsError,
    } = await supabase
      .from(
        'client_subscription_events'
      )
      .select(`
        id,
        event_type,
        event_key,
        metadata,
        created_at
      `)
      .eq(
        'subscription_id',
        subscription.id
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      )
      .limit(20);

    if (eventsError) {
      throw new ApiError(
        500,
        'Subscription history could not be loaded.'
      );
    }

    return res.status(200).json({
      subscription:
        clientSubscription,
      events: events || [],
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Client subscription API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to load your subscription right now.'
            : error.message,
      });
  }
}
