import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FiCheck,
  FiCopy,
  FiLink,
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
      <section className="my-auto w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
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
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
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

function AddLinkerModal({
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

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [
    credentials,
    setCredentials,
  ] = useState(null);

  useEffect(() => {
    if (!open) {
      setForm({
        fullName: '',
        email: '',
        phone: '',
      });

      setError('');
      setCredentials(null);
      setIsSaving(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setIsSaving(true);
    setError('');

    try {
      const accessToken =
        await getAccessToken();

      const response =
        await fetch(
          '/api/admin/linkers',
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(
              form
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
            'The Linker could not be created.'
        );
      }

      setCredentials(
        result.credentials
      );

      onCreated();
    } catch (submitError) {
      setError(
        submitError?.message ||
          'The Linker could not be created.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      title={
        credentials
          ? 'Linker account created'
          : 'Add New Linker'
      }
      subtitle={
        credentials
          ? 'Copy these temporary credentials and send them securely to the Linker.'
          : 'Create a Linker account that Admin can connect to Applicants.'
      }
      onClose={onClose}
      disableClose={isSaving}
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
                  The Linker can now sign in to ApplyLoop.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Email
              </p>

              <div className="mt-2 flex items-center justify-between gap-4">
                <p className="break-all font-semibold text-slate-900">
                  {credentials.email}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard
                      ?.writeText(
                        credentials.email
                      )
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                >
                  <FiCopy />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Temporary Password
              </p>

              <div className="mt-2 flex items-center justify-between gap-4">
                <p className="break-all font-mono font-semibold text-slate-900">
                  {
                    credentials.temporaryPassword
                  }
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard
                      ?.writeText(
                        credentials
                          .temporaryPassword
                      )
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                >
                  <FiCopy />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-7 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8"
        >
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm font-bold text-slate-700">
                Full Name
              </span>

              <input
                value={
                  form.fullName
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      fullName:
                        event
                          .target
                          .value,
                    })
                  )
                }
                className={
                  inputClassName
                }
                placeholder="Enter Linker name"
                required
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">
                Email Address
              </span>

              <input
                type="email"
                value={form.email}
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      email:
                        event
                          .target
                          .value,
                    })
                  )
                }
                className={
                  inputClassName
                }
                placeholder="linker@example.com"
                required
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">
                Phone
              </span>

              <input
                value={form.phone}
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      phone:
                        event
                          .target
                          .value,
                    })
                  )
                }
                className={
                  inputClassName
                }
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="mt-7 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? 'Creating...'
                : 'Create Linker'}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}

