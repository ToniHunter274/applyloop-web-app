import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiBriefcase,
  FiExternalLink,
  FiLink,
  FiMessageSquare,
  FiTrendingUp,
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
import styles from './LinkerPortal.module.css';

const validSections = new Set([
  'dashboard',
  'clients',
  'applicants',
  'record-link',
  'job-links',
  'feedback',
  'performance',
  'settings',
]);

const emptyAssignmentData = {
  applicants: [],
  clients: [],
  applications: [],
  sourcedApplications: [],
  employment: {
    lineManager: null,
    nda: null,
  },
  summary: {
    assignedApplicants: 0,
    assignedClients: 0,
    linksFoundToday: 0,
    activeClients: 0,
    linksSourced: 0,
    applicationInProgress: 0,
    convertedApplications: 0,
    conversionRate: 0,
    interviews: 0,
    offers: 0,
    rejected: 0,
    openOpportunities: 0,
    needsAttention: 0,
    qualityRating: 0,
    ratingCount: 0,
  },
};

async function getLinkerAccessToken() {
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

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );
}

function getRequestedSection(router) {
  const value = router.query?.section;
  const segments = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];

  return segments[0] || 'dashboard';
}

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <section className={styles.emptyState}>
      <span className={styles.emptyIcon}>
        <Icon aria-hidden="true" />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}

function LoadingState() {
  return (
    <section
      className={styles.statusPanel}
      aria-live="polite"
    >
      <span className={styles.spinner} />
      <p>Loading Linker assignments...</p>
    </section>
  );
}

function ErrorState({ message }) {
  return (
    <section
      className={styles.errorPanel}
      role="alert"
    >
      <h2>Assignments could not be loaded</h2>
      <p>{message}</p>
    </section>
  );
}

