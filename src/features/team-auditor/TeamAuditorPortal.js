import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiAlertCircle,
  FiAlertOctagon,
  FiAlertTriangle,
  FiArrowLeft,
  FiBarChart2,
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiCheckSquare,
  FiChevronDown,
  FiClock,
  FiDownload,
  FiFileText,
  FiFilter,
  FiHome,
  FiInfo,
  FiLink,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiPlay,
  FiSearch,
  FiSend,
  FiShield,
  FiSliders,
  FiTarget,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiX,
  FiXCircle,
  FiZap,
} from 'react-icons/fi';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../shared/context/AuthContext';
import { getRoleHome } from '../../shared/config/roles';
import styles from './TeamAuditorPortal.module.css';

const cx = (...values) => values.filter(Boolean).join(' ');

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: '/team-auditor', icon: FiHome },
  { key: 'queue', label: 'Audit Queue', href: '/team-auditor/audit-queue', icon: FiCheckSquare, count: 24 },
  { key: 'ai', label: 'AI Auditing System', href: '/team-auditor/ai-auditing-system', icon: FiClipboardLike },
  { key: 'reviews', label: 'Application Reviews', href: '/team-auditor/application-reviews', icon: FiFileText },
  { key: 'quality', label: 'Team Quality Scores', href: '/team-auditor/team-quality-scores', icon: FiUsers },
  { key: 'complaints', label: 'Client Complaints', href: '/team-auditor/client-complaints', icon: FiMessageSquare, count: 2 },
  { key: 'reports', label: 'Audit Report', href: '/team-auditor/audit-report', icon: FiBarChart2 },
  { key: 'analytics', label: 'Analytics and Trends', href: '/team-auditor/analytics-and-trends', icon: FiTrendingUp },
  { key: 'settings', label: 'Profile and Settings', href: '/team-auditor/profile-settings', icon: FiSliders },
];

function FiClipboardLike(props) {
  return <FiCheckSquare {...props} />;
}

const routeToSection = (segments) => {
  const section = Array.isArray(segments) ? segments[0] : segments;
  const map = {
    'audit-queue': 'queue',
    'ai-auditing-system': 'ai',
    'application-reviews': 'reviews',
    'team-quality-scores': 'quality',
    'client-complaints': 'complaints',
    'audit-report': 'reports',
    'analytics-and-trends': 'analytics',
    'profile-settings': 'settings',
  };
  return map[section] || 'dashboard';
};

const dashboardMetrics = [
  { icon: FiFileText, title: 'Applications Audited Today', value: '48', note: '↑ 12 vs. yesterday', noteTone: 'green', tone: 'blue' },
  { icon: FiCheckCircle, title: 'Quality Pass Rate', value: '9.8%', note: '↑ 2.3% this week', noteTone: 'green', tone: 'blue' },
  { icon: FiXCircle, title: 'Failed Audits', value: '8', note: '↑ 3 since yesterday', noteTone: 'green', tone: 'red' },
  { icon: FiAlertTriangle, title: 'Opened Queries', value: '12', note: '↓ 4 resolved today', noteTone: 'red', tone: 'red' },
  { icon: FiAlertOctagon, title: 'Escalated Issues', value: '5', note: 'Immediate attention required', noteTone: 'neutral', tone: 'red' },
  { icon: FiShield, title: 'Compliance Score', value: '94.2%', note: '↑ 1.5% improvement', noteTone: 'green', tone: 'green' },
  { icon: FiMessageSquare, title: 'Client Complaints', value: '3', note: '↓ 2 resolved this week', noteTone: 'red', tone: 'red' },
  { icon: FiAlertCircle, title: 'Corrective Action Pending', value: '11', note: '6 due within 48 hours', noteTone: 'neutral', tone: 'red' },
];

const qualityHealth = [
  { label: 'Resume Quality Score', value: 93, change: '+2.4%', tone: 'blue' },
  { label: 'Cover Letter Quality Score', value: 91, change: '+1.8%', tone: 'blue' },
  { label: 'ATS Compliance Rate', value: 96, change: '-0.5%', tone: 'green', changeTone: 'red' },
  { label: 'Team Accuracy Score', value: 94, change: '+3.2%', tone: 'blue' },
  { label: 'Service Quality Index', value: 95, change: '+1.5%', tone: 'green' },
];

const liveFeed = [
  ['Application #2841 passed audit', '2 minutes ago', 'green'],
  ['Query raised against Applicant Sarah Mitchell', '8 minutes ago', 'orange'],
  ['Premium client application flagged for review', '15 minutes ago', 'red'],
  ['Corrective action completed by Marcus Johnson', '23 minutes ago', 'blue'],
  ['Application #2840 passed audit', '28 minutes ago', 'green'],
  ['Query raised against Applicant Emma Chen', '35 minutes ago', 'orange'],
  ['ATS compliance issue flagged', '42 minutes ago', 'red'],
];

const recentQualityIssues = [
  { id: 'NCR-145', status: 'open', tone: 'red', title: 'Resume formatting does not meet ATS standards', applicant: 'Applicant: Marcus Johnson', time: '2 hours ago' },
  { id: 'QRY-892', status: 'pending', tone: 'orange', title: 'Cover letter lacks specific achievement metrics', applicant: 'Applicant: Sarah Mitchell', time: '4 hours ago' },
  { id: 'CMP-067', status: 'open', tone: 'purple', title: 'Client reports generic application content', applicant: 'Applicant: Emma Chen', time: '6 hours ago' },
  { id: 'NCR-144', status: 'pending', tone: 'red', title: 'Missing keyword optimization in resume', applicant: 'Applicant: David Park', time: '1 day ago' },
];

const AUDIT_SOURCE_LABELS = {
  random_audit: 'Random Audit',
  client_complaint: 'Client Complaint',
  quality_query: 'Quality Query',
  scheduled_review: 'Scheduled Review',
  manual: 'Manual Review',
};

function formatAuditAge(value) {
  const createdAt =
    new Date(value).getTime();

  if (
    Number.isNaN(createdAt)
  ) {
    return '';
  }

  const minutes =
    Math.max(
      0,
      Math.floor(
        (Date.now() - createdAt) /
          60000
      )
    );

  if (minutes < 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes} minute${
      minutes === 1 ? '' : 's'
    } ago`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? '' : 's'
    } ago`;
  }

  const days =
    Math.floor(hours / 24);

  return `${days} day${
    days === 1 ? '' : 's'
  } ago`;
}

function formatAuditQueueItem(
  audit
) {
  return {
    id: audit.id,
    displayId:
      audit.displayId ||
      `AUD-${String(audit.id)
        .slice(0, 8)
        .toUpperCase()}`,
    level:
      String(
        audit.priority ||
        'medium'
      ).toUpperCase(),
    title:
      audit.application
        ?.position ||
      'Application',
    client:
      audit.application
        ?.client?.name ||
      'Client',
    owner:
      audit.application
        ?.createdBy?.name ||
      'Applicant',
    age:
      formatAuditAge(
        audit.createdAt
      ),
    source:
      AUDIT_SOURCE_LABELS[
        audit.source
      ] ||
      'Manual Review',
  };
}

const applicationReviewRows = [
  { id: 'APP-2847', client: 'Maya Patel', applicant: 'Olabanji David', chief: 'Raya Dava', quality: 'Excellent', qualityTone: 'green', date: '2026-05-23', status: 'Passed', statusTone: 'green' },
  { id: 'APP-2847', client: 'Isreal Moon', applicant: 'Olabanji David', chief: 'Raya Dava', quality: 'Good', qualityTone: 'blue', date: '2026-05-23', status: 'In-review', statusTone: 'blue' },
  { id: 'APP-2847', client: 'Isreal Moon', applicant: 'Olabanji David', chief: 'Raya Dava', quality: 'Failed', qualityTone: 'red', date: '2026-05-23', status: 'Failed', statusTone: 'red' },
  { id: 'APP-2848', client: 'Amara Singh', applicant: 'Liam Johnson', chief: 'Raya Dava', quality: 'Good', qualityTone: 'blue', date: '2026-06-01', status: 'In-review', statusTone: 'blue' },
  { id: 'APP-2849', client: 'Felipe Costa', applicant: 'Nia Roberts', chief: 'Raya Dava', quality: 'Good', qualityTone: 'blue', date: '2026-05-29', status: 'Passed', statusTone: 'green' },
  { id: 'APP-2850', client: 'Sofia Müller', applicant: 'Kenji Tanaka', chief: 'Raya Dava', quality: 'Excellent', qualityTone: 'green', date: '2026-06-03', status: 'Passed', statusTone: 'green' },
];

