import {
  deriveSubscriptionState,
  syncClientSubscriptionLifecycle,
} from './clientSubscription';


export async function getClientServiceState({
  supabase,
  clientId,
}) {
  if (!clientId) {
    throw new Error(
      'Client ID is required.'
    );
  }

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
      'id',
      clientId
    )
    .single();

  if (
    clientError ||
    !client
  ) {
    throw new Error(
      'The Client could not be found.'
    );
  }


  const {
    data: subscriptionRow,
    error: subscriptionError,
  } = await supabase
    .from('client_subscriptions')
    .select('*')
    .eq(
      'client_id',
      clientId
    )
    .maybeSingle();

  if (subscriptionError) {
    throw new Error(
      'The Client subscription could not be loaded.'
    );
  }


  /*
   * Fail closed.
   *
   * Once subscriptions are part of the
   * product, a Client without a subscription
   * should not silently receive new work.
   */
  if (!subscriptionRow) {
    return {
      canOperate: false,
      lifecycle:
        'subscription_missing',
      status:
        'subscription_missing',
      pauseReason: null,
      client,
      subscription: null,
    };
  }


  const subscription =
    await syncClientSubscriptionLifecycle(
      supabase,
      subscriptionRow,
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
    canOperate:
      Boolean(
        state.canOperate
      ),
    lifecycle:
      state.lifecycle,
    status:
      subscription.status,
    pauseReason:
      subscription.pause_reason ||
      null,
    client:
      effectiveClient,
    subscription,
  };
}
