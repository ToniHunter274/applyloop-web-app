import {
  useEffect,
  useState,
} from 'react';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiRefreshCw,
  FiSend,
  FiUsers,
  FiZap,
} from 'react-icons/fi';
import {
  createClient,
} from '../../lib/supabase/client';

const ROLE_OPTIONS = [
  {
    value: 'user_client',
    label: 'Clients',
  },
  {
    value: 'applicant',
    label: 'Applicants',
  },
  {
    value: 'chief_applicant',
    label: 'Chief Applicants',
  },
  {
    value: 'linker',
    label: 'Linkers',
  },
  {
    value: 'prompt_engineer',
    label: 'Prompt Engineers',
  },
  {
    value: 'team_auditor',
    label: 'Team Auditors',
  },
  {
    value: 'chief_auditor',
    label: 'Chief Auditors',
  },
  {
    value: 'operations',
    label: 'Operations',
  },
  {
    value: 'owner',
    label: 'Owners',
  },
  {
    value: 'admin',
    label: 'Admins',
  },
];

const WORKFORCE_ROLES = [
  'applicant',
  'chief_applicant',
  'linker',
  'prompt_engineer',
  'team_auditor',
  'chief_auditor',
  'operations',
  'owner',
  'admin',
];

function sameAudience(
  current,
  target
) {
  if (
    !Array.isArray(current) ||
    current.length !==
      target.length
  ) {
    return false;
  }

  return target.every(
    (role) =>
      current.includes(role)
  );
}

const ROLE_LABELS =
  Object.fromEntries(
    ROLE_OPTIONS.map(
      (role) => [
        role.value,
        role.label,
      ]
    )
  );

const TONE_OPTIONS = [
  {
    value: 'info',
    label: 'Information',
    icon: FiInfo,
  },
  {
    value: 'success',
    label: 'Success',
    icon: FiCheckCircle,
  },
  {
    value: 'warning',
    label: 'Important',
    icon: FiAlertTriangle,
  },
  {
    value: 'critical',
    label: 'Urgent',
    icon: FiZap,
  },
];

const TONE_STYLES = {
  info:
    'border-blue-200 bg-blue-50 text-blue-800',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning:
    'border-amber-200 bg-amber-50 text-amber-800',
  critical:
    'border-red-200 bg-red-50 text-red-800',
};

function createEmptyForm() {
  return {
    title: '',
    message: '',
    tone: 'info',
    audienceRoles: [],
    expiresAt: '',
  };
}

async function getAccessToken() {
  const supabase =
    createClient();

  if (!supabase) {
    throw new Error(
      'The Supabase connection is unavailable.'
    );
  }

  const {
    data: {
      session,
    },
    error,
  } =
    await supabase.auth
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
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }

  return date.toLocaleString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  );
}

function getStatus(
  announcement
) {
  if (
    !announcement.is_active
  ) {
    return {
      label: 'Inactive',
      className:
        'bg-slate-100 text-slate-600',
    };
  }

  const now = Date.now();

  const publishedAt =
    new Date(
      announcement
        .published_at
    ).getTime();

  if (
    Number.isFinite(
      publishedAt
    ) &&
    publishedAt > now
  ) {
    return {
      label: 'Scheduled',
      className:
        'bg-violet-100 text-violet-700',
    };
  }

  if (
    announcement
      .expires_at
  ) {
    const expiresAt =
      new Date(
        announcement
          .expires_at
      ).getTime();

    if (
      Number.isFinite(
        expiresAt
      ) &&
      expiresAt <= now
    ) {
      return {
        label: 'Expired',
        className:
          'bg-amber-100 text-amber-700',
      };
    }
  }

  return {
    label: 'Active',
    className:
      'bg-emerald-100 text-emerald-700',
  };
}

function audienceLabel(
  roles
) {
  if (
    !Array.isArray(roles) ||
    roles.length === 0
  ) {
    return 'Everyone';
  }

  if (
    sameAudience(
      roles,
      ['user_client']
    )
  ) {
    return 'Clients only';
  }

  if (
    sameAudience(
      roles,
      WORKFORCE_ROLES
    )
  ) {
    return 'Workforce only';
  }

  return roles
    .map(
      (role) =>
        ROLE_LABELS[role] ||
        role
    )
    .join(', ');
}

