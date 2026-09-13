const DAY_MS =
  24 * 60 * 60 * 1000;

const PLAN_LABELS = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
  quarterly: 'Quarterly',
};

const PRICE_BY_PLAN = {
  basic: 15000,
  standard: 20000,
  premium: 25000,
  quarterly: 0,
};

function dateKey(value = new Date()) {
  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return value;
  }

  return new Date(value)
    .toISOString()
    .slice(0, 10);
}

function dateFromKey(value) {
  return new Date(
    `${dateKey(value)}T00:00:00.000Z`
  );
}

function daysBetween(
  fromValue,
  toValue
) {
  return Math.round(
    (
      dateFromKey(toValue) -
      dateFromKey(fromValue)
    ) /
      DAY_MS
  );
}

function addDays(
  value,
  amount
) {
  const date = dateFromKey(value);

  date.setUTCDate(
    date.getUTCDate() + amount
  );

  return dateKey(date);
}

function addOneMonth(value) {
  const date = dateFromKey(value);

  date.setUTCMonth(
    date.getUTCMonth() + 1
  );

  return dateKey(date);
}

export function getPlanLabel(plan) {
  return (
    PLAN_LABELS[
      String(plan || '')
        .toLowerCase()
    ] ||
    'Subscription'
  );
}

export function getDefaultPlanPrice(
  plan
) {
  return (
    PRICE_BY_PLAN[
      String(plan || '')
        .toLowerCase()
    ] || 0
  );
}

export async function loadClientSubscription(
  supabase,
  client
) {
  const {
    data,
    error,
  } = await supabase
    .from('client_subscriptions')
    .select('*')
    .eq('client_id', client.id)
    .maybeSingle();

  if (error) {
    throw new Error(
      'Subscription information could not be loaded.'
    );
  }

  if (data) {
    return data;
  }

  const today = dateKey();
  const periodEnd =
    addOneMonth(today);

  const {
    data: created,
    error: createError,
  } = await supabase
    .from('client_subscriptions')
    .insert({
      client_id: client.id,
      plan: client.plan,
      monthly_price_cents:
        getDefaultPlanPrice(
          client.plan
        ),
      current_period_start:
        today,
      current_period_end:
        periodEnd,
      grace_period_ends_at:
        addDays(periodEnd, 3),
    })
    .select('*')
    .single();

  if (createError || !created) {
    throw new Error(
      'Subscription information could not be created.'
    );
  }

  return created;
}

async function recordLifecycleEvent(
  supabase,
  subscription,
  eventType,
  eventKey,
  metadata = {}
) {
  const {
    error,
  } = await supabase
    .from(
      'client_subscription_events'
    )
    .upsert(
      {
        subscription_id:
          subscription.id,
        client_id:
          subscription.client_id,
        event_type: eventType,
        event_key: eventKey,
        metadata,
      },
      {
        onConflict:
          'subscription_id,event_key',
        ignoreDuplicates: true,
      }
    );

  if (error) {
    console.error(
      'Unable to record subscription lifecycle event:',
      error
    );
  }
}

export async function syncClientSubscriptionLifecycle(
  supabase,
  subscription,
  client
) {
  const today = dateKey();

  let nextStatus =
    subscription.status;

  let pauseReason =
    subscription.pause_reason;

  if (
    subscription.status ===
      'active' &&
    today >
      subscription.current_period_end
  ) {
    nextStatus =
      today >
      subscription
        .grace_period_ends_at
        ? 'paused'
        : 'grace_period';

    if (nextStatus === 'paused') {
      pauseReason = 'expired';
    }
  }

  if (
    subscription.status ===
      'grace_period' &&
    today >
      subscription
        .grace_period_ends_at
  ) {
    nextStatus = 'paused';
    pauseReason = 'expired';
  }

  if (
    nextStatus ===
    subscription.status
  ) {
    return subscription;
  }

  const updates = {
    status: nextStatus,
    pause_reason:
      pauseReason || null,
  };

  if (nextStatus === 'paused') {
    updates.paused_at =
      new Date().toISOString();
  }

  const {
    data: updated,
    error,
  } = await supabase
    .from('client_subscriptions')
    .update(updates)
    .eq('id', subscription.id)
    .select('*')
    .single();

  if (error || !updated) {
    throw new Error(
      'Subscription lifecycle could not be updated.'
    );
  }

  if (
    nextStatus === 'paused' &&
    client.status === 'active'
  ) {
    const {
      error: clientError,
    } = await supabase
      .from('clients')
      .update({
        status: 'paused',
      })
      .eq('id', client.id);

    if (clientError) {
      throw new Error(
        'Client service status could not be paused.'
      );
    }
  }

  const eventType =
    nextStatus === 'paused'
      ? 'paused'
      : 'grace_period_started';

  await recordLifecycleEvent(
    supabase,
    updated,
    eventType,
    `${eventType}_${updated.current_period_end}`,
    {
      reason:
        updated.pause_reason ||
        null,
    }
  );

  return updated;
}