const teamRows = [
  { name: 'Sarah Mitchell', role: 'Chief Applicant', score: 96, applications: 142, pass: '98%', trend: '+2.3%', payout: '$464.00', tone: 'green' },
  { name: 'Michael Torres', role: 'Applicant', score: 94, applications: 128, pass: '96%', trend: '+2.3%', payout: '$464.00', tone: 'blue' },
  { name: 'Emma Chen', role: 'Applicant', score: 91, applications: 98, pass: '93%', trend: '-1.5%', payout: '$464.00', tone: 'blue' },
  { name: 'David Park', role: 'Applicant', score: 89, applications: 87, pass: '90%', trend: '+2.3%', payout: '$464.00', tone: 'orange' },
  { name: 'Lisa Anderson', role: 'Junior Applicant', score: 85, applications: 64, pass: '87%', trend: '+2.3%', payout: '$464.00', tone: 'orange' },
  { name: 'Michael Torres', role: 'Applicant', score: 94, applications: 128, pass: '96%', trend: '+2.3%', payout: '$464.00', tone: 'blue' },
  { name: 'Emma Chen', role: 'Applicant', score: 91, applications: 98, pass: '93%', trend: '-1.5%', payout: '$464.00', tone: 'blue' },
  { name: 'David Park', role: 'Applicant', score: 89, applications: 87, pass: '90%', trend: '+2.3%', payout: '$464.00', tone: 'orange' },
  { name: 'Lisa Anderson', role: 'Junior Applicant', score: 85, applications: 64, pass: '87%', trend: '+2.3%', payout: '$464.00', tone: 'orange' },
];

const reportCards = [
  { key: 'daily', title: 'Daily Audit Report', detail: 'Comprehensive overview of all audits completed today', tone: 'blue' },
  { key: 'weekly', title: 'Weekly Quality Report', detail: 'Quality metrics and trends for the past 7 days', tone: 'green' },
  { key: 'monthly', title: 'Monthly Compliance Report', detail: 'Compliance status and adherence metrics for the month', tone: 'purple' },
  { key: 'team', title: 'Team Performance Report', detail: 'Individual and team quality performance metrics', tone: 'orange' },
  { key: 'client', title: 'Client Satisfaction Report', detail: 'Client complaints, feedback, and satisfaction scores', tone: 'red' },
];

const reportTitles = {
  daily: 'Generate Daily Audit Report',
  weekly: 'Generate Weekly Quality Report',
  monthly: 'Generate Monthly Compliance Report',
  team: 'Generate Team Performance Report',
  client: 'Generate Client Satisfaction Report',
};

const complaints = [
  { id: 'CMP-067', priority: 'URGENT', stage: 'INVESTIGATION', title: 'Poor Resume Quality', detail: 'Client reports resume lacks industry-specific keywords and achievements appear generic', applicant: 'Olabanji David', chief: 'Marcus Johnson', client: 'Amanda Waller', date: 'May 30, 2026', tone: 'orange' },
  { id: 'CMP-066', priority: 'HIGH', stage: 'CORRECTIVE ACTION', title: 'Generic Cover Letter', detail: 'Cover letter does not address specific company values or position requirements', applicant: 'Olabanji David', chief: 'Marcus Johnson', client: 'Amanda Waller', date: 'May 30, 2026', tone: 'purple' },
  { id: 'CMP-065', priority: 'HIGH', stage: 'FINDINGS', title: 'Wrong Job Applications', detail: "Multiple applications submitted for positions outside client's experience level", applicant: 'Olabanji David', chief: 'Marcus Johnson', client: 'Amanda Waller', date: 'May 30, 2026', tone: 'blue' },
  { id: 'CMP-064', priority: 'NORMAL', stage: 'RESOLVED', title: 'Communication Issues', detail: 'Client was not informed of application submission delays', applicant: 'Olabanji David', chief: 'Marcus Johnson', client: 'Amanda Waller', date: 'May 30, 2026', tone: 'green' },
];

const chartWeeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];

