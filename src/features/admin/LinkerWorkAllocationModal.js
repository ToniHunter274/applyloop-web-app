import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  FiBriefcase,
  FiPause,
  FiPlay,
  FiX,
  FiCheck,
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

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

export default function LinkerWorkAllocationModal({
  linker,
  onClose,
  onChanged,
  focusApplicantId = null,
  focusApplicantName = '',
}) {
  const [allocations, setAllocations] =
    useState([]);

  const [clients, setClients] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [busyAllocationId, setBusyAllocationId] =
    useState(null);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [form, setForm] =
    useState({
      clientId: '',
      applicantIds: [],
      targetLinks: '',
      priority: 'normal',
      startDate:
        new Date()
          .toISOString()
          .slice(0, 10),
      dueDate: '',
      instructions: '',
    });

  const load = useCallback(
    async () => {
      setIsLoading(true);
      setError('');

      try {
        const accessToken =
          await getAccessToken();

        const response =
          await fetch(
            `/api/admin/linkers/${linker.id}/work-allocations`,
            {
              cache: 'no-store',
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
              'Work allocations could not be loaded.'
          );
        }

        setAllocations(
          result.allocations || []
        );

        setClients(
          result.clients || []
        );
      } catch (loadError) {
        setError(
          loadError?.message ||
            'Work allocations could not be loaded.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [linker.id]
  );

  useEffect(() => {
    load();
  }, [load]);

  const selectedClient =
    useMemo(
      () =>
        clients.find(
          (client) =>
            client.id ===
            form.clientId
        ) || null,
      [
        clients,
        form.clientId,
      ]
    );

  useEffect(() => {
    if (
      !focusApplicantId ||
      !selectedClient
    ) {
      return;
    }

    const available =
      selectedClient.applicants.some(
        (applicant) =>
          applicant.id ===
          focusApplicantId
      );

    if (!available) {
      return;
    }

    setForm((current) => ({
      ...current,
      applicantIds:
        current.applicantIds.includes(
          focusApplicantId
        )
          ? current.applicantIds
          : [
              ...current.applicantIds,
              focusApplicantId,
            ],
    }));
  }, [
    focusApplicantId,
    selectedClient,
  ]);

  const toggleApplicant =
    (applicantId) => {
      setForm((current) => ({
        ...current,
        applicantIds:
          current.applicantIds.includes(
            applicantId
          )
            ? current.applicantIds.filter(
                (id) =>
                  id !== applicantId
              )
            : [
                ...current.applicantIds,
                applicantId,
              ],
      }));
    };

  const createAllocation =
    async (event) => {
      event.preventDefault();

      setError('');
      setMessage('');

      if (
        !form.clientId ||
        form.applicantIds.length === 0 ||
        !form.targetLinks
      ) {
        setError(
          'Choose a Client, at least one Applicant, and a target.'
        );
        return;
      }

      setIsSaving(true);

      try {
        const accessToken =
          await getAccessToken();

        const response =
          await fetch(
            `/api/admin/linkers/${linker.id}/work-allocations`,
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
              'The work allocation could not be created.'
          );
        }

        setMessage(
          'Work allocation created successfully.'
        );

        setForm({
          clientId: '',
          applicantIds: [],
          targetLinks: '',
          priority: 'normal',
          startDate:
            new Date()
              .toISOString()
              .slice(0, 10),
          dueDate: '',
          instructions: '',
        });

        await load();
        onChanged?.();
      } catch (saveError) {
        setError(
          saveError?.message ||
            'The work allocation could not be created.'
        );
      } finally {
        setIsSaving(false);
      }
    };

  const changeStatus =
    async (
      allocationId,
      status
    ) => {
      setBusyAllocationId(
        allocationId
      );
      setError('');
      setMessage('');

      try {
        const accessToken =
          await getAccessToken();

        const response =
          await fetch(
            `/api/admin/linkers/${linker.id}/work-allocations`,
            {
              method: 'PATCH',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                allocationId,
                status,
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
              'The allocation could not be updated.'
          );
        }

        setMessage(
          'Work allocation updated.'
        );

        await load();
        onChanged?.();
      } catch (statusError) {
        setError(
          statusError?.message ||
            'The allocation could not be updated.'
        );
      } finally {
        setBusyAllocationId(
          null
        );
      }
    };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget &&
          !isSaving &&
          !busyAllocationId
        ) {
          onClose();
        }
      }}
    >
      <section className="my-auto w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Dynamic workload
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              Work Allocations — {linker.fullName}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              A Linker can work across multiple Clients and Applicants at the same time.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={
              isSaving ||
              Boolean(
                busyAllocationId
              )
            }
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <FiX className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[80vh] overflow-y-auto p-6 sm:p-8">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {message}
            </div>
          )}

          {focusApplicantId && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Create a workload that includes{' '}
              <strong>
                {focusApplicantName ||
                  'the selected Applicant'}
              </strong>.
            </div>
          )}

          <form
            onSubmit={
              createAllocation
            }
            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <FiBriefcase />
              </div>

              <div>
                <h3 className="font-bold text-slate-950">
                  New Work Allocation
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Choose the Client, eligible Applicants and link target.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  Client
                </span>

                <select
                  value={
                    form.clientId
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        clientId:
                          event.target
                            .value,
                        applicantIds:
                          [],
                      })
                    )
                  }
                  className={
                    inputClassName
                  }
                  required
                >
                  <option value="">
                    Select Client
                  </option>

                  {clients.map(
                    (client) => (
                      <option
                        key={client.id}
                        value={client.id}
                      >
                        {client.fullName}
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="sm:col-span-2">
                <p className="text-sm font-bold text-slate-700">
                  Eligible Applicants
                </p>

                {!selectedClient ? (
                  <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                    Select a Client first.
                  </div>
                ) : (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {selectedClient
                      .applicants
                      .map(
                        (applicant) => (
                          <label
                            key={
                              applicant.id
                            }
                            className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300"
                          >
                            <input
                              type="checkbox"
                              checked={
                                form.applicantIds.includes(
                                  applicant.id
                                )
                              }
                              onChange={() =>
                                toggleApplicant(
                                  applicant.id
                                )
                              }
                              className="mt-1"
                            />

                            <span>
                              <strong className="block text-sm text-slate-900">
                                {
                                  applicant.fullName
                                }
                              </strong>

                              <small className="mt-1 block text-slate-500">
                                {
                                  applicant.email
                                }
                              </small>
                            </span>
                          </label>
                        )
                      )}
                  </div>
                )}
              </div>

              <label>
                <span className="text-sm font-bold text-slate-700">
                  Link Target
                </span>

                <input
                  type="number"
                  min="1"
                  value={
                    form.targetLinks
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        targetLinks:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="e.g. 150"
                  className={
                    inputClassName
                  }
                  required
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">
                  Priority
                </span>

                <select
                  value={
                    form.priority
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        priority:
                          event.target
                            .value,
                      })
                    )
                  }
                  className={
                    inputClassName
                  }
                >
                  <option value="low">
                    Low
                  </option>
                  <option value="normal">
                    Normal
                  </option>
                  <option value="high">
                    High
                  </option>
                  <option value="urgent">
                    Urgent
                  </option>
                </select>
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">
                  Start Date
                </span>

                <input
                  type="date"
                  value={
                    form.startDate
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        startDate:
                          event.target
                            .value,
                      })
                    )
                  }
                  className={
                    inputClassName
                  }
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">
                  Due Date
                </span>

                <input
                  type="date"
                  value={
                    form.dueDate
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        dueDate:
                          event.target
                            .value,
                      })
                    )
                  }
                  className={
                    inputClassName
                  }
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  Instructions
                </span>

                <textarea
                  rows={3}
                  value={
                    form.instructions
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        instructions:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Optional sourcing instructions for this workload."
                  className={
                    inputClassName
                  }
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving
                  ? 'Creating...'
                  : 'Create Work Allocation'}
              </button>
            </div>
          </form>

          <section className="mt-7">
            <h3 className="text-lg font-bold text-slate-950">
              Current Work Allocations
            </h3>

            {isLoading ? (
              <p className="mt-4 text-sm text-slate-500">
                Loading allocations...
              </p>
            ) : allocations.length ===
              0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No work allocations yet.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {allocations.map(
                  (allocation) => {
                    const busy =
                      busyAllocationId ===
                      allocation.id;

                    return (
                      <article
                        key={
                          allocation.id
                        }
                        className="rounded-2xl border border-slate-200 bg-white p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-slate-950">
                                {
                                  allocation.clientName
                                }
                              </h4>

                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold capitalize text-blue-700">
                                {
                                  allocation.priority
                                }
                              </span>

                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-600">
                                {
                                  allocation.status
                                }
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-slate-600">
                              Applicants:{' '}
                              {allocation
                                .applicants
                                .map(
                                  (
                                    applicant
                                  ) =>
                                    applicant.fullName
                                )
                                .join(', ')}
                            </p>

                            {allocation.instructions && (
                              <p className="mt-2 text-sm text-slate-500">
                                {
                                  allocation.instructions
                                }
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {allocation.status ===
                              'active' && (
                              <button
                                type="button"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  changeStatus(
                                    allocation.id,
                                    'paused'
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50"
                              >
                                <FiPause />
                                Pause
                              </button>
                            )}

                            {allocation.status ===
                              'paused' && (
                              <button
                                type="button"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  changeStatus(
                                    allocation.id,
                                    'active'
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
                              >
                                <FiPlay />
                                Resume
                              </button>
                            )}

                            {![
                              'completed',
                              'cancelled',
                            ].includes(
                              allocation.status
                            ) && (
                              <button
                                type="button"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  changeStatus(
                                    allocation.id,
                                    'completed'
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                              >
                                <FiCheck />
                                Complete
                              </button>
                            )}

                            {![
                              'completed',
                              'cancelled',
                            ].includes(
                              allocation.status
                            ) && (
                              <button
                                type="button"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  changeStatus(
                                    allocation.id,
                                    'cancelled'
                                  )
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-4">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs font-semibold text-slate-500">
                              Target
                            </p>
                            <strong className="mt-1 block text-lg text-slate-950">
                              {
                                allocation.targetLinks
                              }
                            </strong>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs font-semibold text-slate-500">
                              Submitted
                            </p>
                            <strong className="mt-1 block text-lg text-slate-950">
                              {
                                allocation.linksSubmitted
                              }
                            </strong>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs font-semibold text-slate-500">
                              Remaining
                            </p>
                            <strong className="mt-1 block text-lg text-slate-950">
                              {
                                allocation.linksRemaining
                              }
                            </strong>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs font-semibold text-slate-500">
                              Progress
                            </p>
                            <strong className="mt-1 block text-lg text-slate-950">
                              {
                                allocation.progressPercent
                              }
                              %
                            </strong>
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
