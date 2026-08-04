import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArchive,
  FiBarChart2,
  FiBell,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiEdit3,
  FiFileText,
  FiHome,
  FiLink,
  FiMenu,
  FiMessageCircle,
  FiMessageSquare,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiSend,
  FiSettings,
  FiSliders,
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
import { getRoleHome, USER_ROLES } from '../../shared/config/roles';
import styles from './ChiefApplicantPortal.module.css';

const cn = (...values) => values.filter(Boolean).join(' ');

const NAVIGATION = [
  { section: 'dashboard', label: 'Dashboard', href: '/chief-applicant', icon: FiHome },
  { section: 'team', label: 'Team Overview', href: '/chief-applicant/team', icon: FiUsers },
  { section: 'clients', label: 'Clients Assignment', href: '/chief-applicant/clients', icon: FiBriefcase },
  { section: 'workshop', label: 'Workshop', href: '/chief-applicant/workshop', icon: FiMessageCircle },
  { section: 'review', label: 'Application Review', href: '/chief-applicant/review', icon: FiArchive },
  { section: 'deadlines', label: 'Deadlines & Escalations', href: '/chief-applicant/deadlines', icon: FiAlertTriangle },
  { section: 'feedback', label: 'Feedbacks & Approvals', href: '/chief-applicant/feedback', icon: FiMessageSquare },
  { section: 'performance', label: 'Performance Analytics', href: '/chief-applicant/performance', icon: FiBarChart2 },
  { section: 'settings', label: 'Profile and Settings', href: '/chief-applicant/settings', icon: FiSliders },
];

const PAGE_META = {
  dashboard: ['Dashboard', "Welcome back! Here's your team's overview"],
  team: ['Team Overview', "Monitor your team's performance and availability"],
  clients: ['Clients Assignments', 'Assign and manage client workload distribution'],
  workshop: ['Prompt Center', 'Analyze job fit, generate tailored resumes and cover letters'],
  review: ['Application Review', 'Review and approve submitted applications'],
  deadlines: ['Deadlines & Escalations', 'Monitor critical deadlines and manage escalated issues'],
  feedback: ['Feedback & Approvals', 'Review client feedback and approve applications'],
  performance: ['Performance Analytics', 'Track your team performance and quality metrics'],
  settings: ['Profile & Settings', 'manage your account setting and preference'],
};

const TEAM_MEMBERS = Array.from({ length: 9 }, (_, index) => ({
  id: `team-${index + 1}`,
  name: 'Sarah Chen',
  completed: 187,
  average: '2.3 hrs avg',
  status: [4, 5, 6, 8].includes(index) ? 'Paused' : 'Available',
  tasks: 15,
  quality: 4.8,
  completion: 72,
}));

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

const DASHBOARD_APPLICATIONS = [
  ['#AND123', 'Feb 10, 2026', 'Apple Inc.', 'Software Dev.', 72, 'Anderson...', 'Offered', 'Client'],
  ['#AND122', 'Feb 11, 2026', 'Meta', 'Software Dev.', 89, 'N/A', 'Rejected', 'Client'],
  ['#AND219', 'Feb 13, 2026', 'Paypal', 'Software Dev.', 54, 'Anderson...', 'Interview', 'Finder'],
  ['#AND111', 'Feb 11, 2026', 'Oracle', 'Software Dev.', 99, 'N/A', 'Rejected', 'Applicant'],
  ['#AND101', 'Feb 11, 2026', 'Chowdeck', 'Software Dev.', 77, 'Anderson...', 'Pending', 'Finder'],
  ['#AND102', 'Feb 12, 2026', 'First City', 'Software Dev.', 40, 'Anderson...', 'Pending', 'Finder'],
  ['#AND105', 'Feb 12, 2026', 'Microsoft', 'Software Dev.', 29, 'Anderson...', 'Pending', 'Finder'],
  ['#AND219', 'Feb 13, 2026', 'Paypal', 'Software Dev.', 88, 'Anderson...', 'Rejected', 'Applicant'],
  ['#AND219', 'Feb 13, 2026', 'Paypal', 'Software Dev.', 90, 'Anderson...', 'Interview', 'Applicant'],
].map(([id, date, company, position, score, cover, status, source]) => ({ id, date, company, position, score, cover, status, source }));

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