function DashboardPage({
  data,
  isLoading,
  error,
}) {
  const [
    selectedClient,
    setSelectedClient,
  ] = useState('');

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const applications =
    data.applications.filter(
      (application) =>
        !selectedClient ||
        application.clientId ===
          selectedClient
    );

  const metrics = [
    [
      'Links Found Today',
      data.summary.linksFoundToday,
      'Verified today',
    ],
    [
      'Active Clients',
      data.summary.activeClients,
      'Ready for links',
    ],
    [
      'Links Sourced',
      data.summary.linksSourced,
      'All Linker submissions',
    ],
    [
      'Application in Progress',
      data.summary.applicationInProgress,
      'Applicant is working on these links',
    ],
  ];

  return (
    <div className={styles.figmaDashboard}>
      <section
        className={styles.figmaMetrics}
        aria-label="Linker activity summary"
      >
        {metrics.map(
          ([label, value, note]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </article>
          )
        )}
      </section>

      <section
        className={styles.figmaDashboardTable}
      >
        <header>
          <h2>All Assigned Clients</h2>

          <select
            value={selectedClient}
            onChange={(event) =>
              setSelectedClient(
                event.target.value
              )
            }
            aria-label="Select Client"
          >
            <option value="">
              Select Client
            </option>

            {data.clients.map(
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
        </header>

        <div className={styles.tableScroll}>
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Position</th>
                <th>Client</th>
                <th>Date</th>
                <th>Status</th>
                <th>Links</th>
                <th>Note</th>
              </tr>
            </thead>

            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className={
                      styles.figmaTableEmpty
                    }
                  >
                    No assigned Client
                    applications match this
                    view.
                  </td>
                </tr>
              ) : (
                applications.map(
                  (application) => (
                    <tr key={application.id}>
                      <td>
                        {application.company}
                      </td>
                      <td>
                        {application.position}
                      </td>
                      <td>
                        {application.clientName}
                      </td>
                      <td>
                        {formatDate(
                          application.appliedAt
                        )}
                      </td>
                      <td>
                        <span
                          className={
                            application.status ===
                            'Rejected'
                              ? styles.figmaRejected
                              : application.status ===
                                  'Offer Received'
                                ? styles.statusReady
                                : styles.figmaInfo
                          }
                        >
                          {application.status}
                        </span>
                      </td>
                      <td>
                        {application.jobLink ? (
                          <a
                            href={
                              application.jobLink
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            {
                              application.linkSource
                            }
                          </a>
                        ) : (
                          application.linkSource
                        )}
                      </td>
                      <td>
                        {application.jobLink ? (
                          <a
                            href={
                              application.jobLink
                            }
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open job link"
                          >
                            <FiExternalLink />
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ClientsPage({
  data,
  isLoading,
  error,
}) {
  const [search, setSearch] =
    useState('');
  const [filter, setFilter] =
    useState('all');
  const [
    selectedClientId,
    setSelectedClientId,
  ] = useState('');

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const selectedClient =
    data.clients.find(
      (client) =>
        client.id === selectedClientId
    );

  const applicantsById =
    new Map(
      data.applicants.map(
        (applicant) => [
          applicant.id,
          applicant,
        ]
      )
    );

  if (selectedClient) {
    const assignedApplicants =
      selectedClient.applicantIds
        .map(
          (id) =>
            applicantsById.get(id)
        )
        .filter(Boolean);

    const progress =
      selectedClient.applicationLimit > 0
        ? Math.min(
            100,
            Math.round(
              (
                selectedClient
                  .applicationsCompleted /
                selectedClient
                  .applicationLimit
              ) * 100
            )
          )
        : 0;

    return (
      <div className={styles.clientDetail}>
        <button
          type="button"
          className={styles.backLink}
          onClick={() =>
            setSelectedClientId('')
          }
        >
          ← {selectedClient.fullName}
        </button>

        <p className={styles.detailPlan}>
          {selectedClient.plan ||
            'Client plan'}
        </p>

        <section
          className={styles.clientDetailMetrics}
        >
          <article>
            <span>Total Applications</span>
            <strong>
              {
                selectedClient
                  .applicationsCompleted
              }
              /
              {
                selectedClient
                  .applicationLimit
              }
            </strong>
          </article>

          <article>
            <span>Upcoming Interviews</span>
            <strong>
              {
                selectedClient
                  .upcomingInterviews
              }
            </strong>
          </article>

          <article>
            <span>Total Rejected Jobs</span>
            <strong>
              {
                selectedClient
                  .rejectedApplications
              }
            </strong>
          </article>

          <article>
            <span>Total Accepted Jobs</span>
            <strong>
              {
                selectedClient
                  .offersReceived
              }
            </strong>
          </article>

          <article>
            <span>Resumes</span>
            <strong>—</strong>
          </article>
        </section>

        <section className={styles.readinessSection}>
          <div>
            <h2>Client Dashboard Readiness</h2>
            <span
              className={
                selectedClient.canReceiveLinks
                  ? styles.statusReady
                  : styles.statusUnavailable
              }
            >
              {selectedClient.canReceiveLinks
                ? 'Setup complete'
                : 'Setup required'}
            </span>
          </div>

          <div className={styles.readinessGrid}>
            <article>
              <strong>Email</strong>
              <span>
                {selectedClient.email
                  ? 'Available'
                  : 'Missing'}
              </span>
            </article>

            <article>
              <strong>Tracker</strong>
              <span>
                {selectedClient.linksSourced}
                {' links sourced'}
              </span>
            </article>

            <article
              className={
                selectedClient.canReceiveLinks
                  ? ''
                  : styles.readinessWarning
              }
            >
              <strong>
                Request Available
              </strong>
              <span>
                {selectedClient.canReceiveLinks
                  ? 'Ready to receive links'
                  : 'Client or Applicant unavailable'}
              </span>
            </article>
          </div>
        </section>

        <section className={styles.clientInformation}>
          <h2>Personal Information</h2>

          <dl>
            <div>
              <dt>Full Name</dt>
              <dd>
                {selectedClient.fullName}
              </dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd>
                {selectedClient.plan ||
                  'Not provided'}
              </dd>
            </div>
            <div>
              <dt>Email Address</dt>
              <dd>
                {selectedClient.email ||
                  'Not provided'}
              </dd>
            </div>
            <div>
              <dt>Country</dt>
              <dd>
                {selectedClient.country ||
                  'Not provided'}
              </dd>
            </div>
            <div>
              <dt>State/Province</dt>
              <dd>
                {selectedClient.state ||
                  'Not provided'}
              </dd>
            </div>
            <div>
              <dt>Application Progress</dt>
              <dd>{progress}%</dd>
            </div>
          </dl>
        </section>

        <section className={styles.clientInformation}>
          <h2>Work Availability</h2>

          <dl>
            <div>
              <dt>Client Status</dt>
              <dd>
                {selectedClient.status}
              </dd>
            </div>
            <div>
              <dt>Assigned Applicants</dt>
              <dd>
                {assignedApplicants
                  .map(
                    (applicant) =>
                      applicant.fullName
                  )
                  .join(', ') ||
                  'Not assigned'}
              </dd>
            </div>
            <div>
              <dt>Last Activity</dt>
              <dd>
                {formatDate(
                  selectedClient.lastActivity
                )}
              </dd>
            </div>
            <div>
              <dt>Links Sourced</dt>
              <dd>
                {selectedClient.linksSourced}
              </dd>
            </div>
          </dl>
        </section>

        <section className={styles.adminNotes}>
          <h2>Notes from Admin</h2>
          <p>
            Private administrative notes are not
            exposed in the Linker workspace.
          </p>
        </section>
      </div>
    );
  }

  const term =
    search.trim().toLowerCase();

  const filteredClients =
    data.clients.filter((client) => {
      const matchesSearch =
        !term ||
        [
          client.fullName,
          client.email,
          client.plan,
          client.country,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(term)
        );

      const isActive =
        client.status === 'active' &&
        client.accountStatus === 'active';

      const matchesFilter =
        filter === 'all' ||
        (
          filter === 'active' &&
          isActive
        ) ||
        (
          filter === 'inactive' &&
          !isActive
        );

      return (
        matchesSearch &&
        matchesFilter
      );
    });

  const totals = {
    clients: data.clients.length,
    links: data.clients.reduce(
      (sum, client) =>
        sum + client.linksSourced,
      0
    ),
    completed: data.clients.reduce(
      (sum, client) =>
        sum + client.completedLinks,
      0
    ),
    interviews: data.clients.reduce(
      (sum, client) =>
        sum +
        client.upcomingInterviews,
      0
    ),
  };

  const activeCount =
    data.clients.filter(
      (client) =>
        client.status === 'active' &&
        client.accountStatus === 'active'
    ).length;

  if (data.clients.length === 0) {
    return (
      <EmptyState
        icon={FiBriefcase}
        title="No assigned clients"
        description="Clients belonging to your assigned Applicants will appear here."
      />
    );
  }

  return (
    <div className={styles.figmaClients}>
      <section className={styles.clientMetrics}>
        <article>
          <span>Total Clients</span>
          <strong>{totals.clients}</strong>
        </article>
        <article>
          <span>Total Links</span>
          <strong>{totals.links}</strong>
        </article>
        <article>
          <span>Completed Links</span>
          <strong>{totals.completed}</strong>
        </article>
        <article>
          <span>Total Interviews</span>
          <strong>{totals.interviews}</strong>
        </article>
      </section>

      <label className={styles.clientSearch}>
        <span className="sr-only">
          Search Clients
        </span>
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search Clients"
        />
      </label>

      <div className={styles.clientTabs}>
        {[
          [
            'all',
            'All Clients',
            data.clients.length,
          ],
          [
            'active',
            'Active Clients',
            activeCount,
          ],
          [
            'inactive',
            'Inactive Clients',
            data.clients.length -
              activeCount,
          ],
        ].map(
          ([value, label, count]) => (
            <button
              key={value}
              type="button"
              className={
                filter === value
                  ? styles.clientTabActive
                  : styles.clientTab
              }
              onClick={() =>
                setFilter(value)
              }
            >
              {label} ({count})
            </button>
          )
        )}
      </div>

      {filteredClients.length === 0 ? (
        <div className={styles.clientEmpty}>
          No Clients match this view.
        </div>
      ) : (
        <section className={styles.clientCardGrid}>
          {filteredClients.map(
            (client) => {
              const progress =
                client.applicationLimit > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (
                          client
                            .applicationsCompleted /
                          client
                            .applicationLimit
                        ) * 100
                      )
                    )
                  : 0;

              const applicantNames =
                client.applicantIds
                  .map(
                    (id) =>
                      applicantsById.get(id)
                        ?.fullName
                  )
                  .filter(Boolean)
                  .join(', ') ||
                'Not assigned';

              return (
                <article
                  key={client.id}
                  className={styles.clientCard}
                >
                  <header>
                    <div>
                      <h2>
                        {client.fullName}
                      </h2>
                      <p>
                        {client.plan ||
                          'Client plan'}
                      </p>
                    </div>
                    <span
                      className={
                        client.canReceiveLinks
                          ? styles.statusReady
                          : styles.statusUnavailable
                      }
                    >
                      {client.canReceiveLinks
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </header>

                  <div
                    className={
                      styles.progressLabel
                    }
                  >
                    <span>Links Progress</span>
                    <strong>
                      {
                        client
                          .applicationsCompleted
                      }
                      /
                      {
                        client
                          .applicationLimit
                      }
                    </strong>
                  </div>

                  <div
                    className={
                      styles.clientProgress
                    }
                  >
                    <span
                      style={{
                        width:
                          progress + '%',
                      }}
                    />
                  </div>

                  <dl>
                    <div>
                      <dt>Total Links</dt>
                      <dd>
                        {client.linksSourced}
                      </dd>
                    </div>
                    <div>
                      <dt>Upcoming Interviews</dt>
                      <dd>
                        {
                          client
                            .upcomingInterviews
                        }
                      </dd>
                    </div>
                    <div>
                      <dt>Target Countries</dt>
                      <dd>
                        {client.country ||
                          'Not provided'}
                      </dd>
                    </div>
                  </dl>

                  <footer>
                    <span>
                      Applicant: {applicantNames}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedClientId(
                          client.id
                        )
                      }
                    >
                      View Details →
                    </button>
                  </footer>
                </article>
              );
            }
          )}
        </section>
      )}
    </div>
  );
}

function ApplicantsPage({
  data,
  isLoading,
  error,
}) {
  const [search, setSearch] =
    useState('');
  const [filter, setFilter] =
    useState('all');
  const [revealedRatings, setRevealedRatings] =
    useState(() => new Set());

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const applicants =
    data.applicants || [];

  const clients =
    data.clients || [];

  const normalizedSearch =
    search.trim().toLowerCase();

  const applicantMetrics =
    applicants.map((applicant) => {
      const assignedClients =
        clients.filter((client) =>
          client.applicantIds.includes(
            applicant.id
          )
        );

      return {
        ...applicant,
        assignedClients,
        activeClients:
          assignedClients.filter(
            (client) =>
              client.status === 'active'
          ).length,
        totalLinks:
          assignedClients.reduce(
            (total, client) =>
              total +
              Number(
                client.linksSourced || 0
              ),
            0
          ),
      };
    });

  const filteredApplicants =
    applicantMetrics.filter(
      (applicant) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            applicant.fullName,
            applicant.email,
            applicant.team,
          ].some((value) =>
            String(value || '')
              .toLowerCase()
              .includes(
                normalizedSearch
              )
          );

        const matchesFilter =
          filter === 'all' ||
          (
            filter === 'available' &&
            applicant.canReceiveLinks
          ) ||
          (
            filter === 'unavailable' &&
            !applicant.canReceiveLinks
          );

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );

  const availableApplicants =
    applicantMetrics.filter(
      (applicant) =>
        applicant.canReceiveLinks
    ).length;

  const activeClientIds =
    new Set(
      clients
        .filter(
          (client) =>
            client.status === 'active'
        )
        .map(
          (client) => client.id
        )
    );

  const totalLinks =
    clients.reduce(
      (total, client) =>
        total +
        Number(
          client.linksSourced || 0
        ),
      0
    );

  const averageCompletion =
    applicants.length
      ? Math.round(
          applicants.reduce(
            (total, applicant) =>
              total +
              Number(
                applicant.completionRate ||
                  0
              ),
            0
          ) /
            applicants.length
        )
      : 0;

  return (
    <div
      className={
        styles.figmaApplicants
      }
    >
      <section
        className={
          styles.applicantMetrics
        }
      >
        <article>
          <span>Assigned Applicants</span>
          <strong>
            {applicants.length}
          </strong>
        </article>

        <article>
          <span>Available</span>
          <strong>
            {availableApplicants}
          </strong>
        </article>

        <article>
          <span>Active Clients</span>
          <strong>
            {activeClientIds.size}
          </strong>
        </article>

        <article>
          <span>Links Sourced</span>
          <strong>{totalLinks}</strong>
        </article>
      </section>

      <label
        className={
          styles.applicantSearch
        }
      >
        <FiUsers aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search Applicants"
          aria-label="Search Applicants"
        />
      </label>

      <div
        className={
          styles.applicantTabs
        }
      >
        {[
          ['all', 'All Applicants'],
          ['available', 'Available'],
          [
            'unavailable',
            'Unavailable',
          ],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={
              filter === value
                ? styles.applicantTabActive
                : styles.applicantTab
            }
            onClick={() =>
              setFilter(value)
            }
          >
            {label}
          </button>
        ))}
      </div>

      <section
        className={
          styles.applicantTable
        }
      >
        <div
          className={styles.tableScroll}
        >
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Status</th>
                <th>Active Clients</th>
                <th>Total Links</th>
                <th>Client Satisfaction</th>
                <th>Completion Rate</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredApplicants.map(
                (applicant) => {
                  const completion =
                    Math.max(
                      0,
                      Math.min(
                        100,
                        Number(
                          applicant
                            .completionRate ||
                            0
                        )
                      )
                    );

                  return (
                    <tr
                      key={applicant.id}
                    >
                      <td>
                        <strong>
                          {
                            applicant.fullName
                          }
                        </strong>
                        <small>
                          {applicant.email ||
                            'No email available'}
                        </small>
                      </td>

                      <td>
                        <span
                          className={
                            applicant
                              .canReceiveLinks
                              ? styles
                                  .applicantAvailable
                              : styles
                                  .applicantUnavailable
                          }
                        >
                          {applicant
                            .canReceiveLinks
                            ? 'Available'
                            : 'Unavailable'}
                        </span>
                      </td>

                      <td>
                        {
                          applicant.activeClients
                        }
                      </td>

                      <td>
                        {applicant.totalLinks}
                      </td>

                      <td>
                        <button
                          type="button"
                          aria-label={`${revealedRatings.has(applicant.id) ? 'Hide' : 'Show'} Client satisfaction for ${applicant.fullName}`}
                          onClick={() =>
                            setRevealedRatings((current) => {
                              const next = new Set(current);
                              if (next.has(applicant.id)) next.delete(applicant.id);
                              else next.add(applicant.id);
                              return next;
                            })
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          {revealedRatings.has(applicant.id)
                            ? Number(applicant.ratingCount || 0) > 0
                              ? `${Number(applicant.clientSatisfaction || 0).toFixed(1)}/5 · ${Number(applicant.ratingCount)} rating${Number(applicant.ratingCount) === 1 ? '' : 's'} · Hide`
                              : 'No ratings yet · Hide'
                            : 'Show rating'}
                        </button>
                      </td>

                      <td>
                        <div
                          className={
                            styles
                              .completionValue
                          }
                        >
                          <span>
                            {completion}%
                          </span>
                          <div>
                            <span
                              style={{
                                width:
                                  completion +
                                  '%',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <Link
                          href="/linker/record-link"
                          className={
                            styles
                              .applicantAction
                          }
                        >
                          + Send Job Link
                        </Link>
                      </td>
                    </tr>
                  );
                }
              )}

              {filteredApplicants.length ===
                0 && (
                <tr>
                  <td
                    colSpan="7"
                    className={
                      styles
                        .applicantTableEmpty
                    }
                  >
                    No Applicants match
                    this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p
        className={
          styles.applicantSummary
        }
      >
        Average completion rate:{' '}
        <strong>
          {averageCompletion}%
        </strong>
      </p>
    </div>
  );
}

function RecordLinkPage({
  isLoading,
  error,
}) {
  const [
    allocations,
    setAllocations,
  ] = useState([]);

  const [
    allocationsLoading,
    setAllocationsLoading,
  ] = useState(true);

  const [
    allocationsError,
    setAllocationsError,
  ] = useState('');

  const [
    allocationId,
    setAllocationId,
  ] = useState('');

  const [applicantId, setApplicantId] =
    useState('');

  const [company, setCompany] =
    useState('');

  const [position, setPosition] =
    useState('');

  const [location, setLocation] =
    useState('');

  const [jobType, setJobType] =
    useState('');

  const [salaryRange, setSalaryRange] =
    useState('');

  const [jobLink, setJobLink] =
    useState('');

  const [linkProvider, setLinkProvider] =
    useState('');

  const [comment, setComment] =
    useState('');

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    requestError,
    setRequestError,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  useEffect(() => {
    let active = true;

    const loadAllocations =
      async () => {
        setAllocationsLoading(true);
        setAllocationsError('');

        try {
          const accessToken =
            await getLinkerAccessToken();

          const response =
            await fetch(
              '/api/linker/work-allocations',
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
            !Array.isArray(
              result.allocations
            )
          ) {
            throw new Error(
              result.error ||
                'Your Work Allocations could not be loaded.'
            );
          }

          if (active) {
            setAllocations(
              result.allocations
            );
          }
        } catch (loadError) {
          if (active) {
            setAllocationsError(
              loadError?.message ||
                'Your Work Allocations could not be loaded.'
            );
          }
        } finally {
          if (active) {
            setAllocationsLoading(
              false
            );
          }
        }
      };

    loadAllocations();

    return () => {
      active = false;
    };
  }, []);

  if (
    isLoading ||
    allocationsLoading
  ) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
      />
    );
  }

  if (allocationsError) {
    return (
      <ErrorState
        message={allocationsError}
      />
    );
  }

  const selectedAllocation =
    allocations.find(
      (allocation) =>
        allocation.id ===
        allocationId
    ) || null;

  const clientId =
    selectedAllocation
      ?.clientId || '';

  const eligibleApplicants =
    selectedAllocation
      ?.applicants
      ?.filter(
        (applicant) =>
          applicant.canReceiveLinks
      ) || [];

  const clearForm = () => {
    setAllocationId('');
    setApplicantId('');
    setCompany('');
    setPosition('');
    setLocation('');
    setJobType('');
    setSalaryRange('');
    setJobLink('');
    setLinkProvider('');
    setComment('');
    setRequestError('');
    setSuccessMessage('');
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setRequestError('');
      setSuccessMessage('');

      if (
        !allocationId ||
        !applicantId ||
        !clientId ||
        !company.trim() ||
        !position.trim() ||
        !location.trim() ||
        !jobType ||
        !jobLink.trim()
      ) {
        setRequestError(
          'Complete every required field before sending the job link.'
        );
        return;
      }

      setIsSubmitting(true);

      try {
        const accessToken =
          await getLinkerAccessToken();

        const response =
          await fetch(
            '/api/linker/job-requests',
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                allocationId,
                applicantId,
                clientId,
                company,
                position,
                location,
                jobType,
                salaryRange,
                jobLink,
                linkProvider,
                comment,
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
              'The job link could not be sent.'
          );
        }

        if (!result.request?.id) {
          throw new Error(
            'The sent job link could not be verified.'
          );
        }

        const recipientApplicant =
          eligibleApplicants.find(
            (applicant) =>
              applicant.id ===
              applicantId
          );

        setAllocations(
          (current) =>
            current.map(
              (allocation) => {
                if (
                  allocation.id !==
                  allocationId
                ) {
                  return allocation;
                }

                const submitted =
                  Number(
                    allocation
                      .linksSubmitted ||
                      0
                  ) + 1;

                return {
                  ...allocation,
                  linksSubmitted:
                    submitted,
                  linksRemaining:
                    Math.max(
                      Number(
                        allocation
                          .targetLinks ||
                          0
                      ) -
                        submitted,
                      0
                    ),
                  progressPercent:
                    allocation.targetLinks >
                    0
                      ? Math.min(
                          100,
                          Math.round(
                            (
                              submitted /
                              allocation
                                .targetLinks
                            ) *
                              100
                          )
                        )
                      : 0,
                };
              }
            )
        );

        setCompany('');
        setPosition('');
        setLocation('');
        setJobType('');
        setSalaryRange('');
        setJobLink('');
        setLinkProvider('');
        setComment('');

        setSuccessMessage(
          `Job link sent to ${
            recipientApplicant
              ?.fullName ||
            'the selected Applicant'
          } for ${
            selectedAllocation
              ?.clientName ||
            'the selected Client'
          }.`
        );
      } catch (submitError) {
        setRequestError(
          submitError?.message ||
            'The job link could not be recorded.'
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  if (allocations.length === 0) {
    return (
      <EmptyState
        icon={FiExternalLink}
        title="No active Work Allocations"
        description="Admin needs to create an active Client workload for you before job links can be sent."
      />
    );
  }

  return (
    <div
      className={styles.figmaRecordPage}
    >
      <header
        className={styles.recordPageHeader}
      >
        <span aria-hidden="true">
          ←
        </span>

        <div>
          <h2>Send Job Link</h2>

          <p>
            Choose one of your active
            Work Allocations, then send
            the opportunity to an
            eligible Applicant.
          </p>
        </div>
      </header>

      <form
        className={
          styles.figmaRecordForm
        }
        onSubmit={handleSubmit}
      >
        <fieldset>
          <legend>
            Work Allocation
          </legend>

          <div
            className={
              styles.recordFieldGrid
            }
          >
            <label
              className={
                styles.recordFullField
              }
            >
              <span>
                Allocation<sup>*</sup>
              </span>

              <select
                value={allocationId}
                onChange={(event) => {
                  setAllocationId(
                    event.target.value
                  );

                  setApplicantId('');
                  setRequestError('');
                  setSuccessMessage('');
                }}
                disabled={isSubmitting}
                required
              >
                <option value="">
                  Select Work Allocation
                </option>

                {allocations.map(
                  (allocation) => (
                    <option
                      key={allocation.id}
                      value={allocation.id}
                    >
                      {allocation.clientName}
                      {' — '}
                      {
                        allocation.linksRemaining
                      }
                      {' of '}
                      {
                        allocation.targetLinks
                      }
                      {' links remaining'}
                    </option>
                  )
                )}
              </select>
            </label>

            {selectedAllocation && (
              <>
                <label>
                  <span>Client</span>

                  <input
                    value={
                      selectedAllocation
                        .clientName
                    }
                    disabled
                    readOnly
                  />
                </label>

                <label>
                  <span>
                    Applicant<sup>*</sup>
                  </span>

                  <select
                    value={applicantId}
                    onChange={(event) => {
                      setApplicantId(
                        event.target.value
                      );

                      setRequestError('');
                      setSuccessMessage('');
                    }}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">
                      Select Applicant
                    </option>

                    {eligibleApplicants.map(
                      (applicant) => (
                        <option
                          key={
                            applicant.id
                          }
                          value={
                            applicant.id
                          }
                        >
                          {
                            applicant.fullName
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>
              </>
            )}
          </div>

          {selectedAllocation && (
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <article className="rounded-xl bg-slate-50 p-3">
                <span className="text-xs text-slate-500">
                  Target
                </span>
                <strong className="mt-1 block">
                  {
                    selectedAllocation
                      .targetLinks
                  }
                </strong>
              </article>

              <article className="rounded-xl bg-slate-50 p-3">
                <span className="text-xs text-slate-500">
                  Submitted
                </span>
                <strong className="mt-1 block">
                  {
                    selectedAllocation
                      .linksSubmitted
                  }
                </strong>
              </article>

              <article className="rounded-xl bg-slate-50 p-3">
                <span className="text-xs text-slate-500">
                  Remaining
                </span>
                <strong className="mt-1 block">
                  {
                    selectedAllocation
                      .linksRemaining
                  }
                </strong>
              </article>

              <article className="rounded-xl bg-slate-50 p-3">
                <span className="text-xs text-slate-500">
                  Priority
                </span>
                <strong className="mt-1 block capitalize">
                  {
                    selectedAllocation
                      .priority
                  }
                </strong>
              </article>
            </div>
          )}

          {selectedAllocation
            ?.instructions && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                Sourcing Instructions
              </p>

              <p className="mt-2 text-sm leading-6 text-blue-950">
                {
                  selectedAllocation
                    .instructions
                }
              </p>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend>Job Details</legend>

          <div
            className={
              styles.recordFieldGrid
            }
          >
            <label>
              <span>
                Company Name<sup>*</sup>
              </span>

              <input
                value={company}
                onChange={(event) =>
                  setCompany(
                    event.target.value
                  )
                }
                placeholder="e.g. Stripe"
                maxLength={200}
                disabled={isSubmitting}
                required
              />
            </label>

            <label>
              <span>
                Job Position<sup>*</sup>
              </span>

              <input
                value={position}
                onChange={(event) =>
                  setPosition(
                    event.target.value
                  )
                }
                placeholder="e.g. Frontend Engineer"
                maxLength={200}
                disabled={isSubmitting}
                required
              />
            </label>

            <label>
              <span>
                Location<sup>*</sup>
              </span>

              <input
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value
                  )
                }
                placeholder="e.g. London, UK or Remote"
                maxLength={200}
                disabled={isSubmitting}
                required
              />
            </label>

            <label>
              <span>
                Job Type<sup>*</sup>
              </span>

              <select
                value={jobType}
                onChange={(event) =>
                  setJobType(
                    event.target.value
                  )
                }
                disabled={isSubmitting}
                required
              >
                <option value="">
                  Select Job Type
                </option>
                <option value="Full-time">
                  Full-time
                </option>
                <option value="Part-time">
                  Part-time
                </option>
                <option value="Contract">
                  Contract
                </option>
                <option value="Internship">
                  Internship
                </option>
                <option value="Temporary">
                  Temporary
                </option>
              </select>
            </label>

            <label>
              <span>
                Salary Range
              </span>

              <input
                value={salaryRange}
                onChange={(event) =>
                  setSalaryRange(
                    event.target.value
                  )
                }
                placeholder="e.g. $130k–$200k"
                maxLength={200}
                disabled={isSubmitting}
              />
            </label>

            <label>
              <span>
                Job Posting URL
                <sup>*</sup>
              </span>

              <input
                type="url"
                value={jobLink}
                onChange={(event) =>
                  setJobLink(
                    event.target.value
                  )
                }
                placeholder="https://..."
                maxLength={2000}
                disabled={isSubmitting}
                required
              />
            </label>

            <label>
              <span>
                Link Provided By
              </span>

              <select
                value={linkProvider}
                onChange={(event) =>
                  setLinkProvider(
                    event.target.value
                  )
                }
                disabled={isSubmitting}
              >
                <option value="">
                  Select provider
                </option>
                <option value="Company website">
                  Company website
                </option>
                <option value="LinkedIn">
                  LinkedIn
                </option>
                <option value="Indeed">
                  Indeed
                </option>
                <option value="Glassdoor">
                  Glassdoor
                </option>
                <option value="Other">
                  Other
                </option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            Notes &amp; Tags
          </legend>

          <label
            className={
              styles.recordFullField
            }
          >
            <span>
              Additional Notes
            </span>

            <textarea
              value={comment}
              onChange={(event) =>
                setComment(
                  event.target.value
                )
              }
              placeholder="Add any useful details about this opportunity."
              maxLength={2000}
              rows={5}
              disabled={isSubmitting}
            />
          </label>
        </fieldset>

        {requestError && (
          <p
            className={
              styles.formError
            }
            role="alert"
          >
            {requestError}
          </p>
        )}

        {successMessage && (
          <p
            className={
              styles.formSuccess
            }
            role="status"
          >
            {successMessage}
          </p>
        )}

        <footer
          className={
            styles.recordActions
          }
        >
          <button
            type="button"
            className={
              styles.clearRecordButton
            }
            onClick={clearForm}
            disabled={isSubmitting}
          >
            × &nbsp; Clear Form
          </button>

          <button
            type="submit"
            className={
              styles.saveRecordButton
            }
            disabled={
              isSubmitting ||
              !allocationId ||
              !applicantId ||
              !clientId ||
              !company.trim() ||
              !position.trim() ||
              !location.trim() ||
              !jobType ||
              !jobLink.trim()
            }
          >
            {isSubmitting
              ? 'Sending...'
              : '▣  Send to Applicant'}
          </button>
        </footer>
      </form>
    </div>
  );
}

function JobLinksPage({ data }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    let active = true;

    const loadRequests = async () => {
      setIsLoading(true);
      setError('');

      try {
        const accessToken = await getLinkerAccessToken();
        const response = await fetch('/api/linker/job-requests', {
          cache: 'no-store',
          headers: {
            Authorization: 'Bearer ' + accessToken,
          },
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !Array.isArray(result.requests)) {
          throw new Error(
            result.error || 'Your job links could not be loaded.'
          );
        }

        if (active) setRequests(result.requests);
      } catch (loadError) {
        if (active) {
          setError(
            loadError.message || 'Your job links could not be loaded.'
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

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const applicantNames = new Map(
    data.applicants.map((applicant) => [applicant.id, applicant.fullName])
  );
  const clientNames = new Map(
    data.clients.map((client) => [client.id, client.fullName])
  );

  const applicationsByJobRequestId =
    new Map(
      data.applications
        .filter(
          (application) =>
            application.jobRequestId
        )
        .map(
          (application) => [
            application.jobRequestId,
            application,
          ]
        )
    );

  const getRequestDisplayStatus =
    (request) => {
      if (request.status === 'new') {
        return 'Sent';
      }

      if (
        request.status ===
        'in_review'
      ) {
        return 'Application in Progress';
      }

      if (
        request.status ===
        'converted'
      ) {
        return (
          applicationsByJobRequestId.get(
            request.id
          )?.status ||
          'Application Recorded'
        );
      }

      if (
        request.status ===
        'dismissed'
      ) {
        return 'Closed';
      }

      if (
        request.status ===
        'withdrawn'
      ) {
        return 'Withdrawn';
      }

      return String(
        request.status ||
          'Sent'
      ).replace(
        /_/g,
        ' '
      );
    };

  const term = search.trim().toLowerCase();
  const visibleRequests = requests.filter((request) => {
    const matchesStatus =
      status === 'all' ||
      (status === 'active'
        ? ['new', 'in_review'].includes(request.status)
        : status === 'completed'
          ? ['converted', 'dismissed'].includes(request.status)
          : request.status === status);
    const matchesSearch =
      !term ||
      [
        request.company,
        request.position,
        request.location,
        request.jobLink,
        applicantNames.get(request.applicantId),
        clientNames.get(request.clientId),
      ].some((value) =>
        String(value || '').toLowerCase().includes(term)
      );

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="block w-full max-w-xl">
          <span className="sr-only">Search sent job links</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, role, client, applicant, or URL"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Job-link status">
          {[
            ['active', 'In Progress'],
            ['withdrawn', 'Withdrawn'],
            ['completed', 'Completed'],
            ['all', 'All'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={status === value}
              onClick={() => setStatus(value)}
              className={
                status === value
                  ? 'rounded-full bg-blue-700 px-3 py-2 text-xs font-semibold text-white'
                  : 'rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200'
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-900">Sent Job Links</h2>
            <p className="mt-1 text-sm text-slate-500">
              Track each opportunity from delivery to Applicant action and completed application.
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {visibleRequests.length}
          </span>
        </div>

        {visibleRequests.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {visibleRequests.map((request) => (
              <article
                key={request.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-slate-900">
                      {request.position || 'Position not provided'}
                    </h3>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {request.company || 'Company not provided'}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600">
                    {getRequestDisplayStatus(
                      request
                    )}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div><dt className="text-slate-400">Client</dt><dd className="mt-1 font-semibold text-slate-700">{clientNames.get(request.clientId) || 'Assigned Client'}</dd></div>
                  <div><dt className="text-slate-400">Applicant</dt><dd className="mt-1 font-semibold text-slate-700">{applicantNames.get(request.applicantId) || 'Assigned Applicant'}</dd></div>
                  <div><dt className="text-slate-400">Location</dt><dd className="mt-1 font-semibold text-slate-700">{request.location || 'Not provided'}</dd></div>
                  <div><dt className="text-slate-400">Recorded</dt><dd className="mt-1 font-semibold text-slate-700">{formatDate(request.createdAt)}</dd></div>
                </dl>
                <a
                  href={request.jobLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
                >
                  Open job link <FiExternalLink />
                </a>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No sent job links match this view.
          </p>
        )}
      </section>
    </div>
  );
}

function FeedbackPage() {
  const [conversations, setConversations] =
    useState([]);
  const [selectedId, setSelectedId] =
    useState('');
  const [activeTab, setActiveTab] =
    useState('applicant');
  const [response, setResponse] =
    useState('');
  const [isLoading, setIsLoading] =
    useState(true);
  const [isSending, setIsSending] =
    useState(false);
  const [error, setError] =
    useState('');
  const [success, setSuccess] =
    useState('');

  useEffect(() => {
    let active = true;

    const loadFeedback = async () => {
      setIsLoading(true);
      setError('');

      try {
        const accessToken =
          await getLinkerAccessToken();

        const request = await fetch(
          '/api/linker/feedback',
          {
            headers: {
              Authorization:
                'Bearer ' + accessToken,
            },
            cache: 'no-store',
          }
        );

        const result =
          await request
            .json()
            .catch(() => ({}));

        if (!request.ok) {
          throw new Error(
            result.error ||
              'Feedback could not be loaded.'
          );
        }

        if (
          !Array.isArray(
            result.conversations
          )
        ) {
          throw new Error(
            'The feedback response could not be verified.'
          );
        }

        if (active) {
          setConversations(
            result.conversations
          );

          setSelectedId((current) =>
            result.conversations.some(
              (conversation) =>
                conversation.id ===
                current
            )
              ? current
              : result.conversations[0]
                  ?.id || ''
          );
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError.message ||
              'Feedback could not be loaded.'
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadFeedback();

    return () => {
      active = false;
    };
  }, []);

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation.id === selectedId
    ) || null;

  const formatMessageDate = (value) => {
    if (!value) {
      return 'Date unavailable';
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return 'Date unavailable';
    }

    return date.toLocaleString(
      undefined,
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    );
  };

  const handleReply = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (
      !selectedConversation ||
      !response.trim()
    ) {
      setError(
        'Enter a response before sending.'
      );
      return;
    }

    setIsSending(true);

    try {
      const accessToken =
        await getLinkerAccessToken();

      const request = await fetch(
        '/api/linker/feedback',
        {
          method: 'POST',
          headers: {
            Authorization:
              'Bearer ' + accessToken,
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            applicationId:
              selectedConversation
                .applicationId,
            message: response,
          }),
        }
      );

      const result =
        await request
          .json()
          .catch(() => ({}));

      if (!request.ok) {
        throw new Error(
          result.error ||
            'Your response could not be sent.'
        );
      }

      if (!result.message?.id) {
        throw new Error(
          'The sent response could not be verified.'
        );
      }

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id ===
          selectedConversation.id
            ? {
                ...conversation,
                status: 'resolved',
                latestMessage:
                  result.message.message,
                latestAt:
                  result.message.createdAt,
                messages: [
                  ...conversation.messages,
                  result.message,
                ],
              }
            : conversation
        )
      );

      setResponse('');
      setSuccess(
        'Your response was sent successfully.'
      );
    } catch (sendError) {
      setError(
        sendError.message ||
          'Your response could not be sent.'
      );
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (
    error &&
    conversations.length === 0
  ) {
    return <ErrorState message={error} />;
  }

  return (
    <div
      className={
        styles.figmaFeedback
      }
    >
      <div
        className={
          styles.feedbackTabs
        }
      >
        <button
          type="button"
          className={
            activeTab === 'applicant'
              ? styles.feedbackTabActive
              : styles.feedbackTab
          }
          onClick={() => {
            setActiveTab('applicant');
            setError('');
            setSuccess('');
          }}
        >
          Applicants Feedback
          ({conversations.length})
        </button>

        <button
          type="button"
          className={
            activeTab === 'admin'
              ? styles.feedbackTabActive
              : styles.feedbackTab
          }
          onClick={() => {
            setActiveTab('admin');
            setError('');
            setSuccess('');
          }}
        >
          Admin Feedback
        </button>
      </div>

      {activeTab === 'admin' ? (
        <section
          className={
            styles.feedbackEmpty
          }
        >
          <FiMessageSquare
            aria-hidden="true"
          />
          <h2>No Admin feedback</h2>
          <p>
            Private administrative notes are
            not exposed in the Linker
            workspace.
          </p>
        </section>
      ) : conversations.length === 0 ? (
        <section
          className={
            styles.feedbackEmpty
          }
        >
          <FiMessageSquare
            aria-hidden="true"
          />
          <h2>No Applicant feedback</h2>
          <p>
            Client feedback for applications
            managed through your assigned
            Applicants will appear here.
          </p>
        </section>
      ) : (
        <div
          className={
            styles.feedbackWorkspace
          }
        >
          <section
            className={
              styles.feedbackList
            }
          >
            {conversations.map(
              (conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  className={
                    conversation.id ===
                    selectedId
                      ? styles
                          .feedbackCardActive
                      : styles.feedbackCard
                  }
                  onClick={() => {
                    setSelectedId(
                      conversation.id
                    );
                    setResponse('');
                    setError('');
                    setSuccess('');
                  }}
                >
                  <header>
                    <div>
                      <strong>
                        {
                          conversation
                            .clientName
                        }
                      </strong>
                      <span>
                        {
                          conversation
                            .position
                        }
                      </span>
                    </div>

                    <small
                      className={
                        conversation.status ===
                        'resolved'
                          ? styles
                              .feedbackResolved
                          : styles
                              .feedbackPending
                      }
                    >
                      {conversation.status}
                    </small>
                  </header>

                  <p>
                    {
                      conversation
                        .latestMessage
                    }
                  </p>

                  <time>
                    {formatMessageDate(
                      conversation.latestAt
                    )}
                  </time>
                </button>
              )
            )}
          </section>

          {selectedConversation && (
            <aside
              className={
                styles.feedbackDetail
              }
            >
              <h2>Feedback Details</h2>

              <header>
                <strong>
                  {
                    selectedConversation
                      .clientName
                  }
                </strong>
                <span>
                  {
                    selectedConversation
                      .company
                  }
                  {' · '}
                  {
                    selectedConversation
                      .position
                  }
                </span>
                <time>
                  {formatMessageDate(
                    selectedConversation
                      .latestAt
                  )}
                </time>
              </header>

              <div
                className={
                  styles.feedbackThread
                }
              >
                {selectedConversation
                  .messages.map(
                    (message) => (
                      <article
                        key={message.id}
                        className={
                          message.sender
                            .role ===
                          'linker'
                            ? styles
                                .linkerMessage
                            : styles
                                .clientMessage
                        }
                      >
                        <strong>
                          {
                            message.sender
                              .name
                          }
                        </strong>
                        <p>
                          {message.message}
                        </p>
                        <time>
                          {formatMessageDate(
                            message.createdAt
                          )}
                        </time>
                      </article>
                    )
                  )}
              </div>

              <form
                onSubmit={handleReply}
              >
                <label>
                  <span>Your Response</span>
                  <textarea
                    value={response}
                    onChange={(event) => {
                      setResponse(
                        event.target.value
                      );
                      setError('');
                      setSuccess('');
                    }}
                    placeholder="Type your response..."
                    maxLength={5000}
                    rows={6}
                    disabled={isSending}
                  />
                </label>

                {error && (
                  <p
                    className={
                      styles.formError
                    }
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                {success && (
                  <p
                    className={
                      styles.formSuccess
                    }
                    role="status"
                  >
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    isSending ||
                    !response.trim()
                  }
                >
                  {isSending
                    ? 'Sending...'
                    : '⌁  Send Reply'}
                </button>
              </form>

              <div
                className={
                  styles.feedbackResolution
                }
              >
                {selectedConversation
                  .status === 'resolved'
                  ? '✓ Resolved'
                  : 'Reply to resolve this feedback'}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

function PerformancePage({
  data,
  isLoading,
  error,
}) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const applications =
    data.sourcedApplications || [];

  const totalLinks =
    Number(
      data.summary?.linksSourced || 0
    );

  const convertedLinks =
    Number(
      data.summary
        ?.convertedApplications || 0
    );

  const conversionRate =
    Number(
      data.summary?.conversionRate || 0
    );

  const totalInterviews =
    Number(
      data.summary?.interviews || 0
    );

  const totalOffers =
    Number(
      data.summary?.offers || 0
    );

  const openOpportunities =
    Number(
      data.summary
        ?.openOpportunities || 0
    );

  const needsAttention =
    Number(
      data.summary?.needsAttention || 0
    );

  const qualityRating =
    Number(
      data.summary?.qualityRating || 0
    );

  const ratingCount =
    Number(
      data.summary?.ratingCount || 0
    );

  const inReview =
    Number(
      data.summary
        ?.applicationInProgress || 0
    );

  const getPeriodStats = (days) => {
    const cutoff = new Date();

    cutoff.setDate(
      cutoff.getDate() - days
    );

    const periodApplications =
      applications.filter(
        (application) => {
          const date = new Date(
            application.appliedAt
          );

          return (
            !Number.isNaN(
              date.getTime()
            ) &&
            date >= cutoff
          );
        }
      );

    return {
      total:
        periodApplications.length,
      successful:
        periodApplications.filter(
          (application) =>
            [
              'Interview Scheduled',
              'Offer Received',
            ].includes(
              application.status
            )
        ).length,
    };
  };

  const periods = [
    ['This Week', getPeriodStats(7)],
    ['Last 30 Days', getPeriodStats(30)],
    ['Last 90 Days', getPeriodStats(90)],
  ];

  return (
    <div
      className={
        styles.figmaPerformance
      }
    >
      <section
        className={
          styles.performanceMetrics
        }
      >
        <article>
          <span>
            Opportunities Sourced
          </span>
          <strong>{totalLinks}</strong>
          <small>
            Verified Linker submissions
          </small>
        </article>

        <article>
          <span>
            Converted Applications
          </span>
          <strong>
            {convertedLinks}
          </strong>
          <small>
            Applications from your links
          </small>
        </article>

        <article>
          <span>Interviews</span>
          <strong>
            {totalInterviews}
          </strong>
          <small>
            From Linker-sourced applications
          </small>
        </article>

        <article>
          <span>Offers</span>
          <strong>{totalOffers}</strong>
          <small>
            From Linker-sourced applications
          </small>
        </article>

        <article>
          <span>Client Rating</span>
          <strong>
            {ratingCount > 0
              ? `${qualityRating.toFixed(1)}/5`
              : '—'}
          </strong>
          <small>
            {ratingCount > 0
              ? `${ratingCount} rated job link${ratingCount === 1 ? '' : 's'}`
              : 'No rated job links yet'}
          </small>
        </article>
      </section>

      <section
        className={
          styles.performanceLevel
        }
      >
        <h2>Conversion Overview</h2>

        <div
          className={
            styles.performanceLevelHeader
          }
        >
          <div>
            <strong>
              {conversionRate}%
            </strong>
            <span>
              {convertedLinks} of{' '}
              {totalLinks} opportunities
              converted
            </span>
          </div>

          <small>
            {openOpportunities} open
            {' · '}
            {needsAttention} need attention
          </small>
        </div>

        <div
          className={
            styles.performanceTrack
          }
        >
          <span
            style={{
              width:
                conversionRate + '%',
            }}
          />
        </div>

        <div
          className={
            styles.performanceLabels
          }
        >
          <span>
            {inReview} in review
          </span>

          <span>
            {totalInterviews} interviews
          </span>

          <span>
            {totalOffers} offers
          </span>
        </div>
      </section>

      <section
        className={
          styles.recentPerformance
        }
      >
        <h2>Recent Performance</h2>

        <div>
          {periods.map(
            ([label, values]) => (
              <article key={label}>
                <strong>{label}</strong>

                <dl>
                  <div>
                    <dt>
                      Applications
                    </dt>
                    <dd>
                      {values.total}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Interview / Offer
                    </dt>
                    <dd>
                      {values.successful}
                    </dd>
                  </div>

                </dl>
              </article>
            )
          )}
        </div>
      </section>

      <section
        className={
          styles.performanceAchievements
        }
      >
        <h2>Achievements</h2>

        <p>
          Verified achievements will appear
          as Linker activity and successful
          outcomes increase.
        </p>
      </section>
    </div>
  );
}

function SettingsPage({
  user,
  employment,
}) {
  const name =
    user?.name || 'Not provided';

  const email =
    user?.email || 'Not provided';

  const initial =
    name !== 'Not provided'
      ? name.charAt(0).toUpperCase()
      : 'L';

  const lineManager =
    employment?.lineManager ||
    null;

  const nda =
    employment?.nda ||
    null;

  const [
    isDownloading,
    setIsDownloading,
  ] = useState(false);

  const [
    documentError,
    setDocumentError,
  ] = useState('');

  const downloadNda = async () => {
    setIsDownloading(true);
    setDocumentError('');

    try {
      const accessToken =
        await getLinkerAccessToken();

      const response =
        await fetch(
          '/api/linker/employment-document',
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
            cache: 'no-store',
          }
        );

      const result =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            'The employee contract could not be downloaded.'
        );
      }

      const link =
        document.createElement('a');

      link.href = result.url;
      link.rel = 'noreferrer';
      link.download =
        result.filename ||
        nda?.fileName ||
        'ApplyLoop-employee-contract';

      document.body.appendChild(
        link
      );

      link.click();
      link.remove();
    } catch (downloadError) {
      setDocumentError(
        downloadError?.message ||
          'The employee contract could not be downloaded.'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className={
        styles.figmaSettings
      }
    >
      <section
        className={
          styles.settingsIdentity
        }
      >
        <div
          className={
            styles.settingsAvatar
          }
          aria-hidden="true"
        >
          {initial}
        </div>

        <div>
          <strong>{name}</strong>
          <span>Linker</span>
        </div>
      </section>

      <section
        className={
          styles.settingsSection
        }
      >
        <h2>Personal Information</h2>

        <dl
          className={
            styles.settingsGrid
          }
        >
          <div
            className={
              styles.settingsFull
            }
          >
            <dt>Full Name</dt>
            <dd>{name}</dd>
          </div>

          <div>
            <dt>Designation</dt>
            <dd>Linker</dd>
          </div>

          <div>
            <dt>Email Address</dt>
            <dd>{email}</dd>
          </div>

          <div>
            <dt>Account Status</dt>
            <dd>Active</dd>
          </div>

          <div>
            <dt>Company</dt>
            <dd>ApplyLoop</dd>
          </div>
        </dl>

        <p
          className={
            styles.settingsNotice
          }
        >
          Profile changes are managed by
          ApplyLoop administrators.
        </p>
      </section>

      <section
        className={
          styles.settingsSection
        }
      >
        <h2>Security</h2>

        <div
          className={
            styles.securityPanel
          }
        >
          <div>
            <strong>Password</strong>
            <span>
              Use the secure reset flow to
              change your account password.
            </span>
          </div>

          <Link href="/auth/forgot-password">
            Reset Password
          </Link>
        </div>
      </section>

      <section
        className={
          styles.settingsSection
        }
      >
        <h2>
          Notification Preferences
        </h2>

        <div
          className={
            styles.preferenceList
          }
        >
          <div>
            <div>
              <strong>
                Email Notifications
              </strong>
              <span>
                Important account and workflow
                updates are sent to {email}.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        className={
          styles.settingsSection
        }
      >
        <h2>Employment · ApplyLoop</h2>

        <div
          className={
            styles.companySettings
          }
        >
          <div>
            <div>
              <strong>Line Manager</strong>
              <span>
                Chief Applicant
              </span>
            </div>

            <small>
              {lineManager?.fullName ||
                'Not assigned yet'}
            </small>
          </div>

          <div>
            <div>
              <strong>
                Non-Disclosure Agreement
              </strong>
              <span>
                {nda?.fileName ||
                  'Employee contract / NDA'}
              </span>
            </div>

            <button
              type="button"
              disabled={
                !nda ||
                isDownloading
              }
              onClick={downloadNda}
              title={
                nda
                  ? 'Download your employee contract.'
                  : 'No employee contract has been uploaded yet.'
              }
            >
              {isDownloading
                ? 'Preparing...'
                : nda
                  ? 'Download Agreement'
                  : 'Not uploaded yet'}
            </button>
          </div>
        </div>

        {documentError && (
          <p
            className={
              styles.settingsDocumentError
            }
            role="alert"
          >
            {documentError}
          </p>
        )}
      </section>
    </div>
  );
}

function renderPage(
  section,
  user,
  data,
  isLoading,
  error
) {
  if (section === 'clients') {
    return (
      <ClientsPage
        data={data}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  if (section === 'applicants') {
    return (
      <ApplicantsPage
        data={data}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  if (section === 'record-link') {
    return (
      <RecordLinkPage
        data={data}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  if (section === 'job-links') {
    return <JobLinksPage data={data} />;
  }

  if (section === 'feedback') {
    return <FeedbackPage />;
  }

  if (section === 'performance') {
    return (
      <PerformancePage
        data={data}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  if (section === 'settings') {
    return (
      <SettingsPage
        user={user}
        employment={
          data.employment
        }
      />
    );
  }

  return (
    <DashboardPage
      data={data}
      isLoading={isLoading}
      error={error}
    />
  );
}

export default function LinkerPortal() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [
    assignmentData,
    setAssignmentData,
  ] = useState(emptyAssignmentData);
  const [
    isLoadingAssignments,
    setIsLoadingAssignments,
  ] = useState(true);
  const [
    assignmentsError,
    setAssignmentsError,
  ] = useState('');

  const requestedSection =
    getRequestedSection(router);

  const section =
    validSections.has(requestedSection)
      ? requestedSection
      : 'dashboard';

  const metadata =
    ROLE_PAGE_META[USER_ROLES.LINKER][section];

  const navigation =
    ROLE_NAVIGATION[USER_ROLES.LINKER];

  useEffect(() => {
    if (
      !router.isReady ||
      user?.role !== USER_ROLES.LINKER
    ) {
      return undefined;
    }

    let active = true;

    const loadAssignments = async () => {
      setIsLoadingAssignments(true);
      setAssignmentsError('');

      try {
        const accessToken =
          await getLinkerAccessToken();

        const response = await fetch(
          '/api/linker/assignments',
          {
            headers: {
              Authorization:
                'Bearer ' + accessToken,
            },
            cache: 'no-store',
          }
        );

        const result =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Your Linker assignments could not be loaded.'
          );
        }

        if (
          !Array.isArray(result.applicants) ||
          !Array.isArray(result.clients) ||
          !Array.isArray(result.applications) ||
          !Array.isArray(
            result.sourcedApplications
          )
        ) {
          throw new Error(
            'The assignment response could not be verified.'
          );
        }

        if (active) {
          setAssignmentData({
            applicants:
              result.applicants,
            clients:
              result.clients,
            applications:
              result.applications,
            sourcedApplications:
              result.sourcedApplications,
            employment:
              result.employment || {
                lineManager: null,
                nda: null,
              },
            summary: {
              assignedApplicants:
                Number(
                  result.summary
                    ?.assignedApplicants ||
                    0
                ),
              assignedClients:
                Number(
                  result.summary
                    ?.assignedClients ||
                    0
                ),
              linksFoundToday:
                Number(
                  result.summary
                    ?.linksFoundToday ||
                    0
                ),
              activeClients:
                Number(
                  result.summary
                    ?.activeClients ||
                    0
                ),
              linksSourced:
                Number(
                  result.summary
                    ?.linksSourced ||
                    0
                ),
              applicationInProgress:
                Number(
                  result.summary
                    ?.applicationInProgress ||
                    0
                ),
              convertedApplications:
                Number(
                  result.summary
                    ?.convertedApplications ||
                    0
                ),
              conversionRate:
                Number(
                  result.summary
                    ?.conversionRate ||
                    0
                ),
              interviews:
                Number(
                  result.summary
                    ?.interviews ||
                    0
                ),
              offers:
                Number(
                  result.summary
                    ?.offers ||
                    0
                ),
              rejected:
                Number(
                  result.summary
                    ?.rejected ||
                    0
                ),
              openOpportunities:
                Number(
                  result.summary
                    ?.openOpportunities ||
                    0
                ),
              needsAttention:
                Number(
                  result.summary
                    ?.needsAttention ||
                    0
                ),
              qualityRating:
                Number(
                  result.summary
                    ?.qualityRating ||
                    0
                ),
              ratingCount:
                Number(
                  result.summary
                    ?.ratingCount ||
                    0
                ),
            },
          });
        }
      } catch (error) {
        if (active) {
          setAssignmentData(
            emptyAssignmentData
          );
          setAssignmentsError(
            error.message ||
              'Your Linker assignments could not be loaded.'
          );
        }
      } finally {
        if (active) {
          setIsLoadingAssignments(false);
        }
      }
    };

    loadAssignments();

    return () => {
      active = false;
    };
  }, [
    router.isReady,
    user?.role,
  ]);

  useEffect(() => {
    if (
      user?.role &&
      user.role !== USER_ROLES.LINKER
    ) {
      router.replace(getRoleHome(user.role));
    }
  }, [router, user?.role]);

  useEffect(() => {
    if (
      router.isReady &&
      requestedSection !== section
    ) {
      router.replace('/linker');
    }
  }, [
    requestedSection,
    router,
    router.isReady,
    section,
  ]);

  if (
    user?.role &&
    user.role !== USER_ROLES.LINKER
  ) {
    return null;
  }

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
        navigation={navigation}
        activeSection={section}
        homeHref="/linker"
        title={metadata[0]}
        subtitle={metadata[1]}
        workspaceLabel="Linker Workspace"
        roleLabel="Linker"
        user={user}
        onLogout={logout}
      >
        {renderPage(
          section,
          user,
          assignmentData,
          isLoadingAssignments,
          assignmentsError
        )}
      </WorkspaceShell>
    </>
  );
}