export function deriveSubscriptionState(
  subscription,
  client
) {
  const today = dateKey();

  const daysRemaining =
    daysBetween(
      today,
      subscription
        .current_period_end
    );

  const graceDaysRemaining =
    daysBetween(
      today,
      subscription
        .grace_period_ends_at
    );

  let lifecycle = 'active';

  if (
    subscription.status ===
      'cancelled'
  ) {
    lifecycle = 'cancelled';
  } else if (
    subscription.status ===
      'paused'
  ) {
    lifecycle = 'paused';
  } else if (
    subscription.status ===
      'grace_period' ||
    daysRemaining < 0
  ) {
    lifecycle =
      'grace_period';
  } else if (
    daysRemaining === 0
  ) {
    lifecycle =
      'renewal_due';
  } else if (
    daysRemaining <= 14
  ) {
    lifecycle = 'due_soon';
  }

  const canOperate =
    ![
      'paused',
      'cancelled',
    ].includes(
      subscription.status
    ) &&
    client.status === 'active';

  return {
    lifecycle,
    daysRemaining,
    graceDaysRemaining,
    canOperate,
  };
}

export async function ensureCurrentSubscriptionNotification(
  supabase,
  subscription,
  client
) {
  const state =
    deriveSubscriptionState(
      subscription,
      client
    );

  let reminder = null;

  if (
    state.lifecycle ===
    'due_soon'
  ) {
    let bucket = 14;

    if (state.daysRemaining <= 1) {
      bucket = 1;
    } else if (
      state.daysRemaining <= 3
    ) {
      bucket = 3;
    } else if (
      state.daysRemaining <= 7
    ) {
      bucket = 7;
    }

    reminder = {
      eventType:
        'renewal_reminder',
      eventKey:
        `renewal_${subscription.current_period_end}_${bucket}d`,
      title:
        `Subscription renewal in ${state.daysRemaining} day${
          state.daysRemaining === 1
            ? ''
            : 's'
        }`,
      message:
        `Your ${getPlanLabel(
          subscription.plan
        )} subscription reaches its renewal date on ${subscription.current_period_end}. Visit Billing & Subscription to review your service status.`,
    };
  }

  if (
    state.lifecycle ===
    'renewal_due'
  ) {
    reminder = {
      eventType:
        'renewal_due',
      eventKey:
        `renewal_${subscription.current_period_end}_due`,
      title:
        'Your subscription renewal is due',
      message:
        `Your ApplyLoop subscription reaches its renewal date today. Your service remains available during the grace period.`,
    };
  }

  if (
    state.lifecycle ===
    'grace_period'
  ) {
    reminder = {
      eventType:
        'grace_period_started',
      eventKey:
        `renewal_${subscription.current_period_end}_grace`,
      title:
        'Your subscription is in its grace period',
      message:
        `Your subscription is awaiting renewal. Application services will pause after ${subscription.grace_period_ends_at} if renewal is not recorded.`,
    };
  }

  if (
    state.lifecycle === 'paused' &&
    subscription.pause_reason ===
      'expired'
  ) {
    reminder = {
      eventType: 'paused',
      eventKey:
        `renewal_${subscription.current_period_end}_paused`,
      title:
        'Application services are paused',
      message:
        'Your subscription grace period has ended. Your account and history remain available, but new application work is paused until renewal.',
    };
  }

  if (!reminder) {
    return state;
  }

  const {
    error,
  } = await supabase.rpc(
    'create_subscription_notification_once',
    {
      p_subscription_id:
        subscription.id,
      p_event_key:
        reminder.eventKey,
      p_event_type:
        reminder.eventType,
      p_title:
        reminder.title,
      p_message:
        reminder.message,
      p_href: '/billing',
    }
  );

  if (error) {
    console.error(
      'Unable to create subscription reminder:',
      error
    );
  }

  return state;
}

export function serializeSubscription(
  subscription,
  client
) {
  const state =
    deriveSubscriptionState(
      subscription,
      client
    );

  return {
    id: subscription.id,
    plan: subscription.plan,
    planLabel:
      getPlanLabel(
        subscription.plan
      ),
    monthlyPriceCents:
      Number(
        subscription
          .monthly_price_cents || 0
      ),
    currency:
      subscription.currency ||
      'USD',
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
    currentPeriodStart:
      subscription
        .current_period_start,
    currentPeriodEnd:
      subscription
        .current_period_end,
    gracePeriodEndsAt:
      subscription
        .grace_period_ends_at,
    lastRenewedAt:
      subscription
        .last_renewed_at,
    pausedAt:
      subscription.paused_at,
    clientServiceStatus:
      client.status,
    usage: {
      used: Number(
        client
          .applications_completed || 0
      ),
      limit: Number(
        client
          .application_limit || 0
      ),
    },
  };
}
