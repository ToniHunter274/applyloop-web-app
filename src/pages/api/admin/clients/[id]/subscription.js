import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';

import {
  deriveSubscriptionState,
  getPlanLabel,
  syncClientSubscriptionLifecycle,
} from '../../../../../lib/subscriptions/clientSubscription';


function getClientId(value) {
  const clientId =
    Array.isArray(value)
      ? value[0]
      : value;

  if (!clientId) {
    throw new ApiError(
      400,
      'Client ID is required.'
    );
  }

  return clientId;
}


async function loadSubscription(
  supabase,
  clientId
) {
  const {
    data: client,
    error: clientError,
  } = await supabase
    .from('clients')
    .select(`
      id,
      plan,
      application_limit,
      status
    `)
    .eq(
      'id',
      clientId
    )
    .single();

  if (
    clientError ||
    !client
  ) {
    throw new ApiError(
      404,
      'The Client could not be found.'
    );
  }


  let {
    data: subscription,
    error: subscriptionError,
  } = await supabase
    .from('client_subscriptions')
    .select('*')
    .eq(
      'client_id',
      clientId
    )
    .single();

  if (
    subscriptionError ||
    !subscription
  ) {
    throw new ApiError(
      404,
      'The Client subscription could not be found.'
    );
  }


  subscription =
    await syncClientSubscriptionLifecycle(
      supabase,
      subscription,
      client
    );


  const effectiveClient = {
    ...client,
    status:
      subscription.status ===
        'paused'
        ? 'paused'
        : client.status,
  };


  const state =
    deriveSubscriptionState(
      subscription,
      effectiveClient
    );


  return {
    client,
    subscription: {
      id:
        subscription.id,
      plan:
        subscription.plan,
      planLabel:
        getPlanLabel(
          subscription.plan
        ),
      status:
        subscription.status,
      pauseReason:
        subscription.pause_reason,
      lifecycle:
        state.lifecycle,
      canOperate:
        state.canOperate,
      daysRemaining:
        state.daysRemaining,
      graceDaysRemaining:
        state.graceDaysRemaining,
      startedAt:
        subscription.started_at,
      periodStart:
        subscription.current_period_start,
      periodEnd:
        subscription.current_period_end,
      graceEndsAt:
        subscription.grace_period_ends_at,
      lastRenewedAt:
        subscription.last_renewed_at,
      pausedAt:
        subscription.paused_at,
    },
  };
}


export default async function handler(
  req,
  res
) {
  if (
    ![
      'GET',
      'POST',
    ].includes(req.method)
  ) {
    res.setHeader(
      'Allow',
      'GET, POST'
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
    } = await requireAdmin(req);

    const clientId =
      getClientId(
        req.query.id
      );


    if (req.method === 'GET') {
      const result =
        await loadSubscription(
          supabase,
          clientId
        );

      return res
        .status(200)
        .json(result);
    }


    const action =
      String(
        req.body?.action || ''
      )
        .trim()
        .toLowerCase();


    if (
      ![
        'renew',
        'pause',
        'reactivate',
      ].includes(action)
    ) {
      throw new ApiError(
        400,
        'Select a valid subscription action.'
      );
    }


    if (action === 'renew') {
      const expectedPeriodEnd =
        String(
          req.body
            ?.expectedPeriodEnd ||
            ''
        ).trim();

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
          expectedPeriodEnd
        )
      ) {
        throw new ApiError(
          400,
          'A valid current renewal date is required.'
        );
      }

      const {
        error,
      } = await supabase.rpc(
        'renew_client_subscription',
        {
          p_client_id:
            clientId,
          p_expected_period_end:
            expectedPeriodEnd,
          p_created_by:
            profile.id,
        }
      );

      if (error) {
        console.error(
          'Subscription renewal failed:',
          error
        );

        throw new ApiError(
          400,
          error.message ||
            'The subscription could not be renewed.'
        );
      }
    }


    if (action === 'pause') {
      const {
        error,
      } = await supabase.rpc(
        'pause_client_subscription',
        {
          p_client_id:
            clientId,
          p_created_by:
            profile.id,
        }
      );

      if (error) {
        console.error(
          'Subscription pause failed:',
          error
        );

        throw new ApiError(
          400,
          error.message ||
            'The subscription could not be paused.'
        );
      }
    }


    if (
      action ===
      'reactivate'
    ) {
      const {
        error,
      } = await supabase.rpc(
        'reactivate_client_subscription',
        {
          p_client_id:
            clientId,
          p_created_by:
            profile.id,
        }
      );

      if (error) {
        console.error(
          'Subscription reactivation failed:',
          error
        );

        throw new ApiError(
          400,
          error.message ||
            'The subscription could not be reactivated.'
        );
      }
    }


    const result =
      await loadSubscription(
        supabase,
        clientId
      );


    return res
      .status(200)
      .json({
        message:
          action === 'renew'
            ? 'Subscription renewed successfully.'
            : action === 'pause'
              ? 'Application service paused.'
              : 'Application service reactivated.',
        ...result,
      });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Subscription operations API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to manage the subscription right now.'
            : error.message,
      });
  }
}