export default function OwnerAnnouncementsPage() {
  const [
    form,
    setForm,
  ] = useState(
    createEmptyForm
  );

  const [
    announcements,
    setAnnouncements,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    busyId,
    setBusyId,
  ] = useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadAnnouncements =
      async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
          const token =
            await getAccessToken();

          const response =
            await fetch(
              '/api/announcements?manage=1',
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const body =
            await response
              .json()
              .catch(
                () => ({})
              );

          if (
            !response.ok
          ) {
            throw new Error(
              body.error ||
                'Announcements could not be loaded.'
            );
          }

          if (!cancelled) {
            setAnnouncements(
              Array.isArray(
                body.announcements
              )
                ? body.announcements
                : []
            );
          }
        } catch (error) {
          if (!cancelled) {
            setErrorMessage(
              error.message ||
                'Announcements could not be loaded.'
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      };

    loadAnnouncements();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const toggleAudience =
    (role) => {
      setForm(
        (current) => {
          const selected =
            current.audienceRoles;

          if (
            selected.length === 0
          ) {
            return {
              ...current,
              audienceRoles: [
                role,
              ],
            };
          }

          const exists =
            selected.includes(
              role
            );

          const next =
            exists
              ? selected.filter(
                  (
                    selectedRole
                  ) =>
                    selectedRole !==
                    role
                )
              : [
                  ...selected,
                  role,
                ];

          return {
            ...current,
            audienceRoles:
              next,
          };
        }
      );
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setIsSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        const token =
          await getAccessToken();

        const expiresAt =
          form.expiresAt
            ? new Date(
                form.expiresAt
              ).toISOString()
            : null;

        const response =
          await fetch(
            '/api/announcements',
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${token}`,
                'Content-Type':
                  'application/json',
              },
              body:
                JSON.stringify({
                  title:
                    form.title,
                  message:
                    form.message,
                  tone:
                    form.tone,
                  audienceRoles:
                    form.audienceRoles,
                  expiresAt,
                }),
            }
          );

        const body =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (
          !response.ok
        ) {
          throw new Error(
            body.error ||
              'Announcement could not be published.'
          );
        }

        setForm(
          createEmptyForm()
        );

        setSuccessMessage(
          'Announcement published successfully.'
        );

        window.dispatchEvent(
          new Event(
            'applyloop:announcements-refresh'
          )
        );

        setRefreshKey(
          (current) =>
            current + 1
        );
      } catch (error) {
        setErrorMessage(
          error.message ||
            'Announcement could not be published.'
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  const updateActiveState =
    async (
      announcement,
      nextActive
    ) => {
      setBusyId(
        announcement.id
      );

      setErrorMessage('');
      setSuccessMessage('');

      try {
        const token =
          await getAccessToken();

        const response =
          await fetch(
            '/api/announcements',
            {
              method: 'PATCH',
              headers: {
                Authorization:
                  `Bearer ${token}`,
                'Content-Type':
                  'application/json',
              },
              body:
                JSON.stringify({
                  id:
                    announcement.id,
                  isActive:
                    nextActive,
                }),
            }
          );

        const body =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (
          !response.ok
        ) {
          throw new Error(
            body.error ||
              'Announcement could not be updated.'
          );
        }

        setSuccessMessage(
          nextActive
            ? 'Announcement activated.'
            : 'Announcement deactivated.'
        );

        window.dispatchEvent(
          new Event(
            'applyloop:announcements-refresh'
          )
        );

        setRefreshKey(
          (current) =>
            current + 1
        );
      } catch (error) {
        setErrorMessage(
          error.message ||
            'Announcement could not be updated.'
        );
      } finally {
        setBusyId('');
      }
    };

  return (
    <div className="space-y-7">
      {(errorMessage ||
        successMessage) && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
            errorMessage
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {errorMessage ||
            successMessage}
        </div>
      )}

      <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FiSend className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Publish Update
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Send an announcement to everyone or selected ApplyLoop workspaces.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-6 px-6 py-6 sm:px-7"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
            <label className="text-sm font-semibold text-slate-700">
              Title

              <input
                type="text"
                required
                maxLength={200}
                value={
                  form.title
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,
                      title:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder="e.g. Scheduled maintenance"
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Update Type

              <select
                value={
                  form.tone
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,
                      tone:
                        event
                          .target
                          .value,
                    })
                  )
                }
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {TONE_OPTIONS.map(
                  (
                    option
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Message

            <textarea
              required
              maxLength={3000}
              rows={5}
              value={
                form.message
              }
              onChange={(
                event
              ) =>
                setForm(
                  (
                    current
                  ) => ({
                    ...current,
                    message:
                      event
                        .target
                        .value,
                  })
                )
              }
              placeholder="Write the update users should see..."
              className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <span className="mt-1 block text-right text-xs font-normal text-slate-400">
              {
                form.message
                  .length
              }
              /3000
            </span>
          </label>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FiUsers />
              Audience
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Clients are ApplyLoop customers. Workforce includes Applicants, Linkers, Prompt Engineers, Auditors, Operations, Admins, and Owners.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,
                      audienceRoles:
                        [],
                    })
                  )
                }
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  form
                    .audienceRoles
                    .length === 0
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                Everyone
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,
                      audienceRoles: [
                        'user_client',
                      ],
                    })
                  )
                }
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  sameAudience(
                    form.audienceRoles,
                    ['user_client']
                  )
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                Clients only
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,
                      audienceRoles: [
                        ...WORKFORCE_ROLES,
                      ],
                    })
                  )
                }
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  sameAudience(
                    form.audienceRoles,
                    WORKFORCE_ROLES
                  )
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                Workforce only
              </button>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Or target specific roles
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {ROLE_OPTIONS.map(
                  (role) => {
                    const selected =
                      form
                        .audienceRoles
                        .includes(
                          role.value
                        );

                    return (
                      <button
                        type="button"
                        key={
                          role.value
                        }
                        onClick={() =>
                          toggleAudience(
                            role.value
                          )
                        }
                        className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                          selected
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                        }`}
                      >
                        {
                          role.label
                        }
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="text-sm font-semibold text-slate-700">
              Expiry Date
              <span className="ml-1 font-normal text-slate-400">
                (Optional)
              </span>

              <input
                type="datetime-local"
                value={
                  form.expiresAt
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,
                      expiresAt:
                        event
                          .target
                          .value,
                    })
                  )
                }
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !form.title
                  .trim() ||
                !form.message
                  .trim()
              }
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiSend />

              {isSubmitting
                ? 'Publishing...'
                : 'Publish Update'}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Published Updates
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review active, expired, and deactivated announcements.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setRefreshKey(
                (
                  current
                ) =>
                  current + 1
              )
            }
            disabled={
              isLoading
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw
              className={
                isLoading
                  ? 'animate-spin'
                  : ''
              }
            />

            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

              <p className="mt-3 text-sm text-slate-500">
                Loading updates...
              </p>
            </div>
          </div>
        ) : announcements.length ===
          0 ? (
          <div className="px-6 py-14 text-center">
            <FiInfo className="mx-auto h-8 w-8 text-slate-300" />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              No announcements yet
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Your first published update will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {announcements.map(
              (
                announcement
              ) => {
                const status =
                  getStatus(
                    announcement
                  );

                const toneStyle =
                  TONE_STYLES[
                    announcement
                      .tone
                  ] ||
                  TONE_STYLES
                    .info;

                return (
                  <article
                    key={
                      announcement.id
                    }
                    className="px-6 py-5 sm:px-7"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${toneStyle}`}
                          >
                            {
                              announcement
                                .tone
                            }
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${status.className}`}
                          >
                            {
                              status.label
                            }
                          </span>
                        </div>

                        <h3 className="mt-3 text-base font-bold text-slate-950">
                          {
                            announcement
                              .title
                          }
                        </h3>

                        <p className="mt-2 max-w-4xl whitespace-pre-line text-sm leading-6 text-slate-600">
                          {
                            announcement
                              .message
                          }
                        </p>

                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                          <span>
                            <strong className="font-semibold text-slate-700">
                              Audience:
                            </strong>{' '}
                            {audienceLabel(
                              announcement
                                .audience_roles
                            )}
                          </span>

                          <span>
                            <strong className="font-semibold text-slate-700">
                              Published:
                            </strong>{' '}
                            {formatDate(
                              announcement
                                .published_at
                            )}
                          </span>

                          <span>
                            <strong className="font-semibold text-slate-700">
                              Expires:
                            </strong>{' '}
                            {announcement
                              .expires_at
                              ? formatDate(
                                  announcement
                                    .expires_at
                                )
                              : 'No expiry'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={
                          busyId ===
                          announcement.id
                        }
                        onClick={() =>
                          updateActiveState(
                            announcement,
                            !announcement
                              .is_active
                          )
                        }
                        className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                          announcement
                            .is_active
                            ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                            : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {busyId ===
                        announcement.id
                          ? 'Updating...'
                          : announcement
                              .is_active
                            ? 'Deactivate'
                            : 'Activate'}
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}