function NotificationButton() {
  return <button type="button" aria-label="Notifications" className={styles.notification}><FiBell /></button>;
}

function Avatar({ size = 'small' }) {
  return <img src="/chief-applicant-avatar.png" alt="Team member" className={cn(styles.avatar, size === 'large' && styles.avatarLarge)} />;
}

function ChiefShell({ section, children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.role && user.role !== USER_ROLES.CHIEF_APPLICANT) router.replace(getRoleHome(user.role));
  }, [router, user?.role]);

  return (
    <div className={styles.app}>
      {menuOpen && <button className={styles.backdrop} aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <aside className={cn(styles.sidebar, menuOpen && styles.sidebarOpen)}>
        <Link href="/chief-applicant" className={styles.brand} onClick={() => setMenuOpen(false)}>
          <img src="/logo.svg" alt="ApplyLoop" />
          <span>ApplyLoop</span>
        </Link>
        <nav className={styles.nav}>
          {NAVIGATION.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.section} href={item.href} onClick={() => setMenuOpen(false)} className={cn(styles.navItem, section === item.section && styles.navActive)}>
                <Icon />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button type="button" className={styles.account} onClick={logout}>
          <Avatar />
          <span><strong>Team Lead</strong><small>Administrator</small></span>
        </button>
      </aside>
      <div className={styles.mainRail}>
        <div className={styles.mobileBar}>
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><FiMenu /></button>
          <span>ApplyLoop</span>
          <NotificationButton />
        </div>
        <main className={styles.surface}>{children}</main>
      </div>
    </div>
  );
}

