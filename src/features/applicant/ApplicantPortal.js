import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiBell,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCopy,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiHome,
  FiLink,
  FiLock,
  FiLogOut,
  FiMessageSquare,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiSend,
  FiSettings,
  FiTarget,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../shared/context/AuthContext';
import { createClient } from '../../lib/supabase/client';
import {
  getRoleHome,
  ROLE_NAVIGATION,
  ROLE_PAGE_META,
  USER_ROLES,
} from '../../shared/config/roles';
import WorkspaceShell from '../../shared/components/WorkspaceShell';
import {
  STATUS_OPTIONS,
} from '../../data/applicantData';
import styles from './ApplicantPortal.module.css';

const classNames = (...values) => values.filter(Boolean).join(' ');

const EMPTY_APPLICANT_PERFORMANCE = {
  dailyTarget: 0,
  completedTasks: 0,
  clientSatisfaction: 0,
  ratingCount: 0,
  completionRate: 0,
  monitoredWorkdays: 0,
  todayCompleted: 0,
  todayCompletionRate: 0,
};

async function getApplicantAccessToken() {
  const supabase = createClient();

  if (!supabase) {
    throw new Error(
      'The Supabase connection is unavailable.'
    );
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

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

const formatConversationTime = (
  value
) => {
  if (!value) {
    return '';
  }

  return new Date(
    value
  ).toLocaleString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  );
};

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'AL';

const getParts = (router) => {
  const section = router.query?.section;
  return Array.isArray(section) ? section : section ? [section] : [];
};

const getStatusClass = (status) => {
  if (status === 'Interview Scheduled') return styles.statusInterview;
  if (status === 'Waiting') return styles.statusWaiting;
  if (status === 'Offer Received') return styles.statusOffer;
  if (status === 'Rejected') return styles.statusRejected;
  return styles.statusSubmitted;
};

const normalizeAssignedClient = (
  client = {}
) => ({
  id: client.id,
  name:
    client.name ||
    client.fullName ||
    'Unnamed Client',
  role:
    client.role ||
    'Client',
  email:
    client.email || '',
  phone:
    client.phone || '',
  nationality:
    client.nationality ||
    client.country ||
    'Not provided',
  state:
    client.state || '',
  gender:
    client.gender ||
    'Not provided',
  disability:
    client.disability ||
    'Not provided',
  veteran:
    client.veteran ||
    'Not provided',
  workType:
    client.workType ||
    'Not provided',
  schedule:
    client.schedule ||
    'Not provided',
  contract:
    client.contract ||
    client.plan ||
    'Not provided',
  locations:
    Array.isArray(
      client.locations
    )
      ? client.locations
      : [],
  targetCountries:
    client.targetCountries ||
    client.country ||
    'Not provided',
  currentLocation:
    client.currentLocation ||
    'Not provided',
  targetMarkets:
    Array.isArray(client.targetMarkets)
      ? client.targetMarkets
      : [],
  targetRoles:
    Array.isArray(client.targetRoles)
      ? client.targetRoles
      : [],
  targetIndustries:
    client.targetIndustries ||
    'Not provided',
  specialization:
    client.specialization ||
    'Not provided',
  employmentType:
    client.employmentType ||
    'Not provided',
  duration:
    client.duration ||
    'Not provided',
  salaryExpectation:
    client.salaryExpectation ||
    'Not provided',
  workAuthorization:
    client.workAuthorization ||
    'Not provided',
  sponsorship:
    client.sponsorship ||
    'Not provided',
  yearsExperience:
    client.yearsExperience ||
    'Not provided',
  linkedinUrl:
    client.linkedinUrl || '',
  portfolioUrl:
    client.portfolioUrl || '',
  additionalPreferences:
    client.additionalPreferences ||
    'Not provided',
  jobRequests:
    Array.isArray(client.jobRequests)
      ? client.jobRequests
      : [],
  hasResume:
    Boolean(client.hasResume),
  onboardingStatus:
    client.onboardingStatus ||
    'not_started',
  progress:
    Number(
      client.progress || 0
    ),
  rejectedRoles:
    Number(
      client.rejectedRoles || 0
    ),
  selectedRoles:
    Number(
      client.selectedRoles || 0
    ),
  interviews:
    Number(
      client.interviews || 0
    ),
  feedbacks:
    Number(
      client.feedbacks || 0
    ),
  offers:
    Number(
      client.offers || 0
    ),
  applications:
    Number(
      client.applications || 0
    ),
  applicationLimit:
    Number(
      client.applicationLimit || 0
    ),
  applicantTarget:
    Number(
      client.applicantTarget || 0
    ),
  applicantPeriodCompleted:
    Number(
      client.applicantPeriodCompleted ||
        0
    ),
  applicantTargetRemaining:
    Number(
      client.applicantTargetRemaining ||
        0
    ),
  applicantTargetProgress:
    Number(
      client.applicantTargetProgress ||
        0
    ),
  clientPeriodCompleted:
    Number(
      client.clientPeriodCompleted || 0
    ),
  subscriptionStatus:
    client.subscriptionStatus || null,
  subscriptionPeriodStart:
    client.subscriptionPeriodStart ||
    null,
  subscriptionPeriodEnd:
    client.subscriptionPeriodEnd ||
    null,
  gracePeriodEndsAt:
    client.gracePeriodEndsAt || null,
  status:
    client.status || 'active',
  notes:
    client.notes ||
    'No admin notes available.',
});

function Avatar({
  name,
  large = false,
}) {
  return (
    <span
      className={
        large
          ? styles.avatarLarge
          : styles.avatar
      }
    >
      {initials(name)}
    </span>
  );
}

function NotificationButton() {
  return (
    <button type="button" className={styles.notification} aria-label="Notifications">
      <FiBell />
    </button>
  );
}

function PageHeader({
  title,
  subtitle,
  searchable = false,
  search = '',
  onSearch,
  action,
  showHeading = true,
  showNotification = true,
}) {
  const hasActions =
    searchable ||
    Boolean(action) ||
    showNotification;

  if (
    !showHeading &&
    !hasActions
  ) {
    return null;
  }

  return (
    <div
      className={classNames(
        styles.pageHeader,
        !showHeading &&
          styles.pageHeaderActionsOnly
      )}
    >
      {showHeading && (
        <div className={styles.pageHeading}>
          <h1>{title}</h1>
          {subtitle && (
            <p>{subtitle}</p>
          )}
        </div>
      )}

      {hasActions && (
        <div className={styles.headerActions}>
          {searchable && (
            <label className={styles.searchBox}>
              <FiSearch />

              <input
                value={search}
                onChange={(event) =>
                  onSearch?.(
                    event.target.value
                  )
                }
                placeholder="Search Applications"
              />
            </label>
          )}

          {action}

          {showNotification && (
            <NotificationButton />
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, foot, positive = false, warning = false }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      {foot && <div className={classNames(styles.statFoot, positive && styles.statPositive, warning && styles.statWarning)}>{foot}</div>}
    </div>
  );
}

function ApplicationTable({
  records,
  onChangeRecord,
  onOpen,
  search,
  clientFilter,
  readOnly = false,
}) {
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesQuery = !query || [record.client, record.company, record.position, record.location, record.status, record.linkSource]
        .some((value) => String(value).toLowerCase().includes(query));
      const matchesClient = !clientFilter || record.clientId === clientFilter;
      return matchesQuery && matchesClient;
    });
  }, [clientFilter, records, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, clientFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, index) => index + 1);
    if (safePage <= 3) return [1, 2, 3, 'ellipsis', totalPages];
    if (safePage >= totalPages - 2) return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages];
    return [1, 'ellipsis', safePage, 'ellipsis-2', totalPages];
  }, [safePage, totalPages]);

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.applicationTable}>
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '13%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Client</th>
              <th>Company</th>
              <th>Position</th>
              <th>Location</th>
              <th>Date</th>
              <th>Status</th>
              <th>Link Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((record) => (
              <tr key={record.id} onClick={() => onOpen(record)}>
                <td>{record.client}</td>
                <td>{record.company}</td>
                <td>{record.position}</td>
                <td>{record.location}</td>
                <td>{record.date}</td>
                <td>
                  <select
                    aria-label={`Status for ${record.company}`}
                    value={record.status}
                    disabled={readOnly}
                    className={classNames(styles.statusSelect, getStatusClass(record.status))}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => onChangeRecord(record.id, { status: event.target.value })}
                  >
                    {STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </td>
                <td>
                  <div className={styles.sourceCell}>
                    <span title="Automatically recorded from the original link provider">
                      {record.linkSource || 'Not recorded'}
                    </span>
                    <button type="button" className={styles.rowLinkButton} aria-label={`Open ${record.company} application`} onClick={(event) => { event.stopPropagation(); onOpen(record); }}>
                      <FiExternalLink />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={7} style={{ height: 120, textAlign: 'center', color: '#8b919a' }}>No client application records match this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.pagination}>
        <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><FiChevronLeft /></button>
        {visiblePages.map((item) => typeof item === 'number'
          ? <button type="button" key={item} className={item === safePage ? styles.paginationActive : ''} onClick={() => setPage(item)}>{item}</button>
          : <span key={item}>…</span>)}
        <button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><FiChevronRight /></button>
      </div>
    </>
  );
}

function Dashboard({
  applications,
  applicationTotal,
  clients,
  performance =
    EMPTY_APPLICANT_PERFORMANCE,
  onChangeRecord,
  onOpenApplication,
  readOnly = false,
}) {
  const [
    search,
    setSearch,
  ] = useState('');

  const [
    clientFilter,
    setClientFilter,
  ] = useState('');

  const dailyTarget =
    Number(
      performance.dailyTarget || 0
    );

  const todayCompleted =
    Number(
      performance.todayCompleted || 0
    );

  const todayCompletionRate =
    Number(
      performance.todayCompletionRate ||
        0
    );

  const remainingToday =
    Math.max(
      0,
      dailyTarget -
        todayCompleted
    );

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here’s your overview for today."
        searchable
        search={search}
        onSearch={setSearch}
        showHeading={false}
        showNotification={false}
      />

      <div
        className={
          styles.statsGrid
        }
      >
        <StatCard
          label="Total Clients"
          value={
            clients.length
          }
        />

        <StatCard
          label="Active Clients"
          value={
            clients.filter(
              (client) =>
                client.status ===
                'active'
            ).length
          }
        />

        <StatCard
          label="Completed Applications"
          value={
            applicationTotal
          }
        />

        <StatCard
          label="Client Feedback"
          value={
            clients.reduce(
              (
                total,
                client
              ) =>
                total +
                Number(
                  client.feedbacks ||
                    0
                ),
              0
            )
          }
        />
      </div>

      <section className="mb-7 mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">
              Daily Application Pipeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track today&apos;s Application workload against your daily target.
            </p>
          </div>

          <div className="text-left sm:text-right">
            <strong className="block text-2xl font-bold text-slate-950">
              {todayCompletionRate.toFixed(
                1
              )}
              %
            </strong>

            <span className="text-xs text-slate-500">
              today&apos;s target completion
            </span>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#1E50C3] transition-all"
            style={{
              width:
                `${Math.min(
                  100,
                  todayCompletionRate
                )}%`,
            }}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Daily Target
            </span>

            <strong className="mt-2 block text-2xl font-bold text-slate-950">
              {dailyTarget > 0
                ? dailyTarget
                : '—'}
            </strong>

            <small className="mt-1 block text-xs text-slate-400">
              Applications expected today
            </small>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Completed Today
            </span>

            <strong className="mt-2 block text-2xl font-bold text-blue-800">
              {todayCompleted}
            </strong>

            <small className="mt-1 block text-xs text-blue-500">
              Applications recorded today
            </small>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Remaining Today
            </span>

            <strong className="mt-2 block text-2xl font-bold text-amber-800">
              {dailyTarget > 0
                ? remainingToday
                : '—'}
            </strong>

            <small className="mt-1 block text-xs text-amber-600">
              Applications still needed
            </small>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Today&apos;s Progress
            </span>

            <strong className="mt-2 block text-2xl font-bold text-emerald-800">
              {todayCompletionRate.toFixed(
                1
              )}
              %
            </strong>

            <small className="mt-1 block text-xs text-emerald-600">
              {dailyTarget > 0
                ? `${todayCompleted} of ${dailyTarget} completed`
                : 'No daily target configured'}
            </small>
          </div>
        </div>
      </section>

      <div
        className={
          styles.sectionTitleRow
        }
      >
        <h2
          className={
            styles.sectionTitle
          }
        >
          All Assigned Clients
        </h2>

        <select
          className={
            styles.selectPlain
          }
          value={
            clientFilter
          }
          onChange={
            (event) =>
              setClientFilter(
                event.target.value
              )
          }
        >
          <option value="">
            Select Client
          </option>

          {clients.map(
            (client) => (
              <option
                key={
                  client.id
                }
                value={
                  client.id
                }
              >
                {client.name}
              </option>
            )
          )}
        </select>
      </div>

      <ApplicationTable
        records={
          applications
        }
        search={search}
        clientFilter={
          clientFilter
        }
        onChangeRecord={
          onChangeRecord
        }
        onOpen={
          onOpenApplication
        }
        readOnly={
          readOnly
        }
      />
    </>
  );
}