function Sidebar({ current, open, onClose, basePath = '/team-auditor', queueCount = 0 }) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    setProfileOpen(false);
    onClose?.();
    await logout();
  };

  return (
    <aside className={cx(styles.sidebar, open && styles.sidebarOpen)}>
      <div className={styles.logoWrap}>
        <img src="/logo.svg" alt="ApplyLoop" />
        <span>ApplyLoop</span>
      </div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const count =
            item.key === 'queue'
              ? queueCount
              : item.count;

          return (
            <Link key={item.key} href={item.href.replace('/team-auditor', basePath)} className={cx(styles.navItem, current === item.key && styles.navActive)} onClick={onClose}>
              <Icon />
              <span>{item.label}</span>
              {count ? <b>{count}</b> : null}
            </Link>
          );
        })}
      </nav>
      <div className={styles.sidebarProfile}>
        <button
          type="button"
          className={styles.sidebarUser}
          onClick={() => setProfileOpen((value) => !value)}
          aria-expanded={profileOpen}
          aria-label="Open account menu"
        >
          <img src="/images/team-auditor-profile.png" alt={user?.name || 'Team Lead'} />
          <div>
            <strong>{user?.name || 'Team Lead'}</strong>
            <span>Administrator</span>
          </div>
          <FiChevronDown className={cx(styles.profileChevron, profileOpen && styles.profileChevronOpen)} />
        </button>
        {profileOpen ? (
          <div className={styles.sidebarProfileMenu}>
            <button type="button" onClick={handleLogout}>
              <FiLogOut />
              <span>Sign out</span>
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function PageTitle({ title, subtitle, action }) {
  return (
    <div className={styles.pageTitle}>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function Card({ children, className }) {
  return <section className={cx(styles.card, className)}>{children}</section>;
}

function Button({ children, tone = 'primary', icon: Icon, onClick, className, type = 'button' }) {
  return (
    <button type={type} onClick={onClick} className={cx(styles.button, styles[`button_${tone}`], className)}>
      {Icon ? <Icon /> : null}
      {children}
    </button>
  );
}

function Badge({ children, tone = 'blue' }) {
  return <span className={cx(styles.badge, styles[`badge_${tone}`])}>{children}</span>;
}

function Toggle({ enabled = true, red = false }) {
  return <span className={cx(styles.toggle, enabled && styles.toggleOn, red && styles.toggleRed)}><i /></span>;
}

function FormField({ label, children, full = false }) {
  return (
    <div className={cx(styles.formField, full && styles.formFieldFull)}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function DashboardMetricCard({ item }) {
  const Icon = item.icon;
  return (
    <Card className={styles.metricCard}>
      <div className={styles.metricTopRow}>
        <span className={cx(styles.metricIcon, styles[`tone_${item.tone}`])}><Icon /></span>
        <small className={item.noteTone === 'green' ? styles.greenText : item.noteTone === 'red' ? styles.redText : styles.metricNeutral}>{item.note}</small>
      </div>
      <strong>{item.value}</strong>
      <div className={styles.metricLabel}>{item.title}</div>
    </Card>
  );
}

function ProgressRow({ label, value, change, tone = 'blue', changeTone = 'green' }) {
  return (
    <div className={styles.healthRow}>
      <div className={styles.healthRowHead}>
        <span>{label}</span>
        <div>
          <strong>{value}%</strong>
          <small className={changeTone === 'red' ? styles.redText : styles.greenText}>{change}</small>
        </div>
      </div>
      <div className={styles.progress}><i className={styles[`progress_${tone}`]} style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function MiniLineChart({ values = [94, 92, 95, 97, 96, 98], color = '#10b981', min = 85, max = 100, labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'] }) {
  const width = 760;
  const height = 230;
  const padX = 50;
  const padY = 35;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;
  const points = values.map((v, index) => ({
    x: padX + (usableW * index) / Math.max(1, values.length - 1),
    y: padY + usableH - ((v - min) / (max - min)) * usableH,
  }));
  const path = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const ticks = [min, Math.round((min + max) / 2), max];
  return (
    <svg className={styles.lineChart} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Quality trend chart">
      {ticks.map((tick) => {
        const y = padY + usableH - ((tick - min) / (max - min)) * usableH;
        return <g key={tick}><line x1={padX} x2={width - padX} y1={y} y2={y} className={styles.chartGrid} /><text x={padX - 10} y={y + 4} textAnchor="end">{tick}</text></g>;
      })}
      {labels.map((label, i) => {
        const x = padX + (usableW * i) / Math.max(1, labels.length - 1);
        return <g key={label}><line x1={x} x2={x} y1={padY} y2={height - padY} className={styles.chartGrid} /><text x={x} y={height - 10} textAnchor="middle">{label}</text></g>;
      })}
      <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="5" fill={color} />)}
    </svg>
  );
}

function HorizontalBars() {
  const rows = [['ATS Formatting', 24], ['Missing Keywords', 18], ['Generic Content', 15], ['Achievement Metrics', 12], ['Client Instructions', 9], ['Cover Letter Quality', 7]];
  return <div className={styles.horizontalBars}>{rows.map(([label, value]) => <div className={styles.hBarRow} key={label}><span>{label}</span><div><i style={{ width: `${(value / 24) * 100}%` }} /></div></div>)}</div>;
}

function VerticalBars({ values = [45, 38, 52, 41, 35, 28], labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] }) {
  const max = Math.max(...values);
  return <div className={styles.verticalBars}>{values.map((value, index) => <div className={styles.vBarColumn} key={`${labels[index]}-${value}`}><div className={styles.vBarTrack}><i style={{ height: `${(value / max) * 100}%` }} /></div><span>{labels[index]}</span></div>)}</div>;
}

function DonutChart() {
  return <div className={styles.donutWrap}><div className={styles.donut} /><div className={styles.donutLabels}><span className={styles.greenText}>No Rework:<br />87%</span><span className={styles.redText}>Major Rework:<br />3%</span><span className={styles.orangeText}>Minor Rework:<br />10%</span></div></div>;
}

function QueueStatusBadge({ level }) {
  const tone = level === 'HIGH' ? 'red' : level === 'MEDIUM' ? 'orange' : 'gray';
  return <Badge tone={tone}>{level}</Badge>;
}

function DashboardPage({ openAudit, openBreakdown, auditQueue, auditQueueLoading, auditQueueError }) {
  return (
    <div className={styles.stack}>
      <PageTitle
        title="Welcome back, David"
        subtitle="Here's what's happening with your prompts today."
        action={<div className={styles.pageToolbar}><Button tone="outline">Export Report</Button><Button>Start Random Audit</Button></div>}
      />

      <div className={styles.statsGridFour}>
        {dashboardMetrics.map((item) => <DashboardMetricCard item={item} key={item.title} />)}
      </div>

      <div className={styles.dashboardColumns}>
        <div className={styles.dashboardColumn}>
          <Card>
            <div className={styles.sectionHead}><div><h2>Quality Health Dashboard</h2></div></div>
            <div className={styles.dashboardQualityList}>
              {qualityHealth.map((row) => <ProgressRow key={row.label} {...row} />)}
            </div>
          </Card>

          <Card>
            <div className={styles.sectionHead}><div><h2>Quality Performance Trends</h2><p>6-week quality metrics overview</p></div></div>
            <MiniLineChart values={[94, 92, 95, 97, 96, 98]} min={90} max={100} color="#3b82f6" />
            <div className={styles.chartLegend}><span className={styles.legendGreen}><i /> Pass Rate (%)</span><span className={styles.legendBlue}><i /> Avg Quality Score</span></div>
          </Card>

          <Card>
            <div className={styles.sectionHead}><div><h2>Recent Quality Issues</h2><p>Non-conformances, queries, and complaints</p></div></div>
            <div className={styles.issueList}>
              {recentQualityIssues.map((issue) => (
                <div key={issue.id} className={styles.issueRow}>
                  <div className={cx(styles.issueIcon, styles[`tone_${issue.tone === 'purple' ? 'purple' : issue.tone}`])}>{issue.status === 'pending' ? <FiAlertCircle /> : issue.tone === 'purple' ? <FiAlertTriangle /> : <FiXCircle />}</div>
                  <div className={styles.issueBody}>
                    <div className={styles.issueTop}><strong>{issue.id}</strong><Badge tone={issue.tone}>{issue.status}</Badge></div>
                    <p>{issue.title}</p>
                    <small>{issue.applicant} &nbsp; • &nbsp; {issue.time}</small>
                  </div>
                  <button className={styles.linkButton}>Review</button>
                </div>
              ))}
            </div>
            <button className={styles.linkButton}>View All Issues →</button>
          </Card>
        </div>

        <div className={styles.dashboardColumn}>
          <Card>
            <div className={styles.sectionHead}><div><h2>Live Audit Feed</h2></div></div>
            <div className={styles.liveFeedList}>
              {liveFeed.map(([title, time, tone], index) => (
                <div className={styles.liveFeedItem} key={`${title}-${index}`}>
                  <span className={cx(styles.feedIcon, styles[`tone_${tone}`])}>{tone === 'green' ? <FiCheckCircle /> : tone === 'orange' ? <FiAlertCircle /> : tone === 'red' ? <FiAlertTriangle /> : <FiFileText />}</span>
                  <div>
                    <strong>{title}</strong>
                    <small>{time}</small>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className={styles.sectionHead}><div><h2>Audit Queue</h2><p>Applications pending review</p></div></div>
            <div className={styles.queueMiniList}>
              {auditQueueLoading ? (
                <div className={styles.queueMiniItem}>
                  <p>Loading audit queue...</p>
                </div>
              ) : null}
              {auditQueueError ? (
                <div className={styles.queueMiniItem}>
                  <p>{auditQueueError}</p>
                </div>
              ) : null}
              {!auditQueueLoading && !auditQueueError && auditQueue.length === 0 ? (
                <div className={styles.queueMiniItem}>
                  <p>No applications pending review.</p>
                </div>
              ) : null}
              {auditQueue.map((item) => (
                <div key={item.id} className={styles.queueMiniItem}>
                  <div>
                    <div className={styles.queueMiniTop}><strong>{item.displayId}</strong><QueueStatusBadge level={item.level} /></div>
                    <h3>{item.title}</h3>
                    <p>{item.client}</p>
                    <div className={styles.queueMiniMeta}><span><FiUser /> {item.owner}</span><span><FiClock /> {item.age}</span><span><FiInfo /> {item.source}</span></div>
                  </div>
                  <Button onClick={() => openAudit(item.id)}>Start Audit</Button>
                </div>
              ))}
            </div>
            <button className={styles.linkButton} onClick={() => openAudit()}>View All Audits →</button>
          </Card>
        </div>
      </div>

      <Card className={styles.tableCard}>
        <div className={styles.tableSectionTitle}><h2>Team Quality Performance</h2><p>Individual quality scores and metrics</p></div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>TEAM MEMBER</th><th>QUALITY SCORE</th><th>APPLICATIONS</th><th>PASS RATE</th><th>TREND</th>
              </tr>
            </thead>
            <tbody>
              {teamRows.map((row, index) => (
                <tr key={`${row.name}-${index}`}>
                  <td><strong>{row.name}</strong><small>{row.role}</small></td>
                  <td><span className={cx(styles.scoreBubble, styles[`score_${row.tone}`])}>{row.score}</span></td>
                  <td>{row.applications}</td>
                  <td>{row.pass}</td>
                  <td><span className={row.trend.startsWith('-') ? styles.redText : styles.greenText}><FiTrendingUp /> {row.trend}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className={styles.summaryCardsThree}>
        <Card>
          <h2>Common Quality Issues</h2>
          <div className={styles.summaryList}>
            <div><span><i className={styles.dotRed} /> ATS Formatting</span><strong>12</strong></div>
            <div><span><i className={styles.dotOrange} /> Missing Keywords</span><strong>8</strong></div>
            <div><span><i className={styles.dotOrange} /> Generic Content</span><strong>6</strong></div>
            <div><span><i className={styles.dotBlue} /> Achievement Metrics</span><strong>4</strong></div>
          </div>
        </Card>
        <Card>
          <h2>Audit Distribution</h2>
          <div className={styles.distList}>
            <div><label>Random Audits</label><div className={styles.progress}><i className={styles.progress_blue} style={{ width: '65%' }} /></div><strong>65%</strong></div>
            <div><label>Client Complaints</label><div className={styles.progress}><i className={styles.progress_red} style={{ width: '20%' }} /></div><strong>20%</strong></div>
            <div><label>Quality Queries</label><div className={styles.progress}><i className={styles.progress_orange} style={{ width: '15%' }} /></div><strong>15%</strong></div>
          </div>
        </Card>
        <Card>
          <h2>Compliance Status</h2>
          <div className={styles.summaryList}>
            <div><span>ATS Compliance</span><strong>98% <i className={styles.dotGreen} /></strong></div>
            <div><span>Client Preferences</span><strong>96% <i className={styles.dotGreen} /></strong></div>
            <div><span>Quality Standards</span><strong>89% <i className={styles.dotOrange} /></strong></div>
            <div><span>Documentation</span><strong>100% <i className={styles.dotGreen} /></strong></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AuditQueuePage({ openAudit, auditQueue, auditQueueLoading, auditQueueError }) {
  return (
    <div className={styles.stack}>
      <PageTitle title="Audit Queue" subtitle="Applications pending audit review" />
      <Card className={styles.queueHeaderCard}>
        <div className={styles.tableSectionTitle}><h2>Audit Queue</h2><p>Applications pending review</p></div>
        <div className={styles.queuePageList}>
          {auditQueueLoading ? (
            <div className={styles.queuePageRow}>
              <p>Loading audit queue...</p>
            </div>
          ) : null}
          {auditQueueError ? (
            <div className={styles.queuePageRow}>
              <p>{auditQueueError}</p>
            </div>
          ) : null}
          {!auditQueueLoading && !auditQueueError && auditQueue.length === 0 ? (
            <div className={styles.queuePageRow}>
              <p>No applications pending review.</p>
            </div>
          ) : null}
          {auditQueue.map((item) => (
            <div className={styles.queuePageRow} key={item.id}>
              <div>
                <div className={styles.queueMiniTop}><strong>{item.displayId}</strong><QueueStatusBadge level={item.level} /></div>
                <h3>{item.title}</h3>
                <p>Client: {item.client}</p>
                <div className={styles.queueMiniMeta}><span><FiUser /> {item.owner}</span><span><FiClock /> {item.age}</span><span><FiInfo /> {item.source}</span></div>
              </div>
              <Button onClick={() => openAudit(item.id)}>Start Audit</Button>
            </div>
          ))}
        </div>
        <div className={styles.pagination}>‹ <b>1</b> 2 3 … 6 ›</div>
      </Card>
    </div>
  );
}

function AuditQueueDetailPage({
  audit,
  loading,
  error,
  openModal,
  onBack,
}) {
  if (loading) {
    return (
      <div className={styles.stack}>
        <PageTitle
          title="Audit Queue"
          subtitle="Applications pending audit review"
        />
        <button
          className={styles.backLink}
          onClick={onBack}
        >
          <FiArrowLeft /> Back
        </button>
        <Card className={styles.detailPanel}>
          <p>Loading audit...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stack}>
        <PageTitle
          title="Audit Queue"
          subtitle="Applications pending audit review"
        />
        <button
          className={styles.backLink}
          onClick={onBack}
        >
          <FiArrowLeft /> Back
        </button>
        <Card className={styles.detailPanel}>
          <p>{error}</p>
        </Card>
      </div>
    );
  }

  if (!audit) {
    return null;
  }

  const application =
    audit.application || {};

  const preferences =
    Array.isArray(
      application.preferences
    )
      ? application.preferences
      : [];

  const jobDetails =
    Array.isArray(
      application.jobDetails
    )
      ? application.jobDetails
      : [];

  const otherDetails =
    Array.isArray(
      application.otherDetails
    )
      ? application.otherDetails
      : [];

  return (
    <div className={styles.stack}>
      <PageTitle
        title="Audit Queue"
        subtitle="Applications pending audit review"
      />

      <button
        className={styles.backLink}
        onClick={onBack}
      >
        <FiArrowLeft /> Back
      </button>

      <div className={styles.detailGrid}>
        <Card className={styles.detailPanel}>
          <h2>Job Details</h2>

          <div className={styles.detailStack}>
            <div>
              <label>Audit ID</label>
              <strong>
                {audit.displayId}
              </strong>
            </div>

            <div>
              <label>Client</label>
              <strong>
                {application.client
                  ?.name ||
                  'Client'}
              </strong>
            </div>

            <div>
              <label>Applicant</label>
              <strong>
                {application.applicant
                  ?.name ||
                  'Not assigned'}
              </strong>
            </div>

            <div>
              <label>
                Chief Applicant
              </label>
              <strong>
                {application
                  .chiefApplicant
                  ?.name ||
                  'Not assigned'}
              </strong>
            </div>
          </div>

          <hr
            className={
              styles.detailDivider
            }
          />

          <div className={styles.detailStack}>
            <div>
              <label>Job Title</label>
              <strong>
                {application.position ||
                  'Not recorded'}
              </strong>
            </div>

            <div>
              <label>Company</label>
              <strong>
                {application.company ||
                  'Not recorded'}
              </strong>
            </div>

            <div>
              <label>
                Job Description
              </label>
              <div
                className={
                  styles.notesBox
                }
              >
                {jobDetails.length
                  ? jobDetails.join(
                      ' • '
                    )
                  : 'No job details recorded.'}
              </div>
            </div>

            <div>
              <label>
                Client Preferences
              </label>

              {preferences.length ? (
                <ul
                  className={
                    styles.preferenceList
                  }
                >
                  {preferences.map(
                    (preference) => (
                      <li
                        key={
                          preference
                        }
                      >
                        <FiCheckCircle />
                        {preference}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <div
                  className={
                    styles.notesBox
                  }
                >
                  No client preferences
                  recorded.
                </div>
              )}
            </div>
          </div>
        </Card>

        <div
          className={
            styles.detailRightColumn
          }
        >
          <Card
            className={
              styles.detailPanel
            }
          >
            <h2>Submitted Assets</h2>

            <div
              className={cx(
                styles.assetCard,
                styles.assetCardBlue
              )}
            >
              <div>
                <strong>
                  <FiFileText /> Resume
                  Used
                </strong>

                <p>
                  {application.resume
                    ?.name ||
                    'No resume recorded'}
                </p>

                <small>
                  {application.resume
                    ?.path
                    ? 'Stored document available'
                    : 'No stored file path'}
                </small>
              </div>

              <button
                className={
                  styles.linkButton
                }
                disabled={
                  !application.resume
                    ?.path
                }
              >
                View
              </button>
            </div>

            <div
              className={cx(
                styles.assetCard,
                styles.assetCardGreen
              )}
            >
              <div>
                <strong>
                  <FiFileText /> Cover
                  Letter Used
                </strong>

                <p>
                  {application
                    .coverLetter?.name ||
                    'No cover letter recorded'}
                </p>

                <small>
                  {application
                    .coverLetter?.path
                    ? 'Stored document available'
                    : 'No stored file path'}
                </small>
              </div>

              <button
                className={
                  styles.linkButton
                }
                disabled={
                  !application
                    .coverLetter?.path
                }
              >
                View
              </button>
            </div>

            <div
              className={
                styles.atsCard
              }
            >
              <div
                className={
                  styles.atsScoreTop
                }
              >
                <span>
                  ATS Match Score
                </span>
                <strong>
                  Not available
                </strong>
              </div>

              <div
                className={
                  styles.progress
                }
              >
                <i
                  className={
                    styles.progress_green
                  }
                  style={{
                    width: '0%',
                  }}
                />
              </div>
            </div>

            <div>
              <label>
                Submission Notes
              </label>

              <div
                className={
                  styles.notesBox
                }
              >
                {otherDetails.length
                  ? otherDetails.join(
                      ' • '
                    )
                  : application.feedback ||
                    'No submission notes recorded.'}
              </div>
            </div>
          </Card>

          <Card
            className={
              styles.detailPanel
            }
          >
            <h2
              className={
                styles.centerText
              }
            >
              Audit Actions
            </h2>

            <div
              className={
                styles.actionGrid
              }
            >
              <Button
                tone="success"
                icon={FiCheckCircle}
                onClick={() =>
                  openModal('pass')
                }
              >
                Pass Audit
              </Button>

              <Button
                tone="warning"
                icon={FiAlertCircle}
                onClick={() =>
                  openModal('query')
                }
              >
                Raise Query
              </Button>

              <Button
                tone="primary"
                icon={FiSend}
                onClick={() =>
                  openModal(
                    'correction'
                  )
                }
              >
                Request Correction
              </Button>

              <Button
                tone="danger"
                icon={FiAlertCircle}
                onClick={() =>
                  openModal(
                    'escalate'
                  )
                }
              >
                Escalate Case
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AiAuditingPage() {
  const [mode, setMode] = useState('some');
  const [showFilters, setShowFilters] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [priority, setPriority] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [dateRange, setDateRange] = useState('Today');

  const toggleChip = (list, setList, value) => {
    setList((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const renderChip = (list, setList, value) => (
    <button type="button" key={value} className={cx(styles.pillButton, list.includes(value) && styles.pillActive)} onClick={() => toggleChip(list, setList, value)}>{value}</button>
  );

  if (scanning) {
    return (
      <div className={styles.stack}>
        <PageTitle title="AI Quality Scan" subtitle="Detect errors & QA issues automatically" />
        <div className={styles.scanChoiceGrid}>
          <button className={styles.scanChoice}><span /><div><strong>Scan All</strong><small>All applications in queue</small></div></button>
          <button className={cx(styles.scanChoice, styles.scanChoiceActive)}><span /><div><strong>Scan Some</strong><small>Apply filters to select</small></div></button>
        </div>
        <Card className={styles.scanningWrap}>
          <div className={styles.scanningCircle}><div /></div>
          <h2>AI Scanning in Progress</h2>
          <p>Analyzing App #2844 – Data Scientist...</p>
          <div className={styles.scanningProgressHead}><span>Progress</span><span>77%</span></div>
          <div className={styles.progress}><i className={styles.progress_blue} style={{ width: '77%' }} /></div>
          <div className={styles.scanningList}>
            <div><FiCheckCircle className={styles.greenText} /> Checking ATS compatibility</div>
            <div><FiCheckCircle className={styles.greenText} /> Scanning keyword density</div>
            <div><FiCheckCircle className={styles.greenText} /> Evaluating content quality</div>
            <div><FiClock /> Verifying compliance rules</div>
          </div>
          <div className={styles.scanFooter}><Button tone="outline">Cancel Scan</Button></div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      <PageTitle title="AI Quality Scan" subtitle="Detect errors & QA issues automatically" />
      <div className={styles.scanChoiceGrid}>
        <button className={cx(styles.scanChoice, mode === 'all' && styles.scanChoiceActive)} onClick={() => { setMode('all'); setShowFilters(false); }}>
          <span />
          <div><strong>Scan All</strong><small>All applications in queue</small></div>
        </button>
        <button className={cx(styles.scanChoice, mode === 'some' && styles.scanChoiceActive)} onClick={() => setMode('some')}>
          <span />
          <div><strong>Scan Some</strong><small>Apply filters to select</small></div>
        </button>
      </div>

      {mode === 'some' ? <button className={styles.filterToggle} onClick={() => setShowFilters((value) => !value)}><FiFilter /> Show Filters <FiChevronDown /></button> : null}

      {mode === 'some' && showFilters ? (
        <Card className={styles.filtersCard}>
          <div className={styles.filterGroup}>
            <label>Priority</label>
            <div className={styles.chipsWrap}>{['HIGH', 'MEDIUM', 'LOW'].map((value) => renderChip(priority, setPriority, value))}</div>
          </div>
          <div className={styles.filterGroup}>
            <label>Issue Types</label>
            <div className={styles.chipsWrap}>{['ATS Formatting', 'Missing Keywords', 'Generic Content', 'Achievement Metrics', 'Compliance'].map((value) => renderChip(issueTypes, setIssueTypes, value))}</div>
          </div>
          <div className={styles.filterGroup}>
            <label>Date Range</label>
            <div className={styles.chipsWrap}>{['Today', 'This Week', 'This Month'].map((value) => <button type="button" key={value} className={cx(styles.pillButton, dateRange === value && styles.pillActive)} onClick={() => setDateRange(value)}>{value}</button>)}</div>
          </div>
          <div className={styles.filterGroup}>
            <label>Select Applicant</label>
            <div className={styles.chipsWrap}>{['Olabanji David (Chief)', 'Ratel Patel', 'Olu Olaitan', 'Ebubechukwu Anderson', 'Michael Favour', 'Adeusi OluwaDamilola', 'Lolly Cashier', 'Michael Favour', 'Ratel Patel', 'Ebubechukwu Anderson', 'Olu Olaitan', 'Adeusi OluwaDamilola', 'Lolly Cashier', 'Olabanji David'].map((value, index) => <button key={`${value}-${index}`} type="button" className={cx(styles.pillButton, index === 0 && styles.pillActive)}>{value}</button>)}</div>
          </div>
          <div className={styles.filterGroup}>
            <label>Select Clients</label>
            <div className={styles.chipsWrap}>{['Olabanji David (Chief)', 'Ratel Patel', 'Olu Olaitan', 'Ebubechukwu Anderson', 'Michael Favour', 'Adeusi OluwaDamilola', 'Lolly Cashier', 'Michael Favour', 'Ratel Patel', 'Ebubechukwu Anderson', 'Olu Olaitan', 'Adeusi OluwaDamilola', 'Lolly Cashier', 'Olabanji David'].map((value, index) => <button key={`${value}-${index}`} type="button" className={cx(styles.pillButton, index === 0 && styles.pillActive)}>{value}</button>)}</div>
          </div>
        </Card>
      ) : null}

      <div>
        <h2 className={styles.scanChecksTitle}>AI will check for</h2>
        <div className={styles.auditChecksGrid}>
          <Card className={styles.checkCard}><div><strong><FiTarget /> ATS Compatibility</strong><p>Formatting & parsing issues</p></div></Card>
          <Card className={styles.checkCard}><div><strong><FiSearch /> Keyword Gaps</strong><p>Missing role-specific terms</p></div></Card>
          <Card className={styles.checkCard}><div><strong><FiZap /> Content Quality</strong><p>Generic vs tailored content</p></div></Card>
          <Card className={styles.checkCard}><div><strong><FiSearch /> Achievement Metrics</strong><p>Quantified impact statements</p></div></Card>
          <Card className={styles.checkCard}><div><strong><FiCheckSquare /> Compliance Rules</strong><p>Client preference violations</p></div></Card>
          <Card className={styles.checkCard}><div><strong><FiLink /> Link Validation</strong><p>Broken or inaccessible URLs</p></div></Card>
        </div>
      </div>

      <div className={styles.scanFooter}>
        <Button tone="outline">Cancel</Button>
        <Button icon={FiPlay} onClick={() => setScanning(true)}>Start AI Scan</Button>
      </div>
    </div>
  );
}

function ApplicationReviewsPage({ openReview }) {
  return (
    <div className={styles.stack}>
      <PageTitle title="Application Review Center" subtitle="Advanced review and filtering" action={<Button tone="outline" icon={FiDownload}>Export Report</Button>} />
      <Card>
        <div className={styles.toolbarLarge}>
          <label className={styles.search}><FiSearch /><input placeholder="Search prompts..." /></label>
          <button className={styles.filterIconButton}><FiFilter /></button>
          <select><option>All Teams</option></select>
          <select><option>All Plans</option></select>
          <select><option>All Status</option></select>
        </div>
      </Card>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>APPLICATION ID</th><th>CLIENT NAME</th><th>APPLICANT</th><th>CHIEF APPLICANT</th><th>QUALITY</th><th>SUBMISSION DATE</th><th>AUDIT STATUS</th><th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {applicationReviewRows.map((row, index) => (
              <tr key={`${row.id}-${index}`}>
                <td><strong>{row.id}</strong></td>
                <td>{row.client}</td>
                <td>{row.applicant}</td>
                <td>{row.chief}</td>
                <td><Badge tone={row.qualityTone}>{row.quality}</Badge></td>
                <td>{row.date}</td>
                <td><Badge tone={row.statusTone}>{row.status}</Badge></td>
                <td><button className={styles.linkButton} onClick={() => openReview()}>Review</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.pagination}>‹ <b>1</b> 2 3 … 6 ›</div>
    </div>
  );
}

function TeamQualityPage({ openBreakdown }) {
  return <div className={styles.stack}><PageTitle title="Team Quality Scores" subtitle="Individual performance and quality metrics" /><Card className={styles.tableCard}><div className={styles.tableSectionTitle}><h2>Team Quality Performance</h2><p>Individual quality scores and metrics</p></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>TEAM MEMBER</th><th>QUALITY SCORE</th><th>APPLICATIONS</th><th>PASS RATE</th><th>TREND</th><th>APPROVED PAYOUT</th></tr></thead><tbody>{teamRows.slice(0, 10).map((row, index) => <tr key={`${row.name}-${index}`}><td><strong>{row.name}</strong><small>{row.role}</small></td><td><span className={cx(styles.scoreBubble, styles[`score_${row.tone}`])}>{row.score}</span></td><td>{row.applications}</td><td>{row.pass}</td><td><span className={row.trend.startsWith('-') ? styles.redText : styles.greenText}><FiTrendingUp /> {row.trend}</span></td><td><strong>{row.payout}</strong> <button className={styles.viewBreakdown} onClick={() => openBreakdown(row)}>View Breakdown</button></td></tr>)}</tbody></table></div></Card></div>;
}

function ComplaintsPage({ openModal }) {
  return <div className={styles.stack}><PageTitle title="Client Complaint Center" subtitle="Investigate and resolve client complaints" action={<div className={styles.compactStats}><div><span>Active Complaints</span><strong>3</strong></div><div><span>Resolved This Week</span><strong className={styles.greenText}>5</strong></div></div>} /><Card><h2 className={styles.workflowTitle}>Complaint Workflow</h2><div className={styles.workflow}>{[['1', 'Complaint\nReceived', 'gray'], ['2', 'Investigation', 'orange'], ['3', 'Findings', 'blue'], ['4', 'Corrective Action', 'purple'], ['5', 'Resolution', 'green']].map(([number, label, tone], index) => <div className={styles.workflowItem} key={number}><span className={styles[`workflow_${tone}`]}>{number}</span><p>{label.split('\n').map((part) => <span key={part}>{part}</span>)}</p>{index < 4 ? <i /> : null}</div>)}</div></Card><Card className={styles.complaintsCard}><div className={styles.toolbar}><label className={styles.search}><FiSearch /><input placeholder="Search prompts..." /></label><select><option>Today</option></select><select><option>Today</option></select></div>{complaints.map((item) => <div className={styles.complaintRow} key={item.id}><div className={styles.complaintIcon}><FiMessageSquare /></div><div className={styles.complaintBody}><div className={styles.complaintTop}><strong>{item.id}</strong><Badge tone={item.priority === 'NORMAL' ? 'blue' : 'orange'}>{item.priority}</Badge><Badge tone={item.tone}>{item.stage}</Badge></div><h3>{item.title}</h3><p>{item.detail}</p><div className={styles.complaintMeta}><span><FiUser /> Applicant: {item.applicant}</span><span><FiUser /> Chief Applicant: {item.chief}</span><span><FiUser /> Client: {item.client}</span><span><FiClock /> {item.date}</span></div>{item.stage !== 'RESOLVED' ? <div className={styles.complaintActions}><button onClick={() => openModal('update', item)}>Update Status</button><button onClick={() => openModal('findings', item)}>Add Findings</button><button onClick={() => openModal('resolved', item)}>Mark Resolved</button><button>View Details</button></div> : <div className={styles.complaintActions}><button>View Details</button></div>}</div></div>)}</Card><div className={styles.pagination}>‹ <b>1</b> 2 3 … 6 ›</div></div>;
}

function ReportsPage({ openReport }) {
  return <div className={styles.stack}><PageTitle title="Audit Reports" subtitle="Generate and export comprehensive audit reports" /><Card className={styles.reportIntro}><div><h2>Audit Reports</h2><p>Generate and export comprehensive audit reports</p></div><select><option>Today</option></select></Card><div className={styles.reportGrid}>{reportCards.map((report) => <Card key={report.key} className={styles.reportCard}><div className={cx(styles.reportIcon, styles[`report_${report.tone}`])}><FiFileText /></div><h3>{report.title}</h3><p>{report.detail}</p><Button tone="outline" onClick={() => openReport(report.key)}>Generate Report</Button></Card>)}</div><Card className={styles.recentReports}><div className={styles.recentReportsHead}><h2>Recent Reports</h2><div><FiFilter /><select><option>All Teams</option></select><select><option>All Plans</option></select></div></div>{[['Daily Audit Summary - May 30, 2026', '47 applications audited, 96.8% pass rate', 'Ready'], ['Weekly Quality Report - Week 22', '328 applications reviewed, 94.2% quality score', 'Ready'], ['Monthly Compliance - May 2026', 'Compliance score: 94.2%, 3 non-conformances', 'Generating...']].map(([title, detail, status], index) => <div className={styles.recentReportRow} key={title}><div><strong>{title}</strong> <Badge tone={status === 'Ready' ? 'green' : 'orange'}>{status}</Badge><p>{detail}</p><small>Report ID: RPT-2024-05-{index + 1} · Period: May 2026 · Generated: May 30, 2026</small></div>{status === 'Ready' ? <div className={styles.downloadButtons}><Button tone="downloadRed" icon={FiDownload}>PDF</Button><Button tone="downloadGreen" icon={FiDownload}>Excel</Button><Button tone="downloadBlue" icon={FiDownload}>CSV</Button></div> : null}</div>)}</Card></div>;
}

function AnalyticsPage() {
  return <div className={styles.stack}><PageTitle title="Analytics & Trends" subtitle="Comprehensive quality metrics" /><Card className={styles.analyticsIntro}><FiTrendingUp /><div><h2>Analytics & Quality Trends</h2><p>Comprehensive quality metrics and performance insights</p></div></Card><Card><div className={styles.sectionHead}><h2>Quality Pass Rate Trend</h2><select><option>Select Applicant</option></select></div><MiniLineChart /></Card><div className={styles.twoColumn}><Card><h2>Most Common Errors</h2><HorizontalBars /></Card><Card><h2>Rework Percentage</h2><DonutChart /></Card></div><div className={styles.twoColumn}><Card><h2>Query Volume Trend</h2><VerticalBars /></Card><Card><h2>Client Complaint Trend</h2><MiniLineChart values={[12, 9, 15, 8, 6, 4]} min={0} max={16} color="#ef4444" labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']} /></Card></div></div>;
}

function SliderRow({ label, value, tone = 'blue' }) {
  return <div className={styles.sliderRow}><label>{label}</label><div><span><i className={styles[`slider_${tone}`]} style={{ width: `${value}%` }} /><b style={{ left: `${value}%` }} /></span><strong className={tone === 'green' ? styles.greenText : styles.blueText}>{value}%</strong></div></div>;
}

function PersonalSettings() {
  return <div className={styles.profileForm}><div className={styles.formGrid}><FormField label="Full Name" full><input value="Olabanji David T." readOnly /></FormField><FormField label="Designation" full><input value="Chief Applicant" readOnly /></FormField><FormField label="Email Address"><input value="banjidhevid216@gmail.com" readOnly /></FormField><FormField label="Phone Number"><input value="+234 811 474 6609" readOnly /></FormField><FormField label="Nationality"><input value="Nigeria" readOnly /></FormField><FormField label="State/Province"><input value="Lagos" readOnly /></FormField></div><Button className={styles.saveSmall}>Save Changes</Button><h2 className={styles.profileSectionTitle}>Security</h2><div className={styles.formGrid}><FormField label="Current Password" full><input type="password" value="password" readOnly /></FormField><FormField label="New Password" full><input type="password" value="password" readOnly /></FormField><FormField label="Confirm New Password" full><input type="password" value="password" readOnly /></FormField></div><Button className={styles.saveSmall}>Save Changes</Button><h2 className={styles.profileSectionTitle}>Notification Preferencessss</h2><div className={styles.notificationList}>{[['Email Notifications', 'Receive updates via Email', true], ['Deadline Alerts', 'Get notified about upcoming deadlines', true], ['Escalation Notifications', 'Alert on new escalations', true], ['Team Activity', 'Updates on team performance', false]].map(([title, detail, enabled]) => <div key={title}><span><strong>{title}</strong><small>{detail}</small></span><Toggle enabled={enabled} /></div>)}</div></div>;
}

function AuditRulesSettings() {
  return <div className={styles.rulesStack}><Card className={styles.settingsPanel}><div className={styles.panelHeading}><FiInfo /><h2>Audit Rules</h2></div><div className={styles.twoColumnCompact}><SliderRow label="Random Audit Percentage" value={85} /><SliderRow label="Premium Client Audit Rate" value={30} /><FormField label="Minimum Audit Score"><input value="85" readOnly /><small>Minimum score required to pass audit</small></FormField></div></Card><Card className={styles.settingsPanel}><div className={styles.panelHeading}><FiShield /><h2>Quality Thresholds</h2></div><div className={styles.twoColumnCompact}><SliderRow label="Overall Pass Threshold" value={90} tone="green" /><SliderRow label="ATS Compliance Threshold" value={95} tone="green" /><SliderRow label="Resume Quality Threshold" value={88} /><SliderRow label="Cover Letter Quality Threshold" value={85} /></div></Card><Card className={styles.settingsPanel}><div className={styles.panelHeading}><h2>Compliance Policies</h2></div><div className={styles.policyList}>{[['Mandatory ATS Check', 'Require ATS compliance check before submission'], ['Client Preference Validation', 'Verify adherence to client-specific requirements'], ['Dual Review for Premium Clients', 'Require two auditors for premium tier applications']].map(([title, detail]) => <div key={title}><span><strong>{title}</strong><small>{detail}</small></span><Toggle /></div>)}</div></Card><Card className={styles.settingsPanel}><div className={styles.panelHeading}><h2>Escalation Rules</h2></div><div className={styles.twoColumnCompact}><FormField label="Auto-Escalate Score Threshold"><input value="70" readOnly /><small>Automatically escalate if quality score falls below this threshold</small></FormField><FormField label="Escalate After Query Count"><input value="3" readOnly /><small>Escalate applicant after this many quality queries</small></FormField></div><div className={styles.criticalRule}><span><strong>Auto-Escalate Critical Client Issues</strong><small>Immediately escalate any premium/critical client complaints</small></span><Toggle red /></div></Card></div>;
}

function SettingsPage() {
  const [tab, setTab] = useState('personal');
  return <div className={styles.stack}><PageTitle title="Profile & Settings" subtitle="manage your account setting and preference" action={<button className={styles.bell}><FiBell /></button>} /><img src="/images/team-auditor-profile.png" className={styles.profilePhoto} alt="Profile" /><div className={styles.profileTabs}><button className={tab === 'personal' ? styles.profileTabActive : ''} onClick={() => setTab('personal')}>Personal Information</button><button className={tab === 'rules' ? styles.profileTabActive : ''} onClick={() => setTab('rules')}>Location & Work Authorization</button></div>{tab === 'personal' ? <PersonalSettings /> : <AuditRulesSettings />}</div>;
}

function Modal({ title, subtitle, children, footer, onClose, wide = false }) {
  return <div className={styles.modalWrap}><button className={styles.modalBackdrop} onClick={onClose} aria-label="Close modal" /><div className={cx(styles.modalCard, wide && styles.modalWide)}><header><div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div><button onClick={onClose}><FiX /></button></header><div className={styles.modalBody}>{children}</div>{footer ? <footer>{footer}</footer> : null}</div></div>;
}

function ReportModal({ type, onClose }) {
  const title = reportTitles[type] || reportTitles.daily;
  const innerTitle = title.replace('Generate ', '');
  return <Modal title={title} onClose={onClose} footer={<><Button tone="outline" onClick={onClose}>Cancel</Button><Button>Generate & Download</Button></>}><div className={styles.reportModalBanner}><strong>{innerTitle}</strong><span>Configure report parameters and export format</span></div><FormField label="Date Range"><select><option>Today</option><option>Last 7 Days</option><option>This Month</option></select></FormField><div><span className={styles.fieldTitle}>Export Format</span><div className={styles.formatGrid}><button className={styles.formatSelected}><FiFileText /><span>PDF</span></button><button><FiFileText /><span>Excel</span></button><button><FiBarChart2 /><span>CSV</span></button></div></div><label className={styles.checkbox}><input type="checkbox" defaultChecked /> Include charts and visualizations</label><label className={styles.checkbox}><input type="checkbox" defaultChecked /> Include executive summary</label></Modal>;
}

function ActionModal({
  type,
  audit,
  onClose,
  onPassed,
}) {
  const [qualityScore, setQualityScore] =
    useState(100);
  const [comments, setComments] =
    useState('');
  const [submitting, setSubmitting] =
    useState(false);
  const [submitError, setSubmitError] =
    useState('');

  const handlePassAudit =
    async () => {
      if (!audit?.id) {
        setSubmitError(
          'The audit could not be identified.'
        );
        return;
      }

      try {
        setSubmitting(true);
        setSubmitError('');

        const supabase =
          createClient();

        const {
          data: {
            session,
          },
          error: sessionError,
        } =
          await supabase.auth
            .getSession();

        if (
          sessionError ||
          !session?.access_token
        ) {
          throw new Error(
            'Your session could not be verified.'
          );
        }

        const response =
          await fetch(
            `/api/audits/${encodeURIComponent(
              audit.id
            )}/approve`,
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
                'Content-Type':
                  'application/json',
              },
              body:
                JSON.stringify({
                  qualityScore,
                  comments,
                }),
            }
          );

        const body =
          await response.json();

        if (!response.ok) {
          throw new Error(
            body.error ||
              'The audit could not be passed.'
          );
        }

        await onPassed?.(
          body.audit
        );

        onClose();
      } catch (error) {
        setSubmitError(
          error.message ||
            'The audit could not be passed.'
        );
      } finally {
        setSubmitting(false);
      }
    };

  if (type === 'pass') {
    return (
      <Modal
        title="Pass Audit"
        onClose={onClose}
        footer={
          <>
            <Button
              tone="outline"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              tone="success"
              onClick={
                handlePassAudit
              }
              disabled={
                submitting
              }
            >
              {submitting
                ? 'Passing...'
                : 'Pass Audit'}
            </Button>
          </>
        }
      >
        <div
          className={cx(
            styles.actionBanner,
            styles.actionGreen
          )}
        >
          <FiCheckCircle />

          <span>
            <strong>
              Audit Assessment
            </strong>

            <small>
              You are about to mark
              application{' '}
              {audit?.displayId ||
                'audit'}{' '}
              as passed.
            </small>
          </span>
        </div>

        <FormField
          label="Quality Score (0-100)"
        >
          <div
            className={
              styles.scoreSlider
            }
          >
            <input
              type="range"
              min="0"
              max="100"
              value={
                qualityScore
              }
              onChange={(
                event
              ) =>
                setQualityScore(
                  Number(
                    event.target
                      .value
                  )
                )
              }
            />

            <strong>
              {qualityScore}
            </strong>
          </div>
        </FormField>

        <FormField
          label="Audit Comments"
        >
          <textarea
            rows="5"
            value={comments}
            maxLength="5000"
            placeholder="Add any notes about the quality assessment..."
            onChange={(
              event
            ) =>
              setComments(
                event.target.value
              )
            }
          />
        </FormField>

        {submitError ? (
          <p>
            {submitError}
          </p>
        ) : null}
      </Modal>
    );
  }

  if (type === 'query') return <Modal title="Raise Quality Query" onClose={onClose} footer={<><Button tone="outline" onClick={onClose}>Cancel</Button><Button tone="warning">Raise Query</Button></>}><div className={cx(styles.actionBanner, styles.actionOrange)}><FiAlertCircle /><span><strong>Quality Issue Detected</strong><small>Document the quality concern for this application.</small></span></div><div className={styles.formGrid}><FormField label="Query Category"><select><option>Select Category</option></select></FormField><FormField label="Severity Level"><select><option>Medium</option></select></FormField><FormField label="Issue Description" full><textarea rows="6" placeholder="Describe the quality issue in detail..." /></FormField><FormField label="Response Due Date" full><input /></FormField></div></Modal>;

  if (type === 'correction') return <Modal title="Request Correction" onClose={onClose} footer={<><Button tone="outline" onClick={onClose}>Cancel</Button><Button>Send Request</Button></>}><div className={cx(styles.actionBanner, styles.actionBlue)}><FiSend /><span><strong>Correction Required</strong><small>Request corrections for this application.</small></span></div><div className={styles.formGrid}><FormField label="Assign To"><input /></FormField><FormField label="Priority"><input /></FormField><FormField label="Required Corrections" full><textarea rows="7" placeholder="List specific corrections needed..." /></FormField></div></Modal>;

  if (type === 'escalate') return <Modal title="Escalate Case" onClose={onClose} footer={<><Button tone="outline" onClick={onClose}>Cancel</Button><Button tone="danger">Escalate Now</Button></>}><div className={cx(styles.actionBanner, styles.actionRed)}><FiAlertCircle /><span><strong>Critical Issue - Escalation Required</strong><small>Escalate this application to senior management.</small></span></div><div className={styles.formGrid}><FormField label="Escalate To"><input /></FormField><FormField label="Urgency Level"><input /></FormField><FormField label="Escalation Reason" full><textarea rows="7" placeholder="Explain why this case requires escalation..." /></FormField></div></Modal>;

  return null;
}

function ComplaintModal({ type, item, onClose }) {
  const id = item?.id || 'CMP-067';
  if (type === 'resolved') return <Modal title="Mark as Resolved" subtitle={`Mark complaint ${id} as resolved? The client will be notified.`} onClose={onClose} footer={<><Button tone="outline" onClick={onClose}>Cancel</Button><Button>Mark Resolved</Button></>} />;
  if (type === 'findings') return <Modal title={`Add Findings - ${id}`} onClose={onClose} footer={<><Button tone="outline" onClick={onClose}>Cancel</Button><Button tone="purple">Save Findings</Button></>}><FormField label="Investigation Findings"><textarea rows="7" placeholder="Document investigation findings..." /></FormField><FormField label="Root Cause"><textarea rows="4" placeholder="Identify root cause..." /></FormField></Modal>;
  if (type === 'update') return <Modal title={`Update Status - ${id}`} onClose={onClose} footer={<><Button tone="outline" onClick={onClose}>Cancel</Button><Button>Update Status</Button></>}><FormField label="New Status"><input /></FormField><FormField label="Notes"><textarea rows="5" placeholder="Add status update notes..." /></FormField></Modal>;
  return null;
}

function PayoutBreakdownModal({ row, onClose }) {
  const person = row || teamRows[1];
  return <Modal title={person.name} subtitle={person.role} onClose={onClose} wide footer={<><Button tone="outline" onClick={onClose}>Close</Button><Button>Approve Payout — $454.00</Button></>}><div className={styles.personModalHeader}><span className={styles.initialAvatar}>{person.name.split(' ').map((part) => part[0]).join('')}</span><div className={styles.personModalStats}><div><span>Quality Score</span><strong className={styles.greenText}>{person.score}</strong></div><div><span>Applications</span><strong>{person.applications}</strong></div><div><span>Pass Rate</span><strong>{person.pass}</strong></div><div><span>Trend</span><strong className={styles.greenText}>↗ +2.3%</strong></div></div></div><div className={styles.earningsTitle}><h3><FiCheckCircle /> Activities & Earnings</h3><strong>+$490.00</strong></div><div className={styles.earningList}>{[['Completed 15 application audits', 'Jun 12, 2026', 'Audit', '+$150.00'], ['Cover letter quality review (10 apps)', 'Jun 11, 2026', 'Review', '+$100.00'], ['Quality performance bonus — 96% pass rate', 'Jun 10, 2026', 'Bonus', '+$70.00'], ['Completed 12 application audits', 'Jun 9, 2026', 'Audit', '+$120.00'], ['Peer quality review session', 'Jun 8, 2026', 'Review', '+$50.00']].map(([title, date, tag, amount]) => <div key={title}><span><strong>{title}</strong><small><FiClock /> {date} <Badge tone="green">{tag}</Badge></small></span><b className={styles.greenText}>{amount}</b></div>)}</div><div className={styles.earningsTitle}><h3><FiAlertCircle /> Deductions</h3><strong className={styles.redText}>-36.00</strong></div><div className={styles.earningList}>{[['QRY-888 — Quality query not resolved within SLA', 'Jun 12, 2026', 'Quality', '$-20.00'], ['CMP-061 — Client complaint (generic content)', 'Jun 10, 2026', 'Complaint', '$-16.00']].map(([title, date, tag, amount]) => <div key={title}><span><strong>{title}</strong><small><FiClock /> {date} <Badge tone="orange">{tag}</Badge></small></span><b className={styles.redText}>{amount}</b></div>)}</div><div className={styles.payoutSummary}><h3>Payout Summary</h3><div><span>Gross Earnings</span><strong>+$490.00</strong></div><div><span>Total Deductions</span><strong className={styles.redText}>-36.00</strong></div><div className={styles.approvedPayout}><span>$ &nbsp; Approved Payout</span><strong>$454.00</strong></div><footer><span>Period: Jun 7 – Jun 13, 2026</span><b>Awaiting approval</b></footer></div></Modal>;
}

export default function TeamAuditorPortal({
  basePath = '/team-auditor',
  portalTitle = 'Team Auditor',
  requiredRole = 'team_auditor',
}) {
  const router = useRouter();
  const { user } = useAuth();
  const hasWorkspaceAccess =
    user?.role === requiredRole;
  const segments = Array.isArray(router.query.section) ? router.query.section : router.query.section ? [router.query.section] : [];
  const section = routeToSection(segments);
  const detailId = section === 'queue' && segments[1] ? segments[1] : null;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [auditQueue, setAuditQueue] = useState([]);
  const [auditQueueLoading, setAuditQueueLoading] = useState(true);
  const [auditQueueError, setAuditQueueError] = useState('');
  const [auditDetail, setAuditDetail] = useState(null);
  const [auditDetailLoading, setAuditDetailLoading] = useState(false);
  const [auditDetailError, setAuditDetailError] = useState('');

  useEffect(() => {
    if (
      user?.role &&
      !hasWorkspaceAccess
    ) {
      router.replace(
        getRoleHome(user.role)
      );
    }
  }, [
    hasWorkspaceAccess,
    router,
    user?.role,
  ]);

  useEffect(() => {
    if (!hasWorkspaceAccess) {
      setAuditQueue([]);
      setAuditQueueError('');
      setAuditQueueLoading(false);
      return undefined;
    }

    let cancelled = false;

    const loadAuditQueue = async () => {
      try {
        setAuditQueueLoading(true);
        setAuditQueueError('');

        const supabase =
          createClient();

        const {
          data: {
            session,
          },
          error: sessionError,
        } =
          await supabase.auth
            .getSession();

        if (
          sessionError ||
          !session?.access_token
        ) {
          throw new Error(
            'Your session could not be verified.'
          );
        }

        const response =
          await fetch(
            '/api/audits',
            {
              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
              },
            }
          );

        const body =
          await response.json();

        if (!response.ok) {
          throw new Error(
            body.error ||
            'The audit queue could not be loaded.'
          );
        }

        if (!cancelled) {
          setAuditQueue(
            (body.audits || []).map(
              formatAuditQueueItem
            )
          );
        }
      } catch (error) {
        if (!cancelled) {
          setAuditQueue([]);
          setAuditQueueError(
            error.message ||
            'The audit queue could not be loaded.'
          );
        }
      } finally {
        if (!cancelled) {
          setAuditQueueLoading(
            false
          );
        }
      }
    };

    loadAuditQueue();

    return () => {
      cancelled = true;
    };
  }, [hasWorkspaceAccess]);

  useEffect(() => {
    if (
      !hasWorkspaceAccess ||
      !detailId
    ) {
      setAuditDetail(null);
      setAuditDetailError('');
      setAuditDetailLoading(false);
      return undefined;
    }

    let cancelled = false;

    const loadAuditDetail =
      async () => {
        try {
          setAuditDetailLoading(
            true
          );

          setAuditDetailError('');

          const supabase =
            createClient();

          const {
            data: {
              session,
            },
            error: sessionError,
          } =
            await supabase.auth
              .getSession();

          if (
            sessionError ||
            !session?.access_token
          ) {
            throw new Error(
              'Your session could not be verified.'
            );
          }

          const response =
            await fetch(
              `/api/audits/${encodeURIComponent(
                detailId
              )}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${session.access_token}`,
                },
              }
            );

          const body =
            await response.json();

          if (!response.ok) {
            throw new Error(
              body.error ||
                'The audit could not be loaded.'
            );
          }

          if (!cancelled) {
            setAuditDetail(
              body.audit
            );
          }
        } catch (error) {
          if (!cancelled) {
            setAuditDetail(null);

            setAuditDetailError(
              error.message ||
                'The audit could not be loaded.'
            );
          }
        } finally {
          if (!cancelled) {
            setAuditDetailLoading(
              false
            );
          }
        }
      };

    loadAuditDetail();

    return () => {
      cancelled = true;
    };
  }, [
    detailId,
    hasWorkspaceAccess,
  ]);

  const openAuditDetail = (id) => {
    if (!id) {
      return router.push(
        `${basePath}/audit-queue`
      );
    }

    return router.push(
      `${basePath}/audit-queue/${id}`
    );
  };

  const handleAuditPassed =
    async (passedAudit) => {
      setAuditQueue(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              passedAudit.id
          )
      );

      setAuditDetail(
        (current) =>
          current?.id ===
          passedAudit.id
            ? {
                ...current,
                ...passedAudit,
              }
            : current
      );

      await router.push(
        `${basePath}/audit-queue`
      );
    };

  if (!hasWorkspaceAccess) {
    return null;
  }

  const page = {
    dashboard: <DashboardPage openAudit={openAuditDetail} openBreakdown={(row) => { setSelected(row); setModal('payout'); }} auditQueue={auditQueue} auditQueueLoading={auditQueueLoading} auditQueueError={auditQueueError} />,
    queue: detailId ? <AuditQueueDetailPage audit={auditDetail} loading={auditDetailLoading} error={auditDetailError} openModal={(type) => { setSelected(auditDetail); setModal(type); }} onBack={() => router.push(`${basePath}/audit-queue`)} /> : <AuditQueuePage openAudit={openAuditDetail} auditQueue={auditQueue} auditQueueLoading={auditQueueLoading} auditQueueError={auditQueueError} />,
    ai: <AiAuditingPage />,
    reviews: <ApplicationReviewsPage openReview={() => openAuditDetail('AUD-2847')} />,
    quality: <TeamQualityPage openBreakdown={(row) => { setSelected(row); setModal('payout'); }} />,
    complaints: <ComplaintsPage openModal={(type, item) => { setSelected(item); setModal(type); }} />,
    reports: <ReportsPage openReport={(type) => { setSelected(type); setModal('report'); }} />,
    analytics: <AnalyticsPage />,
    settings: <SettingsPage />,
  }[section];

  return (
    <>
      <Head><title>{portalTitle} | ApplyLoop</title></Head>
      <div className={styles.app}>
        {mobileOpen ? <button className={styles.backdrop} onClick={() => setMobileOpen(false)} aria-label="Close navigation" /> : null}
        <Sidebar current={section} open={mobileOpen} onClose={() => setMobileOpen(false)} basePath={basePath} queueCount={auditQueue.length} />
        <main className={styles.main}>
          <div className={styles.mobileHeader}><button onClick={() => setMobileOpen(true)}><FiMenu /></button><strong>ApplyLoop</strong><button><FiBell /></button></div>
          <div className={styles.surface}>{page}</div>
        </main>
      </div>
      {modal === 'payout' ? <PayoutBreakdownModal row={selected} onClose={() => setModal(null)} /> : null}
      {modal === 'report' ? <ReportModal type={selected} onClose={() => setModal(null)} /> : null}
      {['pass', 'query', 'correction', 'escalate'].includes(modal) ? <ActionModal type={modal} audit={selected} onPassed={handleAuditPassed} onClose={() => setModal(null)} /> : null}
      {['update', 'findings', 'resolved'].includes(modal) ? <ComplaintModal type={modal} item={selected} onClose={() => setModal(null)} /> : null}
    </>
  );
}
