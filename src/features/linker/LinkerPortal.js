import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiBriefcase,
  FiExternalLink,
  FiLink,
  FiLogOut,
  FiMenu,
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
import styles from './LinkerPortal.module.css';

const validSections = new Set([
  'dashboard',
  'clients',
  'applicants',
  'record-link',
  'feedback',
  'performance',
  'settings',
]);

const emptyAssignmentData = {
  applicants: [],
  clients: [],
  applications: [],
  summary: {
    assignedApplicants: 0,
    assignedClients: 0,
    linksFoundToday: 0,
    activeClients: 0,
    linksSourced: 0,
    pendingReview: 0,
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
  const [search, setSearch] =
    useState('');
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

  const term =
    search.trim().toLowerCase();

  const applications =
    data.applications.filter(
      (application) =>
        (
          !selectedClient ||
          application.clientId ===
            selectedClient
        ) &&
               (
          !term ||
          [
            application.company,
            application.position,
            application.clientName,
            application.jobLink,
          ].some((value) =>
            String(value || '')
              .toLowerCase()
              .includes(term)
          )
        )
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
      'Pending Review',
      data.summary.pendingReview,
      'Awaiting Applicant action',
    ],
  ];

  return (
    <div className={styles.figmaDashboard}>
      <label
        className={styles.dashboardSearch}
      >
        <span className="sr-only">
          Search job links
        </span>
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search Job Links"
        />
      </label>

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
                <th>Quality Rating</th>
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
                        {Number(
                          applicant.qualityRating ||
                            0
                        ).toFixed(1)}
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
                          + Submit Link
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
  data,
  isLoading,
  error,
}) {
  const [applicantId, setApplicantId] =
    useState('');
  const [clientId, setClientId] =
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

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const eligibleApplicants =
    data.applicants.filter(
      (applicant) =>
        applicant.canReceiveLinks
    );

  const eligibleClients =
    applicantId
      ? data.clients.filter(
          (client) =>
            client.canReceiveLinks &&
            client.applicantIds.includes(
              applicantId
            )
        )
      : [];

  const clearForm = () => {
    setApplicantId('');
    setClientId('');
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setRequestError('');
    setSuccessMessage('');

    if (
      !applicantId ||
      !clientId ||
      !company.trim() ||
      !position.trim() ||
      !location.trim() ||
      !jobType ||
      !jobLink.trim()
    ) {
      setRequestError(
        'Complete every required field before saving the job link.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const accessToken =
        await getLinkerAccessToken();

      const response = await fetch(
        '/api/linker/job-requests',
        {
          method: 'POST',
          headers: {
            Authorization:
              'Bearer ' + accessToken,
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
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
            'The job link could not be recorded.'
        );
      }

      if (!result.request?.id) {
        throw new Error(
          'The recorded job link could not be verified.'
        );
      }

      setCompany('');
      setPosition('');
      setLocation('');
      setJobType('');
      setSalaryRange('');
      setJobLink('');
      setLinkProvider('');
      setComment('');

      setSuccessMessage(
        result.message ||
          'Job link saved successfully.'
      );
    } catch (submitError) {
      setRequestError(
        submitError.message ||
          'The job link could not be recorded.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (eligibleApplicants.length === 0) {
    return (
      <EmptyState
        icon={FiExternalLink}
        title="No eligible assignments"
        description="An active Applicant with an active assigned Client is required before a job link can be recorded."
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
        <span aria-hidden="true">←</span>
        <div>
          <h2>Record Job Application</h2>
          <p>
            Log a new job application for
            your assigned clients
          </p>
        </div>
      </header>

      <form
        className={styles.figmaRecordForm}
        onSubmit={handleSubmit}
      >
        <fieldset>
          <legend>Select Client</legend>

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
                Applicant<sup>*</sup>
              </span>

              <select
                value={applicantId}
                onChange={(event) => {
                  setApplicantId(
                    event.target.value
                  );
                  setClientId('');
                  setRequestError('');
                  setSuccessMessage('');
                }}
                disabled={isSubmitting}
                required
              >
                <option value="">
                  Select an Applicant
                </option>

                {eligibleApplicants.map(
                  (applicant) => (
                    <option
                      key={applicant.id}
                      value={applicant.id}
                    >
                      {applicant.fullName}
                    </option>
                  )
                )}
              </select>
            </label>

            <label
              className={
                styles.recordFullField
              }
            >
              <span>
                Client<sup>*</sup>
              </span>

              <select
                value={clientId}
                onChange={(event) => {
                  setClientId(
                    event.target.value
                  );
                  setRequestError('');
                  setSuccessMessage('');
                }}
                disabled={
                  !applicantId ||
                  isSubmitting
                }
                required
              >
                <option value="">
                  {applicantId
                    ? 'Select a Client'
                    : 'Select an Applicant first'}
                </option>

                {eligibleClients.map(
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
          </div>
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
                placeholder="Remote"
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
                placeholder="Remote"
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
                placeholder="Remote"
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
              <span>Salary Range</span>
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
                Job Posting URL<sup>*</sup>
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
              <span>Link Provided By</span>
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
          <legend>Notes &amp; Tags</legend>

          <label
            className={
              styles.recordFullField
            }
          >
            <span>Additional Notes</span>
            <textarea
              value={comment}
              onChange={(event) =>
                setComment(
                  event.target.value
                )
              }
              placeholder="Add any additional details about this application."
              maxLength={2000}
              rows={5}
              disabled={isSubmitting}
            />
          </label>
        </fieldset>

        {requestError && (
          <p
            className={styles.formError}
            role="alert"
          >
            {requestError}
          </p>
        )}

        {successMessage && (
          <p
            className={styles.formSuccess}
            role="status"
          >
            {successMessage}
          </p>
        )}

        <footer
          className={styles.recordActions}
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
              ? 'Saving...'
              : '▣  Save Job Link'}
          </button>
        </footer>
      </form>
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

function PerformancePage() {
  return (
    <EmptyState
      icon={FiTrendingUp}
      title="No verified performance data"
      description="Performance results will appear after recorded links are processed."
    />
  );
}

function SettingsPage({ user }) {
  return (
    <section className={styles.settingsCard}>
      <h2>Account profile</h2>
      <p>
        Your authenticated ApplyLoop profile is shown below.
      </p>

      <dl>
        <div>
          <dt>Name</dt>
          <dd>{user?.name || 'Not provided'}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user?.email || 'Not provided'}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>Linker</dd>
        </div>
      </dl>
    </section>
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

  if (section === 'feedback') {
    return <FeedbackPage />;
  }

  if (section === 'performance') {
    return <PerformancePage />;
  }

  if (section === 'settings') {
    return <SettingsPage user={user} />;
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
  const [menuOpen, setMenuOpen] = useState(false);
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
          !Array.isArray(result.applications)
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
              pendingReview:
                Number(
                  result.summary
                    ?.pendingReview ||
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
        <title>{metadata[0]} | ApplyLoop</title>
        <meta
          name="description"
          content={metadata[1]}
        />
      </Head>

      <div className={styles.workspace}>
        {menuOpen && (
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <aside
          className={
            menuOpen
              ? styles.sidebarOpen
              : styles.sidebar
          }
        >
          <div className={styles.brandRow}>
            <Link
              href="/linker"
              className={styles.brand}
            >
              <img src="/logo.svg" alt="" />
              <span>ApplyLoop</span>
            </Link>

            <button
              type="button"
              className={styles.closeMenu}
              aria-label="Close navigation"
              onClick={() => setMenuOpen(false)}
            >
              <FiX />
            </button>
          </div>

          <nav aria-label="Linker workspace">
            {navigation.map((item) => {
              const Icon = item.icon;

              const itemSection =
                item.href === '/linker'
                  ? 'dashboard'
                  : item.href.split('/').pop();

              const active =
                itemSection === section;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? styles.navActive
                      : styles.navItem
                  }
                  aria-current={
                    active ? 'page' : undefined
                  }
                  onClick={() =>
                    setMenuOpen(false)
                  }
                >
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className={styles.account}>
            <span className={styles.avatar}>
              {(user?.name || user?.email || 'L')
                .charAt(0)
                .toUpperCase()}
            </span>

            <span className={styles.accountText}>
              <strong>
                {user?.name || 'Linker'}
              </strong>
              <small>
                {user?.email ||
                  'Authenticated account'}
              </small>
            </span>

            <button
              type="button"
              aria-label="Sign out"
              onClick={logout}
            >
              <FiLogOut />
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.mobileHeader}>
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
            >
              <FiMenu />
            </button>

            <Link href="/linker">
              ApplyLoop
            </Link>
          </header>

          <div className={styles.content}>
            <header className={styles.pageHeader}>
              <div>
                <h1>{metadata[0]}</h1>
                <p>{metadata[1]}</p>
              </div>
            </header>

            {renderPage(
              section,
              user,
              assignmentData,
              isLoadingAssignments,
              assignmentsError
            )}
          </div>
        </main>
      </div>
    </>
  );
}
