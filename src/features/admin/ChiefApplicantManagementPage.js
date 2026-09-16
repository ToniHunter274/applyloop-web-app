import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FiCheck,
  FiCopy,
  FiPlus,
  FiSearch,
  FiUserCheck,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { createClient } from '../../lib/supabase/client';

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

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

function ModalShell({
  title,
  subtitle,
  children,
  onClose,
  disableClose = false,
  wide = false,
}) {
  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !disableClose
        ) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
    >
      <section
        className={`my-auto w-full overflow-hidden rounded-3xl bg-white shadow-2xl ${
          wide
            ? 'max-w-5xl'
            : 'max-w-3xl'
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={disableClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}

function AddChiefApplicantModal({
  open,
  onClose,
  onCreated,
}) {
  const [form, setForm] =
    useState({
      fullName: '',
      email: '',
      phone: '',
    });

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [error, setError] =
    useState('');

  const [
    credentials,
    setCredentials,
  ] = useState(null);

  const [
    copied,
    setCopied,
  ] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm({
        fullName: '',
        email: '',
        phone: '',
      });

      setError('');
      setCredentials(null);
      setCopied(false);
      setIsSaving(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setIsSaving(true);
      setError('');

      try {
        const accessToken =
          await getAccessToken();

        const response =
          await fetch(
            '/api/admin/chief-applicants',
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
                'Content-Type':
                  'application/json',
              },
              body:
                JSON.stringify(form),
            }
          );

        const result =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.error ||
              'The Chief Applicant could not be created.'
          );
        }

        setCredentials(
          result.credentials
        );

        onCreated();
      } catch (submitError) {
        setError(
          submitError?.message ||
            'The Chief Applicant could not be created.'
        );
      } finally {
        setIsSaving(false);
      }
    };

  const copyCredentials =
    async () => {
      if (!credentials) {
        return;
      }

      const text = [
        `Email: ${credentials.email}`,
        `Temporary password: ${credentials.temporaryPassword}`,
      ].join('\n');

      try {
        await navigator
          .clipboard
          .writeText(text);

        setCopied(true);

        window.setTimeout(
          () => setCopied(false),
          1800
        );
      } catch {
        setError(
          'The credentials could not be copied automatically. Copy them manually before closing.'
        );
      }
    };

  return (
    <ModalShell
      title={
        credentials
          ? 'Chief Applicant account created'
          : 'Add Chief Applicant'
      }
      subtitle={
        credentials
          ? 'Save these temporary credentials and send them securely to the Chief Applicant.'
          : 'Create an account for an Application team leader.'
      }
      onClose={onClose}
      disableClose={
        isSaving ||
        Boolean(credentials)
      }
    >
      {credentials ? (
        <div className="p-6 sm:p-8">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <FiCheck className="h-5 w-5" />
              </div>

              <div>
                <p className="font-bold text-emerald-950">
                  Account ready
                </p>

                <p className="mt-1 text-sm text-emerald-800">
                  The Chief Applicant can now sign in to ApplyLoop.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Email
              </p>

              <p className="mt-2 break-all font-semibold text-slate-900">
                {credentials.email}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Temporary Password
              </p>

              <p className="mt-2 break-all font-mono font-bold text-slate-900">
                {
                  credentials.temporaryPassword
                }
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            These temporary credentials are shown only during this creation flow.
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={
                copyCredentials
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
            >
              <FiCopy />

              {copied
                ? 'Credentials Copied'
                : 'Copy Credentials'}
            </button>

            <button
              type="button"
              onClick={() => {
                setCredentials(null);
                onClose();
              }}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Done, I Saved Them
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8"
        >
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Full Name *
              </span>

              <input
                type="text"
                required
                maxLength={120}
                value={form.fullName}
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      fullName:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="e.g., Marcus Williams"
                className={inputClassName}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Email Address *
              </span>

              <input
                type="email"
                required
                maxLength={320}
                value={form.email}
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      email:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="chief@example.com"
                className={inputClassName}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Phone Number
              </span>

              <input
                type="tel"
                maxLength={30}
                value={form.phone}
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      phone:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="+1 555 123 4567"
                className={inputClassName}
              />
            </label>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm leading-6 text-blue-800">
              ApplyLoop will generate a secure temporary password automatically.
            </p>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? 'Creating...'
                : 'Create Chief Applicant'}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}

function AssignmentModal({
  chief,
  applicants,
  onClose,
  onChanged,
}) {
  const [search, setSearch] =
    useState('');

  const [
    busyApplicantId,
    setBusyApplicantId,
  ] = useState('');

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  const visibleApplicants =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return applicants;
      }

      return applicants.filter(
        (applicant) =>
          [
            applicant.fullName,
            applicant.email,
            applicant.assignedTeam,
            applicant.availability,
            applicant.accountStatus,
            applicant.chiefApplicantName,
            (
              applicant.assignedClients ||
              []
            )
              .map(
                (client) =>
                  client.fullName
              )
              .join(' '),
          ].some(
            (value) =>
              String(
                value || ''
              )
                .toLowerCase()
                .includes(query)
          )
      );
    }, [
      applicants,
      search,
    ]);

  const changeAssignment =
    async (
      applicant,
      assignedHere
    ) => {
      setBusyApplicantId(
        applicant.id
      );

      setError('');
      setMessage('');

      try {
        const accessToken =
          await getAccessToken();

        const response =
          await fetch(
            `/api/admin/chief-applicants/${chief.id}/assignments`,
            {
              method:
                assignedHere
                  ? 'DELETE'
                  : 'POST',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify(
                assignedHere
                  ? {
                      assignmentId:
                        applicant
                          .assignmentId,
                      applicantId:
                        applicant.id,
                    }
                  : {
                      applicantId:
                        applicant.id,
                    }
              ),
            }
          );

        const result =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.error ||
              'The Chief Applicant assignment could not be updated.'
          );
        }

        setMessage(
          result.message ||
            (
              assignedHere
                ? 'Applicant unassigned successfully.'
                : 'Applicant assigned successfully.'
            )
        );

        onChanged?.();
      } catch (assignmentError) {
        setError(
          assignmentError?.message ||
            'The Chief Applicant assignment could not be updated.'
        );
      } finally {
        setBusyApplicantId('');
      }
    };

  return (
    <ModalShell
      title={`Manage Applicants — ${chief.fullName}`}
      subtitle="Choose the Applicants this Chief Applicant supervises. Client workload is inherited through those Applicants."
      onClose={onClose}
      disableClose={Boolean(
        busyApplicantId
      )}
      wide
    >
      <div className="p-6 sm:p-8">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-bold text-blue-900">
            One active Chief Applicant per Applicant
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700">
            Applicants are the supervision unit. Clients remain assigned directly to Applicants.
          </p>
        </div>

        <div className="relative mt-5">
          <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search Applicants..."
            className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}

        <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {visibleApplicants.length ===
          0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center">
              <FiUsers className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 font-bold text-slate-800">
                No Applicants found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try a different search.
              </p>
            </div>
          ) : (
            visibleApplicants.map(
              (applicant) => {
                const assignedHere =
                  applicant
                    .chiefApplicantId ===
                  chief.id;

                const assignedElsewhere =
                  Boolean(
                    applicant
                      .chiefApplicantId &&
                    !assignedHere
                  );

                const busy =
                  Boolean(
                    busyApplicantId
                  );

                return (
                  <div
                    key={applicant.id}
                    className={`rounded-2xl border p-4 ${
                      assignedHere
                        ? 'border-emerald-200 bg-emerald-50/60'
                        : assignedElsewhere
                          ? 'border-slate-200 bg-slate-50'
                          : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-950">
                            {
                              applicant.fullName
                            }
                          </p>

                          {assignedHere && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              Supervised here
                            </span>
                          )}

                          {assignedElsewhere && (
                            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">
                              Supervised by another Chief
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-sm text-slate-500">
                          {applicant.email ||
                            'No email'}
                        </p>

                        {assignedElsewhere &&
                          applicant
                            .chiefApplicantName && (
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              Current Chief:{' '}
                              {
                                applicant
                                  .chiefApplicantName
                              }
                            </p>
                          )}

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                            {Number(
                              applicant.clientCount ||
                                0
                            )}{' '}
                            Clients
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                            {Number(
                              applicant.applicationCount ||
                                0
                            )}{' '}
                            Applications
                          </span>

                          {applicant.assignedTeam && (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                              {
                                applicant.assignedTeam
                              }
                            </span>
                          )}

                          {applicant.availability && (
                            <span className="rounded-full bg-violet-50 px-2.5 py-1 font-semibold capitalize text-violet-700">
                              {
                                applicant.availability
                              }
                            </span>
                          )}
                        </div>

                        {(
                          applicant
                            .assignedClients ||
                          []
                        ).length > 0 && (
                          <p className="mt-3 max-w-xl truncate text-xs text-slate-500">
                            Clients:{' '}
                            {applicant
                              .assignedClients
                              .map(
                                (client) =>
                                  client.fullName
                              )
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={
                          busy ||
                          assignedElsewhere ||
                          applicant
                            .accountStatus !==
                            'active'
                        }
                        onClick={() =>
                          changeAssignment(
                            applicant,
                            assignedHere
                          )
                        }
                        className={`inline-flex min-w-[150px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          assignedHere
                            ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                            : assignedElsewhere
                              ? 'bg-slate-200 text-slate-500'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {busyApplicantId ===
                        applicant.id
                          ? assignedHere
                            ? 'Unassigning...'
                            : 'Assigning...'
                          : assignedHere
                            ? 'Unassign'
                            : assignedElsewhere
                              ? 'Assigned Elsewhere'
                              : applicant
                                    .accountStatus !==
                                  'active'
                                ? 'Applicant inactive'
                                : 'Assign'}
                      </button>
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(
              busyApplicantId
            )}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export default function ChiefApplicantManagementPage() {
  const [data, setData] =
    useState({
      summary: {},
      chiefs: [],
      applicants: [],
    });

  const [search, setSearch] =
    useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [error, setError] =
    useState('');

  const [
    addModalOpen,
    setAddModalOpen,
  ] = useState(false);

  const [
    assignmentChief,
    setAssignmentChief,
  ] = useState(null);

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadChiefApplicants =
      async () => {
        setIsLoading(true);
        setError('');

        try {
          const accessToken =
            await getAccessToken();

          const response =
            await fetch(
              '/api/admin/chief-applicants',
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
                'Chief Applicant management could not be loaded.'
            );
          }

          if (!cancelled) {
            setData({
              summary:
                result.summary || {},
              chiefs:
                result.chiefs || [],
              applicants:
                result.applicants || [],
            });
          }
        } catch (loadError) {
          if (!cancelled) {
            setError(
              loadError?.message ||
                'Chief Applicant management could not be loaded.'
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      };

    loadChiefApplicants();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const chiefs =
    useMemo(
      () =>
        data.chiefs || [],
      [data.chiefs]
    );

  const applicants =
    useMemo(
      () =>
        data.applicants || [],
      [data.applicants]
    );

  const summary =
    data.summary || {};

  const visibleChiefs =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return chiefs;
      }

      return chiefs.filter(
        (chief) =>
          [
            chief.fullName,
            chief.email,
            chief.phone,
            chief.accountStatus,
            (
              chief.assignedApplicants ||
              []
            )
              .map(
                (applicant) =>
                  applicant.fullName
              )
              .join(' '),
            (
              chief.assignedClients ||
              []
            )
              .map(
                (client) =>
                  client.fullName
              )
              .join(' '),
          ].some(
            (value) =>
              String(
                value || ''
              )
                .toLowerCase()
                .includes(query)
          )
      );
    }, [
      chiefs,
      search,
    ]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
            Workforce Leadership
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Chief Applicants
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Create Chief Applicant accounts and manage the Applicants they supervise.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setAddModalOpen(true)
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          <FiPlus className="h-4 w-4" />
          Add Chief Applicant
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          [
            'Total Chiefs',
            summary.totalChiefs || 0,
          ],
          [
            'Active Chiefs',
            summary.activeChiefs || 0,
          ],
          [
            'Assigned Applicants',
            summary.assignedApplicants ||
              0,
          ],
          [
            'Unassigned Applicants',
            summary.unassignedApplicants ||
              0,
          ],
          [
            'Client Coverage',
            summary.coveredClients || 0,
          ],
          [
            'Applications',
            summary.applications || 0,
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <FiUsers className="h-5 w-5 text-blue-600" />

            <p className="mt-4 text-3xl font-bold text-slate-950">
              {value}
            </p>

            <p className="mt-1 text-sm font-medium text-slate-500">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-7 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search Chiefs, Applicants or Clients..."
              className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        {error && (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="px-6 py-16 text-center text-sm font-medium text-slate-500">
            Loading Chief Applicants...
          </div>
        ) : visibleChiefs.length ===
          0 ? (
          <div className="px-6 py-16 text-center">
            <FiUsers className="mx-auto h-8 w-8 text-slate-300" />

            <p className="mt-3 font-bold text-slate-800">
              No Chief Applicants found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Create the first Chief Applicant account to begin assigning Applicant supervision.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Chief Applicant
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Applicants
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Client Coverage
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Applications
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {visibleChiefs.map(
                  (chief) => (
                    <tr
                      key={chief.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-900">
                          {
                            chief.fullName
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {chief.email}
                        </p>

                        {chief.phone && (
                          <p className="mt-1 text-xs text-slate-400">
                            {chief.phone}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${
                            chief.accountStatus ===
                            'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {
                            chief.accountStatus
                          }
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-900">
                          {Number(
                            chief.applicantCount ||
                              0
                          )}
                        </p>

                        <p className="mt-1 max-w-[260px] truncate text-xs text-slate-500">
                          {(
                            chief.assignedApplicants ||
                            []
                          )
                            .map(
                              (applicant) =>
                                applicant.fullName
                            )
                            .filter(Boolean)
                            .join(', ') ||
                            'No Applicants assigned'}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-900">
                          {Number(
                            chief.clientCount ||
                              0
                          )}
                        </p>

                        <p className="mt-1 max-w-[240px] truncate text-xs text-slate-500">
                          {(
                            chief.assignedClients ||
                            []
                          )
                            .map(
                              (client) =>
                                client.fullName
                            )
                            .filter(Boolean)
                            .join(', ') ||
                            'No Client workload'}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-900">
                          {Number(
                            chief.applicationCount ||
                              0
                          )}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setAssignmentChief(
                              chief
                            )
                          }
                          disabled={
                            chief.accountStatus !==
                            'active'
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          <FiUserCheck className="h-4 w-4" />

                          {chief.accountStatus ===
                          'active'
                            ? 'Manage Applicants'
                            : 'Chief inactive'}
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddChiefApplicantModal
        open={addModalOpen}
        onClose={() =>
          setAddModalOpen(false)
        }
        onCreated={() =>
          setRefreshKey(
            (current) =>
              current + 1
          )
        }
      />

      {assignmentChief && (
        <AssignmentModal
          chief={assignmentChief}
          applicants={applicants}
          onClose={() =>
            setAssignmentChief(
              null
            )
          }
          onChanged={() =>
            setRefreshKey(
              (current) =>
                current + 1
            )
          }
        />
      )}
    </div>
  );
}
