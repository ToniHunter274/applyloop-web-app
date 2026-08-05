import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiAlertTriangle,
  FiAward,
  FiBarChart2,
  FiBell,
  FiBriefcase,
  FiChevronDown,
  FiClock,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiEdit2,
  FiEye,
  FiFileText,
  FiGrid,
  FiHome,
  FiMenu,
  FiMessageSquare,
  FiPauseCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiTrendingUp,
  FiUser,
  FiUserPlus,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { HiOutlineLightBulb, HiOutlineUserGroup } from 'react-icons/hi';
import { FaCrown, FaRegGem } from 'react-icons/fa';
import { useAuth } from '../../shared/context/AuthContext';
import { getRoleHome, USER_ROLES } from '../../shared/config/roles';
import styles from './OwnerPortal.module.css';
import { AxisBarChart, AxisLineChart, AxisMultiLineChart, ConversionFunnelChart } from './OwnerCharts';
import { AnalyticsReportsPage, ClientDetailsPage, EscalationsIssuesPage, PromptSystemPage, SettingsPage } from './OwnerExtraPages';

const cn = (...values) => values.filter(Boolean).join(' ');

const OWNER_NAV_ITEMS = [
  { section: 'dashboard', href: '/owner', label: 'Dashboard', icon: FiHome },
  { section: 'client-management', href: '/owner/client-management', label: 'Client Management', icon: HiOutlineUserGroup },
  { section: 'applicants-management', href: '/owner/applicants-management', label: 'Applicants Management', icon: FiBriefcase },
  { section: 'chief-applicants', href: '/owner/chief-applicants', label: 'Chief Applicants', icon: FiGrid },
  { section: 'application-operations', href: '/owner/application-operations', label: 'Application Operations', icon: FiFileText },
  { section: 'subscription-revenue', href: '/owner/subscription-revenue', label: 'Subscription & Revenue', icon: FiCreditCard },
  { section: 'prompt-system', href: '/owner/prompt-system', label: 'Prompt System', icon: FiFileText },
  { section: 'analytics-reports', href: '/owner/analytics-reports', label: 'Analytics & Reports', icon: FiBarChart2 },
  { section: 'payroll-system', href: '/owner/payroll-system', label: 'Payroll System', icon: FiDollarSign },
  { section: 'escalations-issues', href: '/owner/escalations-issues', label: 'Escalations & Issues', icon: FiAlertTriangle },
  { section: 'settings', href: '/owner/settings', label: 'Settings', icon: FiSettings },
];

const OPERATIONS_NAV_ITEMS = [
  { section: 'client-management', href: '/operations/client-management', label: 'Client Management', icon: HiOutlineUserGroup },
  { section: 'applicants-management', href: '/operations/applicants-management', label: 'Applicants Management', icon: FiBriefcase },
  { section: 'chief-applicants', href: '/operations/chief-applicants', label: 'Chief Applicants', icon: FiGrid },
  { section: 'application-operations', href: '/operations/application-operations', label: 'Application Operations', icon: FiFileText },
];

const OPERATIONS_SECTIONS = new Set(OPERATIONS_NAV_ITEMS.map((item) => item.section));

const PAGE_META = {
  dashboard: ['Dashboard', 'Mission Control - Complete visibility and control over your platform'],
  'client-management': ['Client Management', 'Manage all client accounts, subscriptions, and assignments'],
  'applicants-management': ['Applicants Management', 'Manage workers, assign workload, and track productivity'],
  'chief-applicants': ['Chief Applicants', 'Manage workers, assign workload, and track productivity'],
  'application-operations': ['Application Operations', 'Main operational control panel for all applications'],
  'subscription-revenue': ['Subscription & Revenue', 'Financial management dashboard and revenue analytics'],
  'prompt-system': ['Prompt System', 'Manage prompt configurations and workflow templates'],
  'analytics-reports': ['Analytics & Reports', 'Explore platform metrics and exported reports'],
  'payroll-system': ['Payroll System', 'Track worker payments based on applications completed'],
  'escalations-issues': ['Escalations & Issues', 'Review operational escalations and urgent account issues'],
  settings: ['Settings', 'Manage workspace settings and platform rules'],
};

const dashboardCards = [
  { label: 'TOTAL ACTIVE CLIENTS', value: '342', note: '+12.5% from last month', tone: 'green', icon: HiOutlineUserGroup, iconTone: 'blue' },
  { label: 'APPLICATIONS\nSUBMITTED', value: '1,245', note: '+8.3% this week', tone: 'green', icon: FiFileText, iconTone: 'gray' },
  { label: 'MONTHLY REVENUE', value: '$75,420', note: '+18.2% from last month', tone: 'green', icon: FiDollarSign, iconTone: 'green' },
  { label: 'ACTIVE APPLICANTS', value: '892', note: '+6.7% from last week', tone: 'green', icon: FiBriefcase, iconTone: 'blue' },
  { label: 'CHIEF APPLICANTS', value: '24', note: 'Stable', tone: 'neutral', icon: FaRegGem, iconTone: 'orange' },
  { label: 'INTERVIEW\nSUCCESS RATE', value: '87', note: '+2.1% improvement', tone: 'green', icon: FiTrendingUp, iconTone: 'green' },
  { label: 'PENDING ESCALATIONS', value: '15', note: '-3 from yesterday', tone: 'green', icon: FiAlertTriangle, iconTone: 'red' },
  { label: 'SUBSCRIPTION\nRENEWAL', value: '6', note: 'Due this week', tone: 'neutral', icon: FiRefreshCw, iconTone: 'blue' },
];

const dashboardFeed = [
  ['Applicant Sarah Johnson\nsubmitted 12 applications', '2 minutes ago', 'green'],
  ['Premium client "Amanda\nWaller" assigned', '5 minutes ago', 'blue'],
  ['Subscription renewed -\nEnterprise Plan', '12 minutes ago', 'purple'],
  ['Chief Applicant approved task\nfor review', '18 minutes ago', 'amber'],
  ['Interview scheduled: Michael\nChen - Google', '23 minutes ago', 'green'],
  ['New client onboarded - Pro\nPlan', '31 minutes ago', 'blue'],
];

const clients = [
  { name: 'Maya Patel', plan: 'Standard', applications: 245, interviews: 68, team: 'Team Alpha', status: 'Active', revenue: '$12,500' },
  { name: 'Luis Garcia', plan: 'Premium', applications: 128, interviews: 34, team: 'Team Beta', status: 'Active', revenue: '$4,200' },
  { name: 'Amina Yusuf', plan: 'Standard', applications: 89, interviews: 21, team: 'Team Gamma', status: 'Paused', revenue: '$2,100' },
  { name: 'Ethan Brown', plan: 'Standard', applications: 156, interviews: 45, team: 'Team Alpha', status: 'Active', revenue: '$4,800' },
  { name: 'Michael Chen', plan: 'Standard', applications: 312, interviews: 92, team: 'Team Delta', status: 'Completed', revenue: '$15,000' },
  { name: 'Sophia Martinez', plan: 'Premium', applications: 415, interviews: 120, team: 'Team Alpha', status: 'Completed', revenue: '$22,500' },
  { name: "Liam O'Connor", plan: 'Basic', applications: 210, interviews: 75, team: 'Team Gamma', status: 'Completed', revenue: '$8,750' },
];

