import {
  useEffect,
  useState,
} from 'react';

import Head from 'next/head';

import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiInfo,
  FiRefreshCw,
  FiShield,
} from 'react-icons/fi';

import DashboardLayout
  from '../shared/components/DashboardLayout';

import {
  createClient,
} from '../lib/supabase/client';


async function getAccessToken() {
  const supabase =
    createClient();

  if (!supabase) {
    throw new Error(
      'The Supabase connection is unavailable.'
    );
  }

  const {
    data: { session },
    error,
  } = await supabase.auth
    .getSession();

  if (
    error ||
    !session?.access_token
  ) {
    throw new Error(
      'Your session has expired. Please sign in again.'
    );
  }

  return session.access_token;
}


function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date =
    new Date(
      `${String(value).slice(
        0,
        10
      )}T12:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Not available';
  }

  return date.toLocaleDateString(
    'en-US',
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );
}


function formatMoney(
  cents,
  currency = 'USD'
) {
  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }
  ).format(
    Number(cents || 0) / 100
  );
}


const STATUS_COPY = {
  active: {
    label: 'Active',
    title:
      'Your subscription is active',
    description:
      'Your ApplyLoop application service is running normally.',
    icon: FiCheckCircle,
    classes:
      'border-emerald-200 bg-emerald-50 text-emerald-900',
    iconClasses:
      'bg-emerald-100 text-emerald-700',
  },

  due_soon: {
    label: 'Renewal Due Soon',
    title:
      'Your renewal date is approaching',
    description:
      'Your service is active. Renew before the end of your grace period to avoid interruption.',
    icon: FiClock,
    classes:
      'border-amber-200 bg-amber-50 text-amber-950',
    iconClasses:
      'bg-amber-100 text-amber-700',
  },

  renewal_due: {
    label: 'Renewal Due',
    title:
      'Your subscription renewal is due today',
    description:
      'Your service remains available while the renewal enters its grace period.',
    icon: FiAlertTriangle,
    classes:
      'border-amber-300 bg-amber-50 text-amber-950',
    iconClasses:
      'bg-amber-100 text-amber-700',
  },

  grace_period: {
    label: 'Grace Period',
    title:
      'Your subscription is awaiting renewal',
    description:
      'Your application service is still available during the grace period.',
    icon: FiAlertTriangle,
    classes:
      'border-orange-200 bg-orange-50 text-orange-950',
    iconClasses:
      'bg-orange-100 text-orange-700',
  },

  paused: {
    label: 'Paused',
    title:
      'New application work is paused',
    description:
      'Your account, applications and history remain safe. Renew your subscription to resume new application activity.',
    icon: FiShield,
    classes:
      'border-rose-200 bg-rose-50 text-rose-950',
    iconClasses:
      'bg-rose-100 text-rose-700',
  },

  cancelled: {
    label: 'Cancelled',
    title:
      'Your subscription is not active',
    description:
      'Your historical ApplyLoop information remains available.',
    icon: FiShield,
    classes:
      'border-slate-200 bg-slate-50 text-slate-900',
    iconClasses:
      'bg-slate-200 text-slate-600',
  },
};


const EVENT_LABELS = {
  subscription_started:
    'Subscription started',
  renewal_reminder:
    'Renewal reminder',
  renewal_due:
    'Renewal due',
  grace_period_started:
    'Grace period started',
  paused:
    'Service paused',
  renewed:
    'Subscription renewed',
  reactivated:
    'Service reactivated',
  plan_changed:
    'Plan changed',
};


function LoadingState() {
  return (
    <div className="max-w-6xl animate-pulse space-y-6">
      <div className="h-28 rounded-2xl bg-slate-100" />

      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="h-28 rounded-2xl bg-slate-100"
            />
          )
        )}
      </div>

      <div className="h-72 rounded-2xl bg-slate-100" />
    </div>
  );
}


export default function BillingPage() {
  const [
    subscription,
    setSubscription,
  ] = useState(null);

  const [
    events,
    setEvents,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');


  const loadSubscription =
    async () => {
      setIsLoading(true);
      setError('');

      try {
        const token =
          await getAccessToken();

        const response =
          await fetch(
            '/api/client/subscription',
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const result =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Subscription information could not be loaded.'
          );
        }

        setSubscription(
          result.subscription
        );

        setEvents(
          result.events || []
        );
      } catch (loadError) {
        setSubscription(null);
        setEvents([]);

        setError(
          loadError?.message ||
            'Subscription information could not be loaded.'
        );
      } finally {
        setIsLoading(false);
      }
    };


  useEffect(() => {
    loadSubscription();
  }, []);


  const usage =
    subscription?.usage || {
      used: 0,
      limit: 0,
    };

  const usagePercent =
    usage.limit > 0
      ? Math.min(
          100,
          Math.round(
            (
              usage.used /
              usage.limit
            ) * 100
          )
        )
      : 0;


  const status =
    STATUS_COPY[
      subscription?.lifecycle
    ] ||
    STATUS_COPY.active;

  const StatusIcon =
    status.icon;


  return (
    <>
      <Head>
        <title>
          Billing &amp; Subscription | ApplyLoop
        </title>

        <meta
          name="description"
          content="Review your ApplyLoop subscription, renewal date and service status."
        />
      </Head>

      <DashboardLayout>
        <div className="max-w-6xl pb-10">
          <header className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1E50C3]">
              Account
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Billing &amp; Subscription
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Track your monthly service,
              application allowance,
              renewal date and subscription
              status.
            </p>
          </header>

          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <section className="rounded-2xl border border-rose-200 bg-white p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <FiAlertTriangle />
                </span>

                <div className="flex-1">
                  <h2 className="font-bold text-slate-900">
                    Subscription could not be loaded
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={
                      loadSubscription
                    }
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#1E50C3] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1A45A7]"
                  >
                    <FiRefreshCw />
                    Try again
                  </button>
                </div>
              </div>
            </section>
          ) : subscription ? (
            <div className="space-y-6">
              <section
                className={`rounded-2xl border p-5 sm:p-6 ${status.classes}`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${status.iconClasses}`}
                  >
                    <StatusIcon />
                  </span>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-bold">
                        {status.title}
                      </h2>

                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">
                        {status.label}
                      </span>
                    </div>

                    <p className="mt-1 text-sm leading-6 opacity-80">
                      {status.description}
                    </p>

                    {subscription.lifecycle ===
                      'due_soon' && (
                      <p className="mt-2 text-sm font-semibold">
                        {
                          subscription.daysRemaining
                        }{' '}
                        day
                        {subscription.daysRemaining ===
                        1
                          ? ''
                          : 's'}{' '}
                        until renewal.
                      </p>
                    )}

                    {subscription.lifecycle ===
                      'grace_period' && (
                      <p className="mt-2 text-sm font-semibold">
                        {Math.max(
                          0,
                          subscription
                            .graceDaysRemaining
                        )}{' '}
                        day
                        {subscription.graceDaysRemaining ===
                        1
                          ? ''
                          : 's'}{' '}
                        remaining before
                        service pauses.
                      </p>
                    )}
                  </div>
                </div>
              </section>


              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-2xl border border-slate-200 bg-white p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1E50C3]">
                    <FiCreditCard />
                  </span>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Current plan
                  </p>

                  <strong className="mt-1 block text-xl text-slate-950">
                    {subscription.planLabel}
                  </strong>
                </article>


                <article className="rounded-2xl border border-slate-200 bg-white p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <FiCheckCircle />
                  </span>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Service
                  </p>

                  <strong className="mt-1 block text-xl text-slate-950">
                    {subscription.canOperate
                      ? 'Available'
                      : 'Paused'}
                  </strong>
                </article>


                <article className="rounded-2xl border border-slate-200 bg-white p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <FiCalendar />
                  </span>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Renewal date
                  </p>

                  <strong className="mt-1 block text-base text-slate-950">
                    {formatDate(
                      subscription
                        .currentPeriodEnd
                    )}
                  </strong>
                </article>


                <article className="rounded-2xl border border-slate-200 bg-white p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <FiCreditCard />
                  </span>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Monthly service
                  </p>

                  <strong className="mt-1 block text-xl text-slate-950">
                    {subscription.monthlyPriceCents >
                    0
                      ? formatMoney(
                          subscription
                            .monthlyPriceCents,
                          subscription.currency
                        )
                      : 'Managed plan'}
                  </strong>
                </article>
              </section>


              <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <article className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">
                        Application allowance
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Your application usage
                        for this Client account.
                      </p>
                    </div>

                    <strong className="text-2xl text-slate-950">
                      {usage.used}
                      <span className="text-sm font-medium text-slate-400">
                        {' '}
                        / {usage.limit}
                      </span>
                    </strong>
                  </div>

                  <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#1E50C3] transition-all"
                      style={{
                        width:
                          `${usagePercent}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {usagePercent}% used
                    </span>

                    <span>
                      {Math.max(
                        0,
                        usage.limit -
                          usage.used
                      )}{' '}
                      remaining
                    </span>
                  </div>
                </article>


                <article className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <FiInfo />
                  </span>

                  <h2 className="mt-5 text-lg font-bold">
                    Renewal without online billing
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Online payment is not
                    connected yet. ApplyLoop
                    will record your renewal
                    manually when payment is
                    confirmed.
                  </p>

                  <p className="mt-4 text-xs leading-5 text-slate-400">
                    You will receive reminders
                    before your renewal date so
                    your service does not pause
                    unexpectedly.
                  </p>
                </article>
              </section>


              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-slate-950">
                  Subscription timeline
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your current monthly service
                  period and grace period.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Current period started
                    </p>

                    <p className="mt-2 font-bold text-slate-900">
                      {formatDate(
                        subscription
                          .currentPeriodStart
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                      Renewal date
                    </p>

                    <p className="mt-2 font-bold text-blue-950">
                      {formatDate(
                        subscription
                          .currentPeriodEnd
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                      Grace period ends
                    </p>

                    <p className="mt-2 font-bold text-amber-950">
                      {formatDate(
                        subscription
                          .gracePeriodEndsAt
                      )}
                    </p>
                  </div>
                </div>
              </section>


              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-slate-950">
                  What happens at renewal?
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 p-4">
                    <span className="text-sm font-bold text-[#1E50C3]">
                      01
                    </span>

                    <h3 className="mt-2 font-bold text-slate-900">
                      We remind you
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      ApplyLoop sends renewal
                      notices before your
                      current period ends.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4">
                    <span className="text-sm font-bold text-[#1E50C3]">
                      02
                    </span>

                    <h3 className="mt-2 font-bold text-slate-900">
                      Grace period
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Your service remains
                      available for three days
                      after the renewal date.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4">
                    <span className="text-sm font-bold text-[#1E50C3]">
                      03
                    </span>

                    <h3 className="mt-2 font-bold text-slate-900">
                      Service pause
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      If renewal is still
                      outstanding, new
                      application work pauses.
                      Your account and history
                      remain available.
                    </p>
                  </div>
                </div>
              </section>


              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-slate-950">
                  Subscription history
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Important subscription and
                  renewal events are recorded
                  here.
                </p>

                <div className="mt-5 divide-y divide-slate-100">
                  {events.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-400">
                      No subscription events
                      have been recorded yet.
                    </div>
                  ) : (
                    events.map(
                      (event) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-4 py-4"
                        >
                          <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#1E50C3]">
                            <FiClock />
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900">
                              {EVENT_LABELS[
                                event
                                  .event_type
                              ] ||
                                event
                                  .event_type}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {new Date(
                                event
                                  .created_at
                              ).toLocaleString(
                                'en-US',
                                {
                                  month:
                                    'short',
                                  day: 'numeric',
                                  year:
                                    'numeric',
                                  hour:
                                    'numeric',
                                  minute:
                                    '2-digit',
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </DashboardLayout>
    </>
  );
}