function JobLinksPage({
  clients,
  workshopHref,
  onOpenApplication,
}) {
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [sourceFilter, setSourceFilter] = useState('');

  const jobLinks = useMemo(
    () =>
      clients.flatMap((client) =>
        (client.jobRequests || []).map(
          (request) => ({
            ...request,
            clientId: client.id,
            clientName: client.name,
          })
        )
      ),
    [clients]
  );

  const filteredJobLinks = jobLinks.filter((request) => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      [
        request.clientName,
        request.jobCompany,
        request.jobPosition,
        request.jobLocation,
        request.jobLink,
        request.comment,
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(normalizedSearch)
      );
    const matchesClient =
      !clientFilter ||
      request.clientId === clientFilter;
    const matchesSource =
      !sourceFilter ||
      request.source === sourceFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active'
        ? ['new', 'in_review'].includes(request.status)
        : statusFilter === 'completed'
          ? ['converted', 'dismissed'].includes(request.status)
          : request.status === statusFilter);

    return (
      matchesSearch &&
      matchesClient &&
      matchesSource &&
      matchesStatus
    );
  });

  const getProvider = (request) => {
    if (request.linkProvider) {
      return request.linkProvider;
    }

    try {
      return new URL(request.jobLink).hostname.replace(/^www\./, '');
    } catch {
      return 'Job link';
    }
  };

  const getWorkshopLink =
    (request) => {
      const base =
        typeof workshopHref ===
        'string'
          ? {
              pathname:
                workshopHref,
              query: {},
            }
          : {
              pathname:
                workshopHref
                  ?.pathname ||
                '/applicant/workshop',
              query:
                workshopHref
                  ?.query || {},
            };

      return {
        pathname:
          base.pathname,
        query: {
          ...base.query,
          clientId:
            request.clientId,
          jobRequestId:
            request.id,
        },
      };
    };

  const newLinkerLinks =
    jobLinks.filter(
      (request) =>
        request.source ===
          'Linker' &&
        request.status === 'new'
    ).length;

  return (
    <>
      <PageHeader
        title="Job Links"
        subtitle="Review opportunities sent by Clients and Linkers, then start the application workflow."
        searchable
        search={search}
        onSearch={setSearch}
        showHeading={false}
        showNotification={false}
        action={
          <Link
            href={workshopHref}
            className={styles.primaryButton}
          >
            <FiBriefcase />
            Start New Application
          </Link>
        }
      />

      {newLinkerLinks > 0 && (
        <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-blue-900/40 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <FiBell className="mt-0.5 shrink-0 text-[#1E50C3]" />

            <div>
              <strong className="text-sm text-gray-900 dark:text-white">
                {newLinkerLinks} new job link{newLinkerLinks === 1 ? '' : 's'} from your Linker
              </strong>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Review the opportunit{newLinkerLinks === 1 ? 'y' : 'ies'} and start an application when ready.
              </p>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#1E50C3] shadow-sm dark:bg-gray-900">
            New
          </span>
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Job link status">
            {[
              ['active', 'Active'],
              ['withdrawn', 'Withdrawn'],
              ['completed', 'Completed'],
              ['all', 'All'],
            ].map(([status, label]) => (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={statusFilter === status}
                onClick={() => setStatusFilter(status)}
                className={classNames(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  statusFilter === status
                    ? 'bg-[#1E50C3] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
              aria-label="Filter job links by client"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="">All clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              aria-label="Filter job links by source"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="">All sources</option>
              <option value="Client">Client</option>
              <option value="Linker">Linker</option>
            </select>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {filteredJobLinks.length} job link{filteredJobLinks.length === 1 ? '' : 's'} shown
        </p>

        {filteredJobLinks.length > 0 ? (
          <div className="mt-4 space-y-3">
            {filteredJobLinks.map((request) => (
              <article
                key={request.id}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {request.source || 'Client'}
                      </span>
                      <span className="rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-semibold capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                        {request.status === 'new'
                          ? 'New'
                          : request.status === 'in_review'
                            ? 'In Review'
                            : request.status === 'converted'
                              ? 'Application Recorded'
                              : request.status === 'dismissed'
                                ? 'Closed'
                                : request.status === 'withdrawn'
                                  ? 'Withdrawn'
                                  : String(
                                      request.status ||
                                        'new'
                                    ).replace(
                                      /_/g,
                                      ' '
                                    )}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {request.clientName}
                      </span>
                    </div>

                    <h2 className="mt-3 text-base font-bold text-gray-900 dark:text-white">
                      {request.jobPosition || 'Position not provided'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {request.jobCompany || getProvider(request)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      {request.jobLocation && <span>{request.jobLocation}</span>}
                      {request.jobType && <span>{request.jobType}</span>}
                      {request.salaryRange && <span>{request.salaryRange}</span>}
                      <span>{getProvider(request)}</span>
                    </div>

                    {request.comment && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                        {request.comment}
                      </p>
                    )}

                    <p className="mt-3 break-all text-xs text-gray-500 dark:text-gray-400">
                      {request.jobLink}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {['new', 'in_review'].includes(request.status) && (
                      <Link
                        href={getWorkshopLink(request)}
                        className="rounded-xl bg-[#1E50C3] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1A45A7]"
                      >
                        Start Application
                      </Link>
                    )}

                    {request.status === 'converted' &&
                      request.convertedApplicationId && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenApplication?.({
                              id:
                                request.convertedApplicationId,
                              clientId:
                                request.clientId,
                            })
                          }
                          className="rounded-xl bg-[#1E50C3] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1A45A7]"
                        >
                          Open Application
                        </button>
                      )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No job links match these filters.
          </p>
        )}
      </section>
    </>
  );
}

function ClientCard({ client, onOpen }) {
  const subscriptionPaused =
    client.subscriptionStatus ===
      'paused' ||
    client.status === 'paused';

  return (
    <article className={styles.clientCard}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={styles.clientName}>
            {client.name}
          </h3>

          <p className={styles.clientRole}>
            {client.contract}
          </p>
        </div>

        <span
          className={classNames(
            'rounded-full px-2.5 py-1 text-[11px] font-semibold',
            subscriptionPaused
              ? 'bg-rose-50 text-rose-700'
              : 'bg-emerald-50 text-emerald-700'
          )}
        >
          {subscriptionPaused
            ? 'Subscription Paused'
            : 'Active'}
        </span>
      </div>

      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <div className={styles.progressHeader}>
          <span>Your Period Target</span>

          <span>
            {client.applicantPeriodCompleted}
            {' / '}
            {client.applicantTarget}
          </span>
        </div>

        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{
              width:
                `${client.applicantTargetProgress}%`,
            }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            {client.applicantTargetRemaining}{' '}
            remaining
          </span>

          <span>
            {client.applicantTargetProgress}%
          </span>
        </div>
      </div>

      <div className={styles.clientFacts}>
        <span>Client Allowance:</span>
        <span>
          {client.applicationLimit}
        </span>

        <span>Client Period Progress:</span>
        <span>
          {client.clientPeriodCompleted}
          {' / '}
          {client.applicationLimit}
        </span>

        <span>My Remaining Target:</span>
        <span>
          {client.applicantTargetRemaining}
        </span>

        <span>Target Countries:</span>
        <span>
          {client.targetCountries}
        </span>
      </div>

      {client.subscriptionPeriodEnd && (
        <p className="mt-4 text-xs text-gray-500">
          Current period ends{' '}
          {new Date(
            `${client.subscriptionPeriodEnd}T12:00:00`
          ).toLocaleDateString(
            'en-US',
            {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }
          )}
        </p>
      )}

      <div className={styles.cardFooter}>
        <button
          type="button"
          className={styles.textButton}
          onClick={() =>
            onOpen(client)
          }
        >
          View Details
          <FiArrowRight />
        </button>
      </div>
    </article>
  );
}

function ClientsPage({
  clients,
  onOpenClient,
}) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const visible = useMemo(() => clients.filter((client) => {
    const query = search.trim().toLowerCase();
    const match = !query || `${client.name} ${client.role}`.toLowerCase().includes(query);
    const tabMatch =
      tab === 'all' ||
      (
        tab === 'inactive'
          ? [
              'paused',
              'completed',
            ].includes(
              client.status
            )
          : client.status === tab
      );
    return match && tabMatch;
  }), [clients, search, tab]);

  return (
    <>
      <PageHeader
        title="Assigned Clients"
        subtitle="Welcome back! Here’s your overview for today."
        showHeading={false}
        showNotification={false}
      />
      <div className={styles.statsGrid}>
        <StatCard
          label="Total Clients"
          value={clients.length}
        />

        <StatCard
          label="My Period Target"
          value={
            clients.reduce(
              (total, client) =>
                total +
                Number(
                  client.applicantTarget ||
                    0
                ),
              0
            )
          }
        />

        <StatCard
          label="Completed This Period"
          value={
            clients.reduce(
              (total, client) =>
                total +
                Number(
                  client.applicantPeriodCompleted ||
                    0
                ),
              0
            )
          }
        />

        <StatCard
          label="Remaining Target"
          value={
            clients.reduce(
              (total, client) =>
                total +
                Number(
                  client.applicantTargetRemaining ||
                    0
                ),
              0
            )
          }
        />
      </div>
      <label className={styles.toolbarSearch}>
        <FiSearch />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Clients" />
      </label>
      <div className={styles.tabs}>
        <button type="button" className={classNames(styles.tab, tab === 'all' && styles.tabActive)} onClick={() => setTab('all')}>All Clients ({clients.length})</button>
        <button type="button" className={classNames(styles.tab, tab === 'active' && styles.tabActive)} onClick={() => setTab('active')}>Active Clients ({clients.filter((client) => client.status === 'active').length})</button>
        <button
          type="button"
          className={classNames(
            styles.tab,
            tab === 'inactive' &&
              styles.tabActive
          )}
          onClick={() =>
            setTab('inactive')
          }
        >
          Inactive Clients ({
            clients.filter(
              (client) =>
                [
                  'paused',
                  'completed',
                ].includes(
                  client.status
                )
            ).length
          })
        </button>
      </div>
      <div className={styles.clientGrid}>
        {visible.map((client) => <ClientCard key={client.id} client={client} onOpen={onOpenClient} />)}
      </div>
    </>
  );
}

function ReadonlyField({ label, value, copy = false }) {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      <div className={copy ? styles.fieldWithIcon : undefined}>
        <input readOnly value={value || ''} />
        {copy && <FiCopy />}
      </div>
    </div>
  );
}

function ClientDetail({
  client,
  onBack,
  showInternalNotes = false,
}) {
  return (
    <>
      <div className={styles.detailHeader}>
        <div className={styles.detailTitleGroup}>
          <button type="button" className={styles.backButton} onClick={onBack}><FiArrowLeft /></button>
          <div>
            <h1 className={styles.detailTitle}>{client.name}</h1>
            <p className={styles.detailSubtitle}>{client.role}</p>
          </div>
        </div>
        <NotificationButton />
      </div>
      <div
        className={classNames(
          styles.statsGrid,
          styles.statsGridFive
        )}
      >
        <StatCard
          label="My Period Target"
          value={`${client.applicantPeriodCompleted}/${client.applicantTarget}`}
        />

        <StatCard
          label="Client Period Usage"
          value={`${client.clientPeriodCompleted}/${client.applicationLimit}`}
        />

        <StatCard
          label="Upcoming Interviews"
          value={client.interviews}
        />

        <StatCard
          label="Remaining Target"
          value={
            client.applicantTargetRemaining
          }
        />

        <StatCard
          label="Feedbacks"
          value={client.feedbacks}
        />
      </div>
      <section className={styles.readiness}>
        <div className={styles.readinessHead}>
          <h3>Client Dashboard Readiness</h3>

          <span className={styles.setupTag}>
            {client.hasResume &&
            client.onboardingStatus === 'submitted'
              ? 'Ready'
              : 'Setup Required'}
          </span>
        </div>

        <div className={styles.readinessGrid}>
          <div
            className={classNames(
              styles.readinessItem,
              !client.hasResume &&
                styles.readinessDanger
            )}
          >
            <div className={styles.readinessTitle}>
              {client.hasResume ? (
                <FiCheckCircle color="#1f56c6" />
              ) : (
                <FiAlertCircle color="#e12b49" />
              )}
              Resume
            </div>

            <p>
              {client.hasResume
                ? 'Current resume version available'
                : 'No resume is currently available'}
            </p>
          </div>

          <div
            className={classNames(
              styles.readinessItem,
              client.onboardingStatus !==
                'submitted' &&
                styles.readinessDanger
            )}
          >
            <div className={styles.readinessTitle}>
              {client.onboardingStatus ===
              'submitted' ? (
                <FiCheckCircle color="#1f56c6" />
              ) : (
                <FiAlertCircle color="#e12b49" />
              )}
              Job Search Preferences
            </div>

            <p>
              {client.onboardingStatus ===
              'submitted'
                ? 'Client onboarding preferences submitted'
                : 'Client onboarding preferences are incomplete'}
            </p>
          </div>
        </div>
      </section>
      <div className={styles.formGrid}>
        <ReadonlyField label="Full Name" value={client.name} copy />
        <ReadonlyField label="Gender" value={client.gender} />
        <ReadonlyField label="Email Address" value={client.email} copy />
        <ReadonlyField label="Phone Number" value={client.phone} copy />
        <ReadonlyField label="Nationality" value={client.nationality} />
        <ReadonlyField label="State/Province" value={client.state} />
        <ReadonlyField label="Disability" value={client.disability} />
        <ReadonlyField label="Veteran" value={client.veteran} />
      </div>
      <section className={styles.formSection}>
        <h3>Job Search Preferences</h3>
        <div className={styles.formGrid}>
          <ReadonlyField
            label="Current Location"
            value={client.currentLocation}
          />
          <ReadonlyField
            label="Target Markets"
            value={
              client.targetMarkets.length > 0
                ? client.targetMarkets.join(', ')
                : 'Not provided'
            }
          />
          <ReadonlyField
            label="Target Roles"
            value={
              client.targetRoles.length > 0
                ? client.targetRoles.join(', ')
                : 'Not provided'
            }
          />
          <ReadonlyField
            label="Target Industries"
            value={client.targetIndustries}
          />
          <ReadonlyField
            label="Specialization"
            value={client.specialization}
          />
          <ReadonlyField
            label="Salary Expectation"
            value={client.salaryExpectation}
          />
          <ReadonlyField
            label="Work Arrangement"
            value={client.workType}
          />
          <ReadonlyField
            label="Employment Type"
            value={client.employmentType}
          />
          <ReadonlyField
            label="Work Schedule Preference"
            value={client.schedule}
          />
          <ReadonlyField
            label="Preferred Duration"
            value={client.duration}
          />

          <div className={styles.field}>
            <label>Location Preferences</label>

            <div className={styles.locationPills}>
              {client.locations.length > 0 ? (
                client.locations.map(
                  (location) => (
                    <span key={location}>
                      {location}
                    </span>
                  )
                )
              ) : (
                <span>Not provided</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <h3>Authorization and Experience</h3>

        <div className={styles.formGrid}>
          <ReadonlyField
            label="Work Authorization"
            value={client.workAuthorization}
          />
          <ReadonlyField
            label="Sponsorship Required"
            value={client.sponsorship}
          />
          <ReadonlyField
            label="Relevant Experience"
            value={client.yearsExperience}
          />
          <ReadonlyField
            label="Resume on File"
            value={
              client.hasResume
                ? 'Yes'
                : 'No'
            }
          />
          <ReadonlyField
            label="LinkedIn"
            value={
              client.linkedinUrl ||
              'Not provided'
            }
            copy
          />
          <ReadonlyField
            label="Portfolio"
            value={
              client.portfolioUrl ||
              'Not provided'
            }
            copy
          />
          <ReadonlyField
            label="Additional Preferences"
            value={client.additionalPreferences}
          />
        </div>
      </section>
      {showInternalNotes && (
        <section
          className={styles.noteBlock}
        >
          <div
            className={
              styles.noteTitle
            }
          >
            <FiFileText />
            Internal Notes
          </div>
          <p>{client.notes}</p>
        </section>
      )}
    </>
  );
}

function PdfDocument({ name }) {
  return (
    <div className={styles.pdfDocument}>
      <div className={styles.pdfSheet}><span className={styles.pdfBadge}>PDF</span></div>
      <p>{name}</p>
    </div>
  );
}

function ApplicationDetail({ application, onBack }) {
  return (
    <div className={styles.applicationDetail}>
      <div className={styles.detailHeader}>
        <div className={styles.applicationIntro}>
          <h1>Job Application ({application.company})</h1>
          <p>Track your applications, monitor progress, and stay in control of your job search.</p>
        </div>
        <NotificationButton />
      </div>
      <button type="button" className={styles.textButton} style={{ marginBottom: 17 }} onClick={onBack}><FiArrowLeft /> Back to client</button>
      <dl className={styles.applicationMeta}>
        <dt><FiRefreshCw /> Status</dt><dd><span className={classNames(styles.statusSelect, getStatusClass(application.status))}>{application.status}</span></dd>
        <dt><FiBriefcase /> Role</dt><dd>{application.role}</dd>
        <dt><FiCalendar /> Date</dt><dd>{application.date}</dd>
        <dt><FiClock /> Application Time</dt><dd>{application.applicationTime}</dd>
        <dt><FiTarget /> Preferences</dt>
        <dd className={styles.preferenceTags}>
          {(application.preferences || []).map((item, index) => <span key={item} className={classNames(styles.preferenceTag, index === 0 ? styles.preferenceBlue : index === 1 ? styles.preferencePurple : styles.preferenceYellow)}>{item}</span>)}
        </dd>
        <dt><FiLink /> Job Link</dt><dd><u>{application.jobLink}</u></dd>
      </dl>
      <div className={styles.documentRow}>
        <PdfDocument
          name={
            application.resume ||
            'N/A'
          }
        />
        <PdfDocument
          name={
            application.coverLetter ||
            'N/A'
          }
        />
      </div>

      {application.tailoredResumeText && (
        <section className={styles.copySection}>
          <h3>
            Resume Used for This Application
          </h3>

          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900/30">
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-gray-700 dark:text-gray-300">
              {application.tailoredResumeText}
            </pre>
          </div>
        </section>
      )}

      <section className={styles.copySection}>
        <h3>Job Details</h3>
        <ul>
          {(
            application.jobDetails ||
            []
          ).length > 0 ? (
            application.jobDetails.map(
              (item, index) => (
                <li
                  key={`${index}-${item}`}
                >
                  {item}
                </li>
              )
            )
          ) : (
            <li>
              No job details recorded.
            </li>
          )}
        </ul>
      </section>

      <section className={styles.copySection}>
        <h3>
          Qualities and Characteristics
        </h3>
        <ul>
          {(
            application.qualities ||
            []
          ).length > 0 ? (
            application.qualities.map(
              (item, index) => (
                <li
                  key={`${index}-${item}`}
                >
                  {item}
                </li>
              )
            )
          ) : (
            <li>
              No qualities recorded.
            </li>
          )}
        </ul>
      </section>

      <section className={styles.copySection}>
        <h3>Other Details</h3>
        <ul>
          {(
            application.otherDetails ||
            []
          ).length > 0 ? (
            application.otherDetails.map(
              (item, index) => (
                <li
                  key={`${index}-${item}`}
                >
                  {item}
                </li>
              )
            )
          ) : (
            <li>
              No other details recorded.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function ScoreCard({ label, value, note, state, icon: Icon }) {
  return (
    <div className={classNames(styles.scoreCard, state === 'green' && styles.scoreGreen, state === 'red' && styles.scoreRed)}>
      <div>
        <div className={styles.scoreLabel}>{label}</div>
        <div className={styles.scoreValue}>{value}%</div>
        <div className={styles.scoreNote}>{note}</div>
      </div>
      <Icon className={styles.scoreIcon} />
    </div>
  );
}

function WorkshopPage({
  clients,
  onRecordApplication,
  onUpdateJobRequest,
  isPreview = false,
  isRecordingApplication = false,
}) {
  const router = useRouter();

  const [selectedClientId, setSelectedClientId] =
    useState('');
  const [companyName, setCompanyName] =
    useState('');
  const [position, setPosition] =
    useState('');
  const [jobLocation, setJobLocation] =
    useState('');
  const [jobUrl, setJobUrl] =
    useState('');
  const [jobDescription, setJobDescription] =
    useState('');

  const [resumeStatus, setResumeStatus] =
    useState('');
  const [isOpeningResume, setIsOpeningResume] =
    useState(false);

  const [
    tailoredResume,
    setTailoredResume,
  ] = useState('');

  const [
    tailoredResumePreviewUrl,
    setTailoredResumePreviewUrl,
  ] = useState('');

  const [
    tailoredResumeFingerprint,
    setTailoredResumeFingerprint,
  ] = useState('');

  const [
    resumeGenerationError,
    setResumeGenerationError,
  ] = useState('');

  const [
    resumeAnalysisError,
    setResumeAnalysisError,
  ] = useState('');

  const [
    atsAuditError,
    setAtsAuditError,
  ] = useState('');

  const [
    resumePreviewOpen,
    setResumePreviewOpen,
  ] = useState(false);

  const [
    resumeReviewPromptOpen,
    setResumeReviewPromptOpen,
  ] = useState(false);

  const [
    resumeReviewed,
    setResumeReviewed,
  ] = useState(false);

  const [
    activeJobRequestId,
    setActiveJobRequestId,
  ] = useState('');

  const [
    workflowStatus,
    setWorkflowStatus,
  ] = useState('');

  const [
    applicationDrafts,
    setApplicationDrafts,
  ] = useState([]);

  const [
    activeDraftId,
    setActiveDraftId,
  ] = useState('');

  const [
    isLoadingDrafts,
    setIsLoadingDrafts,
  ] = useState(false);

  const [
    isRunningFitAnalysis,
    setIsRunningFitAnalysis,
  ] = useState(false);

  const [
    draftError,
    setDraftError,
  ] = useState('');

  const jobLinkHandoffRef =
    useRef('');

  const activeDraftIdRef =
    useRef('');

  useEffect(() => {
    activeDraftIdRef.current =
      activeDraftId;
  }, [
    activeDraftId,
  ]);

  const activeClients =
    useMemo(
      () =>
        clients.filter(
          (client) =>
            client.status ===
            'active'
        ),
      [
        clients,
      ]
    );

  const selectedClient =
    activeClients.find(
      (client) =>
        client.id === selectedClientId
    );

  const selectedClientJobRequests =
    selectedClient?.jobRequests || [];

  const activeJobRequests =
    selectedClientJobRequests.filter(
      (request) =>
        [
          'new',
          'in_review',
        ].includes(
          request.status
        )
    );

  const clearJobLinkHandoffFromUrl =
    async () => {
      const routeClientId =
        Array.isArray(
          router.query.clientId
        )
          ? router.query
              .clientId[0]
          : router.query
              .clientId;

      const routeJobRequestId =
        Array.isArray(
          router.query
            .jobRequestId
        )
          ? router.query
              .jobRequestId[0]
          : router.query
              .jobRequestId;

      if (
        !routeClientId &&
        !routeJobRequestId
      ) {
        return;
      }

      /*
       * Suppress the old handoff while
       * Next removes it from the URL.
       */
      if (
        routeClientId &&
        routeJobRequestId
      ) {
        jobLinkHandoffRef.current =
          `${routeClientId}:${routeJobRequestId}`;
      }

      await router.replace(
        '/applicant/workshop',
        undefined,
        {
          shallow: true,
        }
      );

      /*
       * Future genuine Job-Link
       * navigation should be allowed.
       */
      jobLinkHandoffRef.current =
        '';
    };

  useEffect(() => {
    if (
      !router.isReady ||
      isPreview
    ) {
      return;
    }

    const requestedClientId =
      Array.isArray(
        router.query.clientId
      )
        ? router.query.clientId[0]
        : router.query.clientId;

    const requestedJobRequestId =
      Array.isArray(
        router.query.jobRequestId
      )
        ? router.query
            .jobRequestId[0]
        : router.query
            .jobRequestId;

    if (
      !requestedClientId ||
      !requestedJobRequestId
    ) {
      return;
    }

    const handoffKey =
      `${requestedClientId}:${requestedJobRequestId}`;

    if (
      jobLinkHandoffRef.current ===
      handoffKey
    ) {
      return;
    }

    const handoffClient =
      activeClients.find(
        (client) =>
          client.id ===
          requestedClientId
      );

    if (!handoffClient) {
      return;
    }

    const handoffRequest =
      (
        handoffClient.jobRequests ||
        []
      ).find(
        (request) =>
          request.id ===
          requestedJobRequestId
      );

    if (
      !handoffRequest ||
      ![
        'new',
        'in_review',
      ].includes(
        handoffRequest.status
      )
    ) {
      return;
    }

    jobLinkHandoffRef.current =
      handoffKey;

    setSelectedClientId(
      handoffClient.id
    );

    setCompanyName(
      handoffRequest.jobCompany ||
        ''
    );

    setPosition(
      handoffRequest.jobPosition ||
        ''
    );

    setJobLocation(
      handoffRequest.jobLocation ||
        ''
    );

    setJobUrl(
      handoffRequest.jobLink ||
        ''
    );

    setJobDescription('');
    setActiveJobRequestId(
      handoffRequest.id
    );

    setWorkflowStatus('');
    setResumeStatus('');
    setTailoredResume('');
    setTailoredResumePreviewUrl('');
    setTailoredResumeFingerprint('');
    setResumeGenerationError('');
    setResumeAnalysisError('');
    setAtsAuditError('');
    setResumePreviewOpen(false);
    setResumeReviewPromptOpen(false);
    setResumeReviewed(false);
    setActiveDraftId('');
    setDraftError('');

    if (
      handoffRequest.status ===
        'new' &&
      onUpdateJobRequest
    ) {
      Promise.resolve(
        onUpdateJobRequest(
          handoffRequest.id,
          'in_review'
        )
      ).catch((error) => {
        setResumeStatus(
          error?.message ||
            'The job link was loaded, but its status could not be updated.'
        );
      });
    }
  }, [
    activeClients,
    isPreview,
    onUpdateJobRequest,
    router.isReady,
    router.query.clientId,
    router.query.jobRequestId,
  ]);

  const isQuotaReached =
    Boolean(
      selectedClient &&
        Number(
          selectedClient.applications ||
            0
        ) >=
          Number(
            selectedClient.applicationLimit ||
              0
          )
    );

  const resumeFingerprint =
    JSON.stringify([
      selectedClientId,
      companyName.trim(),
      position.trim(),
      jobLocation.trim(),
      jobUrl.trim(),
      jobDescription.trim(),
    ]);

  const tailoredResumeIsCurrent =
    Boolean(
      tailoredResume &&
      tailoredResumeFingerprint ===
        resumeFingerprint
    );

  const validJobUrl =
    /^https?:\/\/\S+/i.test(
      jobUrl.trim()
    );

  const coreJobDetailsComplete =
    Boolean(
      selectedClient &&
      companyName.trim() &&
      position.trim() &&
      jobLocation.trim() &&
      validJobUrl &&
      jobDescription
        .trim()
        .length >= 80
    );

  const hasCurrentApplicationWork =
    Boolean(
      selectedClient &&
      (
        companyName.trim() ||
        position.trim() ||
        jobLocation.trim() ||
        jobUrl.trim() ||
        jobDescription.trim() ||
        tailoredResume.trim()
      )
    );

  const targetRoles =
    selectedClient?.targetRoles?.length
      ? selectedClient.targetRoles.join(
          ', '
        )
      : 'Not provided';

  const targetMarkets =
    selectedClient?.targetMarkets?.length
      ? selectedClient.targetMarkets.join(
          ', '
        )
      : 'Not provided';

  const preferredLocations =
    selectedClient?.locations?.length
      ? selectedClient.locations.join(
          ', '
        )
      : 'Not provided';

  const activeDraft =
    applicationDrafts.find(
      (draft) =>
        draft.id ===
        activeDraftId
    ) || null;

  const formDraftFingerprint =
    JSON.stringify([
      selectedClientId,
      companyName.trim(),
      position.trim(),
      jobLocation.trim(),
      jobUrl.trim(),
      jobDescription.trim(),
    ]);

  const activeDraftFingerprint =
    activeDraft
      ? JSON.stringify([
          activeDraft.clientId,
          String(
            activeDraft.company ||
              ''
          ).trim(),
          String(
            activeDraft.position ||
              ''
          ).trim(),
          String(
            activeDraft.location ||
              ''
          ).trim(),
          String(
            activeDraft.jobUrl ||
              ''
          ).trim(),
          String(
            activeDraft.jobDescription ||
              ''
          ).trim(),
        ])
      : '';

  const activeDraftIsCurrent =
    Boolean(
      activeDraft &&
      formDraftFingerprint ===
        activeDraftFingerprint
    );

  const fitAnalysisIsCurrent =
    Boolean(
      activeDraftIsCurrent &&
      activeDraft?.fitStatus ===
        'completed'
    );

  const activeResumeGenerating =
    Boolean(
      activeDraftIsCurrent &&
      activeDraft?.resumeStatus ===
        'generating'
    );

  const resumeTextMatchesDraft =
    Boolean(
      activeDraftIsCurrent &&
      String(
        tailoredResume || ''
      ) ===
        String(
          activeDraft
            ?.tailoredResumeText ||
            ''
        )
    );

  const resumeAnalysis =
    activeDraftIsCurrent &&
    activeDraft?.resumeAnalysis &&
    typeof activeDraft.resumeAnalysis ===
      'object'
      ? activeDraft.resumeAnalysis
      : {};

  const resumeAnalysisStatus =
    resumeAnalysis?.status ||
    'not_started';

  const resumeAnalysisRunning =
    resumeAnalysisStatus ===
    'analyzing';

  const resumeAnalysisCompleted =
    Boolean(
      resumeAnalysisStatus ===
        'completed' &&
      resumeTextMatchesDraft
    );

  const resumeAnalysisNeedsRefresh =
    Boolean(
      resumeAnalysisStatus ===
        'completed' &&
      !resumeTextMatchesDraft
    );

  const canRunResumeAnalysis =
    Boolean(
      activeDraftIsCurrent &&
      activeDraft?.resumeStatus ===
        'completed' &&
      tailoredResumeIsCurrent &&
      !resumeAnalysisRunning &&
      !isPreview
    );

  const atsAudit =
    activeDraftIsCurrent &&
    activeDraft?.atsAudit &&
    typeof activeDraft.atsAudit ===
      'object'
      ? activeDraft.atsAudit
      : {};

  const atsAuditRunning =
    Boolean(
      activeDraftIsCurrent &&
      activeDraft?.auditStatus ===
        'auditing'
    );

  const atsAuditCompleted =
    Boolean(
      activeDraftIsCurrent &&
      activeDraft?.auditStatus ===
        'completed' &&
      atsAudit?.status ===
        'completed' &&
      resumeAnalysisCompleted &&
      resumeTextMatchesDraft
    );

  const atsAuditNeedsRefresh =
    Boolean(
      activeDraftIsCurrent &&
      activeDraft?.auditStatus ===
        'completed' &&
      !resumeAnalysisCompleted
    );

  const canRunAtsAudit =
    Boolean(
      activeDraftIsCurrent &&
      activeDraft?.resumeStatus ===
        'completed' &&
      resumeAnalysisCompleted &&
      tailoredResumeIsCurrent &&
      !atsAuditRunning &&
      !isPreview
    );

  /*
   * Final Review is deliberately the
   * last quality-control step.
   *
   * Generate Resume
   * -> Resume Analysis
   * -> ATS Audit
   * -> Final Review
   * -> Mark as Applied
   */
  const finalReviewReady =
    Boolean(
      resumeAnalysisCompleted &&
      atsAuditCompleted &&
      tailoredResumeIsCurrent
    );

  const canMarkApplied =
    Boolean(
      coreJobDetailsComplete &&
      finalReviewReady &&
      resumeReviewed &&
      !isRecordingApplication &&
      !isQuotaReached &&
      !isPreview
    );

  const canGenerateTailoredResume =
    Boolean(
      selectedClient?.hasResume &&
      coreJobDetailsComplete &&
      fitAnalysisIsCurrent &&
      !activeResumeGenerating &&
      !isPreview
    );

  const fitScore =
    fitAnalysisIsCurrent
      ? Number(
          activeDraft
            ?.applicabilityScore ||
            0
        )
      : 0;

  const fitDirective =
    fitAnalysisIsCurrent
      ? activeDraft
          ?.applicabilityDirective ||
        'Review'
      : '';

  const fitSummary =
    fitAnalysisIsCurrent
      ? activeDraft
          ?.fitAnalysis
          ?.summary ||
        ''
      : '';

  const preferenceAlignment =
    fitAnalysisIsCurrent
      ? activeDraft
          ?.preferenceAlignment ||
        []
      : [];

  const fitStrengths =
    fitAnalysisIsCurrent
      ? activeDraft
          ?.fitAnalysis
          ?.strengths ||
        []
      : [];

  const fitConcerns =
    fitAnalysisIsCurrent
      ? activeDraft
          ?.fitAnalysis
          ?.concerns ||
        []
      : [];

  const preferenceCounts =
    preferenceAlignment.reduce(
      (counts, item) => {
        if (
          item.status === 'match'
        ) {
          counts.match += 1;
        } else if (
          item.status ===
          'conflict'
        ) {
          counts.conflict += 1;
        } else {
          counts.unknown += 1;
        }

        return counts;
      },
      {
        match: 0,
        conflict: 0,
        unknown: 0,
      }
    );

  const fitTone =
    fitScore >= 70
      ? {
          wrap:
            'border-emerald-200 bg-emerald-50',
          text:
            'text-emerald-700',
        }
      : fitScore >= 45
        ? {
            wrap:
              'border-amber-200 bg-amber-50',
            text:
              'text-amber-700',
          }
        : {
            wrap:
              'border-red-200 bg-red-50',
            text:
              'text-red-600',
          };

  const directiveTone =
    fitDirective === 'Proceed'
      ? 'bg-emerald-100 text-emerald-700'
      : fitDirective === 'Decline'
        ? 'bg-red-100 text-red-700'
        : 'bg-amber-100 text-amber-700';

  const mergeDraft =
    (nextDraft) => {
      if (!nextDraft?.id) {
        return;
      }

      setApplicationDrafts(
        (current) => {
          const exists =
            current.some(
              (draft) =>
                draft.id ===
                nextDraft.id
            );

          if (!exists) {
            return [
              nextDraft,
              ...current,
            ];
          }

          return current.map(
            (draft) =>
              draft.id ===
                nextDraft.id
                ? nextDraft
                : draft
          );
        }
      );
    };


  const fetchLatestApplicationDraft =
    async (draftId) => {
      const accessToken =
        await getApplicantAccessToken();

      const response =
        await fetch(
          `/api/applicant/application-drafts/${encodeURIComponent(
            draftId
          )}`,
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
          .catch(
            () => ({})
          );

      if (!response.ok) {
        throw new Error(
          result.error ||
            'The application could not be refreshed.'
        );
      }

      if (!result.draft) {
        throw new Error(
          'The refreshed application was not returned.'
        );
      }

      return result.draft;
    };

  useEffect(() => {
    if (isPreview) {
      return undefined;
    }

    let cancelled =
      false;

    const loadDrafts =
      async () => {
        setIsLoadingDrafts(
          true
        );

        setDraftError('');

        try {
          const accessToken =
            await getApplicantAccessToken();

          const response =
            await fetch(
              '/api/applicant/application-drafts',
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
              .catch(
                () => ({})
              );

          if (!response.ok) {
            throw new Error(
              result.error ||
                'Applications in progress could not be loaded.'
            );
          }

          if (!cancelled) {
            setApplicationDrafts(
              result.drafts ||
                []
            );
          }
        } catch (error) {
          if (!cancelled) {
            setDraftError(
              error?.message ||
                'Applications in progress could not be loaded.'
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoadingDrafts(
              false
            );
          }
        }
      };

    loadDrafts();

    return () => {
      cancelled = true;
    };
  }, [
    isPreview,
  ]);

  const hasRunningDraftWork =
    applicationDrafts.some(
      (draft) =>
        draft.fitStatus ===
          'analyzing' ||
        draft.resumeStatus ===
          'generating' ||
        draft.resumeAnalysis
          ?.status ===
          'analyzing' ||
        draft.auditStatus ===
          'auditing'
    );

  useEffect(() => {
    if (
      isPreview ||
      !hasRunningDraftWork
    ) {
      return undefined;
    }

    let cancelled =
      false;

    const refreshDrafts =
      async () => {
        try {
          const accessToken =
            await getApplicantAccessToken();

          const response =
            await fetch(
              '/api/applicant/application-drafts',
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
              .catch(
                () => ({})
              );

          if (
            !response.ok ||
            cancelled
          ) {
            return;
          }

          const refreshedDrafts =
            result.drafts || [];

          setApplicationDrafts(
            refreshedDrafts
          );

          /*
           * Keep the active Draft object
           * synchronized with completed
           * background work.
           */
          const refreshedActive =
            refreshedDrafts.find(
              (draft) =>
                draft.id ===
                activeDraftIdRef
                  .current
            );

          if (
            refreshedActive &&
            refreshedActive.resumeStatus ===
              'failed'
          ) {
            setResumeGenerationError(
              refreshedActive
                .lastError ||
                'The tailored resume could not be generated.'
            );
          }

          if (
            refreshedActive
              ?.resumeAnalysis
              ?.status ===
              'failed'
          ) {
            setResumeAnalysisError(
              refreshedActive
                .resumeAnalysis
                ?.error ||
                refreshedActive
                  .lastError ||
                'Resume Analysis could not be completed.'
            );
          }

          if (
            refreshedActive
              ?.auditStatus ===
              'failed'
          ) {
            setAtsAuditError(
              refreshedActive
                ?.atsAudit
                ?.error ||
                refreshedActive
                  ?.lastError ||
                'ATS Readiness Audit could not be completed.'
            );
          }
        } catch (error) {
          console.warn(
            'Unable to refresh Applications in Progress:',
            error
          );
        }
      };

    const intervalId =
      window.setInterval(
        refreshDrafts,
        5000
      );

    return () => {
      cancelled = true;

      window.clearInterval(
        intervalId
      );
    };
  }, [
    hasRunningDraftWork,
    isPreview,
  ]);

  const getDraftStage =
    (draft) => {
      if (
        draft.auditStatus ===
        'auditing'
      ) {
        return 'Auditing resume';
      }

      if (
        draft.resumeStatus ===
        'generating'
      ) {
        return 'Generating resume';
      }

      if (
        draft.resumeAnalysis
          ?.status ===
          'analyzing'
      ) {
        return 'Analyzing resume';
      }

      if (
        draft.fitStatus ===
        'analyzing'
      ) {
        return 'Checking fit';
      }

      if (
        draft.auditStatus ===
        'failed'
      ) {
        return 'Audit failed';
      }

      if (
        draft.resumeAnalysis
          ?.status ===
          'failed'
      ) {
        return 'Resume Analysis failed';
      }

      if (
        draft.resumeStatus ===
        'failed'
      ) {
        return 'Resume failed';
      }

      if (
        draft.fitStatus ===
        'failed'
      ) {
        return 'Fit check failed';
      }

      if (
        draft.auditStatus ===
        'completed'
      ) {
        return 'ATS audit complete';
      }

      if (
        draft.resumeAnalysis
          ?.status ===
          'completed'
      ) {
        return 'Resume analyzed';
      }

      if (
        draft.resumeStatus ===
        'completed'
      ) {
        return 'Resume ready';
      }

      if (
        draft.fitStatus ===
        'completed'
      ) {
        return 'Fit checked';
      }

      return 'In progress';
    };

  const openApplicationDraft =
    async (selectedDraft) => {
      let draft =
        selectedDraft;

      const isSwitchingDraft =
        draft.id !==
        activeDraftId;

      /*
       * Save the application we are
       * actually leaving.
       */
      if (
        isSwitchingDraft &&
        hasCurrentApplicationWork &&
        selectedClient
      ) {
        try {
          await saveApplicationDraft();
        } catch (error) {
          setDraftError(
            error?.message ||
              'Your current application could not be saved. It has not been closed.'
          );

          return;
        }
      }

      /*
       * The card in React may be older
       * than the database, especially
       * after background AI work.
       *
       * Always open the authoritative
       * Supabase version.
       */
      try {
        draft =
          await fetchLatestApplicationDraft(
            selectedDraft.id
          );

        mergeDraft(
          draft
        );
      } catch (error) {
        setDraftError(
          error?.message ||
            'The latest version of this application could not be loaded.'
        );

        return;
      }

      const draftClient =
        activeClients.find(
          (client) =>
            client.id ===
            draft.clientId
        );

      if (!draftClient) {
        setDraftError(
          'This application belongs to a Client who is no longer available in your workspace.'
        );
        return;
      }

      setActiveDraftId(
        draft.id
      );

      setSelectedClientId(
        draft.clientId
      );

      setCompanyName(
        draft.company || ''
      );

      setPosition(
        draft.position || ''
      );

      setJobLocation(
        draft.location || ''
      );

      setJobUrl(
        draft.jobUrl || ''
      );

      setJobDescription(
        draft.jobDescription ||
          ''
      );

      setActiveJobRequestId(
        draft.jobRequestId ||
          ''
      );

      setTailoredResume(
        draft.tailoredResumeText ||
          ''
      );

      setTailoredResumePreviewUrl(
        ''
      );

      const draftResumeFingerprint =
        JSON.stringify([
          draft.clientId,
          String(
            draft.company || ''
          ).trim(),
          String(
            draft.position || ''
          ).trim(),
          String(
            draft.location || ''
          ).trim(),
          String(
            draft.jobUrl || ''
          ).trim(),
          String(
            draft.jobDescription ||
              ''
          ).trim(),
        ]);

      setTailoredResumeFingerprint(
        draft.tailoredResumeText
          ? draftResumeFingerprint
          : ''
      );

      setResumeReviewed(
        Boolean(
          draft.resumeReviewedAt
        )
      );

      setResumePreviewOpen(
        false
      );

      setResumeReviewPromptOpen(
        false
      );

      setResumeGenerationError(
        draft.resumeStatus ===
          'failed'
          ? (
              draft.lastError ||
              'The tailored resume could not be generated.'
            )
          : ''
      );

      setResumeAnalysisError(
        draft.resumeAnalysis
          ?.status ===
          'failed'
          ? (
              draft.resumeAnalysis
                ?.error ||
              draft.lastError ||
              'Resume Analysis could not be completed.'
            )
          : ''
      );

      setAtsAuditError(
        draft.auditStatus ===
          'failed'
          ? (
              draft.atsAudit
                ?.error ||
              draft.lastError ||
              'ATS Readiness Audit could not be completed.'
            )
          : ''
      );

      setDraftError('');

      setWorkflowStatus(
        'Application loaded.'
      );

      /*
       * The Draft is now the source of
       * truth. The old Job-Link URL must
       * stop re-hydrating a different
       * opportunity over this form.
       */
      await clearJobLinkHandoffFromUrl();
    };

  const startNewApplication =
    async () => {
      if (
        hasCurrentApplicationWork &&
        selectedClient
      ) {
        try {
          await saveApplicationDraft();
        } catch (error) {
          setDraftError(
            error?.message ||
              'Your current application could not be saved. A new application was not opened.'
          );

          return;
        }
      }

      await clearJobLinkHandoffFromUrl();

      setActiveDraftId('');
      setSelectedClientId('');
      setCompanyName('');
      setPosition('');
      setJobLocation('');
      setJobUrl('');
      setJobDescription('');
      setActiveJobRequestId('');
      setTailoredResume('');
      setTailoredResumePreviewUrl('');
      setTailoredResumeFingerprint('');
      setResumeGenerationError('');
      setResumeAnalysisError('');
      setAtsAuditError('');
      setResumeStatus('');
      setResumePreviewOpen(false);
      setResumeReviewPromptOpen(false);
      setResumeReviewed(false);
      setWorkflowStatus('');
      setDraftError('');

      jobLinkHandoffRef.current =
        '';
    };

  const saveApplicationDraft =
    async (overrides = {}) => {
      if (!selectedClient) {
        throw new Error(
          'Choose a Client first.'
        );
      }

      const accessToken =
        await getApplicantAccessToken();

      const isExisting =
        Boolean(
          activeDraftId
        );

      const nextResumeText =
        Object.prototype
          .hasOwnProperty.call(
            overrides,
            'tailoredResumeText'
          )
          ? overrides
              .tailoredResumeText
          : tailoredResume;

      const nextResumeReviewed =
        Object.prototype
          .hasOwnProperty.call(
            overrides,
            'resumeReviewed'
          )
          ? overrides
              .resumeReviewed
          : resumeReviewed;

      const payload = {
        clientId:
          selectedClient.id,

        jobRequestId:
          activeJobRequestId ||
          null,

        company:
          companyName.trim(),

        position:
          position.trim(),

        location:
          jobLocation.trim(),

        jobUrl:
          jobUrl.trim(),

        jobDescription:
          jobDescription.trim(),
      };

      /*
       * Generated resume content is part
       * of the Draft, not temporary page
       * state.
       */
      if (
        isExisting &&
        activeDraft?.resumeStatus ===
          'completed' &&
        String(
          nextResumeText || ''
        ).trim()
      ) {
        payload.tailoredResumeText =
          String(
            nextResumeText
          );

        payload.resumeReviewed =
          Boolean(
            nextResumeReviewed
          );
      }

      const endpoint =
        isExisting
          ? `/api/applicant/application-drafts/${encodeURIComponent(
              activeDraftId
            )}`
          : '/api/applicant/application-drafts';

      const response =
        await fetch(
          endpoint,
          {
            method:
              isExisting
                ? 'PATCH'
                : 'POST',

            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (!response.ok) {
        throw new Error(
          result.error ||
            'The application could not be saved.'
        );
      }

      if (!result.draft) {
        throw new Error(
          'The saved application was not returned.'
        );
      }

      setActiveDraftId(
        result.draft.id
      );

      /*
       * React state updates asynchronously.
       * Keep the ref synchronized now so
       * an in-flight AI response cannot
       * mistake this Draft for another one.
       */
      activeDraftIdRef.current =
        result.draft.id;

      mergeDraft(
        result.draft
      );

      return result.draft;
    };

  const runFitAnalysis =
    async () => {
      if (
        !coreJobDetailsComplete
      ) {
        setDraftError(
          'Complete the company, position, location, job URL and Job Description before checking fit.'
        );
        return;
      }

      if (
        isRunningFitAnalysis ||
        isPreview
      ) {
        return;
      }

      setIsRunningFitAnalysis(
        true
      );

      setDraftError('');

      try {
        const savedDraft =
          await saveApplicationDraft();

        const accessToken =
          await getApplicantAccessToken();

        const response =
          await fetch(
            `/api/applicant/application-drafts/${encodeURIComponent(
              savedDraft.id
            )}/fit-analysis`,
            {
              method: 'POST',

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,

                'Content-Type':
                  'application/json',
              },
            }
          );

        const result =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            result.error ||
              'The opportunity could not be checked right now.'
          );
        }

        if (result.draft) {
          mergeDraft(
            result.draft
          );

          setActiveDraftId(
            result.draft.id
          );
        }

        setWorkflowStatus(
          'Job fit checked.'
        );
      } catch (error) {
        setDraftError(
          error?.message ||
            'The opportunity could not be checked right now.'
        );
      } finally {
        setIsRunningFitAnalysis(
          false
        );
      }
    };

  const handleClientChange =
    async (event) => {
      const nextClientId =
        event.target.value;

      if (
        nextClientId !==
          selectedClientId &&
        hasCurrentApplicationWork &&
        selectedClient
      ) {
        try {
          await saveApplicationDraft();
        } catch (error) {
          setDraftError(
            error?.message ||
              'Your current application could not be saved. The Client was not changed.'
          );

          return;
        }
      }

      await clearJobLinkHandoffFromUrl();

      setSelectedClientId(
        nextClientId
      );

      setCompanyName('');
      setPosition('');
      setJobLocation('');
      setJobUrl('');
      setJobDescription('');
      setResumeStatus('');
      setTailoredResume('');
      setTailoredResumePreviewUrl('');
      setTailoredResumeFingerprint('');
      setResumeGenerationError('');
      setResumePreviewOpen(false);
      setResumeReviewPromptOpen(false);
      setResumeReviewed(false);
      setActiveJobRequestId('');
      setWorkflowStatus('');
      setActiveDraftId('');
      setDraftError('');

      jobLinkHandoffRef.current =
        '';
    };

  const openClientResume =
    async () => {
      if (
        !selectedClient?.hasResume
      ) {
        setResumeStatus(
          'This Client does not have a resume on file.'
        );
        return;
      }

      if (isPreview) {
        setResumeStatus(
          'Applicant preview is read-only.'
        );
        return;
      }

      if (isOpeningResume) {
        return;
      }

      setIsOpeningResume(true);
      setResumeStatus('');

      const resumeWindow =
        window.open(
          'about:blank',
          '_blank'
        );

      try {
        const accessToken =
          await getApplicantAccessToken();

        const response =
          await fetch(
            `/api/applicant/clients/${encodeURIComponent(
              selectedClient.id
            )}/resume`,
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
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            result.error ||
              'The Client resume could not be opened.'
          );
        }

        if (!result.url) {
          throw new Error(
            'The Client resume URL was not returned.'
          );
        }

        if (resumeWindow) {
          resumeWindow.opener =
            null;

          resumeWindow.location.href =
            result.url;
        } else {
          window.location.assign(
            result.url
          );
        }
      } catch (error) {
        if (resumeWindow) {
          resumeWindow.close();
        }

        setResumeStatus(
          error?.message ||
            'The Client resume could not be opened.'
        );
      } finally {
        setIsOpeningResume(
          false
        );
      }
    };

  const generateTailoredResume =
    async () => {
      if (!selectedClient) {
        setResumeGenerationError(
          'Select a Client first.'
        );
        return;
      }

      if (
        !selectedClient.hasResume
      ) {
        setResumeGenerationError(
          'This Client does not have a resume on file.'
        );
        return;
      }

      if (
        !coreJobDetailsComplete
      ) {
        setResumeGenerationError(
          'Complete the company, position, location, valid job URL and Job Description first.'
        );
        return;
      }

      if (
        !fitAnalysisIsCurrent
      ) {
        setResumeGenerationError(
          'Check Job Fit before generating the tailored resume.'
        );
        return;
      }

      if (
        activeResumeGenerating ||
        isPreview
      ) {
        return;
      }

      setResumeGenerationError('');
      setResumeAnalysisError('');
      setTailoredResumePreviewUrl('');
      setResumeReviewed(false);
      setResumeReviewPromptOpen(
        false
      );

      let generationDraft =
        null;

      let generationFingerprint =
        '';

      try {
        const savedDraft =
          await saveApplicationDraft();

        if (
          savedDraft.fitStatus !==
          'completed'
        ) {
          throw new Error(
            'Check Job Fit before generating the tailored resume.'
          );
        }

        generationDraft =
          savedDraft;

        const generationDraftId =
          savedDraft.id;

        generationFingerprint =
          JSON.stringify([
            savedDraft.clientId,
            String(
              savedDraft.company ||
                ''
            ).trim(),
            String(
              savedDraft.position ||
                ''
            ).trim(),
            String(
              savedDraft.location ||
                ''
            ).trim(),
            String(
              savedDraft.jobUrl ||
                ''
            ).trim(),
            String(
              savedDraft.jobDescription ||
                ''
            ).trim(),
          ]);

        /*
         * Immediately mark this Draft
         * as generating in the UI.
         *
         * The Applicant can now open
         * another Draft without waiting.
         */
        mergeDraft({
          ...savedDraft,

          resumeStatus:
            'generating',

          resumeAnalysis:
            {},

          resumeReviewedAt:
            null,

          auditStatus:
            'not_started',

          atsScore:
            null,

          atsAudit:
            {},

          lastError:
            '',
        });

        const accessToken =
          await getApplicantAccessToken();

        const response =
          await fetch(
            `/api/applicant/application-drafts/${encodeURIComponent(
              generationDraftId
            )}/generate-resume`,
            {
              method:
                'POST',

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,

                'Content-Type':
                  'application/json',
              },
            }
          );

        const result =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            result.error ||
              'The tailored resume could not be generated.'
          );
        }

        if (
          !result.draft ||
          !result.draft
            .tailoredResumeText
        ) {
          throw new Error(
            'The resume generator returned an empty result.'
          );
        }

        /*
         * Always update the Draft card.
         * Only update the visible editor
         * when the Applicant is still
         * looking at this same Draft.
         */
        mergeDraft(
          result.draft
        );

        if (
          activeDraftIdRef
            .current ===
          generationDraftId
        ) {
          setTailoredResumePreviewUrl(
            ''
          );

          setTailoredResume(
            result.draft
              .tailoredResumeText
          );

          setTailoredResumeFingerprint(
            generationFingerprint
          );

          setResumePreviewOpen(
            true
          );

          /*
           * Human review belongs after
           * Resume Analysis and ATS Audit.
           */
          setResumeReviewPromptOpen(
            false
          );

          setResumeGenerationError(
            ''
          );
        }
      } catch (error) {
        const message =
          error?.message ||
          'The tailored resume could not be generated.';

        /*
         * A browser/network error does not
         * prove the server-side generation
         * failed.
         *
         * The request may have completed
         * successfully in Supabase after
         * the browser stopped waiting.
         */
        if (generationDraft) {
          try {
            const latestDraft =
              await fetchLatestApplicationDraft(
                generationDraft.id
              );

            mergeDraft(
              latestDraft
            );

            if (
              latestDraft.resumeStatus ===
                'completed' &&
              latestDraft
                .tailoredResumeText
            ) {
              if (
                activeDraftIdRef
                  .current ===
                latestDraft.id
              ) {
                const latestFingerprint =
                  JSON.stringify([
                    latestDraft.clientId,
                    String(
                      latestDraft.company ||
                        ''
                    ).trim(),
                    String(
                      latestDraft.position ||
                        ''
                    ).trim(),
                    String(
                      latestDraft.location ||
                        ''
                    ).trim(),
                    String(
                      latestDraft.jobUrl ||
                        ''
                    ).trim(),
                    String(
                      latestDraft
                        .jobDescription ||
                        ''
                    ).trim(),
                  ]);

                setTailoredResume(
                  latestDraft
                    .tailoredResumeText
                );

                setTailoredResumeFingerprint(
                  latestFingerprint
                );

                setResumeGenerationError(
                  ''
                );
              }

              return;
            }

            if (
              latestDraft.resumeStatus ===
                'failed'
            ) {
              if (
                activeDraftIdRef
                  .current ===
                latestDraft.id
              ) {
                setResumeGenerationError(
                  latestDraft
                    .lastError ||
                    message
                );
              }

              return;
            }

            /*
             * Still generating or the
             * database has not reached a
             * terminal state yet.
             *
             * Leave it alone. Polling will
             * resolve the correct result.
             */
            if (
              latestDraft.resumeStatus ===
                'generating'
            ) {
              return;
            }
          } catch {
            /*
             * Reconciliation itself failed.
             * Keep the optimistic
             * "generating" state so polling
             * can recover later.
             */
          }
        }

        if (
          !generationDraft ||
          activeDraftIdRef
            .current ===
            generationDraft.id
        ) {
          setResumeGenerationError(
            message
          );
        }
      }
    };

  const runResumeAnalysis =
    async () => {
      if (
        !activeDraftId ||
        !activeDraftIsCurrent
      ) {
        setResumeAnalysisError(
          'Open a saved application before running Resume Analysis.'
        );
        return;
      }

      if (
        !tailoredResumeIsCurrent ||
        !tailoredResume.trim()
      ) {
        setResumeAnalysisError(
          'Generate the current tailored resume before running Resume Analysis.'
        );
        return;
      }

      if (
        resumeAnalysisRunning ||
        isPreview
      ) {
        return;
      }

      setResumeAnalysisError('');
      setAtsAuditError('');
      setResumeReviewed(false);
      setResumeReviewPromptOpen(
        false
      );

      let analysisDraft =
        null;

      try {
        /*
         * Persist any Applicant edits
         * before analyzing the resume.
         */
        const savedDraft =
          await saveApplicationDraft({
            tailoredResumeText:
              tailoredResume,

            resumeReviewed:
              false,
          });

        analysisDraft =
          savedDraft;

        mergeDraft({
          ...savedDraft,

          resumeAnalysis: {
            status:
              'analyzing',

            startedAt:
              new Date()
                .toISOString(),
          },

          resumeReviewedAt:
            null,

          auditStatus:
            'not_started',

          atsScore:
            null,

          atsAudit:
            {},

          lastError:
            '',
        });

        const accessToken =
          await getApplicantAccessToken();

        const response =
          await fetch(
            `/api/applicant/application-drafts/${encodeURIComponent(
              savedDraft.id
            )}/resume-analysis`,
            {
              method:
                'POST',

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,

                'Content-Type':
                  'application/json',
              },
            }
          );

        const result =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Resume Analysis could not be completed.'
          );
        }

        if (!result.draft) {
          throw new Error(
            'Resume Analysis completed without returning the application.'
          );
        }

        mergeDraft(
          result.draft
        );

        if (
          activeDraftIdRef
            .current ===
          result.draft.id
        ) {
          setResumeAnalysisError(
            ''
          );
        }
      } catch (error) {
        const message =
          error?.message ||
          'Resume Analysis could not be completed.';

        /*
         * As with resume generation,
         * reconcile with Supabase before
         * declaring the AI job failed.
         */
        if (analysisDraft) {
          try {
            const latestDraft =
              await fetchLatestApplicationDraft(
                analysisDraft.id
              );

            mergeDraft(
              latestDraft
            );

            const latestStatus =
              latestDraft
                ?.resumeAnalysis
                ?.status;

            if (
              latestStatus ===
                'completed'
            ) {
              if (
                activeDraftIdRef
                  .current ===
                latestDraft.id
              ) {
                setResumeAnalysisError(
                  ''
                );
              }

              return;
            }

            if (
              latestStatus ===
                'failed'
            ) {
              if (
                activeDraftIdRef
                  .current ===
                latestDraft.id
              ) {
                setResumeAnalysisError(
                  latestDraft
                    ?.resumeAnalysis
                    ?.error ||
                    latestDraft
                      ?.lastError ||
                    message
                );
              }

              return;
            }

            if (
              latestStatus ===
                'analyzing'
            ) {
              return;
            }
          } catch {
            /*
             * Polling can reconcile an
             * in-flight server result.
             */
          }
        }

        if (
          !analysisDraft ||
          activeDraftIdRef
            .current ===
            analysisDraft.id
        ) {
          setResumeAnalysisError(
            message
          );
        }
      }
    };


  const runAtsAudit =
    async () => {
      if (
        !activeDraftId ||
        !activeDraftIsCurrent
      ) {
        setAtsAuditError(
          'Open a saved application before running ATS Readiness Audit.'
        );
        return;
      }

      if (
        !resumeAnalysisCompleted
      ) {
        setAtsAuditError(
          'Complete Resume Analysis before running ATS Readiness Audit.'
        );
        return;
      }

      if (
        atsAuditRunning ||
        isPreview
      ) {
        return;
      }

      setAtsAuditError('');
      setResumeReviewed(false);
      setResumeReviewPromptOpen(
        false
      );

      let auditDraft =
        null;

      try {
        /*
         * Save the final text before
         * auditing it. If the Applicant
         * changed the resume after
         * Resume Analysis, the save will
         * invalidate that analysis and
         * the audit must not continue.
         */
        const savedDraft =
          await saveApplicationDraft({
            tailoredResumeText:
              tailoredResume,

            resumeReviewed:
              false,
          });

        if (
          savedDraft
            ?.resumeAnalysis
            ?.status !==
          'completed'
        ) {
          throw new Error(
            'The resume changed after Resume Analysis. Run Resume Analysis again before ATS Audit.'
          );
        }

        auditDraft =
          savedDraft;

        mergeDraft({
          ...savedDraft,

          auditStatus:
            'auditing',

          atsScore:
            null,

          atsAudit: {
            status:
              'auditing',

            startedAt:
              new Date()
                .toISOString(),
          },

          resumeReviewedAt:
            null,

          lastError:
            '',
        });

        const accessToken =
          await getApplicantAccessToken();

        const response =
          await fetch(
            `/api/applicant/application-drafts/${encodeURIComponent(
              savedDraft.id
            )}/resume-audit`,
            {
              method:
                'POST',

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,

                'Content-Type':
                  'application/json',
              },
            }
          );

        const result =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            result.error ||
              'ATS Readiness Audit could not be completed.'
          );
        }

        if (!result.draft) {
          throw new Error(
            'ATS Readiness Audit completed without returning the application.'
          );
        }

        mergeDraft(
          result.draft
        );

        if (
          activeDraftIdRef
            .current ===
          result.draft.id
        ) {
          setAtsAuditError(
            ''
          );

          setResumeReviewed(
            false
          );
        }
      } catch (error) {
        const message =
          error?.message ||
          'ATS Readiness Audit could not be completed.';

        /*
         * Do not manufacture an Audit
         * failure from a browser/network
         * error. Ask Supabase what
         * actually happened first.
         */
        if (auditDraft) {
          try {
            const latestDraft =
              await fetchLatestApplicationDraft(
                auditDraft.id
              );

            mergeDraft(
              latestDraft
            );

            if (
              latestDraft
                ?.auditStatus ===
              'completed'
            ) {
              if (
                activeDraftIdRef
                  .current ===
                latestDraft.id
              ) {
                setAtsAuditError(
                  ''
                );

                setResumeReviewed(
                  Boolean(
                    latestDraft
                      .resumeReviewedAt
                  )
                );
              }

              return;
            }

            if (
              latestDraft
                ?.auditStatus ===
              'failed'
            ) {
              if (
                activeDraftIdRef
                  .current ===
                latestDraft.id
              ) {
                setAtsAuditError(
                  latestDraft
                    ?.atsAudit
                    ?.error ||
                    latestDraft
                      ?.lastError ||
                    message
                );
              }

              return;
            }

            if (
              latestDraft
                ?.auditStatus ===
              'auditing'
            ) {
              return;
            }
          } catch {
            /*
             * Polling will reconcile an
             * in-flight server result.
             */
          }
        }

        if (
          !auditDraft ||
          activeDraftIdRef
            .current ===
            auditDraft.id
        ) {
          setAtsAuditError(
            message
          );
        }
      }
    };


  const markTailoredResumeReviewed =
    async () => {
      if (
        !activeDraftId ||
        !tailoredResume.trim()
      ) {
        setResumeGenerationError(
          'The tailored resume must be saved before it can be marked reviewed.'
        );

        return;
      }

      if (!finalReviewReady) {
        setResumeGenerationError(
          'Complete Resume Analysis and ATS Audit before Final Review.'
        );

        return;
      }

      try {
        const savedDraft =
          await saveApplicationDraft({
            tailoredResumeText:
              tailoredResume,

            resumeReviewed:
              true,
          });

        setResumeReviewed(
          Boolean(
            savedDraft
              ?.resumeReviewedAt
          )
        );

        setResumeReviewPromptOpen(
          false
        );

        setResumePreviewOpen(
          true
        );

        setResumeGenerationError(
          ''
        );
      } catch (error) {
        setResumeGenerationError(
          error?.message ||
            'The resume review could not be saved.'
        );
      }
    };


  const copyTailoredResume =
    async () => {
      if (!tailoredResume) {
        return;
      }

      try {
        await navigator
          .clipboard
          .writeText(
            tailoredResume
          );

        setResumeGenerationError(
          ''
        );
      } catch {
        setResumeGenerationError(
          'The resume could not be copied automatically.'
        );
      }
    };

  const handleRecordApplication =
    async () => {
      if (!canMarkApplied) {
        return;
      }

      const completedJobRequestId =
        activeJobRequestId;

      const nextJobQueue =
        activeClients.flatMap(
          (client) => {
            const applicationLimit =
              Number(
                client.applicationLimit ||
                  0
              );

            const currentApplications =
              Number(
                client.applications ||
                  0
              );

            const applicationsAfterRecord =
              currentApplications +
              (
                client.id ===
                  selectedClient.id
                  ? 1
                  : 0
              );

            const hasCapacity =
              applicationsAfterRecord <
              applicationLimit;

            if (!hasCapacity) {
              return [];
            }

            return (
              client.jobRequests ||
              []
            )
              .filter(
                (request) =>
                  request.id !==
                    completedJobRequestId &&
                  [
                    'new',
                    'in_review',
                  ].includes(
                    request.status
                  )
              )
              .map(
                (request) => ({
                  client,
                  request,
                })
              );
          }
        );

      const nextJob =
        completedJobRequestId
          ? (
              nextJobQueue.find(
                (entry) =>
                  entry.client.id ===
                  selectedClient.id
              ) ||
              nextJobQueue[0] ||
              null
            )
          : null;

      const recorded =
        await onRecordApplication(
          selectedClient,
          companyName,
          position,
          jobLocation,
          jobUrl,
          jobDescription,
          completedJobRequestId,
          tailoredResume
        );

      if (!recorded) {
        return;
      }

      setTailoredResume('');
      setTailoredResumePreviewUrl('');
      setTailoredResumeFingerprint('');
      setResumeGenerationError('');
      setResumeAnalysisError('');
      setAtsAuditError('');
      setResumeStatus('');
      setResumePreviewOpen(false);
      setResumeReviewPromptOpen(false);
      setResumeReviewed(false);

      if (
        completedJobRequestId &&
        nextJob
      ) {
        const {
          client:
            nextClient,
          request:
            nextRequest,
        } = nextJob;

        setSelectedClientId(
          nextClient.id
        );

        setCompanyName(
          nextRequest.jobCompany ||
            ''
        );

        setPosition(
          nextRequest.jobPosition ||
            ''
        );

        setJobLocation(
          nextRequest.jobLocation ||
            ''
        );

        setJobUrl(
          nextRequest.jobLink ||
            ''
        );

        setJobDescription('');

        setActiveJobRequestId(
          nextRequest.id
        );

        setWorkflowStatus(
          `Application recorded. Next job link loaded for ${nextClient.name}.`
        );

        jobLinkHandoffRef.current =
          `${nextClient.id}:${nextRequest.id}`;

        if (
          nextRequest.status ===
            'new' &&
          onUpdateJobRequest
        ) {
          try {
            await Promise.resolve(
              onUpdateJobRequest(
                nextRequest.id,
                'in_review'
              )
            );
          } catch (error) {
            setResumeStatus(
              error?.message ||
                'The next job link loaded, but its status could not be updated.'
            );
          }
        }

        router.replace(
          {
            pathname:
              '/applicant/workshop',
            query: {
              clientId:
                nextClient.id,
              jobRequestId:
                nextRequest.id,
            },
          },
          undefined,
          {
            shallow: true,
          }
        );

        return;
      }

      setCompanyName('');
      setPosition('');
      setJobLocation('');
      setJobUrl('');
      setJobDescription('');
      setActiveJobRequestId('');

      if (
        completedJobRequestId
      ) {
        setWorkflowStatus(
          'Application recorded. There are no more active job links waiting right now.'
        );

        jobLinkHandoffRef.current =
          '';

        router.replace(
          '/applicant/workshop',
          undefined,
          {
            shallow: true,
          }
        );
      } else {
        setWorkflowStatus(
          'Application recorded. The Workshop is ready for another Applicant-sourced opportunity.'
        );
      }
    };

  return (
    <>
      <PageHeader
        title="Prompt Center"
        subtitle="Prepare each application, check Client fit and complete the resume review before applying."
        showHeading
        showNotification
        action={
          selectedClient &&
          !isPreview ? (
            <button
              type="button"
              onClick={
                handleRecordApplication
              }
              disabled={
                !canMarkApplied
              }
              title={
                canMarkApplied
                  ? 'Record this application as applied'
                  : 'Complete the job details, generate a current tailored resume and confirm that it has been reviewed.'
              }
              className={classNames(
                'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                canMarkApplied
                  ? 'bg-[#1E50C3] text-white shadow-sm hover:bg-[#1A45A7]'
                  : 'cursor-not-allowed border border-slate-200 bg-slate-200 text-slate-500 shadow-none'
              )}
            >
              <FiSave />

              {isQuotaReached
                ? 'Application Limit Reached'
                : isRecordingApplication
                  ? 'Recording...'
                  : 'Mark as Applied'}
            </button>
          ) : null
        }
      />

      {!isPreview && (
        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Applications in Progress
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Move between active applications without losing your work.
              </p>
            </div>

            <button
              type="button"
              onClick={
                startNewApplication
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E50C3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1A45A7]"
            >
              <FiPlus />
              New Application
            </button>
          </div>

          {isLoadingDrafts ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <FiRefreshCw className="animate-spin" />
              Loading applications...
            </div>
          ) : applicationDrafts.length >
            0 ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {applicationDrafts.map(
                (draft) => {
                  const isActive =
                    draft.id ===
                    activeDraftId;

                  return (
                    <button
                      key={
                        draft.id
                      }
                      type="button"
                      onClick={() =>
                        openApplicationDraft(
                          draft
                        )
                      }
                      className={classNames(
                        'flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition',
                        isActive
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {draft.company ||
                            'Untitled application'}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {draft.position ||
                            'Role not added yet'}
                        </p>
                      </div>

                      <span
                        className={classNames(
                          'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
                          draft.resumeStatus ===
                            'generating' ||
                          draft.fitStatus ===
                            'analyzing' ||
                          draft.auditStatus ===
                            'auditing'
                            ? 'bg-blue-100 text-blue-700'
                            : draft.resumeStatus ===
                                  'failed' ||
                                draft.fitStatus ===
                                  'failed' ||
                                draft.auditStatus ===
                                  'failed'
                              ? 'bg-red-100 text-red-700'
                              : draft.auditStatus ===
                                    'completed' ||
                                  draft.resumeStatus ===
                                    'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {
                          getDraftStage(
                            draft
                          )
                        }
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No applications in progress yet.
            </p>
          )}

          {draftError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {draftError}
            </div>
          )}
        </section>
      )}

      <section
        className={
          styles.workshopPanel
        }
      >
        <div
          className={
            styles.clientSelector
          }
        >
          <label
            className={
              styles.fieldLabel
            }
          >
            Select Client
          </label>

          <select
            value={
              selectedClientId
            }
            onChange={
              handleClientChange
            }
            disabled={
              isRecordingApplication
            }
          >
            <option value="">
              Select a client
            </option>

            {activeClients.map(
              (client) => (
                <option
                  key={
                    client.id
                  }
                  value={
                    client.id
                  }
                >
                  {
                    client.name
                  }
                </option>
              )
            )}
          </select>
        </div>

        {selectedClient && (
          <div
            className={
              styles.selectedClient
            }
          >
            <Avatar
              name={
                selectedClient.name
              }
            />

            <div
              className={
                styles.selectedClientInfo
              }
            >
              <strong>
                {
                  selectedClient.name
                }
              </strong>

              <p>
                Target Roles:{' '}
                {targetRoles}
              </p>

              <p>
                Work Arrangement:{' '}
                {
                  selectedClient.workType
                }{' '}
                | Employment Type:{' '}
                {
                  selectedClient.employmentType
                }{' '}
                | Salary:{' '}
                {
                  selectedClient.salaryExpectation
                }
              </p>

              <p>
                Target Markets:{' '}
                {
                  targetMarkets
                }{' '}
                | Industries:{' '}
                {
                  selectedClient.targetIndustries
                }{' '}
                | Specialization:{' '}
                {
                  selectedClient.specialization
                }
              </p>

              <p>
                Preferred Locations:{' '}
                {
                  preferredLocations
                }{' '}
                | Sponsorship:{' '}
                {
                  selectedClient.sponsorship
                }{' '}
                | Experience:{' '}
                {
                  selectedClient.yearsExperience
                }
              </p>
            </div>

            <button
              type="button"
              data-no-glance
              className={
                styles.resumeLink
              }
              onClick={
                openClientResume
              }
              disabled={
                isOpeningResume ||
                !selectedClient.hasResume ||
                isPreview
              }
            >
              {isOpeningResume
                ? 'Opening...'
                : selectedClient
                    .hasResume
                  ? "Client's Resume"
                  : 'Resume Unavailable'}
            </button>
          </div>
        )}
      </section>

      {!selectedClient ? (
        <section
          className={
            styles.workshopPanel
          }
        >
          <div
            className={
              styles.emptyWorkshop
            }
          >
            <FiUser />

            <h3>
              No Client Selected
            </h3>

            <p>
              Select a Client above
              to load their
              preferences, resume
              and application
              workflow.
            </p>
          </div>
        </section>
      ) : (
        <>
          {activeJobRequests.length >
            0 && (
            <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <FiLink className="mt-0.5 shrink-0 text-[#1E50C3]" />

                <div>
                  <strong className="text-sm text-slate-900">
                    {
                      activeJobRequests.length
                    }{' '}
                    active job link
                    {activeJobRequests.length ===
                    1
                      ? ''
                      : 's'}{' '}
                    available
                  </strong>

                  <p className="mt-1 text-xs text-slate-500">
                    Select work
                    from Job Links
                    or continue with
                    this opportunity.
                  </p>
                </div>
              </div>

              <Link
                href="/applicant/job-links"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-[#1E50C3]"
              >
                View Job Links
                <FiArrowRight />
              </Link>
            </section>
          )}

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div
                className={
                  styles.field
                }
              >
                <label>
                  Company Name
                </label>

                <input
                  value={
                    companyName
                  }
                  onChange={
                    (event) =>
                      setCompanyName(
                        event.target
                          .value
                      )
                  }
                  placeholder="e.g. Microsoft"
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label>
                  Position
                </label>

                <input
                  value={
                    position
                  }
                  onChange={
                    (event) =>
                      setPosition(
                        event.target
                          .value
                      )
                  }
                  placeholder="e.g. Software Engineer"
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label>
                  Job Location
                </label>

                <input
                  value={
                    jobLocation
                  }
                  onChange={
                    (event) =>
                      setJobLocation(
                        event.target
                          .value
                      )
                  }
                  placeholder="e.g. Remote"
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label>
                  Job Posting URL
                </label>

                <input
                  value={
                    jobUrl
                  }
                  onChange={
                    (event) =>
                      setJobUrl(
                        event.target
                          .value
                      )
                  }
                  placeholder="https://..."
                />

                {jobUrl.trim() &&
                  !validJobUrl && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    Enter a complete
                    http:// or https://
                    job URL.
                  </p>
                )}
              </div>
            </div>

            <div
              className={`${styles.field} mt-5`}
            >
              <label>
                Job Description
              </label>

              <textarea
                value={
                  jobDescription
                }
                onChange={
                  (event) =>
                    setJobDescription(
                      event.target
                        .value
                    )
                }
                placeholder="Paste the complete job description here..."
              />

              <p className="mt-2 text-xs text-slate-400">
                {
                  jobDescription
                    .trim()
                    .length
                }{' '}
                characters — at least
                80 are required.
              </p>
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Job Fit
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Check this opportunity against the Client&apos;s saved preferences.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  runFitAnalysis
                }
                disabled={
                  !coreJobDetailsComplete ||
                  isRunningFitAnalysis ||
                  isPreview
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1E50C3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1A45A7] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {isRunningFitAnalysis ? (
                  <>
                    <FiRefreshCw className="animate-spin" />
                    Checking Fit...
                  </>
                ) : (
                  <>
                    <FiTarget />
                    Check Job Fit
                  </>
                )}
              </button>
            </div>

            {activeDraft &&
              !activeDraftIsCurrent && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Job details have changed. Check Job Fit again to refresh the result.
              </div>
            )}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FiTarget className="text-[#1E50C3]" />

                    <h3 className="text-sm font-bold text-slate-900">
                      Preference Alignment
                    </h3>
                  </div>

                  {fitAnalysisIsCurrent && (
                    <span className="text-xs font-semibold text-slate-500">
                      {preferenceCounts.match} match
                      {preferenceCounts.match ===
                      1
                        ? ''
                        : 'es'}
                      {' · '}
                      {preferenceCounts.conflict} conflict
                      {preferenceCounts.conflict ===
                      1
                        ? ''
                        : 's'}
                      {' · '}
                      {preferenceCounts.unknown} unknown
                    </span>
                  )}
                </div>

                {!fitAnalysisIsCurrent ? (
                  <p className="mt-4 text-sm text-slate-500">
                    Check Job Fit to see how the opportunity agrees with the Client&apos;s preferences.
                  </p>
                ) : preferenceAlignment.length >
                  0 ? (
                  <div className="mt-4 space-y-3">
                    {preferenceAlignment.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={`${item.preference}-${index}`}
                          className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <strong className="text-sm text-slate-800">
                              {
                                item.preference
                              }
                            </strong>

                            <span
                              className={classNames(
                                'rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
                                item.status ===
                                  'match'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : item.status ===
                                      'conflict'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-slate-200 text-slate-600'
                              )}
                            >
                              {
                                item.status
                              }
                            </span>
                          </div>

                          {item.clientPreference && (
                            <p className="mt-2 text-xs text-slate-600">
                              <strong>
                                Client:
                              </strong>{' '}
                              {
                                item.clientPreference
                              }
                            </p>
                          )}

                          {item.jobEvidence && (
                            <p className="mt-1 text-xs text-slate-500">
                              <strong>
                                Job:
                              </strong>{' '}
                              {
                                item.jobEvidence
                              }
                            </p>
                          )}

                          {item.explanation && (
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {
                                item.explanation
                              }
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    No preference comparisons were returned.
                  </p>
                )}
              </section>

              <section
                className={classNames(
                  'rounded-2xl border p-5',
                  fitAnalysisIsCurrent
                    ? fitTone.wrap
                    : 'border-slate-200 bg-white'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      Applicability Score
                    </p>

                    <p
                      className={classNames(
                        'mt-1 text-4xl font-bold',
                        fitAnalysisIsCurrent
                          ? fitTone.text
                          : 'text-slate-300'
                      )}
                    >
                      {fitAnalysisIsCurrent
                        ? fitScore
                        : '—'}
                      {fitAnalysisIsCurrent
                        ? '%'
                        : ''}
                    </p>
                  </div>

                  {fitAnalysisIsCurrent && (
                    <span
                      className={classNames(
                        'rounded-full px-3 py-1 text-xs font-bold',
                        directiveTone
                      )}
                    >
                      {
                        fitDirective
                      }
                    </span>
                  )}
                </div>

                {!fitAnalysisIsCurrent ? (
                  <p className="mt-4 text-sm text-slate-500">
                    Applicability is decided from the Client&apos;s saved preferences and this opportunity.
                  </p>
                ) : (
                  <>
                    {fitSummary && (
                      <p className="mt-4 text-sm leading-6 text-slate-700">
                        {
                          fitSummary
                        }
                      </p>
                    )}

                    {fitStrengths.length >
                      0 && (
                      <div className="mt-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                          Strong alignment
                        </p>

                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                          {fitStrengths.map(
                            (
                              item,
                              index
                            ) => (
                              <li
                                key={`${index}-${item}`}
                                className="flex items-start gap-2"
                              >
                                <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-600" />
                                <span>
                                  {
                                    item
                                  }
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {fitConcerns.length >
                      0 && (
                      <div className="mt-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                          Points to review
                        </p>

                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                          {fitConcerns.map(
                            (
                              item,
                              index
                            ) => (
                              <li
                                key={`${index}-${item}`}
                              >
                                • {
                                  item
                                }
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          </section>

          {activeResumeGenerating && (
            <section className="mt-5 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <FiRefreshCw className="animate-spin" />
                  </span>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Generating
                      Tailored Resume
                    </p>

                    <p className="text-xs text-slate-500">
                      You can open
                      another application
                      while this resume
                      is being prepared.
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Generating
                </span>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-[#1E50C3]" />
              </div>
            </section>
          )}

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold text-slate-900">
              Generate Documents
            </h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={
                  generateTailoredResume
                }
                disabled={
                  !canGenerateTailoredResume
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1E50C3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1A45A7] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <FiFileText />

                {activeResumeGenerating
                  ? 'Generating...'
                  : tailoredResumeIsCurrent
                    ? 'Regenerate Tailored Resume'
                    : 'Generate Tailored Resume'}
              </button>

              <button
                type="button"
                disabled
                title="Cover-letter generation will be added later."
                className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-400"
              >
                <FiFileText />
                Generate Cover Letter
              </button>
            </div>

            {tailoredResume &&
              !resumePreviewOpen && (
              <button
                type="button"
                onClick={() =>
                  setResumePreviewOpen(
                    true
                  )
                }
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#1E50C3]"
              >
                <FiFileText />
                Reopen Tailored Resume
              </button>
            )}

            {fitAnalysisIsCurrent && (
              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-xs text-slate-600">
                    Fit Directive:
                  </strong>

                  <span
                    className={classNames(
                      'rounded-full px-2.5 py-1 text-xs font-bold',
                      directiveTone
                    )}
                  >
                    {
                      fitDirective
                    }
                  </span>
                </div>

                {fitSummary && (
                  <p className="mt-2 text-sm text-slate-600">
                    {
                      fitSummary
                    }
                  </p>
                )}
              </div>
            )}

            {!canMarkApplied && (
              <p className="mt-3 text-xs text-slate-500">
                Mark as Applied
                unlocks after all job
                details are complete,
                the tailored resume is
                generated, Resume
                Analysis and ATS Audit
                are complete, and the
                Applicant confirms
                Final Review.
              </p>
            )}

            {resumeReviewed &&
              tailoredResumeIsCurrent && (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <FiCheckCircle />
                Final Review
                complete — Mark as
                Applied is ready.
              </div>
            )}

            {resumeGenerationError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {
                  resumeGenerationError
                }
              </div>
            )}
          </section>

          {tailoredResumePreviewUrl &&
            resumePreviewOpen && (
            <section className="relative mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <button
                type="button"
                data-no-glance
                aria-label="Close resume preview"
                onClick={() =>
                  setResumePreviewOpen(
                    false
                  )
                }
                className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX />
              </button>

              <h3 className="text-sm font-bold text-slate-900">
                Source Resume
                Preview
              </h3>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <iframe
                  src={
                    tailoredResumePreviewUrl
                  }
                  title="Client resume preview"
                  className="h-[650px] w-full bg-white"
                />
              </div>
            </section>
          )}

          {tailoredResume &&
            resumePreviewOpen && (
            <section className="relative mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <button
                type="button"
                data-no-glance
                aria-label="Close tailored resume preview"
                onClick={() =>
                  setResumePreviewOpen(
                    false
                  )
                }
                className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX />
              </button>

              <div className="pr-12">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-600" />

                  <h3 className="text-sm font-bold text-slate-900">
                    Tailored Resume
                    Preview
                  </h3>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Review and edit the
                  Hugging Face
                  generated version
                  before applying.
                </p>
              </div>

              {!tailoredResumeIsCurrent && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
                  Job details changed
                  after this resume was
                  generated. Generate a
                  fresh version before
                  applying.
                </div>
              )}

              <textarea
                value={
                  tailoredResume
                }
                onChange={
                  (event) => {
                    setTailoredResume(
                      event.target
                        .value
                    );

                    setResumeReviewed(
                      false
                    );
                  }
                }
                rows={26}
                spellCheck
                className="mt-4 min-h-[520px] w-full resize-y rounded-xl border border-slate-200 bg-white p-5 font-sans text-sm leading-6 text-slate-800 outline-none focus:border-blue-500"
                aria-label="Tailored resume preview"
              />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={
                    copyTailoredResume
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  <FiCopy />
                  Copy Resume
                </button>

                <p className="text-xs text-slate-500 sm:max-w-xs sm:text-right">
                  Final Review is
                  completed after
                  Resume Analysis and
                  ATS Audit.
                </p>
              </div>
            </section>
          )}

          {tailoredResumeIsCurrent &&
            activeDraft?.resumeStatus ===
              'completed' && (
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FiFileText className="text-[#1E50C3]" />

                    <h3 className="text-sm font-bold text-slate-900">
                      Resume Analysis
                    </h3>
                  </div>

                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                    Check how well the
                    tailored resume
                    communicates relevant
                    experience, where
                    evidence is weak and
                    whether any wording
                    needs correction
                    before ATS Audit.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    runResumeAnalysis
                  }
                  disabled={
                    !canRunResumeAnalysis
                  }
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1E50C3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1A45A7] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {resumeAnalysisRunning ? (
                    <FiRefreshCw className="animate-spin" />
                  ) : (
                    <FiFileText />
                  )}

                  {resumeAnalysisRunning
                    ? 'Analyzing...'
                    : resumeAnalysisCompleted
                      ? 'Run Again'
                      : 'Run Resume Analysis'}
                </button>
              </div>

              {resumeAnalysisRunning && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                    <FiRefreshCw className="animate-spin" />
                    Analyzing the
                    tailored resume
                  </div>

                  <p className="mt-1 text-xs text-blue-600">
                    You can open another
                    application while
                    this analysis runs.
                  </p>
                </div>
              )}

              {resumeAnalysisNeedsRefresh && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  The tailored resume
                  has changed since the
                  last analysis. Run
                  Resume Analysis again
                  before continuing.
                </div>
              )}

              {resumeAnalysisCompleted && (
                <div className="mt-5 space-y-4">
                  {resumeAnalysis.summary && (
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-sm leading-6 text-slate-700">
                        {
                          resumeAnalysis
                            .summary
                        }
                      </p>
                    </div>
                  )}

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        Strong Matches
                      </h4>

                      {(
                        resumeAnalysis
                          .strongMatches ||
                        []
                      ).length > 0 ? (
                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                          {resumeAnalysis
                            .strongMatches
                            .map(
                              (
                                item,
                                index
                              ) => (
                                <li
                                  key={`${index}-${item}`}
                                  className="flex gap-2"
                                >
                                  <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-600" />
                                  <span>
                                    {item}
                                  </span>
                                </li>
                              )
                            )}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">
                          No major
                          strengths were
                          identified.
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-amber-700">
                        Missing / Weak
                        Evidence
                      </h4>

                      {(
                        resumeAnalysis
                          .missingOrWeakEvidence ||
                        []
                      ).length > 0 ? (
                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                          {resumeAnalysis
                            .missingOrWeakEvidence
                            .map(
                              (
                                item,
                                index
                              ) => (
                                <li
                                  key={`${index}-${item}`}
                                  className="flex gap-2"
                                >
                                  <FiAlertCircle className="mt-0.5 shrink-0 text-amber-600" />
                                  <span>
                                    {item}
                                  </span>
                                </li>
                              )
                            )}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">
                          No important
                          evidence gaps
                          were identified.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                      Keyword Coverage
                    </h4>

                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold text-emerald-700">
                          Represented
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {(
                            resumeAnalysis
                              .keywordCoverage
                              ?.matched ||
                            []
                          ).length > 0 ? (
                            resumeAnalysis
                              .keywordCoverage
                              .matched
                              .map(
                                (
                                  item,
                                  index
                                ) => (
                                  <span
                                    key={`${index}-${item}`}
                                    className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                  >
                                    {item}
                                  </span>
                                )
                              )
                          ) : (
                            <span className="text-xs text-slate-500">
                              None
                              identified.
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-amber-700">
                          Missing or Weak
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {(
                            resumeAnalysis
                              .keywordCoverage
                              ?.missingImportant ||
                            []
                          ).length > 0 ? (
                            resumeAnalysis
                              .keywordCoverage
                              .missingImportant
                              .map(
                                (
                                  item,
                                  index
                                ) => (
                                  <span
                                    key={`${index}-${item}`}
                                    className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                                  >
                                    {item}
                                  </span>
                                )
                              )
                          ) : (
                            <span className="text-xs text-slate-500">
                              None
                              identified.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        Evidence Risks
                      </h4>

                      {(
                        resumeAnalysis
                          .evidenceRisks ||
                        []
                      ).length > 0 ? (
                        <ul className="mt-3 space-y-2 text-sm text-red-700">
                          {resumeAnalysis
                            .evidenceRisks
                            .map(
                              (
                                item,
                                index
                              ) => (
                                <li
                                  key={`${index}-${item}`}
                                  className="flex gap-2"
                                >
                                  <FiAlertCircle className="mt-0.5 shrink-0" />
                                  <span>
                                    {item}
                                  </span>
                                </li>
                              )
                            )}
                        </ul>
                      ) : (
                        <div className="mt-3 flex gap-2 text-sm text-emerald-700">
                          <FiCheckCircle className="mt-0.5 shrink-0" />
                          No unsupported
                          or overstated
                          wording was
                          identified.
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        Recommendations
                      </h4>

                      {(
                        resumeAnalysis
                          .recommendations ||
                        []
                      ).length > 0 ? (
                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                          {resumeAnalysis
                            .recommendations
                            .map(
                              (
                                item,
                                index
                              ) => (
                                <li
                                  key={`${index}-${item}`}
                                  className="flex gap-2"
                                >
                                  <FiCheckCircle className="mt-0.5 shrink-0 text-[#1E50C3]" />
                                  <span>
                                    {item}
                                  </span>
                                </li>
                              )
                            )}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">
                          No additional
                          content changes
                          were recommended.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    Resume Analysis is
                    complete. The next
                    step is ATS Audit.
                  </div>
                </div>
              )}

              {resumeAnalysisError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {
                    resumeAnalysisError
                  }
                </div>
              )}
            </section>
          )}

          {tailoredResumeIsCurrent &&
            activeDraft?.resumeStatus ===
              'completed' && (
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FiFileText className="text-[#1E50C3]" />

                    <h3 className="text-sm font-bold text-slate-900">
                      ATS Readiness
                    </h3>
                  </div>

                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                    Audit the final
                    resume text and
                    structure against
                    the Job Description
                    before Final Review.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    runAtsAudit
                  }
                  disabled={
                    !canRunAtsAudit
                  }
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1E50C3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1A45A7] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {atsAuditRunning ? (
                    <FiRefreshCw className="animate-spin" />
                  ) : (
                    <FiFileText />
                  )}

                  {atsAuditRunning
                    ? 'Auditing...'
                    : atsAuditCompleted
                      ? 'Run Again'
                      : 'Run ATS Audit'}
                </button>
              </div>

              {!resumeAnalysisCompleted &&
                !atsAuditRunning && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Complete Resume
                  Analysis before
                  running ATS Audit.
                </div>
              )}

              {atsAuditRunning && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                    <FiRefreshCw className="animate-spin" />
                    Auditing ATS
                    readiness
                  </div>

                  <p className="mt-1 text-xs text-blue-600">
                    You can open another
                    application while
                    this audit runs.
                  </p>
                </div>
              )}

              {atsAuditNeedsRefresh && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  The resume or Resume
                  Analysis changed after
                  this ATS Audit. Run
                  Resume Analysis and
                  ATS Audit again.
                </div>
              )}

              {atsAuditCompleted && (
                <div className="mt-5 space-y-4">
                  <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                        ATS Readiness Score
                      </p>

                      <div className="mt-2 flex items-end gap-1">
                        <span className="text-4xl font-black text-slate-950">
                          {
                            Number(
                              activeDraft
                                ?.atsScore ??
                                0
                            )
                          }
                        </span>

                        <span className="pb-1 text-sm font-semibold text-slate-500">
                          /100
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Measures text,
                        structure and
                        job-specific ATS
                        readiness.
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-4 py-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        Audit Summary
                      </h4>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {
                          atsAudit
                            .summary
                        }
                      </p>
                    </div>
                  </div>

                  {(
                    atsAudit.checks ||
                    []
                  ).length > 0 && (
                    <div className="rounded-xl border border-slate-200 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        ATS Checks
                      </h4>

                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                        {atsAudit.checks.map(
                          (
                            check,
                            index
                          ) => {
                            const checkTone =
                              check.status ===
                                'pass'
                                ? 'border-emerald-100 bg-emerald-50/60'
                                : check.status ===
                                    'fail'
                                  ? 'border-red-100 bg-red-50/60'
                                  : 'border-amber-100 bg-amber-50/60';

                            const statusTone =
                              check.status ===
                                'pass'
                                ? 'text-emerald-700'
                                : check.status ===
                                    'fail'
                                  ? 'text-red-700'
                                  : 'text-amber-700';

                            return (
                              <div
                                key={`${index}-${check.label}`}
                                className={classNames(
                                  'rounded-xl border p-4',
                                  checkTone
                                )}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-bold text-slate-900">
                                    {
                                      check.label
                                    }
                                  </p>

                                  <span
                                    className={classNames(
                                      'text-xs font-bold uppercase',
                                      statusTone
                                    )}
                                  >
                                    {
                                      check.status
                                    }
                                  </span>
                                </div>

                                {check.finding && (
                                  <p className="mt-2 text-sm leading-5 text-slate-700">
                                    {
                                      check.finding
                                    }
                                  </p>
                                )}

                                {check.recommendation && (
                                  <p className="mt-2 text-xs leading-5 text-slate-600">
                                    <strong>
                                      Improve:
                                    </strong>{' '}
                                    {
                                      check
                                        .recommendation
                                    }
                                  </p>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        Strong ATS Keywords
                      </h4>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(
                          atsAudit
                            .keywordFindings
                            ?.strong ||
                          []
                        ).length > 0 ? (
                          atsAudit
                            .keywordFindings
                            .strong
                            .map(
                              (
                                item,
                                index
                              ) => (
                                <span
                                  key={`${index}-${item}`}
                                  className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                >
                                  {item}
                                </span>
                              )
                            )
                        ) : (
                          <span className="text-xs text-slate-500">
                            None
                            identified.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-amber-700">
                        Weak / Missing ATS Keywords
                      </h4>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(
                          atsAudit
                            .keywordFindings
                            ?.weak ||
                          []
                        ).length > 0 ? (
                          atsAudit
                            .keywordFindings
                            .weak
                            .map(
                              (
                                item,
                                index
                              ) => (
                                <span
                                  key={`${index}-${item}`}
                                  className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-700"
                                >
                                  {item}
                                </span>
                              )
                            )
                        ) : (
                          <span className="text-xs text-slate-500">
                            None
                            identified.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        Issues
                      </h4>

                      {(
                        atsAudit.issues ||
                        []
                      ).length > 0 ? (
                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                          {atsAudit.issues.map(
                            (
                              item,
                              index
                            ) => (
                              <li
                                key={`${index}-${item}`}
                                className="flex gap-2"
                              >
                                <FiAlertCircle className="mt-0.5 shrink-0 text-amber-600" />
                                <span>
                                  {item}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <div className="mt-3 flex gap-2 text-sm text-emerald-700">
                          <FiCheckCircle className="mt-0.5 shrink-0" />
                          No major
                          ATS-readiness
                          issues were
                          identified.
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        Recommendations
                      </h4>

                      {(
                        atsAudit
                          .recommendations ||
                        []
                      ).length > 0 ? (
                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                          {atsAudit
                            .recommendations
                            .map(
                              (
                                item,
                                index
                              ) => (
                                <li
                                  key={`${index}-${item}`}
                                  className="flex gap-2"
                                >
                                  <FiCheckCircle className="mt-0.5 shrink-0 text-[#1E50C3]" />
                                  <span>
                                    {item}
                                  </span>
                                </li>
                              )
                            )}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">
                          No additional
                          ATS improvements
                          were recommended.
                        </p>
                      )}
                    </div>
                  </div>

                  {atsAudit.scopeNote && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                      {
                        atsAudit
                          .scopeNote
                      }
                    </div>
                  )}

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    ATS Readiness Audit
                    is complete. Review
                    any recommendations,
                    then complete Final
                    Review.
                  </div>
                </div>
              )}

              {atsAuditError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {
                    atsAuditError
                  }
                </div>
              )}
            </section>
          )}

          {tailoredResumeIsCurrent &&
            activeDraft?.resumeStatus ===
              'completed' && (
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FiCheckCircle
                      className={
                        resumeReviewed
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }
                    />

                    <h3 className="text-sm font-bold text-slate-900">
                      Final Review
                    </h3>
                  </div>

                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                    Confirm the final
                    tailored resume only
                    after Resume Analysis
                    and ATS Audit are
                    complete.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    markTailoredResumeReviewed
                  }
                  disabled={
                    !finalReviewReady ||
                    resumeReviewed
                  }
                  className={classNames(
                    'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition',
                    resumeReviewed
                      ? 'cursor-default bg-emerald-100 text-emerald-700'
                      : finalReviewReady
                        ? 'bg-[#1E50C3] text-white hover:bg-[#1A45A7]'
                        : 'cursor-not-allowed bg-slate-200 text-slate-500'
                  )}
                >
                  <FiCheckCircle />

                  {resumeReviewed
                    ? 'Final Review Complete'
                    : !resumeAnalysisCompleted
                      ? 'Complete Resume Analysis First'
                      : activeDraft?.auditStatus !==
                          'completed'
                        ? 'ATS Audit Required'
                        : 'Confirm Final Review'}
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div
                  className={classNames(
                    'rounded-xl border px-3 py-2.5 text-xs font-semibold',
                    resumeAnalysisCompleted
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  )}
                >
                  {resumeAnalysisCompleted
                    ? '✓ Resume Analysis Complete'
                    : 'Resume Analysis Pending'}
                </div>

                <div
                  className={classNames(
                    'rounded-xl border px-3 py-2.5 text-xs font-semibold',
                    atsAuditCompleted
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  )}
                >
                  {atsAuditCompleted
                    ? '✓ ATS Audit Complete'
                    : 'ATS Audit Pending'}
                </div>

                <div
                  className={classNames(
                    'rounded-xl border px-3 py-2.5 text-xs font-semibold',
                    resumeReviewed
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  )}
                >
                  {resumeReviewed
                    ? '✓ Final Review Complete'
                    : 'Final Review Pending'}
                </div>
              </div>

              {!resumeAnalysisCompleted && (
                <p className="mt-3 text-xs text-slate-500">
                  Finish Resume
                  Analysis before
                  moving to ATS Audit.
                </p>
              )}

              {resumeAnalysisCompleted &&
                !atsAuditCompleted && (
                <p className="mt-3 text-xs text-slate-500">
                  Resume Analysis is
                  complete. ATS Audit is
                  the next step.
                </p>
              )}

              {finalReviewReady &&
                !resumeReviewed && (
                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  ATS Audit is complete.
                  Review the final resume
                  carefully, then confirm
                  Final Review.
                </div>
              )}

              {resumeReviewed && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <FiCheckCircle className="mt-0.5 shrink-0" />
                  Final Review complete.
                  This application can
                  now be marked as
                  Applied.
                </div>
              )}
            </section>
          )}

          {workflowStatus && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <FiCheckCircle className="mt-0.5 shrink-0" />
              {
                workflowStatus
              }
            </div>
          )}

          {resumeStatus && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <FiAlertCircle className="mt-0.5 shrink-0" />
              {
                resumeStatus
              }
            </div>
          )}
        </>
      )}

      {resumeReviewPromptOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="resume-review-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1E50C3]">
              <FiFileText />
            </div>

            <h2
              id="resume-review-title"
              className="mt-4 text-xl font-bold text-slate-950"
            >
              Has the tailored
              resume been reviewed?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Mark as Applied will
              remain locked until the
              Applicant confirms that
              the generated resume has
              been reviewed.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setResumeReviewPromptOpen(
                    false
                  );

                  setResumePreviewOpen(
                    true
                  );
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Not Yet — Review It
              </button>

              <button
                type="button"
                onClick={
                  markTailoredResumeReviewed
                }
                className="rounded-xl bg-[#1E50C3] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Yes, I Reviewed It
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function FeedbackPage({
  clientFeedback = [],
  previewApplicantId = '',
  isPreview = false,
}) {
  const [tab, setTab] =
    useState('client');
  const [
    teamMessages,
    setTeamMessages,
  ] = useState([]);
  const [
    currentProfileId,
    setCurrentProfileId,
  ] = useState('');
  const [
    messageDraft,
    setMessageDraft,
  ] = useState('');
  const [
    isLoadingMessages,
    setIsLoadingMessages,
  ] = useState(false);
  const [
    isSendingMessage,
    setIsSendingMessage,
  ] = useState(false);
  const [
    messageError,
    setMessageError,
  ] = useState('');
  const [
    messageRefreshKey,
    setMessageRefreshKey,
  ] = useState(0);

  useEffect(() => {
    if (tab !== 'admin') {
      return undefined;
    }

    let cancelled = false;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      setMessageError('');

      try {
        const accessToken =
          await getApplicantAccessToken();

        const messagesEndpoint =
          previewApplicantId
            ? `/api/admin/applicants/${previewApplicantId}/messages`
            : '/api/applicant/messages';

        const response = await fetch(
          messagesEndpoint,
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          }
        );

        const result = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Your messages could not be loaded.'
          );
        }

        if (!cancelled) {
          setTeamMessages(
            result.messages || []
          );

          setCurrentProfileId(
            result.currentProfileId ||
              ''
          );
        }
      } catch (error) {
        if (!cancelled) {
          setMessageError(
            error?.message ||
              'Your messages could not be loaded.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMessages(false);
        }
      }
    };

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [
    tab,
    messageRefreshKey,
    previewApplicantId,
  ]);

  const sendTeamMessage =
    async () => {
      if (isPreview) {
        setMessageError(
          'Applicant preview is read-only. Send messages from Applicants Management.'
        );
        return;
      }

      const message =
        messageDraft.trim();

      if (
        !message ||
        isSendingMessage
      ) {
        return;
      }

      setIsSendingMessage(true);
      setMessageError('');

      try {
        const accessToken =
          await getApplicantAccessToken();

        const response = await fetch(
          '/api/applicant/messages',
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              message,
            }),
          }
        );

        const result = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Your message could not be sent.'
          );
        }

        if (result.message) {
          setTeamMessages(
            (current) => [
              ...current,
              result.message,
            ]
          );
        }

        setMessageDraft('');
      } catch (error) {
        setMessageError(
          error?.message ||
            'Your message could not be sent.'
        );
      } finally {
        setIsSendingMessage(false);
      }
    };

  return (
    <>
      <PageHeader
        title="Feedback & Messages"
        subtitle="Review client feedback and communicate with the ApplyLoop team"
        showHeading={false}
        showNotification={false}
      />

      <div
        className={
          styles.feedbackTabs
        }
      >
        <button
          type="button"
          className={classNames(
            styles.tab,
            tab === 'client' &&
              styles.tabActive
          )}
          onClick={() =>
            setTab('client')
          }
        >
          Client Feedback (
          {clientFeedback.length})
        </button>

        <button
          type="button"
          className={classNames(
            styles.tab,
            tab === 'admin' &&
              styles.tabActive
          )}
          onClick={() =>
            setTab('admin')
          }
        >
          Team Messages
        </button>
      </div>

      {tab === 'client' ? (
        <div
          className={
            styles.feedbackList
          }
        >
          {clientFeedback.map(
            (item) => (
              <article
                key={item.id}
                className={
                  styles.feedbackCard
                }
              >
                <div
                  className={
                    styles.feedbackCardHead
                  }
                >
                  <div>
                    <strong>
                      {item.client}
                    </strong>

                    <div
                      className={
                        styles.feedbackRole
                      }
                    >
                      {item.role}
                    </div>
                  </div>

                  <span
                    className={classNames(
                      styles.statusSelect,
                      item.status ===
                        'Received'
                        ? styles.statusOffer
                        : styles.statusWaiting
                    )}
                  >
                    {item.status}
                  </span>
                </div>

                <p
                  className={
                    styles.feedbackMessage
                  }
                >
                  {item.message}
                </p>

                <p
                  className={
                    styles.feedbackDate
                  }
                >
                  {formatConversationTime(
                    item.createdAt
                  )}
                </p>
              </article>
            )
          )}
        </div>
      ) : (
        <section
          className={
            styles.teamChatShell
          }
        >
          <div
            className={
              styles.teamChatHeader
            }
          >
            <div>
              <h3>
                ApplyLoop Team
              </h3>

              <p>
                Messages from Owners and Admins appear here.
              </p>
            </div>

            <button
              type="button"
              className={
                styles.teamChatRefresh
              }
              onClick={() =>
                setMessageRefreshKey(
                  (current) =>
                    current + 1
                )
              }
              disabled={
                isLoadingMessages ||
                isSendingMessage
              }
              title="Refresh messages"
              aria-label="Refresh messages"
            >
              <FiRefreshCw
                className={
                  isLoadingMessages
                    ? styles.teamChatSpinning
                    : ''
                }
              />
            </button>
          </div>

          <div
            className={
              styles.teamChatMessages
            }
          >
            {isLoadingMessages ? (
              <div
                className={
                  styles.teamChatEmpty
                }
              >
                <FiRefreshCw
                  className={
                    styles.teamChatSpinning
                  }
                />

                <strong>
                  Loading messages...
                </strong>
              </div>
            ) : teamMessages.length ===
              0 ? (
              <div
                className={
                  styles.teamChatEmpty
                }
              >
                <span
                  className={
                    styles.teamChatEmptyIcon
                  }
                >
                  <FiMessageSquare />
                </span>

                <strong>
                  No team messages yet
                </strong>

                <p>
                  Messages from the ApplyLoop team will appear here.
                </p>
              </div>
            ) : (
              teamMessages.map(
                (message) => {
                  const isMine =
                    message.senderProfileId ===
                    currentProfileId;

                  const roleLabel =
                    message.senderRole ===
                    'applicant'
                      ? 'Applicant'
                      : 'Team Member';

                  return (
                    <div
                      key={message.id}
                      className={classNames(
                        styles.teamChatMessageRow,
                        isMine &&
                          styles.teamChatMessageOwn
                      )}
                    >
                      <div
                        className={
                          styles.teamChatMessageWrap
                        }
                      >
                        <div
                          className={classNames(
                            styles.teamChatMeta,
                            isMine &&
                              styles.teamChatMetaOwn
                          )}
                        >
                          <strong>
                            {message.senderName}
                          </strong>

                          <span>
                            {roleLabel}
                          </span>

                          <span>
                            {formatConversationTime(
                              message.createdAt
                            )}
                          </span>

                          {isMine && (
                            <span>
                              {message.readAt
                                ? 'Seen'
                                : 'Sent'}
                            </span>
                          )}
                        </div>

                        <div
                          className={classNames(
                            styles.teamChatBubble,
                            isMine &&
                              styles.teamChatBubbleOwn
                          )}
                        >
                          {message.message}
                        </div>
                      </div>
                    </div>
                  );
                }
              )
            )}
          </div>

          <div
            className={
              styles.teamChatComposer
            }
          >
            {messageError && (
              <div
                role="alert"
                className={
                  styles.teamChatError
                }
              >
                {messageError}
              </div>
            )}

            <div
              className={
                styles.teamChatComposerRow
              }
            >
              <textarea
                value={messageDraft}
                onChange={(event) =>
                  setMessageDraft(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                      'Enter' &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    sendTeamMessage();
                  }
                }}
                maxLength={4000}
                rows={2}
                placeholder="Reply to the ApplyLoop team..."
              />

              <button
                type="button"
                className={
                  styles.teamChatSend
                }
                onClick={
                  sendTeamMessage
                }
                disabled={
                  isSendingMessage ||
                  !messageDraft.trim()
                }
              >
                <FiSend />

                {isSendingMessage
                  ? 'Sending...'
                  : 'Send'}
              </button>
            </div>

            <div
              className={
                styles.teamChatComposerMeta
              }
            >
              <span>
                Enter to send · Shift + Enter for a new line
              </span>

              <span>
                {messageDraft.length}/4000
              </span>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function PerformancePage({
  applications = [],
  performance =
    EMPTY_APPLICANT_PERFORMANCE,
}) {
  const [
    ratingRevealed,
    setRatingRevealed,
  ] = useState(false);

  const totalApplications =
    applications.length;

  const dailyTarget =
    Number(
      performance.dailyTarget || 0
    );

  const todayCompleted =
    Number(
      performance.todayCompleted || 0
    );

  const todayCompletionRate =
    Number(
      performance.todayCompletionRate ||
        0
    );

  const averageCompletionRate =
    Number(
      performance.completionRate || 0
    );

  const monitoredWorkdays =
    Number(
      performance.monitoredWorkdays ||
        0
    );

  const clientSatisfaction =
    Number(
      performance.clientSatisfaction ||
        0
    );

  const ratingCount =
    Number(
      performance.ratingCount || 0
    );

  const countStatus =
    (status) =>
      applications.filter(
        (application) =>
          application.status ===
          status
      ).length;

  const rejected =
    countStatus(
      'Rejected'
    );

  const interviews =
    countStatus(
      'Interview Scheduled'
    );

  const offers =
    countStatus(
      'Offer Received'
    );

  const rate =
    (value, total) =>
      total > 0
        ? (
            (
              value /
              total
            ) *
            100
          )
        : 0;

  const interviewRate =
    rate(
      interviews,
      totalApplications
    );

  const offerRate =
    rate(
      offers,
      totalApplications
    );

  const rejectionRate =
    rate(
      rejected,
      totalApplications
    );

  const getPeriodStats =
    (days) => {
      const cutoff =
        new Date();

      cutoff.setHours(
        0,
        0,
        0,
        0
      );

      cutoff.setDate(
        cutoff.getDate() -
          (days - 1)
      );

      const rows =
        applications.filter(
          (application) => {
            const date =
              new Date(
                application.appliedAt ||
                application.createdAt ||
                ''
              );

            return (
              !Number.isNaN(
                date.getTime()
              ) &&
              date >= cutoff
            );
          }
        );

      const advanced =
        rows.filter(
          (application) =>
            [
              'Interview Scheduled',
              'Offer Received',
            ].includes(
              application.status
            )
        ).length;

      const periodRejected =
        rows.filter(
          (application) =>
            application.status ===
            'Rejected'
        ).length;

      return {
        total:
          rows.length,

        advanced,

        qualityRate:
          rate(
            advanced,
            rows.length
          ),

        rejectionRate:
          rate(
            periodRejected,
            rows.length
          ),
      };
    };

  const periods = [
    [
      'This Week',
      getPeriodStats(7),
    ],
    [
      'Last 30 Days',
      getPeriodStats(30),
    ],
    [
      'Last 90 Days',
      getPeriodStats(90),
    ],
  ];

  const achievements = [
    todayCompletionRate >= 100
      ? {
          title:
            'Daily Target Met',
          description:
            `${todayCompleted} Application${
              todayCompleted === 1
                ? ''
                : 's'
            } completed today`,
        }
      : null,

    averageCompletionRate >= 80
      ? {
          title:
            'Consistent Application Pace',
          description:
            `${averageCompletionRate.toFixed(
              1
            )}% average completion across monitored workdays`,
        }
      : null,

    ratingCount >= 3 &&
    clientSatisfaction >= 4
      ? {
          title:
            'Strong Client Quality',
          description:
            `${clientSatisfaction.toFixed(
              1
            )}/5 across ${ratingCount} Client ratings`,
        }
      : null,

    interviews >= 1
      ? {
          title:
            'Interview Conversion',
          description:
            `${interviewRate.toFixed(
              1
            )}% of recorded Applications reached interview`,
        }
      : null,

    offers >= 1
      ? {
          title:
            'Offer Conversion',
          description:
            `${offerRate.toFixed(
              1
            )}% of recorded Applications reached offer`,
        }
      : null,
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title="Performance"
        subtitle="Track Application pace and the quality of submitted work."
        showHeading={false}
        showNotification={false}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Today&apos;s Application Rate
          </span>

          <strong className="mt-3 block text-3xl font-bold text-slate-950">
            {todayCompletionRate.toFixed(
              1
            )}
            %
          </strong>

          <small className="mt-2 block text-sm text-slate-500">
            {dailyTarget > 0
              ? `${todayCompleted} of ${dailyTarget} daily target`
              : `${todayCompleted} completed today`}
          </small>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Average Target Completion
          </span>

          <strong className="mt-3 block text-3xl font-bold text-slate-950">
            {averageCompletionRate.toFixed(
              1
            )}
            %
          </strong>

          <small className="mt-2 block text-sm text-slate-500">
            Across
            {' '}
            {monitoredWorkdays}
            {' '}
            monitored workday
            {monitoredWorkdays === 1
              ? ''
              : 's'}
          </small>
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Client Quality Rating
          </span>

          <strong className="mt-3 block text-3xl font-bold text-slate-950">
            {ratingCount === 0
              ? '—'
              : ratingRevealed
                ? `${clientSatisfaction.toFixed(
                    1
                  )}/5`
                : 'Concealed'}
          </strong>

          <small className="mt-2 block text-sm text-slate-500">
            {ratingCount === 0
              ? 'No Client ratings yet'
              : `Based on ${ratingCount} rating${
                  ratingCount === 1
                    ? ''
                    : 's'
                }`}
          </small>

          {ratingCount > 0 && (
            <button
              type="button"
              data-no-glance
              onClick={() =>
                setRatingRevealed(
                  (current) =>
                    !current
                )
              }
              className="mt-3 text-sm font-semibold text-[#1E50C3]"
            >
              {ratingRevealed
                ? 'Hide rating'
                : 'Show rating'}
            </button>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-950">
          Application Rate
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          How quickly the Applicant is completing the expected Application workload.
        </p>

        <div className="mt-5 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <div>
                <strong className="text-slate-900">
                  Today
                </strong>

                <span className="ml-2 text-slate-500">
                  {dailyTarget > 0
                    ? `${todayCompleted} / ${dailyTarget}`
                    : `${todayCompleted} completed`}
                </span>
              </div>

              <strong className="text-[#1E50C3]">
                {todayCompletionRate.toFixed(
                  1
                )}
                %
              </strong>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#1E50C3]"
                style={{
                  width:
                    `${Math.min(
                      100,
                      todayCompletionRate
                    )}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <div>
                <strong className="text-slate-900">
                  Average Target Completion
                </strong>

                <span className="ml-2 text-slate-500">
                  Last
                  {' '}
                  {monitoredWorkdays}
                  {' '}
                  monitored workday
                  {monitoredWorkdays === 1
                    ? ''
                    : 's'}
                </span>
              </div>

              <strong className="text-[#1E50C3]">
                {averageCompletionRate.toFixed(
                  1
                )}
                %
              </strong>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#1E50C3]"
                style={{
                  width:
                    `${Math.min(
                      100,
                      averageCompletionRate
                    )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-950">
          Application Quality
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Quality signals from Client ratings and Application outcomes.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-blue-50 px-4 py-4">
            <span className="text-xs font-semibold text-blue-600">
              Interview Conversion
            </span>

            <strong className="mt-2 block text-2xl font-bold text-blue-800">
              {interviewRate.toFixed(
                1
              )}
              %
            </strong>

            <small className="mt-1 block text-xs text-blue-500">
              {interviews}
              {' '}
              interview
              {interviews === 1
                ? ''
                : 's'}
              {' '}
              from
              {' '}
              {totalApplications}
              {' '}
              Applications
            </small>
          </div>

          <div className="rounded-xl bg-emerald-50 px-4 py-4">
            <span className="text-xs font-semibold text-emerald-600">
              Offer Conversion
            </span>

            <strong className="mt-2 block text-2xl font-bold text-emerald-800">
              {offerRate.toFixed(
                1
              )}
              %
            </strong>

            <small className="mt-1 block text-xs text-emerald-600">
              {offers}
              {' '}
              offer
              {offers === 1
                ? ''
                : 's'}
              {' '}
              from
              {' '}
              {totalApplications}
              {' '}
              Applications
            </small>
          </div>

          <div className="rounded-xl bg-red-50 px-4 py-4">
            <span className="text-xs font-semibold text-red-500">
              Rejection Rate
            </span>

            <strong className="mt-2 block text-2xl font-bold text-red-700">
              {rejectionRate.toFixed(
                1
              )}
              %
            </strong>

            <small className="mt-1 block text-xs text-red-500">
              {rejected}
              {' '}
              rejected Application
              {rejected === 1
                ? ''
                : 's'}
            </small>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-950">
            Recent Performance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recent Application volume and quality trend.
          </p>
        </div>

        <div className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {periods.map(
            ([label, values]) => (
              <article
                key={label}
                className="grid gap-4 px-4 py-4 sm:grid-cols-[1.3fr_repeat(3,1fr)] sm:items-center"
              >
                <strong className="text-sm text-slate-900">
                  {label}
                </strong>

                <div>
                  <span className="block text-xs text-slate-400">
                    Applications
                  </span>

                  <strong className="mt-1 block text-sm text-[#1E50C3]">
                    {values.total}
                  </strong>
                </div>

                <div>
                  <span className="block text-xs text-slate-400">
                    Advanced
                  </span>

                  <strong className="mt-1 block text-sm text-emerald-700">
                    {values.advanced}
                  </strong>
                </div>

                <div>
                  <span className="block text-xs text-slate-400">
                    Quality Rate
                  </span>

                  <strong className="mt-1 block text-sm text-slate-900">
                    {values.qualityRate.toFixed(
                      1
                    )}
                    %
                  </strong>
                </div>
              </article>
            )
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-950">
            Achievements
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Verified milestones based on Application pace and quality.
          </p>
        </div>

        {achievements.length >
        0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {achievements.map(
              (achievement) => (
                <article
                  key={
                    achievement.title
                  }
                  className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <FiCheckCircle />
                  </span>

                  <div>
                    <strong className="text-sm text-slate-950">
                      {
                        achievement.title
                      }
                    </strong>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {
                        achievement.description
                      }
                    </p>
                  </div>
                </article>
              )
            )}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
            Achievements will appear as daily targets are met and Application quality improves.
          </div>
        )}
      </section>
    </>
  );
}

function Toggle({
  value,
  onChange,
  label,
  disabled = false,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={classNames(
        styles.toggle,
        value && styles.toggleOn
      )}
      onClick={() =>
        onChange(!value)
      }
    />
  );
}

function SettingsPage({
  lineManager = null,
  isPreview = false,
}) {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const nameParts = (user?.name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const [profile, setProfile] = useState({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' '),
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || '',
    timezone: user?.timezone || '',
  });
  const [emailNotifications, setEmailNotifications] = useState(user?.emailNotifications ?? true);
  const [savingNotificationKey, setSavingNotificationKey] = useState('');

  useEffect(() => {
    setEmailNotifications(
      user?.emailNotifications ?? true
    );
  }, [
    user?.emailNotifications,
  ]);
  const [
    employmentDocument,
    setEmploymentDocument,
  ] = useState(null);

  const [
    employmentDocumentError,
    setEmploymentDocumentError,
  ] = useState('');

  const [
    isLoadingEmploymentDocument,
    setIsLoadingEmploymentDocument,
  ] = useState(false);

  const [
    isDownloadingEmploymentDocument,
    setIsDownloadingEmploymentDocument,
  ] = useState(false);

  useEffect(() => {
    if (isPreview) {
      setEmploymentDocument(null);
      setEmploymentDocumentError('');
      return undefined;
    }

    let cancelled = false;

    const loadEmploymentDocument =
      async () => {
        setIsLoadingEmploymentDocument(
          true
        );

        setEmploymentDocumentError('');

        try {
          const accessToken =
            await getApplicantAccessToken();

          const response =
            await fetch(
              '/api/applicant/employment-document',
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
                'Your employee agreement could not be loaded.'
            );
          }

          if (!cancelled) {
            setEmploymentDocument(
              result.document ||
              null
            );
          }
        } catch (error) {
          if (!cancelled) {
            setEmploymentDocumentError(
              error?.message ||
                'Your employee agreement could not be loaded.'
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoadingEmploymentDocument(
              false
            );
          }
        }
      };

    loadEmploymentDocument();

    return () => {
      cancelled = true;
    };
  }, [isPreview]);

  const downloadEmploymentDocument =
    async () => {
      if (
        !employmentDocument ||
        isPreview
      ) {
        return;
      }

      setIsDownloadingEmploymentDocument(
        true
      );

      setEmploymentDocumentError('');

      try {
        const accessToken =
          await getApplicantAccessToken();

        const response =
          await fetch(
            '/api/applicant/employment-document?download=1',
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

        if (
          !response.ok ||
          !result.url
        ) {
          throw new Error(
            result.error ||
              'Your employee agreement could not be downloaded.'
          );
        }

        const link =
          document.createElement(
            'a'
          );

        link.href = result.url;

        link.rel =
          'noreferrer';

        link.download =
          result.filename ||
          employmentDocument.fileName ||
          'ApplyLoop-employee-agreement';

        document.body.appendChild(
          link
        );

        link.click();
        link.remove();
      } catch (error) {
        setEmploymentDocumentError(
          error?.message ||
            'Your employee agreement could not be downloaded.'
        );
      } finally {
        setIsDownloadingEmploymentDocument(
          false
        );
      }
    };

  const [saved, setSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const update = (key, value) => setProfile((current) => ({ ...current, [key]: value }));

  const handleNotificationChange = async (key, value) => {
    if (savingNotificationKey) {
      return;
    }

    setSavingNotificationKey(key);

    if (key === 'emailNotifications') {
      setEmailNotifications(value);
    }

    try {
      const result = await updateProfile({
        [key]: value,
      });

      if (!result.success) {
        if (key === 'emailNotifications') {
          setEmailNotifications(!value);
        }

        if (key === 'pushNotifications') {
          setPushNotifications(!value);
        }
      }
    } finally {
      setSavingNotificationKey('');
    }
  };

  const handlePasswordChange = async () => {
    setPasswordStatus('');

    if (newPassword !== confirmPassword) {
      setPasswordStatus('New passwords do not match.');
      return;
    }

    const result = await changePassword({ currentPassword, newPassword });

    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStatus('Password updated successfully.');
      return;
    }

    setPasswordStatus(result.error);
  };

  return (
    <div className={styles.settingsPage}>
      <PageHeader
        title="Profile & Settings"
        subtitle="Manage your account and preferences"
        showHeading={false}
        showNotification={false}
      />
      <div className={styles.settingsAvatar}><Avatar name={`${profile.firstName} ${profile.lastName}`} large /></div>
      <section className={styles.settingsSection}>
        <h3>Personal Information</h3>
        <div className={styles.settingsGrid}>
          <div className={styles.field}><label>First Name</label><input value={profile.firstName} onChange={(event) => update('firstName', event.target.value)} /></div>
          <div className={styles.field}><label>Last Name</label><input value={profile.lastName} onChange={(event) => update('lastName', event.target.value)} /></div>
          <div className={styles.field}><label>Email Address</label><input value={profile.email} readOnly title="Contact an ApplyLoop administrator to change your login email." /></div>
          <div className={styles.field}><label>Phone Number</label><input value={profile.phone} onChange={(event) => update('phone', event.target.value)} /></div>
          <div className={styles.field}><label>Country</label><input value={profile.country} onChange={(event) => update('country', event.target.value)} /></div>
          <div className={styles.field}><label>Timezone</label><input value={profile.timezone} onChange={(event) => update('timezone', event.target.value)} /></div>
        </div>
        <button
          type="button"
          className={styles.primaryButton}
          style={{ marginTop: 15 }}
          onClick={async () => {
            setSaved(false);

            const result = await updateProfile({
              name: `${profile.firstName} ${profile.lastName}`,
              phone: profile.phone,
              country: profile.country,
              timezone: profile.timezone,
            });

            if (result.success) {
              setSaved(true);
            }
          }}
        >
          <FiSave /> Save Changes
        </button>
        {saved && <span style={{ marginLeft: 12, color: '#159a66', fontSize: 9 }}>Saved.</span>}
      </section>
      <section className={styles.settingsSection}>
        <h3>Security</h3>
        <div className={styles.settingsSingle}>
          <div className={styles.field}><label>Current Password</label><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Enter current password" /></div>
          <div className={styles.field} style={{ marginTop: 11 }}><label>New Password</label><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Enter new password" /></div>
          <div className={styles.field} style={{ marginTop: 11 }}><label>Confirm New Password</label><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" /></div>
          <button type="button" className={styles.primaryButton} style={{ marginTop: 13 }} onClick={handlePasswordChange}><FiLock /> Change Password</button>
          {passwordStatus && <p style={{ marginTop: 10, fontSize: 9, color: passwordStatus === "Password updated successfully." ? "#159a66" : "#d14343" }}>{passwordStatus}</p>}
        </div>
      </section>
      <section className={styles.settingsSection}>
        <h3>Notification Preferences</h3>
        <div className={styles.settingRow}><div><strong>Email Notifications</strong><p>Important account and workflow updates will be sent to your email.</p></div><Toggle
          value={emailNotifications}
          onChange={(value) =>
            handleNotificationChange(
              'emailNotifications',
              value
            )
          }
          label="Email notifications"
          disabled={Boolean(
            savingNotificationKey
          )}
        /></div>
      </section>
      <section className={styles.settingsSection}>
        <h3>Company · ApplyLoop</h3>
        <div className={styles.accountAction}>
          <div>
            <strong
              style={{
                display: 'block',
                color: '#172033',
              }}
            >
              Line Manager
            </strong>

            <span
              style={{
                display: 'block',
                marginTop: 4,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {lineManager?.fullName ||
                'Not assigned yet'}
            </span>

            {lineManager?.email && (
              <span
                style={{
                  display: 'block',
                  marginTop: 3,
                  color: '#64748b',
                  fontSize: 10,
                }}
              >
                {lineManager.email}
              </span>
            )}
          </div>

          <span
            style={{
              color: lineManager
                ? '#1f56c6'
                : '#94a3b8',
              fontSize: 10,
              fontWeight: 700,
              textAlign: 'right',
            }}
          >
            {lineManager
              ? 'Chief Applicant'
              : 'Awaiting assignment'}
          </span>
        </div>
        <div className={styles.accountAction}>
          <div>
            <strong
              style={{
                display: 'block',
                color: '#172033',
              }}
            >
              Non-Disclosure Agreement
            </strong>

            <span
              style={{
                display: 'block',
                marginTop: 4,
                color: employmentDocument
                  ? '#334155'
                  : '#94a3b8',
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {isLoadingEmploymentDocument
                ? 'Checking agreement...'
                : employmentDocument
                  ? employmentDocument.fileName
                  : 'Not uploaded yet'}
            </span>

            {employmentDocumentError && (
              <span
                style={{
                  display: 'block',
                  marginTop: 4,
                  color: '#d14343',
                  fontSize: 9,
                }}
              >
                {employmentDocumentError}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={
              downloadEmploymentDocument
            }
            disabled={
              !employmentDocument ||
              isDownloadingEmploymentDocument ||
              isPreview
            }
            title={
              employmentDocument
                ? 'Download Agreement'
                : 'No agreement uploaded yet'
            }
            style={{
              opacity:
                employmentDocument &&
                !isPreview
                  ? 1
                  : 0.45,
              cursor:
                employmentDocument &&
                !isPreview
                  ? 'pointer'
                  : 'not-allowed',
            }}
          >
            <FiDownload />

            <span
              style={{
                marginLeft: 6,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {isDownloadingEmploymentDocument
                ? 'Preparing...'
                : employmentDocument
                  ? 'Download Agreement'
                  : 'Not available'}
            </span>
          </button>
        </div>
        <div className={styles.accountAction}><span>Sign out of this account</span><button type="button" onClick={logout}><FiLogOut /></button></div>
      </section>
    </div>
  );
}

function PreviewModal({ type, onClose }) {
  if (!type) return null;
  return (
    <div className={styles.modalBackdrop} onMouseDown={onClose}>
      <div className={styles.previewModal} onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.previewHeader}><h2>Preview</h2><button type="button" onClick={onClose}><FiX /></button></div>
        <div className={styles.previewBody}>
          <article className={styles.paper}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8 }}><span>Cover Letter</span><span>Download</span></div>
            <div className={styles.paperRule} />
            <p><strong>Your Name</strong><br />Your Title<br />City, State<br />email@example.com</p>
            <p style={{ marginTop: 22 }}>Hiring Manager<br />Apple Inc.<br />February 18, 2026</p>
            <p style={{ marginTop: 22 }}>Dear Hiring Manager,</p>
            <p>I am excited to apply for the Software Engineer position. My background in building scalable products, collaborating across teams, and creating reliable user experiences aligns strongly with the role.</p>
            <p>Throughout my experience, I have translated complex requirements into practical solutions while maintaining a clear focus on quality, usability, and measurable business outcomes.</p>
            <p>Thank you for your time and consideration. I would welcome the opportunity to discuss how my skills can contribute to your team.</p>
            <p style={{ marginTop: 30 }}>Sincerely,<br /><strong style={{ color: '#15a765' }}>Your Name</strong></p>
          </article>
          <article className={styles.paper}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3>Your Name</h3><div style={{ fontSize: 7, textAlign: 'right' }}>123 Your Street<br />City, ST 00000<br />email@example.com</div></div>
            <p>Senior software professional with experience delivering reliable, user-centered applications.</p>
            <h4>Experience</h4>
            <p><strong>Company Name — Job Title</strong><br />January 2022–Present</p>
            <ul><li>Delivered scalable application features across product and engineering teams.</li><li>Improved delivery quality through structured reviews and measurable standards.</li></ul>
            <p><strong>Company Name — Job Title</strong><br />January 2020–December 2021</p>
            <ul><li>Built responsive interfaces and collaborated with stakeholders to refine requirements.</li></ul>
            <h4>Education</h4>
            <p><strong>School Name, Location — Degree</strong><br />Graduation year</p>
            <h4>Skills</h4>
            <p>JavaScript, React, Next.js, APIs, SQL, Git, Agile, Product Collaboration</p>
          </article>
        </div>
      </div>
    </div>
  );
}

export default function ApplicantPortal() {
  const router = useRouter();
  const {
    user,
    logout,
  } = useAuth();

  const previewApplicantId =
    typeof router.query
      ?.previewApplicantId ===
    'string'
      ? router.query.previewApplicantId
      : '';

  const isApplicantPreview =
    Boolean(
      previewApplicantId &&
        [
          USER_ROLES.OWNER,
          USER_ROLES.ADMIN,
        ].includes(user?.role)
    );

  const [
    previewApplicant,
    setPreviewApplicant,
  ] = useState(null);
  const [
    isLoadingApplicantPreview,
    setIsLoadingApplicantPreview,
  ] = useState(false);
  const [
    applicantPreviewError,
    setApplicantPreviewError,
  ] = useState('');

  const parts = getParts(router);
  const section = parts[0] || 'dashboard';

  const metadata =
    ROLE_PAGE_META[
      USER_ROLES.APPLICANT
    ]?.[section] || [
      'Applicant Workspace',
      'Manage assigned Client work and Applications.',
    ];

  const applicantNavigation =
    (
      ROLE_NAVIGATION[
        USER_ROLES.APPLICANT
      ] || []
    ).map((item) => {
      const itemSection =
        item.href === '/applicant'
          ? 'dashboard'
          : String(item.href)
              .split('?')[0]
              .split('/')
              .filter(Boolean)
              .pop();

      return {
        ...item,
        section:
          itemSection ||
          'dashboard',
        href:
          isApplicantPreview
            ? `${item.href}?previewApplicantId=${encodeURIComponent(
                previewApplicantId
              )}`
            : item.href,
      };
    });

  const clientId = parts[1];
  const applicationId = parts[2] === 'applications' ? parts[3] : null;
  const [
    applications,
    setApplications,
  ] = useState([]);
  const [
    applicationSummary,
    setApplicationSummary,
  ] = useState({
    totalApplications: 0,
    persistedApplications: 0,
    historicalApplications: 0,
  });
  const [
    isLoadingApplications,
    setIsLoadingApplications,
  ] = useState(false);
  const [
    applicationsError,
    setApplicationsError,
  ] = useState('');
  const [
    assignedClients,
    setAssignedClients,
  ] = useState([]);
  const [
    applicantPerformance,
    setApplicantPerformance,
  ] = useState(
    EMPTY_APPLICANT_PERFORMANCE
  );
  const [
    clientFeedback,
    setClientFeedback,
  ] = useState([]);
  const [
    lineManager,
    setLineManager,
  ] = useState(null);
  const [
    isLoadingAssignedClients,
    setIsLoadingAssignedClients,
  ] = useState(false);
  const [
    assignedClientsError,
    setAssignedClientsError,
  ] = useState('');
  const [previewType, setPreviewType] = useState(null);
  const [toast, setToast] = useState('');
  const [
    isRecordingApplication,
    setIsRecordingApplication,
  ] = useState(false);
  const recordApplicationInFlight =
    useRef(false);

  useEffect(() => {
    if (
      !router.isReady ||
      !user?.role
    ) {
      return undefined;
    }

    if (
      user.role !==
        USER_ROLES.APPLICANT &&
      !isApplicantPreview
    ) {
      setAssignedClients([]);
      setApplicantPerformance(
        EMPTY_APPLICANT_PERFORMANCE
      );
      setClientFeedback([]);
      setLineManager(null);
      setAssignedClientsError('');
      return undefined;
    }

    let cancelled = false;

    const loadAssignedClients =
      async () => {
        setIsLoadingAssignedClients(
          true
        );
        setAssignedClientsError('');

        try {
          const accessToken =
            await getApplicantAccessToken();

          const endpoint =
            isApplicantPreview
              ? `/api/admin/applicants/${previewApplicantId}/assignments`
              : '/api/applicant/clients';

          const response =
            await fetch(
              endpoint,
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
                'Assigned Clients could not be loaded.'
            );
          }

          const clientRows =
            isApplicantPreview
              ? (
                  result.clients ||
                  []
                ).filter(
                  (client) =>
                    client.isAssigned
                )
              : result.clients ||
                [];

          const feedbackRows =
            isApplicantPreview
              ? []
              : result.feedback || [];

          if (!cancelled) {
            setClientFeedback(
              feedbackRows
            );

            setLineManager(
              result.lineManager ||
                null
            );

            setApplicantPerformance({
              dailyTarget: Number(
                result.performance
                  ?.dailyTarget || 0
              ),
              completedTasks: Number(
                result.performance
                  ?.completedTasks || 0
              ),
              clientSatisfaction: Number(
                result.performance
                  ?.clientSatisfaction || 0
              ),
              ratingCount: Number(
                result.performance
                  ?.ratingCount || 0
              ),
              completionRate: Number(
                result.performance
                  ?.completionRate || 0
              ),
              monitoredWorkdays: Number(
                result.performance
                  ?.monitoredWorkdays || 0
              ),
              todayCompleted: Number(
                result.performance
                  ?.todayCompleted || 0
              ),
              todayCompletionRate: Number(
                result.performance
                  ?.todayCompletionRate || 0
              ),
            });

            setAssignedClients(
              clientRows.map(
                normalizeAssignedClient
              )
            );
          }
        } catch (error) {
          if (!cancelled) {
            setAssignedClients([]);
            setApplicantPerformance(
              EMPTY_APPLICANT_PERFORMANCE
            );
            setClientFeedback([]);
            setLineManager(null);
            setAssignedClientsError(
              error?.message ||
                'Assigned Clients could not be loaded.'
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoadingAssignedClients(
              false
            );
          }
        }
      };

    loadAssignedClients();

    return () => {
      cancelled = true;
    };
  }, [
    isApplicantPreview,
    previewApplicantId,
    router.isReady,
    user?.role,
  ]);

  useEffect(() => {
    if (
      !router.isReady ||
      !user?.role
    ) {
      return undefined;
    }

    if (
      user.role !==
        USER_ROLES.APPLICANT &&
      !isApplicantPreview
    ) {
      setApplications([]);
      setApplicationSummary({
        totalApplications: 0,
        persistedApplications: 0,
        historicalApplications: 0,
      });
      setApplicationsError('');
      return undefined;
    }

    let cancelled = false;

    const loadApplications =
      async () => {
        setIsLoadingApplications(
          true
        );
        setApplicationsError('');

        try {
          const accessToken =
            await getApplicantAccessToken();

          const query =
            isApplicantPreview
              ? `?applicantId=${encodeURIComponent(
                  previewApplicantId
                )}`
              : '';

          const response =
            await fetch(
              `/api/applications${query}`,
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
                'Applications could not be loaded.'
            );
          }

          if (!cancelled) {
            const applicationRows =
              result.applications ||
              [];

            setApplications(
              applicationRows
            );

            setApplicationSummary(
              result.summary || {
                totalApplications:
                  applicationRows.length,
                persistedApplications:
                  applicationRows.length,
                historicalApplications:
                  0,
              }
            );
          }
        } catch (error) {
          if (!cancelled) {
            setApplications([]);
            setApplicationSummary({
              totalApplications: 0,
              persistedApplications: 0,
              historicalApplications: 0,
            });
            setApplicationsError(
              error?.message ||
                'Applications could not be loaded.'
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoadingApplications(
              false
            );
          }
        }
      };

    loadApplications();

    return () => {
      cancelled = true;
    };
  }, [
    isApplicantPreview,
    previewApplicantId,
    router.isReady,
    user?.role,
  ]);

  useEffect(() => {
    if (
      !router.isReady ||
      !user?.role
    ) {
      return;
    }

    if (
      user.role !==
        USER_ROLES.APPLICANT &&
      !isApplicantPreview
    ) {
      router.replace(
        getRoleHome(user.role)
      );
    }
  }, [
    isApplicantPreview,
    router,
    router.isReady,
    user?.role,
  ]);

  useEffect(() => {
    if (
      !router.isReady ||
      !isApplicantPreview
    ) {
      setPreviewApplicant(null);
      setApplicantPreviewError('');
      return undefined;
    }

    let cancelled = false;

    const loadApplicantPreview =
      async () => {
        setIsLoadingApplicantPreview(
          true
        );
        setApplicantPreviewError('');

        try {
          const accessToken =
            await getApplicantAccessToken();

          const response = await fetch(
            '/api/admin/applicants',
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            }
          );

          const result = await response
            .json()
            .catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              result.error ||
                'The Applicant preview could not be loaded.'
            );
          }

          const applicantRows =
            Array.isArray(result)
              ? result
              : result.applicants ||
                [];

          const selected =
            applicantRows.find(
              (applicantItem) =>
                applicantItem.id ===
                previewApplicantId
            );

          if (!selected) {
            throw new Error(
              'The Applicant could not be found.'
            );
          }

          if (!cancelled) {
            setPreviewApplicant(
              selected
            );
          }
        } catch (error) {
          if (!cancelled) {
            setApplicantPreviewError(
              error?.message ||
                'The Applicant preview could not be loaded.'
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoadingApplicantPreview(
              false
            );
          }
        }
      };

    loadApplicantPreview();

    return () => {
      cancelled = true;
    };
  }, [
    isApplicantPreview,
    previewApplicantId,
    router.isReady,
  ]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleApplications =
    applications;

  const getApplicantRoute = (
    pathname
  ) =>
    isApplicantPreview
      ? {
          pathname,
          query: {
            previewApplicantId,
          },
        }
      : pathname;

  const changeApplication =
    async (id, patch) => {
      if (isApplicantPreview) {
        setToast(
          'Applicant preview is read-only.'
        );
        return;
      }

      try {
        const accessToken =
          await getApplicantAccessToken();

        const response =
          await fetch(
            `/api/applications/${id}`,
            {
              method: 'PATCH',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
                'Content-Type':
                  'application/json',
              },
              body:
                JSON.stringify(
                  patch
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
              'The Application could not be updated.'
          );
        }

        setApplications(
          (current) =>
            current.map(
              (item) =>
                item.id === id
                  ? {
                      ...item,
                      ...patch,
                    }
                  : item
            )
        );
      } catch (error) {
        setToast(
          error?.message ||
            'The Application could not be updated.'
        );
      }
    };
  const openApplication = (application) => router.push(getApplicantRoute(`/applicant/clients/${application.clientId}/applications/${application.id}`));
  const openClient = (client) => router.push(getApplicantRoute(`/applicant/clients/${client.id}`));
  const selectedClient = assignedClients.find((client) => client.id === clientId);
  const selectedApplication = visibleApplications.find((application) => application.id === applicationId);

  const updateJobRequestStatus =
    async (
      requestId,
      status
    ) => {
      const accessToken =
        await getApplicantAccessToken();

      const response =
        await fetch(
          `/api/applicant/job-requests/${encodeURIComponent(
            requestId
          )}`,
          {
            method: 'PATCH',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              status,
            }),
          }
        );

      const result =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        let message =
          result.error ||
          'The Client job request could not be updated.';

        if (response.status === 409) {
          try {
            const refreshResponse = await fetch('/api/applicant/clients', {
              cache: 'no-store',
              headers: {
                Authorization: 'Bearer ' + accessToken,
              },
            });

            const refreshed = await refreshResponse.json();

            if (!refreshResponse.ok || !Array.isArray(refreshed.clients)) {
              throw new Error('Refresh failed.');
            }

            setAssignedClients(
              refreshed.clients.map(normalizeAssignedClient)
            );
          } catch {
            message += ' Refresh the page to see the latest job-link status.';
          }
        }

        throw new Error(message);
      }

      const updated =
        result.request;

      if (updated) {
        setAssignedClients(
          (current) =>
            current.map(
              (client) => ({
                ...client,
                jobRequests:
                  Array.isArray(
                    client.jobRequests
                  )
                    ? client.jobRequests.map(
                        (request) =>
                          request.id ===
                          updated.id
                            ? {
                                ...request,
                                ...updated,
                              }
                            : request
                      )
                    : [],
              })
            )
        );
      }

      return updated;
    };

  const recordApplication =
    async (
      client,
      companyName,
      positionName,
      jobLocation,
      jobUrl,
      jobDescription,
      jobRequestId = '',
      tailoredResumeText = ''
    ) => {
      const company =
        String(
          companyName || ''
        ).trim();

      const position =
        String(
          positionName || ''
        ).trim();

      const location =
        String(
          jobLocation || ''
        ).trim();

      const jobPostingUrl =
        String(
          jobUrl || ''
        ).trim();

      const description =
        String(
          jobDescription || ''
        ).trim();

      if (!company) {
        setToast(
          'Enter the company name.'
        );
        return;
      }

      if (!position) {
        setToast(
          'Enter the position.'
        );
        return;
      }

      if (!location) {
        setToast(
          'Enter the job location.'
        );
        return;
      }

      if (
        client.status !== 'active'
      ) {
        setToast(
          'Applications can only be recorded for active Clients.'
        );
        return;
      }

      if (
        Number(
          client.applications || 0
        ) >=
        Number(
          client.applicationLimit || 0
        )
      ) {
        setToast(
          'This Client has reached the application limit.'
        );
        return;
      }

      if (
        recordApplicationInFlight
          .current
      ) {
        return;
      }

      const preferences = [
        client.workType,
        client.employmentType,
        ...(
          Array.isArray(
            client.locations
          )
            ? client.locations
            : []
        ),
      ]
        .map(
          (value) =>
            String(
              value || ''
            ).trim()
        )
        .filter(
          (value) =>
            value &&
            value.toLowerCase() !==
              'not provided'
        );

      const uniquePreferences = [
        ...new Set(preferences),
      ];

      recordApplicationInFlight
        .current = true;

      setIsRecordingApplication(
        true
      );

      try {
        const accessToken =
          await getApplicantAccessToken();

        const response =
          await fetch(
            '/api/applications',
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                clientId:
                  client.id,
                company,
                position,
                location,
                status:
                  'Submitted',
                jobRequestId:
                  jobRequestId ||
                  undefined,
                role:
                  position,
                preferences:
                  uniquePreferences,
                jobUrl:
                  jobPostingUrl,
                jobDetails:
                  description
                    ? [description]
                    : [],
                tailoredResumeText:
                  String(
                    tailoredResumeText ||
                      ''
                  ).trim() ||
                  undefined,
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
              'The Application could not be recorded.'
          );
        }

        if (result.application) {
          setApplications(
            (current) => [
              result.application,
              ...current,
            ]
          );

          setApplicationSummary(
            (current) => ({
              totalApplications:
                Number(
                  current
                    .totalApplications ||
                    0
                ) + 1,
              persistedApplications:
                Number(
                  current
                    .persistedApplications ||
                    0
                ) + 1,
              historicalApplications:
                Number(
                  current
                    .historicalApplications ||
                    0
                ),
            })
          );

          setAssignedClients(
            (current) =>
              current.map(
                (item) => {
                  if (
                    item.id !==
                    client.id
                  ) {
                    return item;
                  }

                  const applications =
                    Number(
                      item.applications ||
                        0
                    ) + 1;

                  const applicationLimit =
                    Number(
                      item.applicationLimit ||
                        0
                    );

                  const progress =
                    applicationLimit > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (
                              applications /
                              applicationLimit
                            ) * 100
                          )
                        )
                      : 0;

                  return {
                    ...item,
                    applications,
                    progress,
                    jobRequests:
                      jobRequestId &&
                      Array.isArray(
                        item.jobRequests
                      )
                        ? item.jobRequests.map(
                            (request) =>
                              request.id ===
                              jobRequestId
                                ? {
                                    ...request,
                                    status:
                                      'converted',
                                    convertedApplicationId:
                                      result
                                        .application
                                        .id,
                                    reviewedAt:
                                      new Date()
                                        .toISOString(),
                                  }
                                : request
                          )
                        : item.jobRequests,
                  };
                }
              )
          );
        }

        setToast(
          'Application recorded in the client database.'
        );

        return true;
      } catch (error) {
        setToast(
          error?.message ||
            'The Application could not be recorded.'
        );

        return false;
      } finally {
        recordApplicationInFlight
          .current = false;

        setIsRecordingApplication(
          false
        );
      }
    };

  let page;
  if (section === 'clients' && applicationId && selectedApplication) {
    page = <ApplicationDetail application={selectedApplication} onBack={() => router.push(getApplicantRoute(`/applicant/clients/${selectedApplication.clientId}`))} />;
  } else if (section === 'clients' && selectedClient) {
    page = (
      <ClientDetail
        client={selectedClient}
        onBack={() =>
          router.push(
            getApplicantRoute(
              '/applicant/clients'
            )
          )
        }
        showInternalNotes={
          isApplicantPreview
        }
      />
    );
  } else if (section === 'clients') {
    page = <ClientsPage clients={assignedClients} onOpenClient={openClient} />;
  } else if (section === 'job-links') {
    page = (
      <JobLinksPage
        clients={assignedClients}
        workshopHref={
          getApplicantRoute(
            '/applicant/workshop'
          )
        }
        onOpenApplication={
          openApplication
        }
      />
    );
  } else if (section === 'workshop') {
    page = (
      <WorkshopPage
        clients={assignedClients}
        onRecordApplication={
          recordApplication
        }
        onUpdateJobRequest={
          updateJobRequestStatus
        }
        onPreview={setPreviewType}
        isPreview={
          isApplicantPreview
        }
        isRecordingApplication={
          isRecordingApplication
        }
      />
    );
  } else if (section === 'feedback') {
    page = (
      <FeedbackPage
        clientFeedback={
          clientFeedback
        }
        previewApplicantId={
          isApplicantPreview
            ? previewApplicantId
            : ''
        }
        isPreview={
          isApplicantPreview
        }
      />
    );
  } else if (section === 'performance') {
    page = (
      <PerformancePage
        applications={applications}
        performance={
          applicantPerformance
        }
      />
    );
  } else if (section === 'settings') {
    page = (
      <SettingsPage
        lineManager={lineManager}
        isPreview={
          isApplicantPreview
        }
      />
    );
  } else {
    page = <Dashboard
      clients={assignedClients}
      applications={visibleApplications}
      performance={
        applicantPerformance
      }
      applicationTotal={
        Number(
          applicationSummary
            .totalApplications || 0
        )
      }
      onChangeRecord={changeApplication}
      onOpenApplication={openApplication}
      readOnly={isApplicantPreview}
    />;
  }

  if (
    isLoadingAssignedClients &&
    assignedClients.length === 0
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading assigned Clients...
          </p>
        </div>
      </div>
    );
  }

  if (
    assignedClientsError &&
    !isApplicantPreview
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">
            Assigned Clients unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {assignedClientsError}
          </p>
        </div>
      </div>
    );
  }

  if (
    isLoadingApplications &&
    applications.length === 0
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading Applications...
          </p>
        </div>
      </div>
    );
  }

  if (applicationsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">
            Applications unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {applicationsError}
          </p>
        </div>
      </div>
    );
  }

  if (
    isApplicantPreview &&
    isLoadingApplicantPreview &&
    !previewApplicant
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading Applicant preview...
          </p>
        </div>
      </div>
    );
  }

  if (
    isApplicantPreview &&
    applicantPreviewError
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">
            Applicant preview unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {applicantPreviewError}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/owner/applicants-management'
              )
            }
            className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to Applicants Management
          </button>
        </div>
      </div>
    );
  }

  const applicantDisplayUser =
    isApplicantPreview &&
    previewApplicant
      ? {
          name:
            previewApplicant.fullName ||
            'Applicant',
          email:
            previewApplicant.email ||
            '',
        }
      : user;

  const exitApplicantPreview = () => {
    router.push(
      user?.role === USER_ROLES.ADMIN
        ? '/admin'
        : '/owner/applicants-management'
    );
  };

  return (
    <>
      <Head>
        <title>
          {metadata[0]} | ApplyLoop
        </title>

        <meta
          name="description"
          content={metadata[1]}
        />
      </Head>

      <WorkspaceShell
        navigation={
          applicantNavigation
        }
        activeSection={section}
        homeHref={
          isApplicantPreview
            ? `/applicant?previewApplicantId=${encodeURIComponent(
                previewApplicantId
              )}`
            : '/applicant'
        }
        title={metadata[0]}
        subtitle={metadata[1]}
        workspaceLabel="Applicant Workspace"
        roleLabel={
          isApplicantPreview
            ? 'Applicant Preview'
            : 'Applicant'
        }
        user={
          applicantDisplayUser
        }
        onLogout={
          isApplicantPreview
            ? undefined
            : logout
        }
        headerActions={
          isApplicantPreview ? (
            <button
              type="button"
              onClick={
                exitApplicantPreview
              }
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <FiArrowLeft className="h-4 w-4" />
              Back to Applicants Management
            </button>
          ) : null
        }
      >
        {page}
      </WorkspaceShell>

      <PreviewModal
        type={previewType}
        onClose={() =>
          setPreviewType(null)
        }
      />

      {toast && (
        <div
          className={
            styles.toast
          }
        >
          {toast}
        </div>
      )}
    </>
  );
}