const applicants = [
  { name: 'Sarah Chen', summary: '187 completed • 2.3 hrs avg', status: 'Available', tasks: 15, rating: '4.8 ★', completion: 72 },
  { name: 'Olabanji David', summary: '187 completed • 2.3 hrs avg', status: 'Available', tasks: 15, rating: '4.8 ★', completion: 72 },
  { name: 'Ivan Anderson', summary: '187 completed • 2.3 hrs avg', status: 'Available', tasks: 15, rating: '4.8 ★', completion: 72 },
  { name: 'Saturn Imam', summary: '187 completed • 2.3 hrs avg', status: 'Available', tasks: 15, rating: '4.8 ★', completion: 72 },
  { name: 'Jefferson Stan', summary: '187 completed • 2.3 hrs avg', status: 'Paused', tasks: 15, rating: '4.8 ★', completion: 72 },
  { name: 'Waller Amanda', summary: '187 completed • 2.3 hrs avg', status: 'Paused', tasks: 15, rating: '4.8 ★', completion: 72 },
  { name: 'Jan Norlan', summary: '187 completed • 2.3 hrs avg', status: 'Paused', tasks: 15, rating: '4.8 ★', completion: 72 },
  { name: 'Supe Anderson', summary: '187 completed • 2.3 hrs avg', status: 'Available', tasks: 15, rating: '4.8 ★', completion: 72 },
  { name: 'Santahs Rue', summary: '187 completed • 2.3 hrs avg', status: 'Paused', tasks: 15, rating: '4.8 ★', completion: 72 },
];

const chiefs = [
  { initials: 'MW', name: 'Marcus Williams', team: 'Team Alpha', teamSize: 45, completion: 92, accuracy: 96, onTime: 94, reviewed: '1,245' },
  { initials: 'JC', name: 'Jasmine Carter', team: 'Team Beta', teamSize: 38, completion: 88, accuracy: 93, onTime: 90, reviewed: '1,032' },
  { initials: 'RD', name: 'Ravi Desai', team: 'Team Gamma', teamSize: 52, completion: 95, accuracy: 98, onTime: 97, reviewed: '1,487' },
  { initials: 'RD', name: 'James Anderson', team: 'Team Delta', teamSize: 42, completion: 90, accuracy: 94, onTime: 89, reviewed: '1,878' },
];

const operations = [
  { client: 'Maya Patel', applicant: 'Olabanji David', chief: 'Raya Dava', status: 'Submitted', deadline: '2026-05-23', quality: 'Approved' },
  { client: 'Israel Moon', applicant: 'Olabanji David', chief: 'Raya Dava', status: 'Pending', deadline: '2026-05-23', quality: 'Pending' },
  { client: 'Israel Moon', applicant: 'Olabanji David', chief: 'Raya Dava', status: 'Pending', deadline: '2026-05-23', quality: 'Revision Required' },
  { client: 'Luna Vega', applicant: 'Ethan Brooks', chief: 'Celestial Heights', status: 'Submitted', deadline: '2025-11-14', quality: 'Approved' },
  { client: 'Orion Starling', applicant: 'Maya Patel', chief: 'Nebula Nexus', status: 'Pending', deadline: '2026-01-30', quality: 'Revision Required' },
  { client: 'Sirius Blaze', applicant: "Liam O'Connor", chief: 'Galaxy Gateway', status: 'Submitted', deadline: '2025-12-05', quality: 'Approved' },
];

const subscriptionStats = [
  { label: 'TOTAL MRR', value: '$113,758', note: '+18.2% from last month', tone: 'green', icon: FiDollarSign, iconTone: 'green' },
  { label: 'ACTIVE SUBSCRIPTIONS', value: '342', note: '+12 this month', tone: 'blue', icon: FiUsers, iconTone: 'blue' },
  { label: 'CHURN RATE', value: '2.4%', note: '-0.8% improvement', tone: 'green', icon: FiTrendingUp, iconTone: 'red' },
  { label: 'RENEWAL DUE', value: '28', note: 'This week', tone: 'neutral', icon: FiCreditCard, iconTone: 'orange' },
];

const plans = [
  { name: 'Basic', price: '$99', applications: '25 applications', features: ['Resume Writing', 'Basic Cover Letters', 'Email Support'], activeClients: 145, revenue: '$14,355', tone: 'slate' },
  { name: 'Standard', price: '$249', applications: '50 applications', features: ['Resume Writing', 'Advanced Cover Letters', 'ATS Optimization', 'Priority Support'], activeClients: 98, revenue: '$24,402', tone: 'blue' },
  { name: 'Premium', price: '$499', applications: '100 applications', features: ['All Standard Features', 'LinkedIn Profile', 'Interview Prep', 'Dedicated Support'], activeClients: 67, revenue: '$33,433', tone: 'purple' },
];

const payrollRows = [
  { initials: 'OT', name: 'Olivia Taylor', period: 'May 2026', type: 'Chief Applicant', work: 'Reviews:\n312 × $2 = $624.00\nApplications:\n298 × $1.5 = $447.00', tasks: 610, earnings: '$1071.00', status: 'Pending', action: 'Mark Paid' },
  { initials: 'JA', name: 'James Anderson', period: 'May 2026', type: 'Chief Applicant', work: 'Reviews:\n289 × $2 = $578.00\nApplications:\n272 × $1.5 = $408.00', tasks: 561, earnings: '$986.00', status: 'Paid', action: 'Completed' },
  { initials: 'ER', name: 'Emily Rodriguez', period: 'May 2026', type: 'Applicant', work: 'Applications:\n58 × $8 = $464.00', tasks: 174, earnings: '$928.00', status: 'Pending', action: 'Mark Paid' },
  { initials: 'JS', name: 'James Smith', period: 'June 2026', type: 'Applicant', work: 'Reviews:\n45 × $10 = $450.00', tasks: 132, earnings: '$780.00', status: 'Pending', action: 'Mark Paid' },
  { initials: 'AL', name: 'Alicia Lee', period: 'July 2026', type: 'Applicant', work: 'Applications:\n60 × $7 = $420.00', tasks: 190, earnings: '$950.00', status: 'Pending', action: 'Mark Paid' },
  { initials: 'ML', name: 'Maria Lopez', period: 'June 2026', type: 'Chief Applicant', work: 'Reviews:\n320 × $2 = $640.00\nApplications:\n295 × $1.5 = $442.50', tasks: 615, earnings: '$1082.50', status: 'Paid', action: 'Completed' },
  { initials: 'RT', name: 'Robert Thompson', period: 'July 2026', type: 'Chief Applicant', work: 'Reviews:\n267 × $2 = $534.00\nApplications:\n310 × $1.5 = $465.00', tasks: 577, earnings: '$999.00', status: 'Paid', action: 'Mark Paid' },
  { initials: 'SK', name: 'Samantha Kim', period: 'August 2026', type: 'Chief Applicant', work: 'Reviews:\n310 × $2 = $620.00\nApplications:\n280 × $1.5 = $420.00', tasks: 590, earnings: '$1040.00', status: 'Paid', action: 'Completed' },
];

const paymentHistoryRows = [
  ['Sarah Johnson', 'Applicant', 'May 2026', 135, '$720.00', 'Direct Deposit', '2026-05-28', 'Paid'],
  ['Marcus Williams', 'Chief Applicant', 'May 2026', 475, '$835.00', 'Direct Deposit', '2026-05-28', 'Pending'],
  ['Michael Chen', 'Applicant', 'May 2026', 96, '$512.00', 'Direct Deposit', '2026-05-28', 'Pending'],
  ['Emily Rodriguez', 'Applicant', 'April 2026', 168, '$845.00', 'Direct Deposit', '2026-04-30', 'Paid'],
  ['James Anderson', 'Chief Applicant', 'April 2026', 561, '$986.00', 'PayPal', '2026-04-30', 'Paid'],
  ['David Park', 'Applicant', 'May 2026', 84, '$448.00', 'Direct Deposit', '2026-05-15', 'Paid'],
  ['Sophia Martinez', 'Chief Applicant', 'May 2026', 383, '$673.50', 'Direct Deposit', '2026-05-28', 'Pending'],
  ['Alex Thompson', 'Applicant', 'May 2026', 114, '$608.00', 'Direct Deposit', '2026-05-28', 'Pending'],
].map(([worker, type, period, tasks, amount, method, date, status]) => ({ worker, type, period, tasks, amount, method, date, status }));

