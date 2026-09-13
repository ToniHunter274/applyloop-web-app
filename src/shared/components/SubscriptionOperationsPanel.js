import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  FiCheckCircle,
  FiPauseCircle,
  FiPlayCircle,
} from 'react-icons/fi';

import {
  createClient,
} from '../../lib/supabase/client';


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
  } =
    await supabase.auth.getSession();

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

  return new Date(
    `${String(value).slice(
      0,
      10
    )}T12:00:00`
  ).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );
}


function formatStatus(value) {
  if (!value) {
    return 'Unknown';
  }

  if (value === 'grace_period') {
    return 'Grace Period';
  }

  return String(value)
    .replace(/_/g, ' ')
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}


function statusClassName(status) {
  if (status === 'active') {
    return (
      'bg-emerald-100 ' +
      'text-emerald-700'
    );
  }

  if (
    status === 'grace_period'
  ) {
    return (
      'bg-amber-100 ' +
      'text-amber-700'
    );
  }

  return (
    'bg-rose-100 ' +
    'text-rose-700'
  );
}


function InfoCard({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}


export default function SubscriptionOperationsPanel({
  clientId,
  canEdit = false,
}) {
  const [
    subscription,
    setSubscription,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState('');

  const [
    pendingAction,
    setPendingAction,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState('');


  const loadSubscription =
    useCallback(
      async () => {
        if (!clientId) {
          return;
        }

        setIsLoading(true);
        setError('');

        try {
          const accessToken =
            await getAccessToken();

          const response =
            await fetch(
              `/api/admin/clients/${clientId}/subscription`,
              {
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
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
        } catch (
          loadError
        ) {
          setError(
            loadError?.message ||
              'Subscription information could not be loaded.'
          );
        } finally {
          setIsLoading(false);
        }
      },
      [clientId]
    );


  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);


  const runAction =
    async () => {
      if (
        !pendingAction ||
        !subscription
      ) {
        return;
      }

      const action =
        pendingAction;

      setActionLoading(
        action
      );

      setError('');
      setSuccess('');

      try {
        const accessToken =
          await getAccessToken();

        const response =
          await fetch(
            `/api/admin/clients/${clientId}/subscription`,
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
                'Content-Type':
                  'application/json',
              },
              body:
                JSON.stringify({
                  action,
                  ...(action ===
                  'renew'
                    ? {
                        expectedPeriodEnd:
                          subscription.periodEnd,
                      }
                    : {}),
                }),
            }
          );

        const result =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Subscription action could not be completed.'
          );
        }

        setSubscription(
          result.subscription
        );

        setSuccess(
          result.message ||
            'Subscription updated.'
        );

        setPendingAction('');

        window.dispatchEvent(
          new CustomEvent(
            'applyloop:subscription-updated',
            {
              detail: {
                clientId,
              },
            }
          )
        );
      } catch (
        actionError
      ) {
        setError(
          actionError?.message ||
            'Subscription action could not be completed.'
        );
      } finally {
        setActionLoading('');
      }
    };


  const actionCopy = {
    renew: {
      title:
        'Confirm subscription renewal',
      message:
        'This starts the next paid subscription period and creates a fresh Applicant target period.',
      button:
        'Mark Subscription Renewed',
    },

    pause: {
      title:
        'Pause application service?',
      message:
        'The Client keeps access to their account and history, but new application work will be stopped.',
      button:
        'Pause Service',
    },

    reactivate: {
      title:
        'Reactivate application service?',
      message:
        'Application service will resume without changing the current renewal date.',
      button:
        'Reactivate Service',
    },
  };


  if (isLoading) {
    return (
      <div className="mx-6 mb-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:mx-8">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />

          <p className="text-sm font-medium text-slate-600">
            Loading subscription operations...
          </p>
        </div>
      </div>
    );
  }


  if (!subscription) {
    return (
      <div className="mx-6 mb-7 rounded-3xl border border-red-200 bg-red-50 p-6 sm:mx-8">
        <p className="text-sm font-semibold text-red-700">
          {error ||
            'Subscription information is unavailable.'}
        </p>

        <button
          type="button"
          onClick={
            loadSubscription
          }
          className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }


  const isPaused =
    subscription.status ===
      'paused';

  const requiresRenewal =
    isPaused &&
    subscription.pauseReason !==
      'manual';

  const daysRemaining =
    Number(
      subscription.daysRemaining ||
        0
    );

  const confirmation =
    pendingAction
      ? actionCopy[
          pendingAction
        ]
      : null;


  return (
    <div className="mx-6 mb-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:mx-8 sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
            Subscription Operations
          </p>

          <h3 className="mt-2 text-xl font-bold text-slate-950">
            {subscription.planLabel}
            {' '}
            Subscription
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Manage renewal and service
            availability. Application
            targets and delivery progress
            remain internal.
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${statusClassName(
            subscription.status
          )}`}
        >
          {formatStatus(
            subscription.status
          )}
        </span>
      </div>


      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          label="Period Start"
          value={formatDate(
            subscription.periodStart
          )}
        />

        <InfoCard
          label="Renewal Date"
          value={formatDate(
            subscription.periodEnd
          )}
        />

        <InfoCard
          label="Grace Ends"
          value={formatDate(
            subscription.graceEndsAt
          )}
        />

        <InfoCard
          label="Last Renewed"
          value={
            subscription.lastRenewedAt
              ? formatDate(
                  subscription.lastRenewedAt
                )
              : 'Initial period'
          }
        />
      </div>


      {success && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}


      {confirmation && (
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h4 className="font-bold text-slate-950">
            {confirmation.title}
          </h4>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {confirmation.message}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setPendingAction('')
              }
              disabled={Boolean(
                actionLoading
              )}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={
                runAction
              }
              disabled={Boolean(
                actionLoading
              )}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {actionLoading
                ? 'Updating...'
                : confirmation.button}
            </button>
          </div>
        </div>
      )}


      {canEdit &&
        !confirmation && (
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() =>
                setPendingAction(
                  'renew'
                )
              }
              disabled={
                daysRemaining > 0
              }
              title={
                daysRemaining > 0
                  ? `Renewal becomes available on ${formatDate(
                      subscription.periodEnd
                    )}.`
                  : 'Mark this subscription renewed'
              }
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
            >
              <FiCheckCircle />

              {daysRemaining > 0
                ? `Renewal in ${daysRemaining} day${
                    daysRemaining === 1
                      ? ''
                      : 's'
                  }`
                : 'Mark Renewed'}
            </button>


            {!isPaused ? (
              <button
                type="button"
                onClick={() =>
                  setPendingAction(
                    'pause'
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700"
              >
                <FiPauseCircle />
                Pause Service
              </button>
            ) : requiresRenewal ? (
              <span className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700">
                Renewal required to reactivate
              </span>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setPendingAction(
                    'reactivate'
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700"
              >
                <FiPlayCircle />
                Reactivate Service
              </button>
            )}
          </div>
        )}
    </div>
  );
}
