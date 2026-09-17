import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArchive,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiEdit3,
  FiFileText,
  FiLink,
  FiMessageCircle,
  FiMessageSquare,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiSend,
  FiStar,
  FiTarget,
  FiThumbsDown,
  FiThumbsUp,
  FiTrendingUp,
  FiUser,
  FiUserPlus,
  FiUsers,
  FiX,
  FiXCircle,
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
import styles from './ChiefApplicantPortal.module.css';

const cn = (...values) => values.filter(Boolean).join(' ');

async function getChiefAccessToken() {
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

const CLIENT_ASSIGNMENTS = [
  ['Olabanji David', 300, 20, '15/20', 75, 'Sarah Chen', 'On Track'],
  ['Maya Patel', 200, 12, '10/15', 67, 'John Smith', 'Attention'],
  ['Luis Garcia', 300, 25, '25/25', 100, 'Emma Zhang', 'Completed'],
  ['Amina Yusuf', 100, 8, '6/10', 20, 'David Lee', 'Behind'],
  ['Ethan Brown', 300, 30, '28/30', 93, 'Olivia Martinez', 'On Track'],
  ['Sophia Lee', 300, 25, '30/30', 100, 'Liam Johnson', 'Completed'],
  ['Michael Chen', 300, 18, '20/30', 67, 'Emma Wilson', 'Attention'],
  ['Isabella Garcia', 300, 29, '30/30', 97, 'Noah Davis', 'On Track'],
  ['Sofia Rossi', 200, 15, '13/15', 87, 'Liam Wilson', 'On Track'],
].map(([name, plan, target, progress, percent, applicant, status], index) => ({ id: `client-${index + 1}`, name, plan, target, progress, percent, applicant, status }));

const APPLICATIONS = [
  { id: 'APP-3421', client: 'TechCorp Inc.', applicant: 'Sarah Chen', resume: 'v2.3', cover: 'Standard Tech Cover Letter', status: 'Pending Review', role: 'Senior Software Engineer' },
  { id: 'APP-3418', client: 'MegaCorp', applicant: 'John Doe', resume: 'v1.8', cover: 'Product Management Template', status: 'Needs Revision', role: 'Product Manager' },
  { id: 'APP-3425', client: 'StartupXYZ', applicant: 'Emma Wilson', resume: 'v3.1', cover: 'Creative Design Cover', status: 'Approved', role: 'Product Designer' },
  { id: 'APP-3419', client: 'InnovateLtd', applicant: 'Michael Brown', resume: 'v2.0', cover: 'Data Analytics Standard', status: 'Pending Review', role: 'Data Analyst' },
];

const ESCALATIONS = [
  ['MegaCorp', 'John Doe', 'Overdue application - No progress', '2 days', 'High', '2026-05-18'],
  ['InnovateLtd', 'Michael Brown', 'Quality concerns raised by client', '-', 'Medium', '2026-05-19'],
  ['CloudSolutions', 'Lisa Anderson', 'Missed deadline - Client waiting', '1 days', 'High', '2026-05-19'],
].map(([client, applicant, issue, days, severity, date]) => ({ client, applicant, issue, days, severity, date }));

const FEEDBACK_ITEMS = [
  { id: 'APP-3421', company: 'TechCorp Inc.', applicant: 'Sarah Chen', state: 'Pending Action', tone: 'positive', message: 'Application is well-written but needs minor adjustments to the cover letter.' },
  { id: 'APP-3418', company: 'MegaCorp', applicant: 'John Doe', state: 'In Progress', tone: 'negative', message: 'Resume formatting needs improvement. Skills section unclear.' },
  { id: 'APP-3425', company: 'StartupXYZ', applicant: 'Emma Wilson', state: 'Approved', tone: 'positive', message: 'Excellent portfolio presentation. Ready for submission.' },
];

const APPROVAL_QUEUE = [
  { id: 'APP-3426', company: 'GlobalTech', applicant: 'Rachel Green', priority: 'High' },
  { id: 'APP-3427', company: 'DataDrive Inc.', applicant: 'Alex Johnson', priority: 'Medium' },
];

const WORKSHOP_CLIENT = {
  name: 'Olabanji David',
  role: 'Senior Product Designer',
  work: 'Remote',
  details: 'JobType: Full-time | Location: Remote | Salary: $140k - $170k | Industry: Technology | Role: DevOps Engineer | Experience: 6+ years | Skills: Kubernetes, Docker, AWS, Terraform',
};

function getSection(router) {
  const parts = router.query?.section;
  if (Array.isArray(parts) && parts.length) return parts[0];
  return 'dashboard';
}

function Avatar({ size = 'small' }) {
  return <img src="/chief-applicant-avatar.png" alt="Team member" className={cn(styles.avatar, size === 'large' && styles.avatarLarge)} />;
}

function PageHeader({
  search = false,
  searchValue = '',
  onSearch,
  action,
}) {
  const hasTools =
    search ||
    Boolean(action);

  if (!hasTools) {
    return null;
  }

  return (
    <header
      className={cn(
        styles.pageHeader,
        styles.pageHeaderActionsOnly
      )}
    >
      <div className={styles.headerTools}>
        {search && (
          <label className={styles.search}>
            <FiSearch />

            <input
              value={searchValue}
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
      </div>
    </header>
  );
}

function StatCard({ label, value, foot, icon: Icon }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statTop}><span>{label}</span>{Icon && <Icon />}</div>
      <strong>{value}</strong>
      {foot && <small>{foot}</small>}
    </div>
  );
}

function StatusPill({ children }) {
  const key = String(children).toLowerCase().replace(/\s+/g, '-');
  return <span className={cn(styles.status, styles[`status_${key}`])}>{children}</span>;
}

function Modal({ title, subtitle, open, onClose, children, footer, wide = false }) {
  if (!open) return null;
  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={onClose}>
      <section className={cn(styles.modal, wide && styles.modalWide)} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button className={styles.modalClose} aria-label="Close" onClick={onClose}><FiX /></button>
        <h2>{title}</h2>
        {subtitle && <p className={styles.modalSubtitle}>{subtitle}</p>}
        <div className={styles.modalBody}>{children}</div>
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </section>
    </div>
  );
}