function getSection(router, fallback = 'dashboard') {
  const raw = router.query?.section;
  if (Array.isArray(raw) && raw.length) return raw[0] === 'task-distribution' ? fallback : raw[0];
  return fallback;
}

function getDetail(router) {
  const raw = router.query?.section;
  if (Array.isArray(raw) && raw.length > 1) return raw[1];
  return '';
}

function formatMultiLine(text) {
  return String(text).split('\n').map((line) => <span key={line}>{line}</span>);
}

function Brand() {
  return (
    <span className={styles.brandMark}>
      <img src="/logo.svg" alt="ApplyLoop" />
      <span>ApplyLoop</span>
    </span>
  );
}

function OwnerShell({ section, children, portalRole, navItems }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOperations = portalRole === USER_ROLES.OPERATIONS;

  useEffect(() => {
    if (user?.role && user.role !== portalRole) router.replace(getRoleHome(user.role));
  }, [portalRole, router, user?.role]);

  return (
    <div className={styles.app}>
      {menuOpen && <button className={styles.backdrop} onClick={() => setMenuOpen(false)} aria-label="Close menu" />}
      <aside className={cn(styles.sidebar, menuOpen && styles.sidebarOpen)}>
        <div className={styles.logoRow}><Brand /></div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={cn(styles.navItem, section === item.section && styles.navItemActive)} onClick={() => setMenuOpen(false)}>
                <Icon />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button className={styles.account} onClick={logout}>
          <span className={styles.avatarTiny}>{isOperations ? 'O' : 'S'}</span>
          <span>
            <strong>{isOperations ? (user?.name || 'Operations Team') : 'Super Admin'}</strong>
            <small>{isOperations ? 'Operations' : 'Owner'}</small>
          </span>
        </button>
      </aside>

      <div className={styles.mainRail}>
        <div className={styles.mobileBar}>
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu"><FiMenu /></button>
          <Brand />
          <button className={styles.bellButton} aria-label="Notifications"><FiBell /></button>
        </div>
        <main className={styles.surface}>{children}</main>
      </div>
    </div>
  );
}

function PageHeader({ section, action }) {
  const [title, subtitle] = PAGE_META[section] || PAGE_META.dashboard;
  return (
    <header className={styles.pageHeader}>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className={styles.pageHeaderActions}>{action}</div>
    </header>
  );
}

function StatCard({ label, value, note, tone = 'neutral', icon: Icon, iconTone = 'blue', cardTone = 'white', valueTone = 'default' }) {
  return (
    <div className={cn(styles.statCard, styles[`statCard_${cardTone}`])}>
      <div className={styles.statTop}>
        <div className={styles.statLabel}>{formatMultiLine(label)}</div>
        {Icon && <span className={cn(styles.statIconWrap, styles[`statIcon_${iconTone}`])}><Icon /></span>}
      </div>
      <div className={cn(styles.statValue, styles[`statValue_${valueTone}`])}>{value}</div>
      <div className={cn(styles.statNote, tone === 'green' && styles.noteGreen, tone === 'blue' && styles.noteBlue, tone === 'red' && styles.noteRed, tone === 'orange' && styles.noteOrange)}>{note}</div>
    </div>
  );
}