function PageHeader({ section, search = false, searchValue = '', onSearch, action }) {
  const [title, subtitle] = PAGE_META[section];
  return (
    <header className={styles.pageHeader}>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className={styles.headerTools}>
        {search && (
          <label className={styles.search}>
            <FiSearch />
            <input value={searchValue} onChange={(event) => onSearch?.(event.target.value)} placeholder="Search Applications" />
          </label>
        )}
        {action}
        <NotificationButton />
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

function DashboardPage() {
  const [search, setSearch] = useState('');
  const rows = useMemo(() => DASHBOARD_APPLICATIONS.filter((item) => !search || Object.values(item).join(' ').toLowerCase().includes(search.toLowerCase())), [search]);
  return (
    <>
      <PageHeader section="dashboard" search searchValue={search} onSearch={setSearch} />
      <div className={cn(styles.stats, styles.statsFive)}>
        <StatCard label="Total Applicants" value="24" foot="+2 from yesterday" />
        <StatCard label="Total Applications" value="87" foot="+3 from yesterday" />
        <StatCard label="Complete Today" value="15" foot="+3 from yesterday" />
        <StatCard label="Overdue Tasks" value="6" foot="2 Urgent" />
        <StatCard label="Escalations" value="3" foot="2 Urgent" />
      </div>
      <div className={styles.dashboardSplit}>
        <section className={styles.panel}>
          <h2>Team Activity Feed</h2>
          <div className={styles.activityList}>
            {Array.from({ length: 4 }, (_, index) => (
              <div className={styles.activityRow} key={index}>
                <Avatar />
                <div><p><strong>Olabanji David</strong> completed 3 applications for StartupHub</p><span>45 min ago</span></div>
              </div>
            ))}
          </div>
        </section>
        <section className={styles.panel}>
          <h2>Urgent Alerts</h2>
          <div className={styles.alertList}>
            <AlertItem icon={FiAlertCircle} tone="red" title="4 Applications Overdue" text="TechCorp Inc. - 2 days past deadline" action="View" />
            <AlertItem icon={FiAlertTriangle} tone="yellow" title="Low Quality Flagged" text="2 submissions from Marcus Rodriguez" action="Review" />
            <AlertItem icon={FiTrendingUp} tone="yellow" title="Quality Score Drop" text="Emily Watson - 15% decrease this week" />
          </div>
        </section>
      </div>
      <section className={cn(styles.panel, styles.applicationsPanel)}>
        <h2>Applications Overview</h2>
        <div className={styles.filters}><span>Filter by:</span><select><option>All Time</option></select><select><option>All Applicants</option></select><select><option>All Clients</option></select></div>
        <div className={styles.tableScroll}>
          <table className={styles.dataTable}>
            <thead><tr><th>Application ID</th><th>Application Date</th><th>Company Name</th><th>Position</th><th>Quality Score</th><th>Cover Letter</th><th>Status</th><th>Link Source</th></tr></thead>
            <tbody>{rows.map((item, index) => <tr key={`${item.id}-${index}`}><td>{item.id}</td><td>{item.date}</td><td>{item.company}</td><td>{item.position}</td><td className={cn(styles.score, item.score >= 80 ? styles.scoreGreen : item.score < 50 ? styles.scoreRed : styles.scoreYellow)}>{item.score}%</td><td>{item.cover !== 'N/A' ? <span className={styles.pdfChip}><FiFileText /> {item.cover}</span> : item.cover}</td><td><StatusPill>{item.status}</StatusPill></td><td>{item.source}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function AlertItem({ icon: Icon, tone, title, text, action }) {
  return <div className={styles.alertRow}><span className={cn(styles.alertIcon, styles[`alert_${tone}`])}><Icon /></span><div><strong>{title}</strong><p>{text}</p>{action && <button>{action}</button>}</div><StatusPill>High</StatusPill></div>;
}

function TeamPage() {
  const [search, setSearch] = useState('');
  const [statsMember, setStatsMember] = useState(null);
  const [messageMember, setMessageMember] = useState(null);
  const [assignMember, setAssignMember] = useState(null);
  const rows = TEAM_MEMBERS.filter((member) => member.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <PageHeader section="team" search searchValue={search} onSearch={setSearch} />
      <div className={styles.stats}>
        <StatCard label="Total Applicants" value="24" foot="+2 from yesterday" />
        <StatCard label="Available" value="87" foot="+3 from yesterday" />
        <StatCard label="Busy" value="15" foot="+3 from yesterday" />
        <StatCard label="Active Tasks" value="6" foot="2 Urgent" />
      </div>
      <div className={styles.tableScroll}>
        <table className={cn(styles.dataTable, styles.teamTable)}>
          <thead><tr><th>Team Member</th><th>Status</th><th>Active Tasks</th><th>Quality Rating</th><th>Completion Rate</th><th>Action</th></tr></thead>
          <tbody>{rows.map((member) => <tr key={member.id}>
            <td><strong>{member.name}</strong><small>{member.completed} completed • {member.average}</small></td>
            <td><StatusPill>{member.status}</StatusPill></td>
            <td><span className={styles.taskCount}>{member.tasks}</span></td>
            <td>{member.quality} <FiStar className={styles.star} /></td>
            <td><div className={styles.completionCell}><strong>{member.completion}%</strong><span><i style={{ width: `${member.completion}%` }} /></span></div></td>
            <td><div className={styles.actionGroup}><button onClick={() => setAssignMember(member)}><FiUserPlus /> Assign</button><button onClick={() => setStatsMember(member)}><FiBarChart2 /> Stats</button><button onClick={() => setMessageMember(member)}><FiMessageSquare /> Chat</button></div></td>
          </tr>)}</tbody>
        </table>
      </div>
      <PerformanceModal member={statsMember} onClose={() => setStatsMember(null)} />
      <MessageModal member={messageMember} onClose={() => setMessageMember(null)} />
      <AssignModal member={assignMember} onClose={() => setAssignMember(null)} />
    </>
  );
}

function PerformanceModal({ member, onClose }) {
  return <Modal open={Boolean(member)} onClose={onClose} title="Performance Statistics" subtitle={member?.name} wide footer={<button className={styles.secondaryButton} onClick={onClose}>Close</button>}>
    <div className={styles.performanceModalTitle}><span>SJ</span><div><h3>Performance Statistics</h3><p>Sarah Chen</p></div></div>
    <div className={styles.modalMetricGrid}>
      <div className={styles.modalMetricBlue}><FiFileText /><span>Active Tasks<strong>12</strong></span></div>
      <div className={styles.modalMetricGreen}><FiCheckCircle /><span>Total Completed<strong>187</strong></span></div>
      <div className={styles.modalMetricOrange}><FiAwardIcon /><span>Quality Score<strong>4.8/5.0</strong></span></div>
      <div className={styles.modalMetricPurple}><FiClock /><span>Avg Time/Task<strong>2.3 hrs</strong></span></div>
    </div>
    <div className={styles.modalProgress}><ProgressLine label="Team Completion Rate" value={95} color="blue" /><ProgressLine label="Approval Accuracy" value={98} color="green" /><ProgressLine label="Deadline Compliance" value={97} color="purple" /></div>
    <div className={styles.recentActivityBox}><h4>Recent Activity</h4></div>
  </Modal>;
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
      <PageHeader section="clients" search searchValue={search} onSearch={setSearch} />
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
      <PageHeader section="workshop" action={selected ? <button className={styles.primaryButton}><FiSave /> Record Application</button> : null} />
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
      <PageHeader section="review" search searchValue={search} onSearch={setSearch} />
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
      <PageHeader section="deadlines" />
      <div className={cn(styles.stats, styles.statsThree)}><StatCard label="Active Escalations" value="3" foot="Requiring attention" icon={FiFileText} /><StatCard label="Upcoming Deadlines" value="3" foot="Next 48 hours" icon={FiTarget} /><StatCard label="At Risk" value="1" foot="Deadlines at risk" icon={FiTrendingUp} /></div>
      <section className={styles.largePanel}><h2>Active Escalations</h2><div className={styles.tableScroll}><table className={styles.dataTable}><thead><tr><th>Client</th><th>Applicant</th><th>Issue</th><th>Days Overdue</th><th>Severity</th><th>Date Escalated</th><th>Actions</th></tr></thead><tbody>{ESCALATIONS.map((item) => <tr key={item.client}><td>{item.client}</td><td>{item.applicant}</td><td>{item.issue}</td><td className={item.days !== '-' ? styles.redText : ''}>{item.days}</td><td><StatusPill>{item.severity}</StatusPill></td><td>{item.date}</td><td><div className={styles.iconActions}><button><FiCheckCircle /></button><button><FiRefreshCw /></button></div></td></tr>)}</tbody></table></div></section>
      <section className={styles.largePanel}><h2>Upcoming Deadlines</h2><div className={styles.tableScroll}><table className={styles.dataTable}><thead><tr><th>Client</th><th>Applicant</th><th>Deadline</th><th>Time Remaining</th><th>Status</th><th>Actions</th></tr></thead><tbody>{ESCALATIONS.map((item) => <tr key={`deadline-${item.client}`}><td>{item.client}</td><td>{item.applicant}</td><td>2026-05-21</td><td className={item.days !== '-' ? styles.redText : ''}>{item.days}</td><td><StatusPill>{item.severity}</StatusPill></td><td><button className={styles.secondaryButton}>Monitor</button></td></tr>)}</tbody></table></div></section>
    </>
  );
}

function FeedbackPage() {
  return (
    <>
      <PageHeader section="feedback" />
      <div className={cn(styles.stats, styles.statsThree)}><StatCard label="Pending Feedback" value="1" foot="Requiring attention" icon={FiFileText} /><StatCard label="Awaiting Approval" value="2" foot="Next 48 hours" icon={FiTarget} /><StatCard label="Approved Today" value="1" foot="Deadlines at risk" icon={FiTrendingUp} /></div>
      <section className={styles.largePanel}><h2>Client Feedback</h2><div className={styles.feedbackList}>{FEEDBACK_ITEMS.map((item) => <article className={styles.feedbackCard} key={item.id}><div className={styles.feedbackTop}><div><strong>{item.id}</strong> <StatusPill>{item.state}</StatusPill><p>{item.company} • {item.applicant}</p></div><span className={item.tone === 'positive' ? styles.positive : styles.negative}>{item.tone === 'positive' ? <FiThumbsUp /> : <FiThumbsDown />} {item.tone === 'positive' ? 'Positive' : 'Negative'}</span></div><p>{item.message}</p><div className={styles.feedbackFoot}><small>Received: 2026-05-20</small><div><button className={styles.secondaryButton}>Respond</button><button className={styles.secondaryButton}>Resolve</button><button className={styles.linkButton}>Forward to Applicant</button></div></div></article>)}</div></section>
      <section className={styles.largePanel}><h2>Approval Queue</h2><div className={styles.approvalList}>{APPROVAL_QUEUE.map((item) => <article className={styles.approvalCard} key={item.id}><div className={styles.approvalHead}><div><strong>{item.id}</strong> <StatusPill>{item.priority}</StatusPill><p>{item.company} • {item.applicant}</p></div><small>2026-05-20</small></div><textarea placeholder="Add approval notes..." /><div><button className={styles.primaryButton}><FiSave /> Approve</button><button className={styles.secondaryButton}><FiX /> Request Changes</button></div></article>)}</div></section>
    </>
  );
}

function PerformancePage() {
  return (
    <>
      <PageHeader section="performance" />
      <div className={styles.stats}><StatCard label="Total Applications" value="328" foot="All time" icon={FiFileText} /><StatCard label="Completion Rate" value="89%" foot="Team average" icon={FiTarget} /><StatCard label="Quality Score" value="4.6/5.0" foot="Average Rating" icon={FiTrendingUp} /><StatCard label="On-Time Delivery" value="94%" foot="Meet deadlines" icon={FiUsers} /></div>
      <section className={styles.largePanel}><h2>Top Performers</h2><div className={styles.performers}>{[['Sarah Chen',42,94],['David Martinez',46,95],['Rachel Green',40,92],['Emma Wilson',47,91]].map(([name,tasks,percent], index) => <div className={styles.performer} key={name}><div><span>{index + 1}</span><div><strong>{name}</strong><p>{tasks} tasks completed</p></div><b>{percent}%</b></div><span className={styles.performerTrack}><i style={{ width: `${percent}%` }} /></span></div>)}</div></section>
      <div className={styles.chartGrid}><section className={styles.chartPlaceholder}><h2>Weekly Performance Trend</h2><p>Chart visualization placeholder</p></section><section className={styles.chartPlaceholder}><h2>Application Status Distribution</h2><p>Chart visualization placeholder</p></section></div>
    </>
  );
}

function SettingsPage() {
  const [toggles, setToggles] = useState({ email: true, deadline: true, escalation: true, team: false });
  return (
    <>
      <PageHeader section="settings" />
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
  const section = getSection(router);
  const page = section === 'team' ? <TeamPage /> : section === 'clients' ? <ClientsPage /> : section === 'workshop' ? <WorkshopPage /> : section === 'review' ? <ApplicationReviewPage /> : section === 'deadlines' ? <DeadlinesPage /> : section === 'feedback' ? <FeedbackPage /> : section === 'performance' ? <PerformancePage /> : section === 'settings' ? <SettingsPage /> : <DashboardPage />;
  const [title] = PAGE_META[section] || PAGE_META.dashboard;
  return <><Head><title>{title} | ApplyLoop</title></Head><ChiefShell section={section}>{page}</ChiefShell></>;
}