function DashboardPage({
  data,
  isLoading,
  error,
}) {
  if (isLoading) {
    return (
      <section className={styles.largePanel}>
        <h2>Loading team dashboard...</h2>
        <p>
          Loading live supervision and
          performance data.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.largePanel}>
        <h2>
          Dashboard could not be loaded
        </h2>

        <p>{error}</p>
      </section>
    );
  }

  const members =
    data?.members || [];

  const applicants =
    members.filter(
      (member) =>
        member.roleType ===
        'Applicant'
    );

  const linkers =
    members.filter(
      (member) =>
        member.roleType ===
        'Linker'
    );

  const activeWork =
    members.reduce(
      (total, member) =>
        total +
        Number(
          member.activeWork || 0
        ),
      0
    );

  const completedApplications =
    applicants.reduce(
      (total, member) =>
        total +
        Number(
          member.completedWork || 0
        ),
      0
    );

  const sourcedLinks =
    linkers.reduce(
      (total, member) =>
        total +
        Number(
          member.completedWork || 0
        ),
      0
    );

  const ratedWorkItems =
    members.reduce(
      (total, member) =>
        total +
        Number(
          member.ratingCount || 0
        ),
      0
    );

  const weightedRating =
    members.reduce(
      (total, member) =>
        total +
        (
          Number(
            member.qualityRating || 0
          ) *
          Number(
            member.ratingCount || 0
          )
        ),
      0
    );

  const teamRating =
    ratedWorkItems > 0
      ? weightedRating /
        ratedWorkItems
      : 0;

  const availablePersonnel =
    members.filter(
      (member) =>
        [
          'available',
          'active',
        ].includes(
          String(
            member.status ||
            member.accountStatus ||
            ''
          ).toLowerCase()
        )
    ).length;

  return (
    <>
      <div
        className={cn(
          styles.stats,
          styles.statsFive
        )}
      >
        <StatCard
          label="Team Members"
          value={members.length}
          foot={`${applicants.length} Applicant${
            applicants.length === 1
              ? ''
              : 's'
          } · ${linkers.length} Linker${
            linkers.length === 1
              ? ''
              : 's'
          }`}
          icon={FiUsers}
        />

        <StatCard
          label="Active Work"
          value={activeWork}
          foot="Current team workload"
          icon={FiBriefcase}
        />

        <StatCard
          label="Applications Completed"
          value={completedApplications}
          foot="Applicant completed work"
          icon={FiCheckCircle}
        />

        <StatCard
          label="Job Links Sourced"
          value={sourcedLinks}
          foot="Linker sourced opportunities"
          icon={FiLink}
        />

        <StatCard
          label="Team Client Rating"
          value={
            ratedWorkItems > 0
              ? `${teamRating.toFixed(
                  1
                )}/5.0`
              : '—'
          }
          foot={
            ratedWorkItems > 0
              ? `${ratedWorkItems} rated work item${
                  ratedWorkItems === 1
                    ? ''
                    : 's'
                }`
              : 'No rated work yet'
          }
          icon={FiStar}
        />
      </div>

      <div className={styles.dashboardSplit}>
        <section className={styles.panel}>
          <h2>Team Activity</h2>

          <div className={styles.activityList}>
            {members.map(
              (member) => (
                <div
                  className={
                    styles.activityRow
                  }
                  key={member.id}
                >
                  <div>
                    <p>
                      <strong>
                        {member.fullName}
                      </strong>{' '}
                      · {member.roleType}
                    </p>

                    <span>
                      {Number(
                        member.activeWork ||
                        0
                      )}{' '}
                      active ·{' '}
                      {Number(
                        member.completedWork ||
                        0
                      )}{' '}
                      {member.roleType ===
                      'Linker'
                        ? 'links sourced'
                        : 'completed'}
                    </span>
                  </div>
                </div>
              )
            )}

            {members.length === 0 && (
              <p>
                No personnel are assigned
                to you yet.
              </p>
            )}
          </div>
        </section>

        <section className={styles.panel}>
          <h2>Supervision Snapshot</h2>

          <div className={styles.activityList}>
            <div className={styles.activityRow}>
              <div>
                <p>
                  <strong>
                    Applicant Coverage
                  </strong>
                </p>

                <span>
                  {applicants.length}{' '}
                  assigned Applicant
                  {applicants.length === 1
                    ? ''
                    : 's'}
                </span>
              </div>
            </div>

            <div className={styles.activityRow}>
              <div>
                <p>
                  <strong>
                    Linker Coverage
                  </strong>
                </p>

                <span>
                  {linkers.length}{' '}
                  assigned Linker
                  {linkers.length === 1
                    ? ''
                    : 's'}
                </span>
              </div>
            </div>

            <div className={styles.activityRow}>
              <div>
                <p>
                  <strong>
                    Available Personnel
                  </strong>
                </p>

                <span>
                  {availablePersonnel} of{' '}
                  {members.length} currently
                  available / active
                </span>
              </div>
            </div>

            <div className={styles.activityRow}>
              <div>
                <p>
                  <strong>
                    Client-Rated Work
                  </strong>
                </p>

                <span>
                  {ratedWorkItems} work item
                  {ratedWorkItems === 1
                    ? ''
                    : 's'}{' '}
                  rated by Clients
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section
        className={cn(
          styles.panel,
          styles.applicationsPanel
        )}
      >
        <h2>Personnel Overview</h2>

        <div className={styles.tableScroll}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Active Work</th>
                <th>Completed / Sourced</th>
                <th>Client Rating</th>
              </tr>
            </thead>

            <tbody>
              {members.map(
                (member) => {
                  const ratingCount =
                    Number(
                      member.ratingCount ||
                      0
                    );

                  return (
                    <tr key={member.id}>
                      <td>
                        <strong>
                          {member.fullName}
                        </strong>
                      </td>

                      <td>
                        {member.roleType}
                      </td>

                      <td>
                        <StatusPill>
                          {member.status ||
                            member.accountStatus ||
                            'Unknown'}
                        </StatusPill>
                      </td>

                      <td>
                        {Number(
                          member.activeWork ||
                          0
                        )}
                      </td>

                      <td>
                        {Number(
                          member.completedWork ||
                          0
                        )}
                      </td>

                      <td>
                        {ratingCount > 0
                          ? `${Number(
                              member.qualityRating ||
                                0
                            ).toFixed(
                              1
                            )}/5 · ${ratingCount}`
                          : 'Not rated'}
                      </td>
                    </tr>
                  );
                }
              )}

              {members.length === 0 && (
                <tr>
                  <td colSpan="6">
                    No assigned personnel yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function TeamPage({
  data,
  isLoading,
  error,
}) {
  const [search, setSearch] =
    useState('');

  const [
    statsMember,
    setStatsMember,
  ] = useState(null);

  if (isLoading) {
    return (
      <section className={styles.largePanel}>
        <h2>Loading supervision team...</h2>
        <p>
          Loading Applicants and Linkers
          assigned to you.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.largePanel}>
        <h2>
          Supervision team could not be loaded
        </h2>
        <p>{error}</p>
      </section>
    );
  }

  const members =
    data?.members || [];

  const summary =
    data?.summary || {};

  const query =
    search
      .trim()
      .toLowerCase();

  const rows =
    members.filter(
      (member) =>
        !query ||
        [
          member.fullName,
          member.email,
          member.roleType,
          member.status,
        ].some(
          (value) =>
            String(value || '')
              .toLowerCase()
              .includes(query)
        )
    );

  return (
    <>
      <PageHeader
        search
        searchValue={search}
        onSearch={setSearch}
      />

      <div className={styles.stats}>
        <StatCard
          label="Team Members"
          value={
            Number(
              summary.teamMembers ||
              0
            )
          }
          foot="Direct reports"
        />

        <StatCard
          label="Applicants"
          value={
            Number(
              summary.applicants ||
              0
            )
          }
          foot="Assigned Applicants"
        />

        <StatCard
          label="Linkers"
          value={
            Number(
              summary.linkers ||
              0
            )
          }
          foot="Assigned Linkers"
        />

        <StatCard
          label="Rated Work"
          value={
            Number(
              summary.ratedWorkItems ||
              0
            )
          }
          foot="Client-rated work items"
        />
      </div>

      <div className={styles.tableScroll}>
        <table
          className={cn(
            styles.dataTable,
            styles.teamTable
          )}
        >
          <thead>
            <tr>
              <th>Team Member</th>
              <th>Role</th>
              <th>Status</th>
              <th>Active Work</th>
              <th>Client Rating</th>
              <th>Completion Rate</th>
              <th>Details</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(
              (member) => {
                const ratingCount =
                  Number(
                    member.ratingCount ||
                    0
                  );

                const qualityRating =
                  Number(
                    member.qualityRating ||
                    0
                  );

                const completionRate =
                  member.completionRate ===
                  null
                    ? null
                    : Number(
                        member
                          .completionRate ||
                          0
                      );

                return (
                  <tr key={member.id}>
                    <td>
                      <strong>
                        {member.fullName}
                      </strong>

                      <small>
                        {member.email ||
                          'No email available'}
                      </small>
                    </td>

                    <td>
                      <strong>
                        {member.roleType}
                      </strong>
                    </td>

                    <td>
                      <StatusPill>
                        {member.status ||
                          member.accountStatus ||
                          'Unknown'}
                      </StatusPill>
                    </td>

                    <td>
                      <span
                        className={
                          styles.taskCount
                        }
                      >
                        {Number(
                          member.activeWork ||
                          0
                        )}
                      </span>

                      <small>
                        {member.roleType ===
                        'Linker'
                          ? 'open job links'
                          : 'active tasks'}
                      </small>
                    </td>

                    <td>
                      {ratingCount > 0
                        ? `${qualityRating.toFixed(
                            1
                          )}/5 · ${ratingCount} rating${
                            ratingCount === 1
                              ? ''
                              : 's'
                          }`
                        : 'Not rated yet'}
                    </td>

                    <td>
                      {completionRate ===
                      null ? (
                        '—'
                      ) : (
                        <div
                          className={
                            styles
                              .completionCell
                          }
                        >
                          <strong>
                            {completionRate}%
                          </strong>

                          <span>
                            <i
                              style={{
                                width:
                                  `${Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      completionRate
                                    )
                                  )}%`,
                              }}
                            />
                          </span>
                        </div>
                      )}
                    </td>

                    <td>
                      <div
                        className={
                          styles.actionGroup
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setStatsMember(
                              member
                            )
                          }
                        >
                          <FiBarChart2 />
                          Stats
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
            )}

            {rows.length === 0 && (
              <tr>
                <td colSpan="7">
                  No assigned personnel match
                  this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PerformanceModal
        member={statsMember}
        onClose={() =>
          setStatsMember(null)
        }
      />
    </>
  );
}

function PerformanceModal({
  member,
  onClose,
}) {
  const ratingCount =
    Number(
      member?.ratingCount || 0
    );

  const qualityRating =
    Number(
      member?.qualityRating || 0
    );

  const completionRate =
    member?.completionRate === null ||
    member?.completionRate === undefined
      ? null
      : Number(
          member.completionRate || 0
        );

  return (
    <Modal
      open={Boolean(member)}
      onClose={onClose}
      title="Performance Statistics"
      subtitle={
        member
          ? `${member.fullName} · ${member.roleType}`
          : ''
      }
      wide
      footer={
        <button
          className={
            styles.secondaryButton
          }
          onClick={onClose}
        >
          Close
        </button>
      }
    >
      <div
        className={
          styles.performanceModalTitle
        }
      >
        <span>
          {String(
            member?.fullName ||
            'T'
          )
            .charAt(0)
            .toUpperCase()}
        </span>

        <div>
          <h3>
            {member?.fullName ||
              'Team Member'}
          </h3>

          <p>
            {member?.roleType ||
              'Personnel'}
          </p>
        </div>
      </div>

      <div
        className={
          styles.modalMetricGrid
        }
      >
        <div
          className={
            styles.modalMetricBlue
          }
        >
          <FiFileText />

          <span>
            Active Work
            <strong>
              {Number(
                member?.activeWork ||
                0
              )}
            </strong>
          </span>
        </div>

        <div
          className={
            styles.modalMetricGreen
          }
        >
          <FiCheckCircle />

          <span>
            Completed / Sourced
            <strong>
              {Number(
                member?.completedWork ||
                0
              )}
            </strong>
          </span>
        </div>

        <div
          className={
            styles.modalMetricOrange
          }
        >
          <FiAwardIcon />

          <span>
            Client Rating
            <strong>
              {ratingCount > 0
                ? `${qualityRating.toFixed(
                    1
                  )}/5`
                : 'Not rated'}
            </strong>
          </span>
        </div>

        <div
          className={
            styles.modalMetricPurple
          }
        >
          <FiStar />

          <span>
            Rated Work
            <strong>
              {ratingCount}
            </strong>
          </span>
        </div>
      </div>

      {completionRate !== null && (
        <div
          className={
            styles.modalProgress
          }
        >
          <ProgressLine
            label="Completion Rate"
            value={Math.max(
              0,
              Math.min(
                100,
                completionRate
              )
            )}
            color="blue"
          />
        </div>
      )}
    </Modal>
  );
}

function FiAwardIcon(props) { return <FiTarget {...props} />; }

function ProgressLine({ label, value, color = 'blue' }) {
  return <div className={styles.progressLine}><div><span>{label}</span><strong>{value}%</strong></div><span className={styles.progressTrack}><i className={styles[`progress_${color}`]} style={{ width: `${value}%` }} /></span></div>;
}

function MessageModal({ member, onClose }) {
  const [message, setMessage] = useState('');
  return <Modal open={Boolean(member)} onClose={onClose} title="Send Message" subtitle="Send a direct message to Sarah Chen" footer={<><button className={styles.secondaryButton} onClick={onClose}>Cancel</button><button className={styles.primaryButton} onClick={onClose}>Send Message <FiSend /></button></>}>
    <div className={styles.memberSummary}><Avatar size="large" /><div><strong>Sarah Chen</strong><span><i /> Available</span></div></div>
    <label className={styles.field}><span>Messages</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type your message here..." /></label>
  </Modal>;
}

function AssignModal({ member, onClose }) {
  return <Modal open={Boolean(member)} onClose={onClose} title="Assign Clients" subtitle="Assign a client application to Sarah Chen" footer={<><button className={styles.secondaryButton} onClick={onClose}>Cancel</button><button className={styles.primaryButton} onClick={onClose}>Assign Task <FiCalendar /></button></>}>
    <div className={styles.assignSummary}><div className={styles.assignPerson}><Avatar size="large" /><div><strong>Sarah Chen</strong><span>Assign a client application to Sarah Chen</span></div></div><div className={styles.assignMetrics}><span>Completion<strong>94%</strong></span><span>On-Time<strong>96%</strong></span><span>Quality<strong>4.8/5.0</strong></span></div></div>
    <label className={styles.field}><span>Select Clients</span><select><option>Select a client</option><option>Olabanji David</option></select></label>
  </Modal>;
}

function ClientsPage() {
  const [search, setSearch] = useState('');
  const rows = CLIENT_ASSIGNMENTS.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <PageHeader search searchValue={search} onSearch={setSearch} />
      <div className={styles.stats}>
        <StatCard label="Total Clients" value="8" foot="Active clients" icon={FiFileText} />
        <StatCard label="Weekly Target" value="125" foot="89 completed" icon={FiTarget} />
        <StatCard label="Completion Rate" value="71%" foot="Overall progress" icon={FiTrendingUp} />
        <StatCard label="Premium Clients" value="3" foot="High-priority accounts" icon={FiUsers} />
      </div>
      <section className={styles.clientsOverview}>
        <h2>Client Assignment Overview</h2>
        <div className={styles.tableScroll}><table className={cn(styles.dataTable, styles.clientsTable)}><thead><tr><th>Client Name</th><th>Plan</th><th>Weekly Target</th><th>Progress</th><th>Assigned Applicant</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td><span className={cn(styles.plan, styles[`plan${item.plan}`])}>{item.plan}</span></td><td>{item.target}</td><td><div className={styles.clientProgress}><div><span>{item.progress}</span><span>{item.percent}%</span></div><span><i style={{ width: `${item.percent}%` }} /></span></div></td><td>{item.applicant}</td><td><StatusPill>{item.status}</StatusPill></td><td><div className={styles.iconActions}><button aria-label="Assign"><FiUserPlus /></button><button aria-label="Refresh"><FiRefreshCw /></button></div></td></tr>)}</tbody></table></div>
      </section>
    </>
  );
}

function WorkshopPage() {
  const [selected, setSelected] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [stage, setStage] = useState('idle');

  const selectClient = (value) => {
    setSelected(value);
    setStage('idle');
    setJobDescription(value ? '' : '');
    setJobUrl('');
  };

  const startAnalysis = () => {
    setStage('processing');
    setTimeout(() => setStage(jobDescription.trim() ? 'success' : 'failed'), 900);
  };

  const score = stage === 'success' ? [80, 100] : [0, 0];
  const tone = stage === 'success' ? 'green' : stage === 'failed' ? 'red' : 'neutral';
  return (
    <>
      <PageHeader action={selected ? <button className={styles.primaryButton}><FiSave /> Record Application</button> : null} />
      <section className={styles.selectClientPanel}>
        <label className={styles.field}><strong>Select Client</strong><span>Client</span><select value={selected} onChange={(event) => selectClient(event.target.value)}><option value="">Select a client</option><option value="olabanji">Olabanji David</option></select></label>
        {selected && <div className={styles.clientCard}><Avatar size="large" /><div><strong>{WORKSHOP_CLIENT.name}</strong><span>{WORKSHOP_CLIENT.role}　•　{WORKSHOP_CLIENT.work}</span><p>{WORKSHOP_CLIENT.details}</p></div><a href="#resume">Client&apos;s Resume</a></div>}
      </section>
      {!selected ? (
        <section className={styles.noClient}><FiUser /><h2>No Client Selected</h2><p>Select a client above to load their<br />preferences, resume, and analyze job fit.</p></section>
      ) : (
        <>
          {stage === 'processing' && <section className={styles.processingBox}><div className={styles.processingTitle}><span><FiRefreshCw /> Request Processing</span><button>Querying</button></div><div className={styles.processingTrack}><i /></div><div className={styles.processingFoot}><strong>68%</strong><span>2m 15s remaining</span></div></section>}
          <div className={styles.scoreGrid}>
            <ScoreCard label="Resume Match Score" value={score[0]} text="Based on skills & experience alignment" tone={tone} icon={FiTarget} />
            <ScoreCard label="Applicability Score" value={score[1]} text="Based on client preferences vs job" tone={tone} icon={FiBriefcase} />
          </div>
          {stage === 'success' && <label className={styles.field}><span>Job Posting URL</span><div className={styles.urlField}><FiLink /><input value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} placeholder="https://......" /></div></label>}
          <label className={styles.field}><span>Job Description</span><textarea className={styles.jobDescription} value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder={stage === 'idle' ? 'Type in description...' : 'Job Title: Software Engineer (Remote)\nExperience Level: Mid-Level (4+ Years Experience)'} /></label>
          {(stage === 'failed' || stage === 'success') && <AnalysisPanels success={stage === 'success'} />}
          <section className={styles.generateBox}>
            <h2>Generate Documents</h2>
            <div className={styles.generateButtons}><button className={styles.primaryButton}><FiFileText /> Generate Tailored Resume</button><button className={styles.secondaryButton}><FiFileText /> Generate Cover Letter</button></div>
            <div className={styles.recommendation}><strong>Recommendation:</strong><p>{stage === 'success' ? 'Very good match. This job aligns with client preferences.' : 'Low match. This job may not align with client preferences. Consider discussing with the client before applying.'}</p></div>
            <button className={styles.analyzeButton} onClick={startAnalysis}>{stage === 'processing' ? 'Analyzing…' : 'Analyze Job Fit'}</button>
          </section>
        </>
      )}
    </>
  );
}

function ScoreCard({ label, value, text, tone, icon: Icon }) {
  return <div className={cn(styles.scoreCard, styles[`scoreCard_${tone}`])}><div><span>{label}</span><strong>{value}%</strong><p>{text}</p></div><Icon /></div>;
}

function AnalysisPanels({ success }) {
  return <div className={styles.analysisGrid}><section><h3><FiFileText /> Resume Analysis</h3><p className={styles.matchLine}><FiCheckCircle /> Matching Skills</p><ul><li>python</li><li>aws</li><li>docker</li><li>kubernetes</li></ul><p className={styles.highlightLine}><FiAlertCircle /> Skills to Highlight</p><ul><li>react</li><li>node</li><li>product</li><li>agile</li></ul></section><section><h3><FiTrendingUp /> Preference Alignment</h3><p className={styles.matchLine}><FiCheckCircle /> Matches</p>{success ? <ul><li>Location: Remote match</li><li>Role: Software Engineer match found</li></ul> : <p>Nil</p>}</section></div>;
}

function ApplicationReviewPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(APPLICATIONS[0]);
  const [tab, setTab] = useState('resume');
  const [feedback, setFeedback] = useState('');
  const rows = APPLICATIONS.filter((item) => !search || Object.values(item).join(' ').toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <PageHeader search searchValue={search} onSearch={setSearch} />
      <div className={styles.stats}>
        <StatCard label="Pending Review" value="2" foot="Awaiting Review" icon={FiFileText} />
        <StatCard label="Approved" value="1" foot="Ready to Submit" icon={FiTarget} />
        <StatCard label="Needs Revision" value="1" foot="requires Changes" icon={FiTrendingUp} />
        <StatCard label="Total Applications" value="4" foot="In queue" icon={FiUsers} />
      </div>
      <div className={styles.reviewLayout}>
        <section className={styles.reviewQueue}><h2>Applications Queue</h2><div className={styles.tableScroll}><table className={styles.dataTable}><thead><tr><th>ID</th><th>Client</th><th>Applicant</th><th>Resume Ver.</th><th>Cover Letter</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id} className={selected?.id === item.id ? styles.selectedRow : ''} onClick={() => setSelected(item)}><td><strong>{item.id}</strong></td><td>{item.client}</td><td>{item.applicant}</td><td><span className={styles.version}>{item.resume}</span></td><td>{item.cover}</td></tr>)}</tbody></table></div></section>
        <section className={styles.previewPanel}>
          <div className={styles.previewHead}><div><h2>Preview Panel - {selected.id}</h2><p>{selected.role} at {selected.client}</p></div><StatusPill>{selected.status}</StatusPill></div>
          <div className={styles.previewTabs}><button className={tab === 'resume' ? styles.tabActive : ''} onClick={() => setTab('resume')}><FiFileText /> Resume</button><button className={tab === 'cover' ? styles.tabActive : ''} onClick={() => setTab('cover')}><FiMessageSquare /> Cover Letter</button><button className={tab === 'job' ? styles.tabActive : ''} onClick={() => setTab('job')}><FiFileText /> Job Description</button></div>
          <pre className={styles.documentPreview}>{tab === 'resume' ? `${selected.applicant}\n${selected.role}\n\nEXPERIENCE\n• Lead Developer at Tech Solutions (2020–Present)\n• Full-stack Engineer at StartupCo (2018–2020)\n\nSKILLS\nReact, Node.js, Python, AWS, Docker...` : tab === 'cover' ? 'Dear Hiring Manager,\n\nI am excited to apply for this opportunity...' : 'We are looking for an experienced professional to join our growing team...'}</pre>
          <h3>Active Document</h3><div className={styles.activeDocument}><div><strong>Alex_Morgan_Resume.pdf</strong><span>245 KB</span></div><StatusPill>Uploaded</StatusPill></div>
          <hr /><label className={styles.field}><strong>Add Feedback</strong><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Enter your review comments..." /></label>
          <div className={styles.reviewActions}><button className={styles.primaryButton}><FiCheckCircle /> Approve</button><button className={styles.secondaryButton}><FiEdit3 /> Request Revision</button><button className={styles.secondaryButton}><FiMessageSquare /> Add Feedback</button><button className={styles.linkButton}><FiUsers /> Reassign</button></div>
        </section>
      </div>
    </>
  );
}