function MetricMini({ icon: Icon, tone, title, value, note }) {
  return (
    <div className={cn(styles.metricMini, styles[`metricCard_${tone}`])}>
      {Icon && <span className={cn(styles.metricIcon, styles[`metric_${tone}`])}><Icon /></span>}
      <div>
        <p className={styles.metricTitle}>{title}</p>
        <strong className={styles[`metricValue_${tone}`]}>{value}</strong>
        {note && <small>{note}</small>}
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const key = String(value).toLowerCase().replace(/[^a-z]+/g, '-');
  return <span className={cn(styles.badge, styles[`badge_${key}`])}>{value}</span>;
}

function AvatarCircle({ initials }) {
  return <span className={styles.avatarCircle}>{initials}</span>;
}

function ProgressBar({ value, tone = 'blue' }) {
  return <span className={styles.progressTrack}><span className={cn(styles.progressFill, styles[`progress_${tone}`])} style={{ width: `${value}%` }} /></span>;
}

function SimpleLineChart({ values, height = 180, fill = false, color = '#3b82f6' }) {
  const width = 520;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / Math.max(values.length - 1, 1);
  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - ((value - min) / range) * (height - 24) - 12;
    return `${x},${y}`;
  }).join(' ');
  const area = `${points} ${width},${height} 0,${height}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map((line) => <line key={line} x1="0" y1={height * line} x2={width} y2={height * line} className={styles.gridLine} />)}
      {Array.from({ length: values.length }).map((_, index) => <line key={index} x1={(width / Math.max(values.length - 1, 1)) * index} y1="0" x2={(width / Math.max(values.length - 1, 1)) * index} y2={height} className={styles.gridLineLight} />)}
      {fill && <polygon points={area} className={styles.areaFill} />}
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}



function Card({ children, className }) {
  return <section className={cn(styles.card, className)}>{children}</section>;
}

function PanelTitle({ children, action }) {
  return (
    <div className={styles.panelTitle}>
      <h2>{children}</h2>
      {action}
    </div>
  );
}

function SearchFilters({ placeholder = 'Search...', filters = [], compact = false, action }) {
  return (
    <div className={cn(styles.searchPanel, compact && styles.searchPanelCompact)}>
      <label className={styles.searchField}>
        <FiSearch />
        <input placeholder={placeholder} />
      </label>
      {filters.map((filter) => (
        <label key={filter} className={styles.selectField}>
          <select defaultValue="">
            <option value="">{filter}</option>
          </select>
          <FiChevronDown />
        </label>
      ))}
      {action}
    </div>
  );
}

function ActionButton({ children, icon: Icon, variant = 'primary', onClick }) {
  return <button className={cn(styles.button, styles[`button_${variant}`])} onClick={onClick}>{Icon && <Icon />}{children}</button>;
}

function Modal({ open, onClose, title, subtitle, children, footer, wide = false, initials }) {
  if (!open) return null;
  return (
    <div className={styles.modalBackdrop} onMouseDown={onClose}>
      <section className={cn(styles.modal, wide && styles.modalWide)} onMouseDown={(event) => event.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close"><FiX /></button>
        <div className={styles.modalHeadingRow}>
          {initials && <AvatarCircle initials={initials} />}
          <div><h2>{title}</h2>{subtitle && <p className={styles.modalSubtitle}>{subtitle}</p>}</div>
        </div>
        <div className={styles.modalBody}>{children}</div>
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </section>
    </div>
  );
}

function HealthCard({ icon: Icon, title, score, tone }) {
  return (
    <div className={cn(styles.healthCard, styles[`health_${tone}`])}>
      <div className={styles.healthCardTop}><span className={cn(styles.healthIcon, styles[`healthIcon_${tone}`])}><Icon /></span><i className={cn(styles.healthDot, styles[`healthDot_${tone}`])} /></div>
      <span className={styles.healthLabel}>{title}</span>
      <strong className={styles[`healthScore_${tone}`]}>{score}</strong>
    </div>
  );
}

function DashboardPage() {
  return (
    <>
      <PageHeader section="dashboard" />
      <div className={styles.statsGridEight}>{dashboardCards.map((card) => <StatCard key={card.label} {...card} />)}</div>
      <div className={styles.dashboardMain}>
        <Card>
          <div className={styles.dashboardAnalyticsHeader}>
            <h2>Business Analytics</h2>
            <label className={styles.inlineSelect}><span>Last 7 Days (May 7th - May 14th)</span><FiChevronDown /></label>
          </div>
          <div className={styles.chartBlock}>
            <p className={styles.chartTitle}>Applications & Interviews</p>
            <AxisMultiLineChart
              xLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
              maxY={80}
              yStep={20}
              series={[
                { label: 'Applications', color: '#3b82f6', values: [44, 52, 61, 58, 71, 38, 42] },
                { label: 'Interviews', color: '#8b5cf6', values: [18, 24, 31, 29, 36, 20, 22] },
              ]}
            />
          </div>
          <div className={styles.chartBlock}>
            <div className={styles.chartHeaderMini}><p className={styles.chartTitle}>Revenue Growth (Last 5 Months)</p><label className={styles.inlineSelect}><span>Custom (January 01 - May 01)</span><FiChevronDown /></label></div>
            <AxisBarChart values={[45000, 52000, 61000, 58000, 76000]} xLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May']} maxY={80000} yStep={20000} color="#2d58cb" legend="Revenue ($)" />
          </div>
          <div className={styles.chartBlock}>
            <p className={styles.chartTitle}>Conversion Funnel</p>
            <ConversionFunnelChart />
          </div>
        </Card>
        <Card className={styles.feedCard}>
          <div className={styles.feedHeader}><h2>Live Operations Feed</h2><span className={styles.livePill}><span />Real-time</span></div>
          <div className={styles.feedList}>
            {dashboardFeed.map(([text, time, tone]) => (
              <div key={`${text}-${time}`} className={styles.feedItem}>
                <span className={cn(styles.feedIcon, styles[`feed_${tone}`])} />
                <div><strong>{formatMultiLine(text)}</strong><small>{time}</small></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <div className={styles.operationalHead}><h2>Operational Health</h2><div className={styles.healthLegend}><span><i className={styles.dotGreen} /> Healthy</span><span><i className={styles.dotAmber} /> Attention</span><span><i className={styles.dotRed} /> Critical</span></div></div>
        <div className={styles.healthGrid}>
          <HealthCard icon={FiBarChart2} title="System Performance" score="98.5%" tone="green" />
          <HealthCard icon={HiOutlineUserGroup} title="Team Productivity" score="High" tone="mint" />
          <HealthCard icon={FiClock} title="Overdue Applications" score="12" tone="yellow" />
          <HealthCard icon={FiTrendingUp} title="High-Priority Clients" score="8 Active" tone="orange" />
          <HealthCard icon={FiAlertTriangle} title="Escalated Issues" score="3 Urgent" tone="red" />
        </div>
      </Card>
    </>
  );
}

function ClientManagementPage({ openClient, openAddClient, openPause, openEscalate, basePath = '/owner' }) {
  return (
    <>
      <PageHeader section="client-management" action={<ActionButton icon={FiPlus} onClick={openAddClient}>Add New Client</ActionButton>} />
      <Card>
        <SearchFilters placeholder="Search clients by name, plan, or team..." filters={['All Plans', 'All Statuses']} compact />
        <table className={styles.table}>
          <thead>
            <tr>
              <th>CLIENT NAME</th><th>PLAN TYPE</th><th>APPLICATIONS</th><th>INTERVIEWS</th><th>ASSIGNED TEAM</th><th>STATUS</th><th>REVENUE</th><th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.name}>
                <td className={styles.nameCell}><Link href={`${basePath}/client-management/olabanji-david`} className={styles.clientNameLink}>{client.name}</Link></td>
                <td><StatusBadge value={client.plan} /></td>
                <td>{client.applications}</td>
                <td>{client.interviews}</td>
                <td>{client.team}</td>
                <td><StatusBadge value={client.status} /></td>
                <td className={styles.boldText}>{client.revenue}</td>
                <td>
                  <div className={styles.actionIcons}>
                    <button onClick={openClient}><FiEye /></button>
                    <button onClick={() => {}}><FiTrendingUp /></button>
                    <button onClick={openPause}><FiPauseCircle /></button>
                    <button onClick={openEscalate}><FiAlertTriangle /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.paginationRow}><span>Showing 5 of 342 clients</span><div className={styles.pagination}><button>Previous</button><button className={styles.pageActive}>1</button><button>2</button><button>3</button><button>Next</button></div></div>
      </Card>
    </>
  );
}

function ApplicantsManagementPage({ openAddApplicant, openWorkerStats }) {
  return (
    <>
      <PageHeader section="applicants-management" action={<ActionButton icon={FiUserPlus} onClick={openAddApplicant}>Add New Applicant</ActionButton>} />
      <div className={styles.statsGridFour}>
        <StatCard label="TOTAL APPLICANTS" value="892" note="" />
        <StatCard label="AVAILABLE" value="624" note="" cardTone="green" valueTone="green" icon={FiUsers} iconTone="green" />
        <StatCard label="AVG COMPLETION RATE" value="88.5%" note="" />
        <StatCard label="INACTIVE" value="6" note="" />
      </div>
      <Card>
        <SearchFilters placeholder="Search clients by name, plan, or team..." />
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Team Member</th><th>Status</th><th>Active Tasks</th><th>Quality Rating</th><th>Completion Rate</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((item) => (
              <tr key={item.name}>
                <td><div className={styles.twoLine}><strong>{item.name}</strong><small>{item.summary}</small></div></td>
                <td><StatusBadge value={item.status} /></td>
                <td><span className={styles.taskCount}>{item.tasks}</span></td>
                <td>{item.rating}</td>
                <td><div className={styles.inlineProgress}><span>{item.completion}%</span><ProgressBar value={item.completion} /></div></td>
                <td><div className={styles.buttonGroup}><button className={styles.ghostMini}><FiUserPlus />Assign</button><button className={styles.ghostMini} onClick={openWorkerStats}><FiBarChart2 />Stats</button><button className={styles.ghostMini}><FiMessageSquare />Chat</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function ChiefApplicantsPage({ openChiefStats }) {
  return (
    <>
      <PageHeader section="chief-applicants" action={<ActionButton icon={FiUserPlus}>Add Chief Applicant</ActionButton>} />
      <div className={styles.statsGridFour}>
        <StatCard label="TOTAL CHIEFS" value="45" note="" />
        <StatCard label="AVG TEAM SIZE" value="44" note="" />
        <StatCard label="AVG ACCURACY" value="95.6%" note="" />
        <StatCard label="TOTAL REVIEWED" value="5,366" note="" />
      </div>
      <div className={styles.chiefGrid}>
        {chiefs.map((chief) => (
          <Card key={chief.name} className={styles.chiefCard}>
            <div className={styles.chiefTop}><div className={styles.chiefIdentity}><AvatarCircle initials={chief.initials} /><div><h3>{chief.name}</h3><p>{chief.team}</p></div><FaRegGem className={styles.gem} /></div><div className={styles.teamSize}>Team Size <strong>{chief.teamSize}</strong></div></div>
            <div className={styles.chiefMetrics}><MetricMini tone="blue" title="Completion" value={`${chief.completion}%`} /><MetricMini tone="green" title="Accuracy" value={`${chief.accuracy}%`} /><MetricMini tone="purple" title="On-Time" value={`${chief.onTime}%`} /></div>
            <div className={styles.barStack}><label>Team Completion Rate <span>{chief.completion}%</span></label><ProgressBar value={chief.completion} tone="blue" /><label>Approval Accuracy <span>{chief.accuracy}%</span></label><ProgressBar value={chief.accuracy} tone="green" /><label>Deadline Compliance <span>{chief.onTime}%</span></label><ProgressBar value={chief.onTime} tone="purple" /></div>
            <div className={styles.chiefFooter}><div>Tasks Reviewed <strong>{chief.reviewed}</strong></div><button className={styles.ghostMini} onClick={openChiefStats}>View Team</button></div>
          </Card>
        ))}
      </div>
    </>
  );
}


function OperationsStatusCard({ label, value, tone }) {
  return <div className={styles.operationsStatusCard}><div><span className={cn(styles.statusDot, styles[`statusDot_${tone}`])} />{label}</div><strong className={tone === 'red' ? styles.redText : ''}>{value}</strong></div>;
}
function ApplicationOperationsPage({ openAddApplicant, openReassign, openForcePriority, openEscalate }) {
  return (
    <>
      <PageHeader section="application-operations" action={<ActionButton icon={FiUserPlus} onClick={openAddApplicant}>Add New Applicant</ActionButton>} />
      <div className={styles.statsGridFiveMini}>
        <OperationsStatusCard label="IN PROGRESS" value="124" tone="blue" />
        <OperationsStatusCard label="IN REVIEW" value="42" tone="orange" />
        <OperationsStatusCard label="SUBMITTED" value="567" tone="green" />
        <OperationsStatusCard label="DELAYED" value="8" tone="red" />
        <OperationsStatusCard label="CRITICAL" value="3" tone="red" />
      </div>
      <Card>
        <SearchFilters placeholder="Search clients by name, plan, or team..." filters={['All Plans', 'All Statuses']} />
        <table className={styles.table}>
          <thead>
            <tr>
              <th>CLIENT NAME</th><th>APPLICANT</th><th>CHIEF APPLICANT</th><th>SUBMISSIONS</th><th>DEADLINE</th><th>QUALITY</th><th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {operations.map((item) => (
              <tr key={`${item.client}-${item.deadline}-${item.quality}`}>
                <td className={styles.nameCell}>{item.client}</td>
                <td>{item.applicant}</td>
                <td>{item.chief}</td>
                <td><StatusBadge value={item.status} /></td>
                <td>{item.deadline}</td>
                <td><StatusBadge value={item.quality} /></td>
                <td>
                  <div className={styles.actionIcons}>
                    <button onClick={openReassign}><FiRefreshCw /></button>
                    <button onClick={openForcePriority}><FiClock /></button>
                    <button onClick={openEscalate}><FiAlertTriangle /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function SubscriptionRevenuePage({ openManagePlans, openEditSubscription }) {
  return (
    <>
      <PageHeader section="subscription-revenue" action={<ActionButton variant="secondary" onClick={openManagePlans}>Manage Plans</ActionButton>} />
      <div className={styles.statsGridFour}>{subscriptionStats.map((item) => <StatCard key={item.label} {...item} />)}</div>
      <div className={styles.splitCharts}>
        <Card>
          <PanelTitle>Monthly Recurring Revenue</PanelTitle>
          <AxisLineChart values={[45000, 52000, 61000, 58000, 76000]} xLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May']} maxY={80000} yStep={20000} color="#10b981" legend="MRR ($)" />
        </Card>
        <Card>
          <PanelTitle>Revenue by Plan</PanelTitle>
          <AxisBarChart values={[35000, 45000, 53000]} xLabels={['Basic', 'Standard', 'Premium']} maxY={60000} yStep={15000} color="#8b5cf6" legend="Revenue ($)" />
        </Card>
      </div>
      <div className={styles.planGrid}>
        {plans.map((plan) => (
          <Card key={plan.name} className={cn(styles.planCard, styles[`plan_${plan.tone}`])}>
            <h3>{plan.name}</h3>
            <div className={styles.planPrice}>{plan.price}<span>/month</span></div>
            <p className={styles.planMeta}>Active Clients</p>
            <strong className={styles.planClients}>{plan.activeClients}</strong>
            <p className={styles.planMeta}>Monthly Recurring Revenue</p>
            <strong className={styles.planRevenue}>{plan.revenue}</strong>
            <button className={cn(styles.managePlanButton, styles[`managePlan_${plan.tone}`])} onClick={openEditSubscription}>Manage Plan</button>
          </Card>
        ))}
      </div>
    </>
  );
}

function PayrollSystemPage({ openPaymentHistory }) {
  return (
    <>
      <PageHeader section="payroll-system" />
      <div className={styles.statsGridFour}>
        <StatCard label="PENDING PAYMENT" value="$1,758" note="Current pay period" icon={FiClock} iconTone="orange" cardTone="orange" />
        <StatCard label="PAID THIS PERIOD" value="$1,434.00" note="May 2026" icon={FiCheckCircle} iconTone="green" cardTone="green" valueTone="green" />
        <StatCard label="APPLICANTS PAYROLL" value="$2,768.00" note="4 workers pending" icon={FiUser} iconTone="blue" cardTone="blue" valueTone="blue" />
        <StatCard label="CHIEFS PAYOUT" value="28" note="3 chiefs pending" icon={FaRegGem} iconTone="orange" cardTone="orange" />
      </div>
      <Card>
        <PanelTitle>Payment Rates</PanelTitle>
        <div className={styles.ratesGrid}>
          <div className={styles.rateBlock}><div className={styles.rateTitle}><FiUser /> Applicant Rates</div><div className={styles.rateRow}><span>Full Application</span><strong>$2.00</strong></div></div>
          <div className={cn(styles.rateBlock, styles.chiefRateBlock)}><div className={styles.rateTitle}><FaCrown /> Chief Applicant Rates</div><div className={styles.rateRow}><span>Application Review</span><strong>$2.00</strong></div><div className={styles.rateRow}><span>Full Application</span><strong>$2.00</strong></div></div>
        </div>
      </Card>
      <Card>
        <div className={styles.panelTitle}><h2>All Workers - May 2026</h2><div className={styles.inlineFilters}><label className={styles.inlineSelect}><span>All Plans</span><FiChevronDown /></label><label className={styles.inlineSelect}><span>All Statuses</span><FiChevronDown /></label></div></div>
        <table className={styles.table}>
          <thead><tr><th>WORKER</th><th>TYPE</th><th>WORK BREAKDOWN</th><th>TOTAL TASKS</th><th>EARNINGS</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
          <tbody>{payrollRows.map((row) => <tr key={`${row.name}-${row.period}`}><td><div className={styles.personCell}><AvatarCircle initials={row.initials} /><div className={styles.twoLine}><strong>{row.name}</strong><small>{row.period}</small></div></div></td><td><StatusBadge value={row.type} /></td><td className={styles.workBreakdown}>{formatMultiLine(row.work)}</td><td className={styles.boldText}>{row.tasks}</td><td className={styles.boldText}>{row.earnings}</td><td><StatusBadge value={row.status} /></td><td>{row.action === 'Completed' ? <button className={styles.completedButton}>Completed</button> : <button className={styles.markPaidButton}>Mark Paid</button>}</td></tr>)}</tbody>
        </table>
        <div className={styles.pendingTotal}>Total Pending Payments: <strong>$5,347.50</strong></div>
      </Card>
      <Card><div className={styles.infoBanner}><span className={styles.infoIcon}>$</span><div><h3>Automated Payroll Calculation</h3><p>Payments are automatically calculated based on completed work. Each task type has a set rate, and earnings are tracked in real-time. Review and approve pending payments before processing.</p><div className={styles.buttonRow}><button className={styles.ghostMini} onClick={openPaymentHistory}>View Payment History</button><button className={styles.primaryMini}>Configure Rates</button></div></div></div></Card>
    </>
  );
}

function PlaceholderPage({ section }) {
  return (
    <>
      <PageHeader section={section} />
      <Card className={styles.placeholderCard}>
        <div className={styles.placeholderIcon}><FiSettings /></div>
        <h2>{PAGE_META[section]?.[0]}</h2>
        <p>This screen was not included in the supplied references, so a clean matching placeholder was added to preserve the Owner navigation flow.</p>
      </Card>
    </>
  );
}

function AddNewClientModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Add New Client" subtitle="Create a new client account" footer={<><button className={styles.modalGhost} onClick={onClose}>Cancel</button><button className={styles.modalPrimary}>Create Client</button></>}>
      <FormGrid>
        <InputField label="Client Name *" placeholder="e.g., Olabanji David T." />
        <InputField label="Gender" placeholder="e.g., John Smith" />
        <InputField label="Email Address *" placeholder="contact@company.com" />
        <InputField label="Phone Number" placeholder="+1 (555) 123-4567" />
        <SelectField label="Subscription Plan *" placeholder="Select a subscription plan" />
        <SelectField label="Assigned Team *" placeholder="Assign a team" />
        <InputField label="Portfolio Link" placeholder="banji.framer.website" />
        <InputField label="LinkedIn URL" placeholder="https://www.linkedin.com/in/olabanji-da" />
      </FormGrid>
      <InputField label="Upload Resume" placeholder="Attach a file" icon="clip" />
      <TextAreaField label="Notes (Optional)" placeholder="Additional information about the client..." rows={4} />
    </Modal>
  );
}

function ClientPerformanceModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Olabanji David T." subtitle="Client Performance Overview" wide footer={<><button className={styles.modalGhost} onClick={onClose}>Close</button><button className={styles.modalPrimary}>Edit Client</button></>}>
      <div className={styles.metricStripThree}><MetricMini tone="blue" title="Applications" value="245" /><MetricMini tone="green" title="Interviews" value="68" /><MetricMini tone="purple" title="Success Rate" value="27.8%" /></div>
      <Card className={styles.modalInnerCard}><PanelTitle>Client Information</PanelTitle><div className={styles.infoGrid}><div><span>Plan Type</span><strong>Enterprise</strong></div><div><span>Assigned Team</span><strong>Team Alpha</strong></div><div><span>Account Status</span><StatusBadge value="Active" /></div><div><span>Total Revenue</span><strong>$12,500</strong></div></div></Card>
      <Card className={styles.modalInnerCard}><PanelTitle>Current Onboarding Process</PanelTitle><div className={styles.steps}><div className={styles.stepComplete}>Profile Setup</div><div className={styles.stepComplete}>Preference Disclosure</div><div className={styles.stepComplete}>Payment</div><div className={styles.stepActive}>Resume Alignment</div><div className={styles.stepActive}>Preference Alignment</div><div className={styles.stepMuted}>Analyst Onboarding</div></div><div className={cn(styles.steps, styles.secondary)}><div className={styles.stepMuted}>Application Commencement</div><div className={styles.stepMuted}>Touch Call 1</div><div className={styles.stepMuted}>Touch Call 2</div><div className={styles.stepMuted}>Touch Call 3</div><div className={styles.stepMuted}>Re-subscription</div><div className={styles.stepMuted}>Season</div></div></Card>
      <Card className={styles.modalInnerCard}><PanelTitle>Application Trends</PanelTitle><SimpleLineChart values={[42, 48, 52, 45, 59]} fill color="#3b82f6" /></Card>
    </Modal>
  );
}

function PauseAccountModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Pause Account" subtitle="Olabanji David" footer={<><button className={styles.modalGhost} onClick={onClose}>Cancel</button><button className={styles.modalWarning}>Pause Account</button></>}>
      <NoticeBox tone="amber" title="Pausing this account will:" items={['Stop all active application work', 'Suspend billing until reactivation', 'Reassign pending tasks to other teams', 'Retain all client data and history']} />
      <InputField label="Pause Duration (days)" />
      <TextAreaField label="Reason for Pause (Optional)" placeholder="e.g., Client requested temporary hold, payment issue, etc." rows={4} />
    </Modal>
  );
}

function AddNewApplicantModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Add New Applicant" subtitle="Create new applicant or chief applicant account" footer={<><button className={styles.modalGhost} onClick={onClose}>Cancel</button><button className={styles.modalPrimary}>Create Applicant</button></>}>
      <FormGrid>
        <InputField label="Applicant Name *" placeholder="e.g., Olabanji David T." />
        <InputField label="Email Address *" placeholder="e.g., John Smith" />
        <InputField label="Phone Number" placeholder="+1 (555) 123-4567" />
        <SelectField label="Designated Role" placeholder="Select a role" />
        <InputField label="Work Email Address" placeholder="banjidavid@applyloop.com" />
        <InputField label="Default Password" placeholder="#734912%773w" />
        <SelectField label="Assigned Team *" placeholder="Assign a team" />
        <InputField label="Availability" />
      </FormGrid>
      <InputField label="Skills and Expertise" placeholder="e.g., Resume writing, etc." icon="clip" />
      <TextAreaField label="Experience Level" placeholder="Additional information about the client..." rows={4} />
      <div className={styles.paymentCard}><h3>Payment Information</h3><p>Workers are paid per application based on configured rates. You can customize rates in Settings.</p><div className={styles.paymentRow}><span>Full Application</span><strong>$4.00</strong></div></div>
    </Modal>
  );
}

function WorkerPerformanceModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Sarah Johnson" subtitle="Worker Performance Dashboard" initials="SJ" wide footer={<><button className={styles.modalGhost} onClick={onClose}>Close</button><button className={styles.modalDangerAlt}>Remove Worker</button></>}>
      <div className={styles.metricStripFour}><MetricMini icon={FiTrendingUp} tone="blue" title="Active Tasks" value="12" /><MetricMini icon={FiCheckCircle} tone="green" title="Completion Rate" value="94%" /><MetricMini icon={HiOutlineLightBulb} tone="amber" title="Quality Score" value="4.8/5.0" /><MetricMini icon={FiClock} tone="purple" title="Total Completed" value="342" /></div>
      <div className={styles.splitCharts}>
        <Card className={styles.modalInnerCard}><PanelTitle>Weekly Performance Trend</PanelTitle><AxisMultiLineChart xLabels={['Week 1', 'Week 2', 'Week 3', 'Week 4']} maxY={20} yStep={5} series={[{ label: 'Completed Tasks', color: '#3b82f6', values: [12, 15, 14, 18] }, { label: 'Quality Score', color: '#10b981', values: [4.5, 4.8, 4.6, 4.9] }]} /></Card>
        <Card className={styles.modalInnerCard}><PanelTitle>Task Breakdown (This Month)</PanelTitle><AxisBarChart values={[45, 45, 45]} xLabels={['Resumes', 'Cover Letters', 'Applications']} maxY={60} yStep={15} color="#8b5cf6" /></Card>
      </div>
      <Card className={styles.modalInnerCard}><PanelTitle>Worker Information</PanelTitle><div className={styles.infoGridFour}><div><span>Status</span><StatusBadge value="Available" /></div><div><span>Assigned Team</span><strong>Team Alpha</strong></div><div><span>Join Date</span><strong>Jan 15, 2026</strong></div><div><span>Earnings (MTD)</span><strong className={styles.greenText}>$720.00</strong></div></div></Card>
    </Modal>
  );
}

function ChiefStatsModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Marcus Williams" subtitle="Team Alpha - Team Performance Report" initials="MW" wide footer={<><button className={styles.modalGhost} onClick={onClose}>Close</button><button className={styles.modalPrimary}>Export Report</button></>}>
      <div className={styles.metricStripFour}><MetricMini icon={FiUsers} tone="blue" title="Team Size" value="12" /><MetricMini icon={FiCheckCircle} tone="green" title="Completion Rate" value="94%" /><MetricMini icon={FiAward} tone="amber" title="Approval Accuracy" value="96%" /><MetricMini icon={FiClock} tone="purple" title="On-Time Delivery" value="94%" /></div>
      <Card className={styles.modalInnerCard}><PanelTitle>Team Performance Trend</PanelTitle><AxisMultiLineChart xLabels={['Week 1', 'Week 2', 'Week 3', 'Week 4']} maxY={320} yStep={80} series={[{ label: 'Tasks Completed', color: '#3b82f6', values: [245, 268, 288, 315] }, { label: 'Avg Quality Score', color: '#10b981', values: [292, 298, 304, 312] }]} /></Card>
      <Card className={styles.modalInnerCard}><PanelTitle>Team Members Performance</PanelTitle><table className={styles.table}><thead><tr><th>NAME</th><th>TASKS (MTD)</th><th>QUALITY SCORE</th><th>STATUS</th><th>PERFORMANCE</th></tr></thead><tbody>{[['Sarah Johnson', 45, '4.8', 'Active', 92], ['Michael Chen', 38, '4.6', 'Active', 88], ['Emily Rodriguez', 52, '4.9', 'Active', 93], ['David Park', 28, '4.3', 'Active', 84], ['Alex Thompson', 41, '4.7', 'Active', 90]].map(([name, tasks, score, status, performance]) => <tr key={name}><td>{name}</td><td>{tasks}</td><td>{score} <span className={styles.fiveScale}>/5.0</span></td><td><StatusBadge value={status} /></td><td><ProgressBar value={performance} /></td></tr>)}</tbody></table></Card>
      <Card className={styles.modalInnerCard}><PanelTitle>Chief Applicant Stats</PanelTitle><div className={styles.infoGridFour}><div><span>Total Tasks Reviewed</span><strong>1,245</strong></div><div><span>Average Review Time</span><strong>12m</strong></div><div><span>Rejection Rate</span><strong>4.2%</strong></div><div><span>Monthly Earnings</span><strong className={styles.greenText}>$835.00</strong></div><div><span>Join Date</span><strong>Oct 2025</strong></div><div><span>Team Rank</span><strong className={styles.orangeText}>#1</strong></div></div></Card>
    </Modal>
  );
}

function ReassignApplicationModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Reassign Application" subtitle="Olabanji David" footer={<><button className={styles.modalGhost} onClick={onClose}>Cancel</button><button className={styles.modalPrimary}>Reassign Application</button></>}>
      <div className={styles.assignmentBox}><h3>Current Assignment</h3><div className={styles.assignmentGrid}><div><span>Applicant</span><strong>Sarah Johnson</strong></div><div><span>Chief Applicant</span><strong>Marcus Williams</strong></div><div><span>Deadline</span><strong>2026-05-23</strong></div><div><span>Quality Review</span><StatusBadge value="Approved" /></div></div></div>
      <div className={styles.tabSwitch}><button>New Applicant</button><button>New Chief Applicant</button><button className={styles.tabActive}>Both</button></div>
      <InputField label="Select New Applicant *" />
      <InputField label="Select New Chief Applicant *" />
      <TextAreaField label="Reason for Reassignment" placeholder="Explain why this application is being reassigned..." rows={4} />
    </Modal>
  );
}

function ForcePriorityModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Force Priority" subtitle="Olabanji David" footer={<><button className={styles.modalGhost} onClick={onClose}>Cancel</button><button className={styles.modalWarning}>Force Priority</button></>}>
      <NoticeBox tone="amber" title="Forcing priority will:" items={['Move this application and client to top of worker queue', 'Send urgent notifications to assigned team', 'Flag as high priority in all dashboards', 'Require completion before other tasks']} />
      <Card className={styles.modalInnerCard}><PanelTitle>Current Status</PanelTitle><div className={styles.infoGridFour}><div><span>Assigned To</span><strong>Sarah Johnson</strong></div><div><span>Current Deadline</span><strong>2026-05-23</strong></div><div><span>Resume Status</span><StatusBadge value="Completed" /></div><div><span>Cover Letter</span><StatusBadge value="In Review" /></div></div></Card>
      <InputField label="New Deadline (Optional)" />
      <small className={styles.hint}>Leave empty to keep current deadline</small>
      <TextAreaField label="Reason for Priority" placeholder="Explain why this application needs immediate attention..." rows={4} />
      <div className={styles.toggleCard}><div><strong>Notify Workers</strong><small>Send urgent alert to assigned team</small></div><span className={styles.toggle}><i /></span></div>
    </Modal>
  );
}

function EscalateModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Escalate Priority" subtitle="TechCorp Inc." footer={<><button className={styles.modalGhost} onClick={onClose}>Cancel</button><button className={styles.modalDanger}>Escalate Client</button></>}>
      <label className={styles.fieldLabel}>Priority Level</label>
      <div className={styles.tabSwitch}><button className={styles.tabActiveWarning}>High</button><button>Urgent</button><button>Critical</button></div>
      <TextAreaField label="Escalation Reason" placeholder="Describe why this client needs priority attention..." rows={4} />
      <div className={styles.toggleCard}><div><strong>Notify Assigned Team</strong><small>Team Alpha</small></div><span className={styles.toggle}><i /></span></div>
      <NoticeBox tone="orange" title="Escalating priority will:" items={['Move client to top of team queue', 'Send alerts to assigned team lead', 'Flag in all operational dashboards', 'Require daily status updates']} />
    </Modal>
  );
}

function EditSubscriptionModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Edit Subscription" subtitle="Olabanji David" footer={<><button className={styles.modalGhost} onClick={onClose}>Cancel</button><button className={styles.modalPrimary}>Update Subscription</button></>}>
      <div className={styles.currentPlan}><span>Current Plan</span><strong>Basic</strong></div>
      <label className={styles.fieldLabel}>Select New Plan</label>
      <div className={styles.subscriptionOptions}><div className={styles.subscriptionOption}><h4>Basic</h4><strong>$99</strong><small>100 applications/month</small></div><div className={styles.subscriptionOption}><h4>Standard</h4><strong>$249</strong><small>200 applications/month</small></div><div className={cn(styles.subscriptionOption, styles.subscriptionOptionActive)}><h4>Premium</h4><strong>$499</strong><small>100 applications/month</small><span className={styles.radioActive} /></div></div>
      <NoticeBox tone="amber" title="Upgrade" items={['Changes will take effect at the start of the next billing cycle.']} compact />
    </Modal>
  );
}

function ManagePlansModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Manage Subscription Plans" subtitle="Create, edit, and configure pricing plans" wide>
      <div className={styles.planModalGrid}>
        {plans.map((plan) => (
          <div key={plan.name} className={styles.planModalCard}>
            <div className={styles.planModalActions}><button><FiEdit2 /></button><button><FiX /></button></div>
            <h3>{plan.name}</h3>
            <div className={styles.planPrice}>{plan.price}<span>/month</span></div>
            <p className={styles.planMeta}>Monthly Applications</p>
            <strong className={styles.planClients}>{plan.applications}</strong>
            <p className={styles.planMeta}>Features</p>
            <ul className={styles.featureList}>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <div className={styles.planBottom}><span>Active Clients</span><strong>{plan.activeClients}</strong></div>
          </div>
        ))}
      </div>
      <div className={styles.addPlanBox}><FiPlus /> Add New Plan</div>
    </Modal>
  );
}

function PaymentHistoryModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Payment History" subtitle="Complete payment records and transaction history" wide footer={<button className={styles.modalGhostWide} onClick={onClose}>Close</button>}>
      <div className={styles.metricStripThreeLarge}><MetricMini tone="green" title="Total Paid" value="$2,999.00" /><MetricMini tone="amber" title="Pending" value="$2,628.50" /><MetricMini tone="blue" title="Total" value="$5,627.50" /></div>
      <Card className={styles.modalInnerCard}><SearchFilters placeholder="Search by worker name..." filters={['All Period', 'All Statuses']} compact action={<button className={styles.exportButton}>Export</button>} /><table className={styles.table}><thead><tr><th>WORKER</th><th>TYPE</th><th>PERIOD</th><th>TASKS</th><th>AMOUNT</th><th>METHOD</th><th>DATE</th><th>STATUS</th></tr></thead><tbody>{paymentHistoryRows.map((row) => <tr key={`${row.worker}-${row.date}-${row.amount}`}><td className={styles.nameCell}>{row.worker}</td><td><StatusBadge value={row.type} /></td><td>{row.period}</td><td>{row.tasks}</td><td className={styles.boldText}>{row.amount}</td><td>{row.method}</td><td>{row.date}</td><td><StatusBadge value={row.status} /></td></tr>)}</tbody></table><div className={styles.paginationRow}><span>Showing 8 of 156 payment records</span><div className={styles.pagination}><button>Previous</button><button className={styles.pageActive}>1</button><button>2</button><button>3</button><button>Next</button></div></div></Card>
    </Modal>
  );
}

function FormGrid({ children }) { return <div className={styles.formGrid}>{children}</div>; }
function InputField({ label, placeholder = '', icon }) {
  return <label className={styles.formField}><span>{label}</span><div className={styles.inputWrap}><input placeholder={placeholder} />{icon === 'clip' && <span className={styles.inputIcon}>⌕</span>}</div></label>;
}
function SelectField({ label, placeholder }) {
  return <label className={styles.formField}><span>{label}</span><div className={styles.inputWrap}><input placeholder={placeholder} readOnly /><FiChevronDown className={styles.selectIcon} /></div></label>;
}
function TextAreaField({ label, placeholder = '', rows = 4 }) { return <label className={styles.formField}><span>{label}</span><textarea rows={rows} placeholder={placeholder} /></label>; }
function NoticeBox({ tone, title, items, compact = false }) {
  return <div className={cn(styles.noticeBox, styles[`notice_${tone}`], compact && styles.noticeCompact)}><strong>{title}</strong><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}

export default function OwnerPortal({ portalRole = USER_ROLES.OWNER }) {
  const router = useRouter();
  const isOperations = portalRole === USER_ROLES.OPERATIONS;
  const basePath = isOperations ? '/operations' : '/owner';
  const defaultSection = isOperations ? 'client-management' : 'dashboard';
  const requestedSection = getSection(router, defaultSection);
  const section = isOperations && !OPERATIONS_SECTIONS.has(requestedSection) ? defaultSection : requestedSection;
  const detail = getDetail(router);
  const navItems = isOperations ? OPERATIONS_NAV_ITEMS : OWNER_NAV_ITEMS;
  const [modals, setModals] = useState({
    addClient: false,
    clientPerformance: false,
    pauseAccount: false,
    addApplicant: false,
    workerStats: false,
    chiefStats: false,
    reassign: false,
    forcePriority: false,
    escalate: false,
    editSubscription: false,
    managePlans: false,
    paymentHistory: false,
  });

  useEffect(() => {
    if (isOperations && requestedSection !== section && router.isReady) {
      router.replace(`${basePath}/${defaultSection}`);
    }
  }, [basePath, defaultSection, isOperations, requestedSection, router, section]);

  const openModal = (key) => setModals((current) => ({ ...current, [key]: true }));
  const closeModal = (key) => setModals((current) => ({ ...current, [key]: false }));

  const content = useMemo(() => {
    if (section === 'dashboard') return <DashboardPage />;
    if (section === 'client-management' && detail) return <ClientDetailsPage basePath={basePath} />;
    if (section === 'client-management') return <ClientManagementPage basePath={basePath} openClient={() => openModal('clientPerformance')} openAddClient={() => openModal('addClient')} openPause={() => openModal('pauseAccount')} openEscalate={() => openModal('escalate')} />;
    if (section === 'applicants-management') return <ApplicantsManagementPage openAddApplicant={() => openModal('addApplicant')} openWorkerStats={() => openModal('workerStats')} />;
    if (section === 'chief-applicants') return <ChiefApplicantsPage openChiefStats={() => openModal('chiefStats')} />;
    if (section === 'application-operations') return <ApplicationOperationsPage openAddApplicant={() => openModal('addApplicant')} openReassign={() => openModal('reassign')} openForcePriority={() => openModal('forcePriority')} openEscalate={() => openModal('escalate')} />;
    if (section === 'subscription-revenue') return <SubscriptionRevenuePage openManagePlans={() => openModal('managePlans')} openEditSubscription={() => openModal('editSubscription')} />;
    if (section === 'prompt-system') return <PromptSystemPage />;
    if (section === 'analytics-reports') return <AnalyticsReportsPage />;
    if (section === 'payroll-system') return <PayrollSystemPage openPaymentHistory={() => openModal('paymentHistory')} />;
    if (section === 'escalations-issues') return <EscalationsIssuesPage />;
    if (section === 'settings') return <SettingsPage />;
    return <PlaceholderPage section={section} />;
  }, [basePath, detail, section]);

  const [title, subtitle] = PAGE_META[section] || PAGE_META.dashboard;

  return (
    <>
      <Head>
        <title>{title} | ApplyLoop</title>
        <meta name="description" content={subtitle} />
      </Head>
      <OwnerShell section={section} portalRole={portalRole} navItems={navItems}>
        {content}
        <AddNewClientModal open={modals.addClient} onClose={() => closeModal('addClient')} />
        <ClientPerformanceModal open={modals.clientPerformance} onClose={() => closeModal('clientPerformance')} />
        <PauseAccountModal open={modals.pauseAccount} onClose={() => closeModal('pauseAccount')} />
        <AddNewApplicantModal open={modals.addApplicant} onClose={() => closeModal('addApplicant')} />
        <WorkerPerformanceModal open={modals.workerStats} onClose={() => closeModal('workerStats')} />
        <ChiefStatsModal open={modals.chiefStats} onClose={() => closeModal('chiefStats')} />
        <ReassignApplicationModal open={modals.reassign} onClose={() => closeModal('reassign')} />
        <ForcePriorityModal open={modals.forcePriority} onClose={() => closeModal('forcePriority')} />
        <EscalateModal open={modals.escalate} onClose={() => closeModal('escalate')} />
        <EditSubscriptionModal open={modals.editSubscription} onClose={() => closeModal('editSubscription')} />
        <ManagePlansModal open={modals.managePlans} onClose={() => closeModal('managePlans')} />
        <PaymentHistoryModal open={modals.paymentHistory} onClose={() => closeModal('paymentHistory')} />
      </OwnerShell>
    </>
  );
}
