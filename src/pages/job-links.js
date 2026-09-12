import { useEffect, useMemo, useState } from 'react';
import { FiExternalLink, FiLink, FiPlus } from 'react-icons/fi';
import AddJobLinkModal from '../shared/components/AddJobLinkModal';
import DashboardLayout from '../shared/components/DashboardLayout';
import SEO from '../shared/components/SEO';
import { createClient } from '../lib/supabase/client';

async function getAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  return session.access_token;
}

function formatDate(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ClientJobLinks() {
  const [requests, setRequests] = useState([]);
  const [view, setView] = useState('active');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [withdrawingId, setWithdrawingId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRequests = async () => {
      try {
        setIsLoading(true);
        setError('');
        const accessToken = await getAccessToken();
        const response = await fetch('/api/client/job-requests', {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !Array.isArray(result.requests)) {
          throw new Error(
            result.error || 'Unable to load your submitted job links.'
          );
        }

        if (active) setRequests(result.requests);
      } catch (loadError) {
        if (active) {
          setError(
            loadError.message || 'Unable to load your submitted job links.'
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadRequests();
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => ({
    active: requests.filter((request) =>
      ['new', 'in_review'].includes(request.status)
    ).length,
    withdrawn: requests.filter((request) => request.status === 'withdrawn').length,
    completed: requests.filter((request) =>
      ['converted', 'dismissed'].includes(request.status)
    ).length,
    all: requests.length,
  }), [requests]);

  const visibleRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesView =
        view === 'all' ||
        (view === 'active'
          ? ['new', 'in_review'].includes(request.status)
          : view === 'completed'
            ? ['converted', 'dismissed'].includes(request.status)
            : request.status === view);
      const matchesSearch =
        !term ||
        [request.jobLink, request.comment, request.status].some((value) =>
          String(value || '').toLowerCase().includes(term)
        );

      return matchesView && matchesSearch;
    });
  }, [requests, search, view]);

  const withdrawRequest = async (request) => {
    if (
      withdrawingId ||
      !['new', 'in_review'].includes(request.status) ||
      !window.confirm(
        'Withdraw this job link? The Applicant will no longer be able to start an application from it.'
      )
    ) {
      return;
    }

    try {
      setWithdrawingId(request.id);
      setError('');
      setMessage('');
      const accessToken = await getAccessToken();
      const response = await fetch('/api/client/job-requests', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId: request.id, action: 'withdraw' }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.request?.status !== 'withdrawn') {
        throw new Error(result.error || 'The job link could not be withdrawn.');
      }

      setRequests((current) =>
        current.map((item) =>
          item.id === request.id ? { ...item, ...result.request } : item
        )
      );
      setMessage('Job link moved to the Withdrawn space.');
    } catch (withdrawError) {
      setError(withdrawError.message || 'The job link could not be withdrawn.');
    } finally {
      setWithdrawingId('');
    }
  };

  return (
    <DashboardLayout searchValue={search} onSearchChange={setSearch}>
      <SEO title="Job Links" />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">
            My Job Links
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Submit opportunities and follow each link without mixing them with applications.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError('');
            setMessage('');
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E50C3] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1A45A7]"
        >
          <FiPlus /> Add Job Link
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Job-link status">
        {[
          ['active', 'Active'],
          ['withdrawn', 'Withdrawn'],
          ['completed', 'Completed'],
          ['all', 'All'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={view === value}
            onClick={() => setView(value)}
            className={
              view === value
                ? 'rounded-full bg-[#1E50C3] px-4 py-2 text-xs font-semibold text-white'
                : 'rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700'
            }
          >
            {label} ({counts[value]})
          </button>
        ))}
      </div>

      {message && (
        <p className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">Loading job links...</p>
        ) : visibleRequests.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleRequests.map((request) => (
              <article
                key={request.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    <FiLink />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {String(request.status || 'new').replace(/_/g, ' ')}
                  </span>
                </div>
                <a
                  href={request.jobLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block break-all text-sm font-semibold text-[#1E50C3] hover:underline"
                >
                  {request.jobLink}
                </a>
                <p className="mt-2 text-xs text-slate-500">
                  {request.status === 'withdrawn' && request.withdrawnAt
                    ? `Withdrawn ${formatDate(request.withdrawnAt)}`
                    : `Submitted ${formatDate(request.createdAt)}`}
                </p>
                {request.comment && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    {request.comment}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={request.jobLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Open Job <FiExternalLink />
                  </a>
                  {['new', 'in_review'].includes(request.status) && (
                    <button
                      type="button"
                      disabled={Boolean(withdrawingId)}
                      onClick={() => withdrawRequest(request)}
                      className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {withdrawingId === request.id ? 'Withdrawing...' : 'Withdraw Link'}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center text-sm text-slate-500 dark:border-slate-700">
            No job links are in this space.
          </p>
        )}
      </section>

      <AddJobLinkModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={async ({ jobLink, comment }) => {
          const accessToken = await getAccessToken();
          const response = await fetch('/api/client/job-requests', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ jobLink, comment }),
          });
          const result = await response.json().catch(() => ({}));

          if (!response.ok || !result.request) {
            throw new Error(result.error || 'Unable to submit your job link.');
          }

          setRequests((current) => [
            result.request,
            ...current.filter((request) => request.id !== result.request.id),
          ]);
          setView('active');
          setError('');
          setMessage(result.message || 'Job link submitted successfully.');
        }}
      />
    </DashboardLayout>
  );
}