function DeadlinesPage() {
  return (
    <>
      <PageHeader />
      <div className={cn(styles.stats, styles.statsThree)}><StatCard label="Active Escalations" value="3" foot="Requiring attention" icon={FiFileText} /><StatCard label="Upcoming Deadlines" value="3" foot="Next 48 hours" icon={FiTarget} /><StatCard label="At Risk" value="1" foot="Deadlines at risk" icon={FiTrendingUp} /></div>
      <section className={styles.largePanel}><h2>Active Escalations</h2><div className={styles.tableScroll}><table className={styles.dataTable}><thead><tr><th>Client</th><th>Applicant</th><th>Issue</th><th>Days Overdue</th><th>Severity</th><th>Date Escalated</th><th>Actions</th></tr></thead><tbody>{ESCALATIONS.map((item) => <tr key={item.client}><td>{item.client}</td><td>{item.applicant}</td><td>{item.issue}</td><td className={item.days !== '-' ? styles.redText : ''}>{item.days}</td><td><StatusPill>{item.severity}</StatusPill></td><td>{item.date}</td><td><div className={styles.iconActions}><button><FiCheckCircle /></button><button><FiRefreshCw /></button></div></td></tr>)}</tbody></table></div></section>
      <section className={styles.largePanel}><h2>Upcoming Deadlines</h2><div className={styles.tableScroll}><table className={styles.dataTable}><thead><tr><th>Client</th><th>Applicant</th><th>Deadline</th><th>Time Remaining</th><th>Status</th><th>Actions</th></tr></thead><tbody>{ESCALATIONS.map((item) => <tr key={`deadline-${item.client}`}><td>{item.client}</td><td>{item.applicant}</td><td>2026-05-21</td><td className={item.days !== '-' ? styles.redText : ''}>{item.days}</td><td><StatusPill>{item.severity}</StatusPill></td><td><button className={styles.secondaryButton}>Monitor</button></td></tr>)}</tbody></table></div></section>
    </>
  );
}

