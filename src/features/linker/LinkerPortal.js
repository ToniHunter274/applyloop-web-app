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
  summary: {
    assignedApplicants: 0,
    assignedClients: 0,
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
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const hasAssignments =
    data.applicants.length > 0;

  return (
    <div className={styles.pageGrid}>
      <section className={styles.welcomeCard}>
        <div>
          <span className={styles.eyebrow}>
            Linker workspace
          </span>
          <h2>
            {hasAssignments
              ? 'Your assignment queue'
              : 'No assignments yet'}
          </h2>
          <p>
            Applicant and client access is derived
            from your current verified assignments.
          </p>
        </div>
        <FiLink aria-hidden="true" />
      </section>

      <section
        className={styles.summaryGrid}
        aria-label="Assignment summary"
      >
        <article>
          <span>Assigned Applicants</span>
          <strong>
            {data.summary.assignedApplicants}
          </strong>
        </article>

        <article>
          <span>Assigned Clients</span>
          <strong>
            {data.summary.assignedClients}
          </strong>
        </article>
      </section>

      {!hasAssignments && (
        <EmptyState
          icon={FiBriefcase}
          title="No assignments available"
          description="Admin or Operations has not assigned an Applicant to your Linker account."
        />
      )}
    </div>
  );
}

function ClientsPage({
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

  if (data.clients.length === 0) {
    return (
      <EmptyState
        icon={FiBriefcase}
        title="No assigned clients"
        description="Clients belonging to your assigned Applicants will appear here."
      />
    );
  }

  const applicantsById =
    new Map(
      data.applicants.map(
        (applicant) => [
          applicant.id,
          applicant,
        ]
      )
    );

  return (
    <section className={styles.tableCard}>
      <div className={styles.tableHeading}>
        <div>
          <h2>Assigned clients</h2>
          <p>
            Derived from your current Applicant
            assignments.
          </p>
        </div>
        <strong>
          {data.clients.length}
        </strong>
      </div>

      <div className={styles.tableScroll}>
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Applicant</th>
              <th>Plan</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.clients.map((client) => {
              const applicantNames =
                client.applicantIds
                  .map(
                    (id) =>
                      applicantsById.get(id)
                        ?.fullName
                  )
                  .filter(Boolean)
                  .join(', ') ||
                'Not available';

              return (
                <tr key={client.id}>
                  <td>
                    <strong>
                      {client.fullName}
                    </strong>
                    <small>
                      {client.email ||
                        'No email available'}
                    </small>
                  </td>
                  <td>{applicantNames}</td>
                  <td>{client.plan}</td>
                  <td>
                    {client.applicationsCompleted}
                    {' / '}
                    {client.applicationLimit}
                  </td>
                  <td>
                    <span
                      className={
                        client.canReceiveLinks
                          ? styles.statusReady
                          : styles.statusUnavailable
                      }
                    >
                      {client.canReceiveLinks
                        ? 'Ready'
                        : 'Unavailable'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ApplicantsPage({
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

  if (data.applicants.length === 0) {
    return (
      <EmptyState
        icon={FiUsers}
        title="No assigned Applicants"
        description="Applicants assigned directly to your Linker account will appear here."
      />
    );
  }

  return (
    <section className={styles.tableCard}>
      <div className={styles.tableHeading}>
        <div>
          <h2>Assigned Applicants</h2>
          <p>
            Applicants currently supported by your
            Linker account.
          </p>
        </div>
        <strong>
          {data.applicants.length}
        </strong>
      </div>

      <div className={styles.tableScroll}>
        <table>
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Team</th>
              <th>Assigned</th>
              <th>Active tasks</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.applicants.map(
              (applicant) => (
                <tr key={applicant.id}>
                  <td>
                    <strong>
                      {applicant.fullName}
                    </strong>
                    <small>
                      {applicant.email ||
                        'No email available'}
                    </small>
                  </td>
                  <td>
                    {applicant.team ||
                      'Not assigned'}
                  </td>
                  <td>
                    {formatDate(
                      applicant.assignedAt
                    )}
                  </td>
                  <td>
                    {applicant.activeTasks}
                  </td>
                  <td>
                    <span
                      className={
                        applicant.canReceiveLinks
                          ? styles.statusReady
                          : styles.statusUnavailable
                      }
                    >
                      {applicant.canReceiveLinks
                        ? 'Available'
                        : 'Unavailable'}
                    </span>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
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
  const [jobLink, setJobLink] =
    useState('');
  const [comment, setComment] =
    useState('');
  const [requests, setRequests] =
    useState([]);
  const [
    isLoadingRequests,
    setIsLoadingRequests,
  ] = useState(true);
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

    const loadRequests = async () => {
      setIsLoadingRequests(true);

      try {
        const accessToken =
          await getLinkerAccessToken();

        const response = await fetch(
          '/api/linker/job-requests',
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
              'Recorded job links could not be loaded.'
          );
        }

        if (
          !Array.isArray(result.requests)
        ) {
          throw new Error(
            'The job-link response could not be verified.'
          );
        }

        if (active) {
          setRequests(result.requests);
        }
      } catch (loadError) {
        if (active) {
          setRequestError(
            loadError.message ||
              'Recorded job links could not be loaded.'
          );
        }
      } finally {
        if (active) {
          setIsLoadingRequests(false);
        }
      }
    };

    loadRequests();

    return () => {
      active = false;
    };
  }, []);

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

  const applicantNames =
    new Map(
      data.applicants.map(
        (applicant) => [
          applicant.id,
          applicant.fullName,
        ]
      )
    );

  const clientNames =
    new Map(
      data.clients.map(
        (client) => [
          client.id,
          client.fullName,
        ]
      )
    );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setRequestError('');
    setSuccessMessage('');

    if (
      !applicantId ||
      !clientId ||
      !jobLink.trim()
    ) {
      setRequestError(
        'Select an Applicant and Client, then enter a job link.'
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
            jobLink,
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

      setRequests((current) => [
        result.request,
        ...current.filter(
          (request) =>
            request.id !==
            result.request.id
        ),
      ]);
      setJobLink('');
      setComment('');
      setSuccessMessage(
        result.message ||
          'Job link recorded successfully.'
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
    <div className={styles.recordLayout}>
      <section className={styles.recordCard}>
        <div className={styles.recordHeading}>
          <span className={styles.emptyIcon}>
            <FiExternalLink
              aria-hidden="true"
            />
          </span>

          <div>
            <h2>Record a verified job link</h2>
            <p>
              Choose the intended Applicant first.
              Only Clients assigned to that Applicant
              will be available.
            </p>
          </div>
        </div>

        <form
          className={styles.recordForm}
          onSubmit={handleSubmit}
        >
          <label>
            <span>Applicant</span>
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

          <label>
            <span>Client</span>
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

          <label className={styles.fullField}>
            <span>Employer job link</span>
            <input
              type="url"
              value={jobLink}
              onChange={(event) => {
                setJobLink(
                  event.target.value
                );
                setRequestError('');
                setSuccessMessage('');
              }}
              placeholder="https://company.com/jobs/role"
              maxLength={2000}
              disabled={isSubmitting}
              required
            />
          </label>

          <label className={styles.fullField}>
            <span>
              Comment
              <small>Optional</small>
            </span>
            <textarea
              value={comment}
              onChange={(event) =>
                setComment(
                  event.target.value
                )
              }
              placeholder="Add a short note for the Applicant."
              maxLength={2000}
              rows={4}
              disabled={isSubmitting}
            />
          </label>

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

          <button
            type="submit"
            className={styles.submitButton}
            disabled={
              isSubmitting ||
              !applicantId ||
              !clientId ||
              !jobLink.trim()
            }
          >
            {isSubmitting
              ? 'Recording...'
              : 'Record job link'}
          </button>
        </form>
      </section>

      <section className={styles.requestHistory}>
        <div className={styles.tableHeading}>
          <div>
            <h2>Recorded links</h2>
            <p>
              Your latest verified Linker submissions.
            </p>
          </div>

          <strong>{requests.length}</strong>
        </div>

        {isLoadingRequests ? (
          <div className={styles.historyStatus}>
            <span className={styles.spinner} />
            <p>Loading recorded links...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className={styles.historyStatus}>
            <p>
              No job links have been recorded yet.
            </p>
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Client</th>
                  <th>Job link</th>
                  <th>Status</th>
                  <th>Recorded</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(
                  (request) => (
                    <tr key={request.id}>
                      <td>
                        {applicantNames.get(
                          request.applicantId
                        ) ||
                          'Previous assignment'}
                      </td>
                      <td>
                        {clientNames.get(
                          request.clientId
                        ) ||
                          'Previous Client'}
                      </td>
                      <td>
                        <a
                          href={request.jobLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open link
                          <FiExternalLink
                            aria-hidden="true"
                          />
                        </a>
                      </td>
                      <td>
                        <span
                          className={
                            request.status ===
                            'converted'
                              ? styles.statusReady
                              : styles.statusPending
                          }
                        >
                          {request.status.replace(
                            '_',
                            ' '
                          )}
                        </span>
                      </td>
                      <td>
                        {formatDate(
                          request.createdAt
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function FeedbackPage() {
  return (
    <EmptyState
      icon={FiMessageSquare}
      title="No feedback or messages"
      description="Assignment-related feedback and messages will appear here."
    />
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
          !Array.isArray(result.clients)
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