function AssignmentModal({
  linker,
  onClose,
  onChanged,
  focusApplicantId = null,
  focusApplicantName = '',
}) {
  const [applicants, setApplicants] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [
    changingApplicantId,
    setChangingApplicantId,
  ] = useState(null);

  const loadApplicants = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const accessToken =
        await getAccessToken();

      const response =
        await fetch(
          `/api/admin/linkers/${linker.id}/assignments`,
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
            'Applicants could not be loaded.'
        );
      }

      setApplicants(
        result.applicants || []
      );
    } catch (loadError) {
      setError(
        loadError?.message ||
          'Applicants could not be loaded.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [linker.id]);

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  const visibleApplicants =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      const candidates =
        focusApplicantId
          ? applicants.filter(
              (applicant) =>
                applicant.id ===
                focusApplicantId
            )
          : applicants;

      if (!query) {
        return candidates;
      }

      return candidates.filter(
        (applicant) =>
          [
            applicant.fullName,
            applicant.email,
            applicant.assignedTeam,
            applicant
              .currentAssignment
              ?.linkerName,
          ].some((value) =>
            String(value || '')
              .toLowerCase()
              .includes(query)
          )
      );
    }, [
      applicants,
      search,
      focusApplicantId,
    ]);

  const assignApplicant =
    async (applicant) => {
      setChangingApplicantId(
        applicant.id
      );
      setError('');
      setMessage('');

      try {
        const accessToken =
          await getAccessToken();

        const response =
          await fetch(
            `/api/admin/linkers/${linker.id}/assignments`,
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                applicantId:
                  applicant.id,
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
              'The Applicant could not be assigned.'
          );
        }

        setMessage(
          `${applicant.fullName} is now assigned to ${linker.fullName}.`
        );

        await loadApplicants();
        onChanged();
      } catch (assignError) {
        setError(
          assignError?.message ||
            'The Applicant could not be assigned.'
        );
      } finally {
        setChangingApplicantId(
          null
        );
      }
    };

  const unassignApplicant =
    async (applicant) => {
      const assignmentId =
        applicant
          .currentAssignment?.id;

      if (!assignmentId) {
        return;
      }

      setChangingApplicantId(
        applicant.id
      );
      setError('');
      setMessage('');

      try {
        const accessToken =
          await getAccessToken();

        const response =
          await fetch(
            `/api/admin/linkers/${linker.id}/assignments`,
            {
              method:
                'DELETE',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                assignmentId,
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
              'The Applicant could not be unassigned.'
          );
        }

        setMessage(
          `${applicant.fullName} was unassigned from ${linker.fullName}.`
        );

        await loadApplicants();
        onChanged();
      } catch (unassignError) {
        setError(
          unassignError?.message ||
            'The Applicant could not be unassigned.'
        );
      } finally {
        setChangingApplicantId(
          null
        );
      }
    };

  return (
    <ModalShell
      title={`Applicants for ${linker.fullName}`}
      subtitle="Each Applicant can have one active Linker. Client access will continue to flow through the Applicant's assigned clients."
      onClose={onClose}
      disableClose={
        Boolean(
          changingApplicantId
        )
      }
    >
      <div className="p-6 sm:p-8">
        {focusApplicantId && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-blue-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
              Coverage intervention
            </p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              Assign{' '}
              {focusApplicantName ||
                'this Applicant'}{' '}
              to {linker.fullName}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              Only the Applicant requiring Linker
              coverage is shown below.
            </p>
          </div>
        )}

        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search Applicants..."
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          {isLoading ? (
            <div className="px-6 py-12 text-center text-sm font-medium text-slate-500">
              Loading Applicants...
            </div>
          ) : visibleApplicants.length ===
            0 ? (
            <div className="px-6 py-12 text-center text-sm font-medium text-slate-500">
              No Applicants found.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {visibleApplicants.map(
                (applicant) => {
                  const busy =
                    changingApplicantId ===
                    applicant.id;

                  return (
                    <div
                      key={
                        applicant.id
                      }
                      className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">
                          {
                            applicant.fullName
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {
                            applicant.email
                          }
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                            {
                              applicant.availability
                            }
                          </span>

                          {applicant.currentAssignment && (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                              Linker:{' '}
                              {
                                applicant
                                  .currentAssignment
                                  .linkerName
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {applicant.isAssignedToThisLinker ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              unassignApplicant(
                                applicant
                              )
                            }
                            className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {busy
                              ? 'Removing...'
                              : 'Unassign'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              busy ||
                              !applicant.canAssign
                            }
                            onClick={() =>
                              assignApplicant(
                                applicant
                              )
                            }
                            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {applicant
                              .currentAssignment
                              ? 'Already Assigned'
                              : busy
                                ? 'Assigning...'
                                : 'Assign'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

export default function LinkerManagementPage({
  managementContext = null,
}) {
  const [linkers, setLinkers] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [
    addModalOpen,
    setAddModalOpen,
  ] = useState(false);

  const [
    assignmentLinker,
    setAssignmentLinker,
  ] = useState(null);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const focusApplicantId =
    managementContext?.reason ===
      'linker-coverage'
      ? managementContext.applicantId
      : null;

  const focusApplicantName =
    managementContext?.reason ===
      'linker-coverage'
      ? managementContext.applicantName
      : '';

  const isCoverageIntervention =
    Boolean(
      focusApplicantId
    );

  useEffect(() => {
    let cancelled = false;

    const loadLinkers =
      async () => {
        setIsLoading(true);
        setError('');

        try {
          const accessToken =
            await getAccessToken();

          const response =
            await fetch(
              '/api/admin/linkers',
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
                'The Linker list could not be loaded.'
            );
          }

          if (!cancelled) {
            setLinkers(
              result.linkers || []
            );
          }
        } catch (loadError) {
          if (!cancelled) {
            setError(
              loadError?.message ||
                'The Linker list could not be loaded.'
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      };

    loadLinkers();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const visibleLinkers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return linkers;
      }

      return linkers.filter(
        (linker) =>
          [
            linker.fullName,
            linker.email,
            linker.phone,
            linker.accountStatus,
          ].some((value) =>
            String(value || '')
              .toLowerCase()
              .includes(query)
          )
      );
    }, [linkers, search]);

  const activeLinkers =
    linkers.filter(
      (linker) =>
        linker.accountStatus ===
        'active'
    ).length;

  const assignedApplicants =
    linkers.reduce(
      (total, linker) =>
        total +
        Number(
          linker.activeAssignments ||
            0
        ),
      0
    );

  return (
    <div className="mx-auto w-full max-w-7xl">
      {isCoverageIntervention && (
        <div className="mb-6 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-blue-50 p-5 shadow-sm sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
            Linker coverage required
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Choose a Linker for{' '}
                {focusApplicantName ||
                  'this Applicant'}
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Select an active Linker below. Their
                Applicant assignment window will open
                already focused on the worker who needs
                coverage.
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
              Action required
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
            Workforce
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Linker Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Create Linker accounts and connect each Linker to the Applicants they support.
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
          Add Linker
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <FiUsers className="h-5 w-5 text-blue-600" />

          <p className="mt-4 text-3xl font-bold text-slate-950">
            {linkers.length}
          </p>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Total Linkers
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <FiUserCheck className="h-5 w-5 text-emerald-600" />

          <p className="mt-4 text-3xl font-bold text-slate-950">
            {activeLinkers}
          </p>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Active Linkers
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <FiLink className="h-5 w-5 text-purple-600" />

          <p className="mt-4 text-3xl font-bold text-slate-950">
            {assignedApplicants}
          </p>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Applicant Assignments
          </p>
        </div>
      </div>

      <div className="mt-7 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search Linkers..."
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
            Loading Linkers...
          </div>
        ) : visibleLinkers.length ===
          0 ? (
          <div className="px-6 py-16 text-center">
            <FiUsers className="mx-auto h-8 w-8 text-slate-300" />

            <p className="mt-3 font-bold text-slate-800">
              No Linkers found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Create the first Linker account to begin workforce assignment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Linker
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Applicants
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {visibleLinkers.map(
                  (linker) => (
                    <tr
                      key={linker.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-900">
                          {
                            linker.fullName
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {
                            linker.email
                          }
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            linker.accountStatus ===
                            'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {
                            linker.accountStatus
                          }
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-900">
                          {
                            linker.activeAssignments
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          active assignments
                        </p>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setAssignmentLinker(
                              linker
                            )
                          }
                          disabled={
                            isCoverageIntervention &&
                            linker.accountStatus !==
                              'active'
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          <FiLink className="h-4 w-4" />

                          {isCoverageIntervention
                            ? linker.accountStatus ===
                              'active'
                              ? 'Assign Applicant'
                              : 'Linker inactive'
                            : 'Manage Applicants'}
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

      <AddLinkerModal
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

      {assignmentLinker && (
        <AssignmentModal
          linker={assignmentLinker}
          focusApplicantId={
            focusApplicantId
          }
          focusApplicantName={
            focusApplicantName
          }
          onClose={() =>
            setAssignmentLinker(
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