function FeedbackPage() {
  return (
    <>
      <PageHeader />
      <div className={cn(styles.stats, styles.statsThree)}><StatCard label="Pending Feedback" value="1" foot="Requiring attention" icon={FiFileText} /><StatCard label="Awaiting Approval" value="2" foot="Next 48 hours" icon={FiTarget} /><StatCard label="Approved Today" value="1" foot="Deadlines at risk" icon={FiTrendingUp} /></div>
      <section className={styles.largePanel}><h2>Client Feedback</h2><div className={styles.feedbackList}>{FEEDBACK_ITEMS.map((item) => <article className={styles.feedbackCard} key={item.id}><div className={styles.feedbackTop}><div><strong>{item.id}</strong> <StatusPill>{item.state}</StatusPill><p>{item.company} • {item.applicant}</p></div><span className={item.tone === 'positive' ? styles.positive : styles.negative}>{item.tone === 'positive' ? <FiThumbsUp /> : <FiThumbsDown />} {item.tone === 'positive' ? 'Positive' : 'Negative'}</span></div><p>{item.message}</p><div className={styles.feedbackFoot}><small>Received: 2026-05-20</small><div><button className={styles.secondaryButton}>Respond</button><button className={styles.secondaryButton}>Resolve</button><button className={styles.linkButton}>Forward to Applicant</button></div></div></article>)}</div></section>
      <section className={styles.largePanel}><h2>Approval Queue</h2><div className={styles.approvalList}>{APPROVAL_QUEUE.map((item) => <article className={styles.approvalCard} key={item.id}><div className={styles.approvalHead}><div><strong>{item.id}</strong> <StatusPill>{item.priority}</StatusPill><p>{item.company} • {item.applicant}</p></div><small>2026-05-20</small></div><textarea placeholder="Add approval notes..." /><div><button className={styles.primaryButton}><FiSave /> Approve</button><button className={styles.secondaryButton}><FiX /> Request Changes</button></div></article>)}</div></section>
    </>
  );
}

function PerformancePage({
  data,
  isLoading,
  error,
}) {
  if (isLoading) {
    return (
      <section className={styles.largePanel}>
        <h2>
          Loading team performance...
        </h2>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.largePanel}>
        <h2>
          Team performance could not be loaded
        </h2>
        <p>{error}</p>
      </section>
    );
  }

  const members =
    data?.members || [];

  const applicants =
    members.filter(
      (member) =>
        member.roleType ===
        'Applicant'
    );

  const ratedWorkItems =
    members.reduce(
      (total, member) =>
        total +
        Number(
          member.ratingCount ||
          0
        ),
      0
    );

  const weightedRatingTotal =
    members.reduce(
      (total, member) =>
        total +
        (
          Number(
            member.qualityRating ||
            0
          ) *
          Number(
            member.ratingCount ||
            0
          )
        ),
      0
    );

  const teamRating =
    ratedWorkItems > 0
      ? weightedRatingTotal /
        ratedWorkItems
      : 0;

  const applicantCompletion =
    applicants.length > 0
      ? Math.round(
          applicants.reduce(
            (total, applicant) =>
              total +
              Number(
                applicant
                  .completionRate ||
                0
              ),
            0
          ) /
          applicants.length
        )
      : 0;

  const trackedWork =
    members.reduce(
      (total, member) =>
        total +
        Number(
          member.completedWork ||
          0
        ),
      0
    );

  const orderedMembers =
    [...members].sort(
      (a, b) => {
        const ratingDifference =
          Number(
            b.qualityRating || 0
          ) -
          Number(
            a.qualityRating || 0
          );

        if (ratingDifference) {
          return ratingDifference;
        }

        return a.fullName.localeCompare(
          b.fullName
        );
      }
    );

  return (
    <>
      <PageHeader />

      <div className={styles.stats}>
        <StatCard
          label="Team Members"
          value={members.length}
          foot="Direct reports"
          icon={FiUsers}
        />

        <StatCard
          label="Tracked Work"
          value={trackedWork}
          foot="Completed applications + sourced links"
          icon={FiFileText}
        />

        <StatCard
          label="Team Client Rating"
          value={
            ratedWorkItems > 0
              ? `${teamRating.toFixed(
                  1
                )}/5.0`
              : '—'
          }
          foot={
            ratedWorkItems > 0
              ? `${ratedWorkItems} rated work item${
                  ratedWorkItems === 1
                    ? ''
                    : 's'
                }`
              : 'No rated work yet'
          }
          icon={FiStar}
        />

        <StatCard
          label="Applicant Completion"
          value={
            `${applicantCompletion}%`
          }
          foot="Applicant team average"
          icon={FiTrendingUp}
        />
      </div>

      <section
        className={
          styles.largePanel
        }
      >
        <h2>
          Personnel Performance
        </h2>

        <div
          className={
            styles.tableScroll
          }
        >
          <table
            className={
              styles.dataTable
            }
          >
            <thead>
              <tr>
                <th>
                  Team Member
                </th>
                <th>Role</th>
                <th>
                  Client Rating
                </th>
                <th>
                  Rated Work
                </th>
                <th>
                  Completed / Sourced
                </th>
                <th>
                  Completion
                </th>
              </tr>
            </thead>

            <tbody>
              {orderedMembers.map(
                (member) => {
                  const ratingCount =
                    Number(
                      member.ratingCount ||
                      0
                    );

                  return (
                    <tr
                      key={member.id}
                    >
                      <td>
                        <strong>
                          {
                            member.fullName
                          }
                        </strong>

                        <small>
                          {member.email ||
                            'No email available'}
                        </small>
                      </td>

                      <td>
                        {
                          member.roleType
                        }
                      </td>

                      <td>
                        {ratingCount > 0
                          ? `${Number(
                              member
                                .qualityRating ||
                                0
                            ).toFixed(
                              1
                            )}/5`
                          : 'Not rated'}
                      </td>

                      <td>
                        {ratingCount}
                      </td>

                      <td>
                        {Number(
                          member.completedWork ||
                          0
                        )}
                      </td>

                      <td>
                        {member.completionRate ===
                        null
                          ? '—'
                          : `${Number(
                              member
                                .completionRate ||
                                0
                            )}%`}
                      </td>
                    </tr>
                  );
                }
              )}

              {orderedMembers.length ===
                0 && (
                <tr>
                  <td colSpan="6">
                    No personnel are assigned
                    to this Chief Applicant yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function SettingsPage() {
  const [toggles, setToggles] = useState({ email: true, deadline: true, escalation: true, team: false });
  return (
    <>
      <PageHeader />
      <div className={styles.settingsContent}>
        <Avatar size="large" />
        <h2>Personal Information</h2>
        <div className={styles.formGrid}><label className={cn(styles.field, styles.full)}><span>Full Name</span><input defaultValue="Olabanji David T." /></label><label className={cn(styles.field, styles.full)}><span>Designation</span><input defaultValue="Chief Applicant" /></label><label className={styles.field}><span>Email Address</span><input defaultValue="banjidhevid216@gmail.com" /></label><label className={styles.field}><span>Phone Number</span><input defaultValue="+234 811 474 6609" /></label><label className={styles.field}><span>Nationality</span><input defaultValue="Nigeria" /></label><label className={styles.field}><span>State/Province</span><input defaultValue="Lagos" /></label></div><button className={styles.primaryButton}>Save Changes</button>
        <h2>Security</h2><label className={cn(styles.field, styles.full)}><span>Current Password</span><input type="password" defaultValue="password" /></label><label className={cn(styles.field, styles.full)}><span>New Password</span><input type="password" defaultValue="password" /></label><label className={cn(styles.field, styles.full)}><span>Confirm New Password</span><input type="password" defaultValue="password" /></label><button className={styles.primaryButton}>Save Changes</button>
        <h2>Notification Preferencessss</h2>
        <div className={styles.toggleList}>{[['email','Email Notifications','Receive updates via Email'],['deadline','Deadline Alerts','Get notified about upcoming deadlines'],['escalation','Escalation Notifications','Alert on new escalations'],['team','Team Activity','Updates on team performance']].map(([key,label,description]) => <div className={styles.toggleRow} key={key}><div><strong>{label}</strong><p>{description}</p></div><button className={cn(styles.toggle, toggles[key] && styles.toggleOn)} onClick={() => setToggles((value) => ({ ...value, [key]: !value[key] }))}><i /></button></div>)}</div>
      </div>
    </>
  );
}

export default function ChiefApplicantPortal() {
  const router = useRouter();

  const {
    user,
    logout,
  } = useAuth();

  const [
    supervisionData,
    setSupervisionData,
  ] = useState({
    members: [],
    summary: {
      teamMembers: 0,
      applicants: 0,
      linkers: 0,
      ratedMembers: 0,
      ratedWorkItems: 0,
    },
  });

  const [
    isLoadingSupervision,
    setIsLoadingSupervision,
  ] = useState(true);

  const [
    supervisionError,
    setSupervisionError,
  ] = useState('');

  useEffect(() => {
    if (
      user?.role &&
      user.role !==
        USER_ROLES.CHIEF_APPLICANT
    ) {
      router.replace(
        getRoleHome(user.role)
      );
    }
  }, [
    router,
    user?.role,
  ]);

  useEffect(() => {
    if (
      !router.isReady ||
      user?.role !==
        USER_ROLES.CHIEF_APPLICANT
    ) {
      return undefined;
    }

    let active = true;

    const loadSupervision =
      async () => {
        setIsLoadingSupervision(
          true
        );
        setSupervisionError('');

        try {
          const accessToken =
            await getChiefAccessToken();

          const response =
            await fetch(
              '/api/chief-applicant/team',
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
              result.members
            )
          ) {
            throw new Error(
              result.error ||
                'Your supervision team could not be loaded.'
            );
          }

          if (active) {
            setSupervisionData({
              members:
                result.members,
              summary:
                result.summary || {
                  teamMembers: 0,
                  applicants: 0,
                  linkers: 0,
                  ratedMembers: 0,
                  ratedWorkItems: 0,
                },
            });
          }
        } catch (loadError) {
          if (active) {
            setSupervisionData({
              members: [],
              summary: {
                teamMembers: 0,
                applicants: 0,
                linkers: 0,
                ratedMembers: 0,
                ratedWorkItems: 0,
              },
            });

            setSupervisionError(
              loadError?.message ||
                'Your supervision team could not be loaded.'
            );
          }
        } finally {
          if (active) {
            setIsLoadingSupervision(
              false
            );
          }
        }
      };

    loadSupervision();

    return () => {
      active = false;
    };
  }, [
    router.isReady,
    user?.role,
  ]);

  const section =
    getSection(router);

  const metadata =
    ROLE_PAGE_META[
      USER_ROLES.CHIEF_APPLICANT
    ]?.[section] || [
      'Chief Applicant Workspace',
      'Supervise Applicants and operational work.',
    ];

  const navigation =
    (
      ROLE_NAVIGATION[
        USER_ROLES.CHIEF_APPLICANT
      ] || []
    ).map((item) => ({
      ...item,
      section:
        item.href ===
        '/chief-applicant'
          ? 'dashboard'
          : String(item.href)
              .split('?')[0]
              .split('/')
              .filter(Boolean)
              .pop() ||
            'dashboard',
    }));

  const page =
    section === 'team'
      ? (
          <TeamPage
            data={supervisionData}
            isLoading={
              isLoadingSupervision
            }
            error={
              supervisionError
            }
          />
        )
      : section === 'clients'
        ? <ClientsPage />
        : section === 'workshop'
          ? <WorkshopPage />
          : section === 'review'
            ? <ApplicationReviewPage />
            : section === 'deadlines'
              ? <DeadlinesPage />
              : section === 'feedback'
                ? <FeedbackPage />
                : section === 'performance'
                  ? (
                      <PerformancePage
                        data={supervisionData}
                        isLoading={
                          isLoadingSupervision
                        }
                        error={
                          supervisionError
                        }
                      />
                    )
                  : section === 'settings'
                    ? <SettingsPage />
                    : (
                        <DashboardPage
                          data={supervisionData}
                          isLoading={
                            isLoadingSupervision
                          }
                          error={
                            supervisionError
                          }
                        />
                      );

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
        homeHref="/chief-applicant"
        title={metadata[0]}
        subtitle={metadata[1]}
        workspaceLabel="Chief Workspace"
        roleLabel="Chief Applicant"
        user={user}
        onLogout={logout}
      >
        {page}
      </WorkspaceShell>
    </>
  );
}
