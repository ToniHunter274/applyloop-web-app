import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
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
  FiCopy,
  FiCreditCard,
  FiDownload,
  FiDollarSign,
  FiEdit2,
  FiFileText,
  FiGrid,
  FiHome,
  FiKey,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiPauseCircle,
  FiPlayCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiTrendingUp,
  FiUser,
  FiUserPlus,
  FiUsers,
  FiX,
  FiExternalLink,
} from 'react-icons/fi';
import PasswordResetConfirmationModal from '../../shared/components/PasswordResetConfirmationModal';
import { HiOutlineLightBulb, HiOutlineUserGroup } from 'react-icons/hi';
import { FaCrown, FaRegGem } from 'react-icons/fa';
import { useAuth } from '../../shared/context/AuthContext';
import { createClient } from '../../lib/supabase/client';
import { getRoleHome, USER_ROLES } from '../../shared/config/roles';
import CustomSelect from '../../shared/components/CustomSelect';
import ClientManagementWorkspace from '../../shared/components/ClientManagementWorkspace';
import styles from './OwnerPortal.module.css';
import { AxisBarChart, AxisLineChart, AxisMultiLineChart, ConversionFunnelChart } from './OwnerCharts';
import { AnalyticsReportsPage, ClientDetailsPage, EscalationsIssuesPage, PromptSystemPage, SettingsPage } from './OwnerExtraPages';

const cn = (...values) => values.filter(Boolean).join(' ');

async function getOwnerAccessToken() {
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

  if (error || !session?.access_token) {
    throw new Error(
      'Your session has expired. Please sign in again.'
    );
  }

  return session.access_token;
}

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

function formatOwnerCurrency(value) {
  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }
  ).format(Number(value) || 0);
}

function formatOwnerRelativeTime(value) {
  const timestamp =
    new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return 'Recent';
  }

  const seconds = Math.max(
    0,
    Math.floor(
      (Date.now() - timestamp) /
        1000
    )
  );

  if (seconds < 60) {
    return 'Just now';
  }

  const minutes =
    Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(value)
    .toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
      }
    );
}

function getOwnerOverviewMetrics({
  clients = [],
  applications = [],
  applicationSummary = {},
  audits = [],
}) {
  const activeClients =
    clients.filter(
      (client) =>
        client.status === 'active'
    );

  const totalApplications =
    Number(
      applicationSummary
        ?.totalApplications
    ) || applications.length;

  const interviews =
    clients.reduce(
      (total, client) =>
        total +
        Number(
          client.interviews || 0
        ),
      0
    );

  const completedApplications =
    clients.reduce(
      (total, client) =>
        total +
        Number(
          client.applicationsCompleted ||
            0
        ),
      0
    );

  const interviewSuccessRate =
    completedApplications > 0
      ? Math.round(
          (
            interviews /
            completedApplications
          ) * 100
        )
      : 0;

  const estimatedMonthlyRevenue =
    activeClients.reduce(
      (total, client) =>
        total +
        Number(
          client.planPrice || 0
        ),
      0
    );

  const activePlans =
    new Set(
      activeClients
        .map(
          (client) =>
            client.plan
        )
        .filter(Boolean)
    ).size;

  const priorityClients =
    activeClients.filter(
      (client) =>
        [
          'high',
          'urgent',
          'critical',
        ].includes(
          client.priority
        )
    ).length;

  return {
    activeClients:
      activeClients.length,
    totalClients:
      clients.length,
    totalApplications,
    persistedApplications:
      applications.length,
    interviews,
    completedApplications,
    interviewSuccessRate,
    estimatedMonthlyRevenue,
    activePlans,
    pendingAudits:
      audits.length,
    priorityClients,
  };
}

function getOwnerDashboardCards(
  metrics,
  unavailable
) {
  const value = (
    resolvedValue
  ) =>
    unavailable
      ? '—'
      : resolvedValue;

  return [
    {
      label:
        'TOTAL ACTIVE CLIENTS',
      value: value(
        String(
          metrics.activeClients
        )
      ),
      note: unavailable
        ? 'Live data unavailable'
        : `${metrics.totalClients} total client records`,
      tone: 'green',
      icon: HiOutlineUserGroup,
      iconTone: 'blue',
    },
    {
      label:
        'APPLICATIONS\nSUBMITTED',
      value: value(
        String(
          metrics.totalApplications
        )
      ),
      note: unavailable
        ? 'Live data unavailable'
        : `${metrics.persistedApplications} persisted application records`,
      tone: 'green',
      icon: FiFileText,
      iconTone: 'gray',
    },
    {
      label:
        'EST. MONTHLY\nREVENUE',
      value: value(
        formatOwnerCurrency(
          metrics
            .estimatedMonthlyRevenue
        )
      ),
      note:
        'Based on active client plan prices',
      tone: 'green',
      icon: FiDollarSign,
      iconTone: 'green',
    },
    {
      label:
        'TOTAL INTERVIEWS',
      value: value(
        String(
          metrics.interviews
        )
      ),
      note:
        'Recorded across client accounts',
      tone: 'neutral',
      icon: FiBriefcase,
      iconTone: 'blue',
    },
    {
      label:
        'PLANS IN USE',
      value: value(
        String(
          metrics.activePlans
        )
      ),
      note:
        'Across active clients',
      tone: 'neutral',
      icon: FaRegGem,
      iconTone: 'orange',
    },
    {
      label:
        'INTERVIEW\nSUCCESS RATE',
      value: value(
        `${metrics.interviewSuccessRate}%`
      ),
      note:
        'Interviews / completed applications',
      tone: 'green',
      icon: FiTrendingUp,
      iconTone: 'green',
    },
    {
      label:
        'PENDING AUDITS',
      value: value(
        String(
          metrics.pendingAudits
        )
      ),
      note:
        'Pending or in review',
      tone: 'neutral',
      icon: FiAlertTriangle,
      iconTone: 'red',
    },
    {
      label:
        'PRIORITY\nCLIENTS',
      value: value(
        String(
          metrics.priorityClients
        )
      ),
      note:
        'Active high, urgent, or critical',
      tone: 'neutral',
      icon: FiRefreshCw,
      iconTone: 'blue',
    },
  ];
}

function getOwnerDashboardFeed(
  applications = []
) {
  return applications
    .slice(0, 6)
    .map(
      (application) => {
        const tone =
          application.status ===
          'Interview Scheduled'
            ? 'green'
            : application.status ===
                'Offer Received'
              ? 'purple'
              : application.status ===
                  'Rejected'
                ? 'amber'
                : 'blue';

        return [
          `${application.client || 'Client'}\n${application.company} — ${application.position}`,
          formatOwnerRelativeTime(
            application.appliedAt
          ),
          tone,
        ];
      }
    );
}

const applicants = [];

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
  const {
    user,
    isAuthenticated,
    isLoading,
    logout,
  } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const isOperations = portalRole === USER_ROLES.OPERATIONS;
  const displayName = user?.name || (isOperations ? 'Operations Team' : 'Super Admin');

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0])
    .join('')
    .toUpperCase();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    if (
      user?.role !== portalRole
    ) {
      router.replace(
        getRoleHome(user?.role)
      );
    }
  }, [
    isAuthenticated,
    isLoading,
    portalRole,
    router,
    user?.role,
  ]);

  if (
    isLoading ||
    !isAuthenticated ||
    user?.role !== portalRole
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

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
        <div className={styles.accountPanel}>
          <div className={styles.accountIdentity}>
            <span className={styles.avatarTiny}>
              {initials}
            </span>

            <span className={styles.accountText}>
              <strong>{displayName}</strong>
              <small>{isOperations ? 'Operations' : 'Owner'}</small>
            </span>
          </div>

          <button
            type="button"
            className={styles.signOutButton}
            onClick={logout}
          >
            <FiLogOut />
            <span>Sign out</span>
          </button>
        </div>
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

function OperationsShell({
  section,
  children,
  navItems,
}) {
  const {
    user,
    isAuthenticated,
    isLoading,
    logout,
  } = useAuth();

  const router = useRouter();

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    if (
      user?.role !==
      USER_ROLES.OPERATIONS
    ) {
      router.replace(
        getRoleHome(user?.role)
      );
    }
  }, [
    isAuthenticated,
    isLoading,
    router,
    user?.role,
  ]);

  const displayName =
    user?.name || 'Operations Team';

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (namePart) =>
        namePart[0]
    )
    .join('')
    .toUpperCase();

  if (
    isLoading ||
    !isAuthenticated ||
    user?.role !==
      USER_ROLES.OPERATIONS
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() =>
            setMenuOpen(false)
          }
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0',
          menuOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        )}
      >
        <div className="flex h-24 items-center border-b border-slate-200 px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="ApplyLoop logo"
              width={48}
              height={48}
              priority
              className="h-12 w-12 rounded-xl object-cover"
            />

            <div>
              <p className="text-xl font-bold tracking-tight text-slate-950">
                ApplyLoop
              </p>

              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Operations Portal
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map(
            (item) => {
              const Icon =
                item.icon;

              const active =
                section ===
                item.section;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setMenuOpen(
                      false
                    )
                  }
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition',
                    active
                      ? 'bg-blue-50 font-semibold text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  )}
                >
                  <Icon className="h-5 w-5" />

                  <span>
                    {item.label}
                  </span>
                </Link>
              );
            }
          )}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {displayName}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Operations
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 max-w-full lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-24 items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() =>
                  setMenuOpen(true)
                }
                aria-label="Open menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
              >
                <FiMenu className="h-5 w-5" />
              </button>

              <Image
                src="/logo.svg"
                alt="ApplyLoop logo"
                width={42}
                height={42}
                priority
                className="h-11 w-11 rounded-xl object-cover"
              />

              <span className="text-lg font-bold text-slate-950">
                ApplyLoop
              </span>
            </div>

            <div className="hidden lg:block">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                Operations
              </p>

              <p className="mt-1.5 text-base font-semibold text-slate-800">
                {displayName}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <FiLogOut className="h-4 w-4" />

              Sign out
            </button>
          </div>
        </header>

        <main className="min-w-0 max-w-full overflow-x-hidden px-5 py-9 sm:px-8 lg:py-10">
          {children}
        </main>
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

const FILTER_OPTIONS = {
  'All Plans': [
    { value: 'all', label: 'All Plans' },
    { value: 'basic', label: 'Basic' },
    { value: 'standard', label: 'Standard' },
    { value: 'premium', label: 'Premium' },
    { value: 'quarterly', label: 'Quarterly' },
  ],
  'All Statuses': [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
  ],
  'All Period': [
    { value: 'all', label: 'All Periods' },
    { value: 'current', label: 'Current Period' },
    { value: 'previous', label: 'Previous Period' },
  ],
};

function SearchFilters({
  placeholder = 'Search...',
  filters = [],
  compact = false,
  action,
}) {
  return (
    <div
      className={cn(
        styles.searchPanel,
        compact && styles.searchPanelCompact
      )}
    >
      <label className={styles.searchField}>
        <FiSearch />
        <input placeholder={placeholder} />
      </label>

      {filters.map((filter) => (
        <CustomSelect
          key={filter}
          name={filter
            .toLowerCase()
            .replace(/[^a-z]+/g, '-')}
          compact
          defaultValue="all"
          options={
            FILTER_OPTIONS[filter] || [
              {
                value: 'all',
                label: filter,
              },
            ]
          }
        />
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
  const [
    overview,
    setOverview,
  ] = useState({
    clients: [],
    applications: [],
    applicationSummary: {},
    audits: [],
  });

  const [
    overviewLoading,
    setOverviewLoading,
  ] = useState(true);

  const [
    overviewError,
    setOverviewError,
  ] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadOverview =
      async () => {
        setOverviewLoading(true);
        setOverviewError('');

        try {
          const token =
            await getOwnerAccessToken();

          const headers = {
            Authorization:
              `Bearer ${token}`,
          };

          const responses =
            await Promise.all([
              fetch(
                '/api/admin/clients',
                { headers }
              ),
              fetch(
                '/api/applications',
                { headers }
              ),
              fetch(
                '/api/audits',
                { headers }
              ),
            ]);

          const [
            clientsResult,
            applicationsResult,
            auditsResult,
          ] =
            await Promise.all(
              responses.map(
                (response) =>
                  response.json()
              )
            );

          const failedIndex =
            responses.findIndex(
              (response) =>
                !response.ok
            );

          if (
            failedIndex !== -1
          ) {
            const failedBody = [
              clientsResult,
              applicationsResult,
              auditsResult,
            ][failedIndex];

            throw new Error(
              failedBody?.error ||
                'Owner overview could not be loaded.'
            );
          }

          if (cancelled) {
            return;
          }

          setOverview({
            clients:
              clientsResult.clients ||
              [],
            applications:
              applicationsResult
                .applications || [],
            applicationSummary:
              applicationsResult
                .summary || {},
            audits:
              auditsResult.audits ||
              [],
          });
        } catch (error) {
          if (cancelled) {
            return;
          }

          setOverviewError(
            error?.message ||
              'Owner overview could not be loaded.'
          );
        } finally {
          if (!cancelled) {
            setOverviewLoading(
              false
            );
          }
        }
      };

    loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics =
    getOwnerOverviewMetrics(
      overview
    );

  const unavailable =
    overviewLoading ||
    Boolean(overviewError);

  const cards =
    getOwnerDashboardCards(
      metrics,
      unavailable
    );

  const feed =
    getOwnerDashboardFeed(
      overview.applications
    );

  return (
    <>
      <PageHeader section="dashboard" />

      {overviewError && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {overviewError}
        </div>
      )}

      <div
        className={
          styles.statsGridEight
        }
      >
        {cards.map((card) => (
          <StatCard
            key={card.label}
            {...card}
          />
        ))}
      </div>

      <div
        className={
          styles.dashboardMain
        }
      >
        <Card>
          <div
            className={
              styles.dashboardAnalyticsHeader
            }
          >
            <h2>
              Analytics Preview
            </h2>

            <label
              className={
                styles.inlineSelect
              }
            >
              <span>
                Reference visualization
              </span>
              <FiChevronDown />
            </label>
          </div>

          <div
            className={
              styles.chartBlock
            }
          >
            <p
              className={
                styles.chartTitle
              }
            >
              Applications & Interviews
              (Reference)
            </p>

            <AxisMultiLineChart
              xLabels={[
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat',
                'Sun',
              ]}
              maxY={80}
              yStep={20}
              series={[
                {
                  label:
                    'Applications',
                  color:
                    '#3b82f6',
                  values: [
                    44,
                    52,
                    61,
                    58,
                    71,
                    38,
                    42,
                  ],
                },
                {
                  label:
                    'Interviews',
                  color:
                    '#8b5cf6',
                  values: [
                    18,
                    24,
                    31,
                    29,
                    36,
                    20,
                    22,
                  ],
                },
              ]}
            />
          </div>

          <div
            className={
              styles.chartBlock
            }
          >
            <div
              className={
                styles.chartHeaderMini
              }
            >
              <p
                className={
                  styles.chartTitle
                }
              >
                Revenue Growth
                (Reference)
              </p>

              <label
                className={
                  styles.inlineSelect
                }
              >
                <span>
                  Reference visualization
                </span>
                <FiChevronDown />
              </label>
            </div>

            <AxisBarChart
              values={[
                45000,
                52000,
                61000,
                58000,
                76000,
              ]}
              xLabels={[
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
              ]}
              maxY={80000}
              yStep={20000}
              color="#2d58cb"
              legend="Revenue ($)"
            />
          </div>

          <div
            className={
              styles.chartBlock
            }
          >
            <p
              className={
                styles.chartTitle
              }
            >
              Conversion Funnel
              (Reference)
            </p>

            <ConversionFunnelChart />
          </div>
        </Card>

        <Card
          className={
            styles.feedCard
          }
        >
          <div
            className={
              styles.feedHeader
            }
          >
            <h2>
              Recent Application Activity
            </h2>

            <span
              className={
                styles.livePill
              }
            >
              <span />
              Live data
            </span>
          </div>

          <div
            className={
              styles.feedList
            }
          >
            {overviewLoading ? (
              <div
                className={
                  styles.feedItem
                }
              >
                <div>
                  <strong>
                    Loading recent activity...
                  </strong>
                </div>
              </div>
            ) : feed.length ? (
              feed.map(
                ([
                  text,
                  time,
                  tone,
                ]) => (
                  <div
                    key={`${text}-${time}`}
                    className={
                      styles.feedItem
                    }
                  >
                    <span
                      className={cn(
                        styles.feedIcon,
                        styles[
                          `feed_${tone}`
                        ]
                      )}
                    />

                    <div>
                      <strong>
                        {formatMultiLine(
                          text
                        )}
                      </strong>

                      <small>
                        {time}
                      </small>
                    </div>
                  </div>
                )
              )
            ) : (
              <div
                className={
                  styles.feedItem
                }
              >
                <div>
                  <strong>
                    No recent application activity.
                  </strong>
                  <small>
                    Live data
                  </small>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div
          className={
            styles.operationalHead
          }
        >
          <h2>
            Operational Overview
          </h2>

          <div
            className={
              styles.healthLegend
            }
          >
            <span>
              <i
                className={
                  styles.dotGreen
                }
              />{' '}
              Live
            </span>
          </div>
        </div>

        <div
          className={
            styles.healthGrid
          }
        >
          <HealthCard
            icon={FiBarChart2}
            title="Data Connection"
            score={
              overviewError
                ? 'Attention'
                : overviewLoading
                  ? 'Loading'
                  : 'Live'
            }
            tone={
              overviewError
                ? 'red'
                : overviewLoading
                  ? 'yellow'
                  : 'green'
            }
          />

          <HealthCard
            icon={
              HiOutlineUserGroup
            }
            title="Active Clients"
            score={
              unavailable
                ? '—'
                : String(
                    metrics.activeClients
                  )
            }
            tone="mint"
          />

          <HealthCard
            icon={FiFileText}
            title="Total Applications"
            score={
              unavailable
                ? '—'
                : String(
                    metrics
                      .totalApplications
                  )
            }
            tone="green"
          />

          <HealthCard
            icon={FiTrendingUp}
            title="Priority Clients"
            score={
              unavailable
                ? '—'
                : String(
                    metrics
                      .priorityClients
                  )
            }
            tone="orange"
          />

          <HealthCard
            icon={
              FiAlertTriangle
            }
            title="Pending Audits"
            score={
              unavailable
                ? '—'
                : String(
                    metrics.pendingAudits
                  )
            }
            tone={
              metrics.pendingAudits >
              0
                ? 'yellow'
                : 'green'
            }
          />
        </div>
      </Card>
    </>
  );
}

function ClientManagementPage({
  mode = 'owner',
}) {
  return (
    <div className={styles.clientManagementWorkspace}>
      <ClientManagementWorkspace mode={mode} />
    </div>
  );
}

export function ApplicantsManagementPage({
  openAddApplicant,
  onPasswordReset,
  refreshKey,
  mode = 'owner',
}) {
  const router = useRouter();
  const [applicants, setApplicants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');
  const [
    resettingApplicantId,
    setResettingApplicantId,
  ] = useState(null);
  const [
    passwordResetApplicant,
    setPasswordResetApplicant,
  ] = useState(null);
  const [
    passwordResetError,
    setPasswordResetError,
  ] = useState('');

  const [
    assignmentApplicant,
    setAssignmentApplicant,
  ] = useState(null);
  const [
    assignmentClients,
    setAssignmentClients,
  ] = useState([]);
  const [
    isLoadingAssignments,
    setIsLoadingAssignments,
  ] = useState(false);
  const [
    assigningClientId,
    setAssigningClientId,
  ] = useState(null);
  const [
    unassigningClientId,
    setUnassigningClientId,
  ] = useState(null);
  const [
    assignmentError,
    setAssignmentError,
  ] = useState('');
  const [
    assignmentMessage,
    setAssignmentMessage,
  ] = useState('');
  const [
    assignmentSearch,
    setAssignmentSearch,
  ] = useState('');
  const [
    statsApplicant,
    setStatsApplicant,
  ] = useState(null);
  const [
    statusApplicant,
    setStatusApplicant,
  ] = useState(null);
  const [
    isSavingApplicantStatus,
    setIsSavingApplicantStatus,
  ] = useState(false);
  const [
    applicantStatusError,
    setApplicantStatusError,
  ] = useState('');
  const [
    savingAvailabilityApplicantId,
    setSavingAvailabilityApplicantId,
  ] = useState(null);
  const [
    chatApplicant,
    setChatApplicant,
  ] = useState(null);
  const [
    chatMessages,
    setChatMessages,
  ] = useState([]);
  const [
    chatCurrentProfileId,
    setChatCurrentProfileId,
  ] = useState('');
  const [
    chatDraft,
    setChatDraft,
  ] = useState('');
  const [
    isLoadingChat,
    setIsLoadingChat,
  ] = useState(false);
  const [
    isSendingChat,
    setIsSendingChat,
  ] = useState(false);
  const [
    chatError,
    setChatError,
  ] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadApplicants = async () => {
      setIsLoading(true);
      setListError('');

      try {
        const accessToken =
          await getOwnerAccessToken();

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
              'The applicant list could not be loaded.'
          );
        }

        if (!cancelled) {
          setApplicants(
            result.applicants || []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setListError(
            error?.message ||
              'The applicant list could not be loaded.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadApplicants();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const visibleApplicants = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    if (!normalizedSearch) {
      return applicants;
    }

    return applicants.filter(
      (applicant) =>
        [
          applicant.fullName,
          applicant.email,
          applicant.phone,
          applicant.assignedTeam,
          (applicant.assignedClients || [])
            .map(
              (client) =>
                client.fullName
            )
            .join(' '),
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(normalizedSearch)
        )
    );
  }, [applicants, search]);

  const visibleAssignmentClients = useMemo(() => {
    const normalizedSearch =
      assignmentSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return assignmentClients;
    }

    return assignmentClients.filter(
      (client) =>
        [
          client.fullName,
          client.email,
          client.phone,
          client.plan,
          client.assignedTeam,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(normalizedSearch)
        )
    );
  }, [
    assignmentClients,
    assignmentSearch,
  ]);

  const openAssignmentModal = async (
    applicant
  ) => {
    setAssignmentApplicant(applicant);
    setAssignmentClients([]);
    setAssignmentError('');
    setAssignmentMessage('');
    setAssignmentSearch('');
    setIsLoadingAssignments(true);

    try {
      const accessToken =
        await getOwnerAccessToken();

      const response = await fetch(
        `/api/admin/applicants/${applicant.id}/assignments`,
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
            'The client list could not be loaded.'
        );
      }

      setAssignmentClients(
        result.clients || []
      );
    } catch (error) {
      setAssignmentError(
        error?.message ||
          'The client list could not be loaded.'
      );
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const closeAssignmentModal = () => {
    if (
      assigningClientId ||
      unassigningClientId
    ) {
      return;
    }

    setAssignmentApplicant(null);
    setAssignmentClients([]);
    setAssignmentError('');
    setAssignmentMessage('');
    setAssignmentSearch('');
  };

  const formatChatTime = (value) => {
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

  const loadApplicantChat = async (
    applicant,
    silent = false
  ) => {
    if (!applicant) {
      return;
    }

    if (!silent) {
      setIsLoadingChat(true);
    }

    setChatError('');

    try {
      const accessToken =
        await getOwnerAccessToken();

      const response = await fetch(
        `/api/admin/applicants/${applicant.id}/messages`,
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
            'The conversation could not be loaded.'
        );
      }

      setChatMessages(
        result.messages || []
      );

      setChatCurrentProfileId(
        result.currentProfileId || ''
      );
    } catch (error) {
      setChatError(
        error?.message ||
          'The conversation could not be loaded.'
      );
    } finally {
      if (!silent) {
        setIsLoadingChat(false);
      }
    }
  };

  const openApplicantChat = async (
    applicant
  ) => {
    setChatApplicant(applicant);
    setChatMessages([]);
    setChatDraft('');
    setChatError('');
    setChatCurrentProfileId('');

    await loadApplicantChat(
      applicant
    );
  };

  const closeApplicantChat = () => {
    if (isSendingChat) {
      return;
    }

    setChatApplicant(null);
    setChatMessages([]);
    setChatCurrentProfileId('');
    setChatDraft('');
    setChatError('');
  };

  const sendApplicantChatMessage =
    async () => {
      if (
        !chatApplicant ||
        isSendingChat
      ) {
        return;
      }

      const message =
        chatDraft.trim();

      if (!message) {
        setChatError(
          'Enter a message.'
        );
        return;
      }

      setIsSendingChat(true);
      setChatError('');

      try {
        const accessToken =
          await getOwnerAccessToken();

        const response = await fetch(
          `/api/admin/applicants/${chatApplicant.id}/messages`,
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
              'The message could not be sent.'
          );
        }

        if (result.message) {
          setChatMessages(
            (current) => [
              ...current,
              result.message,
            ]
          );
        }

        setChatDraft('');
      } catch (error) {
        setChatError(
          error?.message ||
            'The message could not be sent.'
        );
      } finally {
        setIsSendingChat(false);
      }
    };

  const updateApplicantAvailability =
    async (applicant) => {
      if (
        !applicant ||
        applicant.accountStatus !==
          'active'
      ) {
        return;
      }

      const nextAvailability =
        applicant.availability ===
        'available'
          ? 'inactive'
          : 'available';

      setSavingAvailabilityApplicantId(
        applicant.id
      );
      setListError('');

      try {
        const accessToken =
          await getOwnerAccessToken();

        const response = await fetch(
          `/api/admin/applicants/${applicant.id}/availability`,
          {
            method: 'PATCH',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              availability:
                nextAvailability,
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
              'The applicant availability could not be updated.'
          );
        }

        const savedAvailability =
          result.applicant
            ?.availability ||
          nextAvailability;

        setApplicants(
          (current) =>
            current.map(
              (currentApplicant) =>
                currentApplicant.id ===
                applicant.id
                  ? {
                      ...currentApplicant,
                      availability:
                        savedAvailability,
                    }
                  : currentApplicant
            )
        );

        setStatsApplicant(
          (current) =>
            current?.id ===
            applicant.id
              ? {
                  ...current,
                  availability:
                    savedAvailability,
                }
              : current
        );
      } catch (error) {
        setListError(
          error?.message ||
            'The applicant availability could not be updated.'
        );
      } finally {
        setSavingAvailabilityApplicantId(
          null
        );
      }
    };

  const updateApplicantAccountStatus = async () => {
    if (!statusApplicant) {
      return;
    }

    const nextStatus =
      statusApplicant.accountStatus ===
      'suspended'
        ? 'active'
        : 'suspended';

    setIsSavingApplicantStatus(true);
    setApplicantStatusError('');
    setListError('');

    try {
      const accessToken =
        await getOwnerAccessToken();

      const response = await fetch(
        `/api/admin/applicants/${statusApplicant.id}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            accountStatus: nextStatus,
          }),
        }
      );

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            'The applicant account could not be updated.'
        );
      }

      setApplicants((current) =>
        current.map((applicant) =>
          applicant.id ===
          statusApplicant.id
            ? {
                ...applicant,
                accountStatus:
                  result.applicant
                    ?.accountStatus ||
                  nextStatus,
                assignedClients:
                  nextStatus ===
                  'suspended'
                    ? []
                    : applicant.assignedClients,
              }
            : applicant
        )
      );

      setStatsApplicant(
        (current) =>
          current?.id ===
          statusApplicant.id
            ? {
                ...current,
                accountStatus:
                  result.applicant
                    ?.accountStatus ||
                  nextStatus,
                assignedClients:
                  nextStatus ===
                  'suspended'
                    ? []
                    : current.assignedClients,
              }
            : current
      );

      setStatusApplicant(null);
      setApplicantStatusError('');
    } catch (error) {
      setApplicantStatusError(
        error?.message ||
          'The applicant account could not be updated.'
      );
    } finally {
      setIsSavingApplicantStatus(false);
    }
  };

  const assignClientToApplicant = async (
    client
  ) => {
    if (
      !assignmentApplicant ||
      !client.canAssign
    ) {
      return;
    }

    setAssigningClientId(client.id);
    setAssignmentError('');
    setAssignmentMessage('');

    try {
      const accessToken =
        await getOwnerAccessToken();

      const response = await fetch(
        `/api/admin/applicants/${assignmentApplicant.id}/assignments`,
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            clientId: client.id,
          }),
        }
      );

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            'The client could not be assigned.'
        );
      }

      setAssignmentClients(
        (current) =>
          current.map((item) => {
            if (item.id !== client.id) {
              return item;
            }

            const assignmentCount =
              Math.min(
                2,
                Number(
                  item.assignmentCount || 0
                ) + 1
              );

            return {
              ...item,
              assignmentCount,
              remainingSlots:
                Math.max(
                  0,
                  2 - assignmentCount
                ),
              isAssigned: true,
              canAssign: false,
            };
          })
      );

      setApplicants((current) =>
        current.map((applicant) => {
          if (
            applicant.id !==
            assignmentApplicant.id
          ) {
            return applicant;
          }

          const assignedClients =
            applicant.assignedClients ||
            [];

          if (
            assignedClients.some(
              (assignedClient) =>
                assignedClient.id ===
                client.id
            )
          ) {
            return applicant;
          }

          return {
            ...applicant,
            assignedClients: [
              ...assignedClients,
              {
                id: client.id,
                fullName:
                  client.fullName,
                email:
                  client.email || '',
                plan:
                  client.plan || '',
                status:
                  client.status ||
                  'active',
              },
            ],
          };
        })
      );

      setAssignmentMessage(
        `${client.fullName} was assigned to ${assignmentApplicant.fullName}.`
      );
    } catch (error) {
      setAssignmentError(
        error?.message ||
          'The client could not be assigned.'
      );
    } finally {
      setAssigningClientId(null);
    }
  };

  const unassignClientFromApplicant =
    async (client) => {
      if (
        !assignmentApplicant ||
        !client.isAssigned
      ) {
        return;
      }

      setUnassigningClientId(
        client.id
      );
      setAssignmentError('');
      setAssignmentMessage('');

      try {
        const accessToken =
          await getOwnerAccessToken();

        const response = await fetch(
          `/api/admin/applicants/${assignmentApplicant.id}/assignments`,
          {
            method: 'DELETE',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              clientId: client.id,
            }),
          }
        );

        const result = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.error ||
              'The client could not be unassigned.'
          );
        }

        setAssignmentClients(
          (current) =>
            current.map((item) => {
              if (
                item.id !==
                client.id
              ) {
                return item;
              }

              const assignmentCount =
                Math.max(
                  0,
                  Number(
                    item.assignmentCount ||
                      0
                  ) - 1
                );

              return {
                ...item,
                assignmentCount,
                remainingSlots:
                  Math.max(
                    0,
                    2 - assignmentCount
                  ),
                isAssigned: false,
                canAssign:
                  assignmentApplicant
                    .accountStatus ===
                    'active' &&
                  assignmentApplicant
                    .availability ===
                    'available' &&
                  item.status ===
                    'active' &&
                  assignmentCount < 2,
              };
            })
        );

        setApplicants(
          (current) =>
            current.map(
              (applicant) => {
                if (
                  applicant.id !==
                  assignmentApplicant.id
                ) {
                  return applicant;
                }

                return {
                  ...applicant,
                  assignedClients: (
                    applicant.assignedClients ||
                    []
                  ).filter(
                    (assignedClient) =>
                      assignedClient.id !==
                      client.id
                  ),
                };
              }
            )
        );

        setStatsApplicant(
          (current) => {
            if (
              current?.id !==
              assignmentApplicant.id
            ) {
              return current;
            }

            return {
              ...current,
              assignedClients: (
                current.assignedClients ||
                []
              ).filter(
                (assignedClient) =>
                  assignedClient.id !==
                  client.id
              ),
            };
          }
        );

        setAssignmentMessage(
          `${client.fullName} was unassigned from ${assignmentApplicant.fullName}.`
        );
      } catch (error) {
        setAssignmentError(
          error?.message ||
            'The client could not be unassigned.'
        );
      } finally {
        setUnassigningClientId(
          null
        );
      }
    };

  const resetApplicantPassword = async (
    applicant
  ) => {
    setResettingApplicantId(
      applicant.id
    );
    setListError('');
    setPasswordResetError('');

    try {
      const accessToken =
        await getOwnerAccessToken();

      const response = await fetch(
        `/api/admin/applicants/${applicant.id}/reset-password`,
        {
          method: 'POST',
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
            'A new password could not be generated.'
        );
      }

      setPasswordResetApplicant(null);
      setPasswordResetError('');

      onPasswordReset?.(
        result.credentials
      );
    } catch (error) {
      const message =
        error?.message ||
        'A new password could not be generated.';

      setPasswordResetError(message);
      setListError(message);
    } finally {
      setResettingApplicantId(null);
    }
  };

  const totalApplicants = applicants.length;

  const availableApplicants =
    applicants.filter(
      (applicant) =>
        applicant.availability ===
          'available' &&
        applicant.accountStatus ===
          'active'
    ).length;

  const inactiveApplicants =
    totalApplicants -
    availableApplicants;

  const averageCompletionRate =
    applicants.length > 0
      ? applicants.reduce(
          (total, applicant) =>
            total +
            Number(
              applicant.completionRate || 0
            ),
          0
        ) / applicants.length
      : 0;

  const stats = [
    {
      label: 'TOTAL APPLICANTS',
      value: String(totalApplicants),
    },
    {
      label: 'AVAILABLE',
      value: String(availableApplicants),
      tone: 'green',
    },
    {
      label: 'AVG COMPLETION RATE',
      value:
        averageCompletionRate === 0
          ? '0%'
          : `${averageCompletionRate.toFixed(
              1
            )}%`,
    },
    {
      label: 'INACTIVE',
      value: String(inactiveApplicants),
    },
  ];

  return (
    <div
      className={
        styles.clientManagementWorkspace
      }
    >
      <section
        className={cn(
          'mx-auto w-full min-w-0 max-w-full',
          mode !== 'operations' &&
            'pt-6 sm:pt-8'
        )}
      >
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Applicants Management
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Create applicant accounts, manage
              availability, assign teams, and monitor
              performance.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddApplicant}
            className={cn(
              styles.shineButton,
              'inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg'
            )}
          >
            <FiUserPlus className="h-4 w-4" />

            <span className={styles.shineText}>
              Add New Applicant
            </span>
          </button>
        </div>

        <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                'rounded-2xl border p-5 shadow-sm transition-all sm:p-6',
                stat.tone === 'green'
                  ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white shadow-emerald-100/60'
                  : 'border-slate-200 bg-white'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p
                  className={cn(
                    'text-xs font-bold tracking-wide',
                    stat.tone === 'green'
                      ? 'text-emerald-700'
                      : 'text-slate-500'
                  )}
                >
                  {stat.label}
                </p>

                {stat.tone === 'green' && (
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                )}
              </div>

              <p
                className={cn(
                  'mt-5 text-3xl font-bold',
                  stat.tone === 'green'
                    ? 'text-emerald-700'
                    : 'text-slate-950'
                )}
              >
                {stat.value}
              </p>

              {stat.tone === 'green' && (
                <p className="mt-2 text-xs font-medium text-emerald-600">
                  Active and ready for assignments
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <label className="relative block">
              <FiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search applicants by name, email, phone, or team"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>

          {listError && (
            <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:m-6">
              {listError}
            </div>
          )}

          {isLoading ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center p-8">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

              <p className="mt-4 text-sm font-medium text-slate-600">
                Loading applicants...
              </p>
            </div>
          ) : visibleApplicants.length ===
            0 ? (
            <div className="flex min-h-[390px] flex-col items-center justify-center px-6 py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                <FiUsers className="h-8 w-8 text-blue-600" />
              </div>

              <h2 className="mt-6 text-xl font-bold text-slate-950">
                {applicants.length === 0
                  ? 'No applicants have been added yet'
                  : 'No matching applicants found'}
              </h2>

              <p className="mt-3 max-w-lg text-base leading-7 text-slate-600">
                {applicants.length === 0
                  ? 'Create your first applicant account to begin assigning teams and managing their work.'
                  : 'Try changing your search.'}
              </p>

              {applicants.length === 0 && (
                <button
                  type="button"
                  onClick={openAddApplicant}
                  className={cn(
                    styles.shineButton,
                    'mt-7 inline-flex items-center gap-2 rounded-[14px] border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700'
                  )}
                >
                  <FiPlus className="h-4 w-4" />

                  <span
                    className={cn(
                      styles.shineText,
                      styles.shineTextDark
                    )}
                  >
                    Create First Applicant
                  </span>
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1220px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      {[
                        'TEAM MEMBER',
                        'ASSIGNED CLIENTS',
                        'STATUS',
                        'ACTIVE TASKS',
                        'QUALITY RATING',
                        'COMPLETION RATE',
                        'ACTION',
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-4 py-4 text-xs font-bold tracking-wide text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {visibleApplicants.map(
                      (applicant) => {
                        const completionRate =
                          Math.min(
                            100,
                            Math.max(
                              0,
                              Number(
                                applicant.completionRate ||
                                  0
                              )
                            )
                          );

                        const qualityRating =
                          Math.min(
                            5,
                            Math.max(
                              0,
                              Number(
                                applicant.qualityRating ||
                                  0
                              )
                            )
                          );

                        return (
                          <tr
                            key={applicant.id}
                            className="border-b border-slate-100 transition-colors hover:bg-slate-50/80"
                          >
                            <td className="px-5 py-5">
                              <button
                                type="button"
                                disabled={
                                  mode === 'operations'
                                }
                                onClick={() => {
                                  if (
                                    mode ===
                                    'operations'
                                  ) {
                                    return;
                                  }

                                  router.push({
                                    pathname:
                                      '/applicant',
                                    query: {
                                      previewApplicantId:
                                        applicant.id,
                                    },
                                  });
                                }}
                                className={cn(
                                  'group block text-left',
                                  mode ===
                                    'operations' &&
                                    'cursor-default'
                                )}
                              >
                                <span
                                  className={cn(
                                    'text-base font-semibold leading-5 underline-offset-4 transition-colors',
                                    mode ===
                                      'operations'
                                      ? 'text-slate-900'
                                      : 'text-blue-700 group-hover:text-blue-600 group-hover:underline'
                                  )}
                                >
                                  {applicant.fullName}
                                </span>

                                <span className="mt-1 block text-xs text-slate-500">
                                  {applicant.email}
                                </span>

                                <span className="mt-1 block text-xs font-medium text-slate-700">
                                  {applicant.phone ||
                                    'No phone number'}
                                </span>

                                {mode !==
                                  'operations' && (
                                  <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600">
                                    View as Applicant
                                    <FiExternalLink className="h-3 w-3" />
                                  </span>
                                )}

                                <span className="mt-2 block text-xs text-slate-400">
                                  {applicant.completedTasks}{' '}
                                  completed
                                </span>
                              </button>
                            </td>

                            <td className="min-w-[190px] px-5 py-5">
                              {(
                                applicant.assignedClients ||
                                []
                              ).length > 0 ? (
                                <div className="space-y-1.5">
                                  {applicant.assignedClients.map(
                                    (client) => (
                                      <div
                                        key={client.id}
                                        className="inline-flex max-w-[180px] items-center rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700"
                                      >
                                        <span className="truncate">
                                          {client.fullName}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400">
                                  Unassigned
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-5">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
                                  applicant.accountStatus ===
                                    'active' &&
                                    applicant.availability ===
                                      'available'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                                )}
                              >
                                <span
                                  className={cn(
                                    'h-2 w-2 rounded-full',
                                    applicant.accountStatus ===
                                      'active' &&
                                      applicant.availability ===
                                        'available'
                                      ? 'bg-emerald-500'
                                      : 'bg-slate-400'
                                  )}
                                />

                                {applicant.accountStatus ===
                                  'active' &&
                                applicant.availability ===
                                  'available'
                                  ? 'Available'
                                  : 'Inactive'}
                              </span>
                            </td>

                            <td className="px-5 py-5">
                              <span className="inline-flex min-w-[44px] items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800">
                                {applicant.activeTasks}
                              </span>
                            </td>

                            <td className="px-5 py-5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-slate-900">
                                  {qualityRating.toFixed(
                                    1
                                  )}
                                </span>

                                <span className="text-base text-amber-500">
                                  ★
                                </span>
                              </div>
                            </td>

                            <td className="min-w-[190px] px-5 py-5">
                              <div className="flex items-center justify-between gap-4">
                                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-blue-600 transition-all"
                                    style={{
                                      width: `${completionRate}%`,
                                    }}
                                  />
                                </div>

                                <span className="min-w-[48px] text-right text-sm font-bold text-slate-800">
                                  {completionRate.toFixed(
                                    0
                                  )}
                                  %
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-5">
                              <div className="flex min-w-max items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openAssignmentModal(
                                      applicant
                                    )
                                  }
                                  disabled={
                                    applicant.accountStatus ===
                                      'suspended' ||
                                    applicant.availability !==
                                      'available'
                                  }
                                  title={
                                    applicant.accountStatus ===
                                    'suspended'
                                      ? 'Reactivate this applicant before assigning another client'
                                      : applicant.availability !==
                                          'available'
                                        ? 'Set this applicant to Available before assigning another client'
                                        : 'Assign client'
                                  }
                                  className={cn(
                                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition',
                                    applicant.accountStatus ===
                                      'suspended' ||
                                    applicant.availability !==
                                      'available'
                                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                      : 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100'
                                  )}
                                >
                                  <FiPlus className="h-3.5 w-3.5" />
                                  Assign
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateApplicantAvailability(
                                      applicant
                                    )
                                  }
                                  disabled={
                                    applicant.accountStatus ===
                                      'suspended' ||
                                    savingAvailabilityApplicantId ===
                                      applicant.id
                                  }
                                  title={
                                    applicant.accountStatus ===
                                    'suspended'
                                      ? 'Reactivate this applicant before changing availability'
                                      : applicant.availability ===
                                          'available'
                                        ? 'Set applicant to Inactive'
                                        : 'Set applicant to Available'
                                  }
                                  className={cn(
                                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                                    applicant.availability ===
                                      'available'
                                      ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  )}
                                >
                                  <FiRefreshCw
                                    className={cn(
                                      'h-3.5 w-3.5',
                                      savingAvailabilityApplicantId ===
                                        applicant.id &&
                                        'animate-spin'
                                    )}
                                  />

                                  {savingAvailabilityApplicantId ===
                                  applicant.id
                                    ? 'Updating...'
                                    : applicant.availability ===
                                        'available'
                                      ? 'Set Inactive'
                                      : 'Set Available'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setStatsApplicant(
                                      applicant
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <FiBarChart2 className="h-3.5 w-3.5" />
                                  Stats
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openApplicantChat(
                                      applicant
                                    )
                                  }
                                  title={`Chat with ${applicant.fullName}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
                                >
                                  <FiMessageSquare className="h-3.5 w-3.5" />
                                  Chat
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setApplicantStatusError(
                                      ''
                                    );
                                    setStatusApplicant(
                                      applicant
                                    );
                                  }}
                                  title={
                                    applicant.accountStatus ===
                                    'suspended'
                                      ? 'Reactivate account'
                                      : 'Pause account'
                                  }
                                  className={cn(
                                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition',
                                    applicant.accountStatus ===
                                      'suspended'
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  )}
                                >
                                  {applicant.accountStatus ===
                                  'suspended' ? (
                                    <FiPlayCircle className="h-3.5 w-3.5" />
                                  ) : (
                                    <FiPauseCircle className="h-3.5 w-3.5" />
                                  )}

                                  {applicant.accountStatus ===
                                  'suspended'
                                    ? 'Reactivate'
                                    : 'Pause'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setPasswordResetError(
                                      ''
                                    );
                                    setPasswordResetApplicant(
                                      applicant
                                    );
                                  }}
                                  disabled={
                                    resettingApplicantId ===
                                    applicant.id
                                  }
                                  title="Reset temporary password"
                                  aria-label={`Reset temporary password for ${applicant.fullName}`}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <FiKey className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing{' '}
                  {visibleApplicants.length} of{' '}
                  {applicants.length} applicants
                </span>

                <span>
                  Search updates this table instantly.
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      <Modal
        open={Boolean(chatApplicant)}
        onClose={closeApplicantChat}
        title={
          chatApplicant
            ? `Chat with ${chatApplicant.fullName}`
            : 'Applicant Chat'
        }
        subtitle={
          chatApplicant?.email ||
          'Team conversation'
        }
        wide
      >
        <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Team Conversation
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Messages are shared with this Applicant&apos;s workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadApplicantChat(
                  chatApplicant
                )
              }
              disabled={
                isLoadingChat ||
                isSendingChat
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Refresh conversation"
              title="Refresh conversation"
            >
              <FiRefreshCw
                className={cn(
                  'h-4 w-4',
                  isLoadingChat &&
                    'animate-spin'
                )}
              />
            </button>
          </div>

          <div className="max-h-[430px] min-h-[330px] overflow-y-auto bg-slate-50/30 px-5 py-5">
            {isLoadingChat ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading conversation...
                </p>
              </div>
            ) : chatMessages.length ===
              0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <FiMessageSquare className="h-6 w-6" />
                </div>

                <p className="mt-4 font-semibold text-slate-900">
                  No messages yet
                </p>

                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                  Send the first message to start a conversation with this Applicant.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map(
                  (message) => {
                    const isMine =
                      message.senderProfileId ===
                      chatCurrentProfileId;

                    const roleLabel =
                      message.senderRole ===
                      'applicant'
                        ? 'Applicant'
                        : 'Team Member';

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'flex',
                          isMine
                            ? 'justify-end'
                            : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[78%]',
                            isMine
                              ? 'text-right'
                              : 'text-left'
                          )}
                        >
                          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <span
                              className={cn(
                                'font-semibold text-slate-600',
                                isMine &&
                                  'ml-auto'
                              )}
                            >
                              {message.senderName}
                            </span>

                            <span>
                              {roleLabel}
                            </span>

                            <span>
                              {formatChatTime(
                                message.createdAt
                              )}
                            </span>

                            {isMine && (
                              <span
                                className={cn(
                                  'font-medium',
                                  message.readAt
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'
                                )}
                              >
                                {message.readAt
                                  ? 'Seen'
                                  : 'Sent'}
                              </span>
                            )}
                          </div>

                          <div
                            className={cn(
                              'rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm',
                              isMine
                                ? 'rounded-br-md bg-blue-600 text-white'
                                : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {message.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-white p-4">
            {chatError && (
              <div
                role="alert"
                className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {chatError}
              </div>
            )}

            <div className="flex items-end gap-3">
              <textarea
                value={chatDraft}
                onChange={(event) =>
                  setChatDraft(
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
                    sendApplicantChatMessage();
                  }
                }}
                rows={2}
                maxLength={4000}
                placeholder={`Message ${chatApplicant?.fullName || 'Applicant'}...`}
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={
                  sendApplicantChatMessage
                }
                disabled={
                  isSendingChat ||
                  !chatDraft.trim()
                }
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiMessageSquare className="h-4 w-4" />

                {isSendingChat
                  ? 'Sending...'
                  : 'Send'}
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[11px] text-slate-400">
                Press Enter to send. Shift + Enter adds a new line.
              </p>

              <p className="text-[11px] text-slate-400">
                {chatDraft.length}/4000
              </p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(statusApplicant)}
        onClose={() => {
          if (
            !isSavingApplicantStatus
          ) {
            setStatusApplicant(null);
            setApplicantStatusError('');
          }
        }}
        title={
          statusApplicant?.accountStatus ===
          'suspended'
            ? 'Reactivate Account'
            : 'Pause Account'
        }
        subtitle={
          statusApplicant?.fullName || ''
        }
        footer={
          <>
            <button
              type="button"
              className={styles.modalGhost}
              disabled={
                isSavingApplicantStatus
              }
              onClick={() => {
                if (
                  !isSavingApplicantStatus
                ) {
                  setStatusApplicant(null);
                  setApplicantStatusError('');
                }
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                isSavingApplicantStatus
              }
              onClick={
                updateApplicantAccountStatus
              }
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60',
                statusApplicant?.accountStatus ===
                  'suspended'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-500 hover:bg-amber-600'
              )}
            >
              {statusApplicant?.accountStatus ===
              'suspended' ? (
                <FiPlayCircle />
              ) : (
                <FiPauseCircle />
              )}

              {isSavingApplicantStatus
                ? 'Updating...'
                : statusApplicant?.accountStatus ===
                    'suspended'
                  ? 'Reactivate Account'
                  : 'Pause Account'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {applicantStatusError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {applicantStatusError}
            </div>
          )}

          <div
            className={cn(
              'rounded-2xl border p-5',
              statusApplicant?.accountStatus ===
                'suspended'
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-amber-200 bg-amber-50'
            )}
          >
            <h3 className="font-bold text-slate-900">
              {statusApplicant?.accountStatus ===
              'suspended'
                ? 'Reactivating this Applicant will:'
                : 'Pausing this Applicant will:'}
            </h3>

            {statusApplicant?.accountStatus ===
            'suspended' ? (
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                <li>
                  • Restore login access.
                </li>
                <li>
                  • Allow new Client assignments.
                </li>
                <li>
                  • Previous Client assignments will not be restored automatically.
                </li>
              </ul>
            ) : (
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                <li>
                  • Block the Applicant from logging in.
                </li>
                <li>
                  • Prevent new Client assignments.
                </li>
                <li>
                  • Remove all current Client assignments.
                </li>
                <li>
                  • Keep completed work and account history.
                </li>
              </ul>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(assignmentApplicant)}
        onClose={closeAssignmentModal}
        title="Manage Client Assignments"
        subtitle={
          assignmentApplicant
            ? `Assign or unassign clients for ${assignmentApplicant.fullName}`
            : ''
        }
        wide
        footer={
          <button
            type="button"
            className={styles.modalGhost}
            onClick={closeAssignmentModal}
            disabled={Boolean(
              assigningClientId ||
                unassigningClientId
            )}
          >
            Close
          </button>
        }
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-sm font-semibold text-blue-900">
              Each client can have a maximum of
              two Applicants.
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              Clients at 2/2 are full and cannot
              receive another assignment.
            </p>
          </div>

          <label className="relative block">
            <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={assignmentSearch}
              onChange={(event) =>
                setAssignmentSearch(
                  event.target.value
                )
              }
              placeholder="Search clients by name, email, phone, plan, or team"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          {assignmentMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {assignmentMessage}
            </div>
          )}

          {assignmentError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {assignmentError}
            </div>
          )}

          {isLoadingAssignments ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

              <p className="mt-3 text-sm text-slate-500">
                Loading clients...
              </p>
            </div>
          ) : visibleAssignmentClients.length ===
            0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <p className="font-semibold text-slate-900">
                No matching clients found
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search.
              </p>
            </div>
          ) : (
            <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
              {visibleAssignmentClients.map(
                (client) => {
                  const isFull =
                    Number(
                      client.assignmentCount ||
                        0
                    ) >= 2;

                  const isBusy =
                    Boolean(
                      assigningClientId ||
                        unassigningClientId
                    );

                  return (
                    <div
                      key={client.id}
                      className={cn(
                        'rounded-2xl border p-4 transition',
                        client.isAssigned
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : isFull
                            ? 'border-slate-200 bg-slate-50'
                            : 'border-slate-200 bg-white hover:border-blue-300'
                      )}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-950">
                              {client.fullName}
                            </p>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600">
                              {client.plan}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {client.email}
                          </p>

                          {client.phone && (
                            <p className="mt-1 text-xs font-medium text-slate-600">
                              {client.phone}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                            <span className="font-semibold text-slate-700">
                              {client.assignmentCount}
                              /2 Applicants assigned
                            </span>

                            <span
                              className={cn(
                                'font-semibold',
                                isFull
                                  ? 'text-red-600'
                                  : 'text-emerald-600'
                              )}
                            >
                              {client.remainingSlots}{' '}
                              {client.remainingSlots ===
                              1
                                ? 'slot'
                                : 'slots'}{' '}
                              remaining
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            client.isAssigned
                              ? unassignClientFromApplicant(
                                  client
                                )
                              : assignClientToApplicant(
                                  client
                                )
                          }
                          disabled={
                            isBusy ||
                            (!client.isAssigned &&
                              !client.canAssign)
                          }
                          className={cn(
                            'inline-flex min-w-[110px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                            client.isAssigned
                              ? 'border border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100'
                              : isFull
                                ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                          )}
                        >
                          {client.isAssigned
                            ? unassigningClientId ===
                              client.id
                              ? 'Unassigning...'
                              : 'Unassign'
                            : isFull
                              ? 'Full'
                              : assigningClientId ===
                                  client.id
                                ? 'Assigning...'
                                : 'Assign'}
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </Modal>

      <WorkerPerformanceModal
        open={Boolean(statsApplicant)}
        applicant={statsApplicant}
        onClose={() =>
          setStatsApplicant(null)
        }
      />

      <PasswordResetConfirmationModal
        open={Boolean(passwordResetApplicant)}
        name={
          passwordResetApplicant?.fullName ||
          ''
        }
        email={
          passwordResetApplicant?.email ||
          ''
        }
        error={passwordResetError}
        isSubmitting={
          resettingApplicantId ===
          passwordResetApplicant?.id
        }
        onClose={() => {
          if (!resettingApplicantId) {
            setPasswordResetApplicant(null);
            setPasswordResetError('');
          }
        }}
        onConfirm={() =>
          passwordResetApplicant &&
          resetApplicantPassword(
            passwordResetApplicant
          )
        }
      />
    </div>
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

export function AddNewApplicantModal({
  open,
  onClose,
  onCreated,
  initialCredentials = null,
  credentialContext = 'created',
}) {
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [formError, setFormError] =
    useState('');
  const [credentials, setCredentials] =
    useState(null);
  const [
    credentialsSaved,
    setCredentialsSaved,
  ] = useState(false);
  const [copied, setCopied] =
    useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormError('');
    setCredentials(
      initialCredentials
    );
    setCredentialsSaved(false);
    setCopied(false);
  }, [
    open,
    initialCredentials,
  ]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (
        event.key === 'Escape' &&
        !isSubmitting &&
        (!credentials ||
          credentialsSaved)
      ) {
        onClose();
      }
    };

    document.body.style.overflow =
      'hidden';

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    open,
    onClose,
    isSubmitting,
    credentials,
    credentialsSaved,
  ]);

  if (!open) {
    return null;
  }

  const fieldClassName =
    'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

  const handleSubmit = async (event) => {
    event.preventDefault();

    setIsSubmitting(true);
    setFormError('');

    try {
      const formData = new FormData(
        event.currentTarget
      );

      const payload =
        Object.fromEntries(
          formData.entries()
        );

      const accessToken =
        await getOwnerAccessToken();

      const response = await fetch(
        '/api/admin/applicants',
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            'The applicant could not be created.'
        );
      }

      setCredentials(
        result.credentials
      );

      setCredentialsSaved(false);
      onCreated?.();
    } catch (error) {
      setFormError(
        error?.message ||
          'The applicant could not be created.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentials = async () => {
    if (!credentials) {
      return;
    }

    const text = [
      `Email: ${credentials.email}`,
      `Temporary password: ${credentials.temporaryPassword}`,
    ].join('\n');

    await navigator.clipboard.writeText(
      text
    );

    setCopied(true);
    setCredentialsSaved(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  const downloadCredentials = () => {
    if (!credentials) {
      return;
    }

    const content = [
      'ApplyLoop Applicant Login',
      '',
      `Email: ${credentials.email}`,
      `Temporary password: ${credentials.temporaryPassword}`,
      '',
      'Please change this password after signing in.',
    ].join('\n');

    const blob = new Blob(
      [content],
      {
        type: 'text/plain;charset=utf-8',
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = url;
    const safeEmail =
      credentials.email.replace(
        /[^a-z0-9]+/gi,
        '-'
      );

    anchor.download =
      `${safeEmail}-applyloop-login.txt`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    setCredentialsSaved(true);
  };

  const requestClose = () => {
    if (
      isSubmitting ||
      (credentials &&
        !credentialsSaved)
    ) {
      return;
    }

    onClose();
  };

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !isSubmitting &&
          (!credentials ||
            credentialsSaved)
        ) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
    >
      <section
        role="dialog"
        aria-modal="true"
        className="my-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              {credentials
                ? credentialContext === 'reset'
                  ? 'Temporary Password Reset'
                  : 'Applicant Created'
                : 'Add New Applicant'}
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              {credentials
                ? credentialContext === 'reset'
                  ? 'The previous password has been replaced. Save this new temporary password now.'
                  : 'Copy or download these credentials before closing. The temporary password is shown only once.'
                : 'Create the applicant account and set their initial work details.'}
            </p>
          </div>

          <button
            type="button"
            onClick={requestClose}
            disabled={
              isSubmitting ||
              (credentials &&
                !credentialsSaved)
            }
            aria-label="Close"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {credentials ? (
          <div className="px-6 py-8 sm:px-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <FiCheckCircle className="h-8 w-8 text-emerald-600" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-950">
                {credentialContext === 'reset'
                  ? 'A new temporary password is ready'
                  : 'The applicant account is ready'}
              </h3>

              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
                {credentialContext === 'reset'
                  ? 'The previous password will no longer work. Send this new password securely to the applicant.'
                  : 'The new applicant is now visible in the table.'}
              </p>
            </div>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Email address
              </p>

              <p className="mt-2 break-all text-base font-semibold text-slate-950">
                {credentials.email}
              </p>

              <div className="mt-5 border-t border-slate-200 pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Temporary password
                </p>

                <p className="mt-2 break-all font-mono text-base font-bold text-slate-950">
                  {credentials.temporaryPassword}
                </p>
              </div>
            </div>

            {!credentialsSaved && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                Copy or download these credentials now. They
                will not be shown again after you leave this
                screen.
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={downloadCredentials}
                className={cn(
                  styles.shineButton,
                  'inline-flex items-center justify-center gap-2 rounded-[14px] border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700'
                )}
              >
                <FiDownload />

                <span
                  className={cn(
                    styles.shineText,
                    styles.shineTextDark
                  )}
                >
                  Download Credentials
                </span>
              </button>

              <button
                type="button"
                onClick={copyCredentials}
                className={cn(
                  styles.shineButton,
                  'inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg'
                )}
              >
                {copied ? (
                  <FiCheckCircle />
                ) : (
                  <FiCopy />
                )}

                <span className={styles.shineText}>
                  {copied
                    ? 'Credentials Copied'
                    : 'Copy Credentials'}
                </span>
              </button>

              <button
                type="button"
                onClick={requestClose}
                disabled={!credentialsSaved}
                className={cn(
                  styles.shineButton,
                  'inline-flex items-center justify-center gap-2 rounded-[14px] bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-45'
                )}
              >
                <FiCheckCircle />

                <span className={styles.shineText}>
                  Done, I Saved Them
                </span>
              </button>
            </div>

            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              You can reset the applicant&apos;s password later
              using the key icon in the Actions column.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="px-6 py-6 sm:px-8"
          >
            {formError && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {formError}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Applicant Name
                <span className="ml-1 text-red-500">
                  *
                </span>

                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="e.g., Sarah Johnson"
                  className={fieldClassName}
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Email Address
                <span className="ml-1 text-red-500">
                  *
                </span>

                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g., sarah@example.com"
                  className={fieldClassName}
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Phone Number
                <span className="ml-1 text-red-500">
                  *
                </span>

                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+1 (555) 123-4567"
                  className={fieldClassName}
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Assigned Team

                <input
                  type="text"
                  name="assignedTeam"
                  placeholder="e.g., Team Alpha"
                  className={fieldClassName}
                />
              </label>

              <CustomSelect
                label="Availability"
                name="availability"
                required
                defaultValue="available"
                options={[
                  {
                    value: 'available',
                    label: 'Available',
                  },
                  {
                    value: 'inactive',
                    label: 'Inactive',
                  },
                ]}
              />

              <label className="text-sm font-semibold text-slate-700">
                Active Tasks
                <span className="ml-1 text-red-500">
                  *
                </span>

                <input
                  type="number"
                  name="activeTasks"
                  required
                  min="1"
                  step="1"
                  inputMode="numeric"
                  defaultValue=""
                  className={fieldClassName}
                />
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
              <p className="text-sm leading-6 text-blue-800">
                A secure temporary password will be
                generated when the applicant account
                is created.
              </p>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={requestClose}
                disabled={isSubmitting}
                className={cn(
                  styles.shineButton,
                  'rounded-[14px] border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50'
                )}
              >
                <span
                  className={cn(
                    styles.shineText,
                    styles.shineTextDark
                  )}
                >
                  Cancel
                </span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  styles.shineButton,
                  'inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60'
                )}
              >
                <FiUserPlus />

                <span
                  className={
                    styles.shineText
                  }
                >
                  {isSubmitting
                    ? 'Creating Applicant...'
                    : 'Create Applicant Account'}
                </span>
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function WorkerPerformanceModal({
  open,
  onClose,
  applicant,
}) {
  if (!open || !applicant) {
    return null;
  }

  const completionRate = Math.min(
    100,
    Math.max(
      0,
      Number(
        applicant.completionRate || 0
      )
    )
  );

  const qualityRating = Math.min(
    5,
    Math.max(
      0,
      Number(
        applicant.qualityRating || 0
      )
    )
  );

  const initials = String(
    applicant.fullName || 'Applicant'
  )
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const joinDate = applicant.createdAt
    ? new Date(
        applicant.createdAt
      ).toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }
      )
    : 'Not available';

  const isAvailable =
    applicant.accountStatus ===
      'active' &&
    applicant.availability ===
      'available';

  const assignedClients =
    applicant.assignedClients || [];

  const metrics = [
    {
      label: 'Active Tasks',
      value: String(
        applicant.activeTasks || 0
      ),
      icon: FiTrendingUp,
      card:
        'border-blue-200 bg-blue-50/70',
      iconWrap:
        'bg-blue-600 text-white',
      valueClass:
        'text-blue-700',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate.toFixed(
        1
      )}%`,
      icon: FiCheckCircle,
      card:
        'border-emerald-200 bg-emerald-50/70',
      iconWrap:
        'bg-emerald-600 text-white',
      valueClass:
        'text-emerald-700',
    },
    {
      label: 'Quality Rating',
      value: `${qualityRating.toFixed(
        1
      )}/5.0`,
      icon: HiOutlineLightBulb,
      card:
        'border-amber-200 bg-amber-50/70',
      iconWrap:
        'bg-amber-500 text-white',
      valueClass:
        'text-amber-700',
    },
    {
      label: 'Total Completed',
      value: String(
        applicant.completedTasks || 0
      ),
      icon: FiClock,
      card:
        'border-violet-200 bg-violet-50/70',
      iconWrap:
        'bg-violet-600 text-white',
      valueClass:
        'text-violet-700',
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={applicant.fullName}
      subtitle="Applicant Performance"
      initials={initials}
      wide
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.label}
                className={cn(
                  'rounded-[18px] border p-5 transition-shadow duration-200 hover:shadow-md',
                  metric.card
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] shadow-sm',
                      metric.iconWrap
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                      {metric.label}
                    </p>

                    <p
                      className={cn(
                        'mt-1 text-[28px] font-bold leading-none tracking-tight',
                        metric.valueClass
                      )}
                    >
                      {metric.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">
                Applicant Information
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Account, availability and assignment details
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
                  isAvailable
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    isAvailable
                      ? 'bg-emerald-500'
                      : 'bg-slate-400'
                  )}
                />

                {isAvailable
                  ? 'Available'
                  : 'Inactive'}
              </span>

            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-3">
            <div className="border-b border-slate-100 px-6 py-5 md:border-r xl:border-b-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Email
              </p>

              <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                {applicant.email ||
                  'Not available'}
              </p>
            </div>

            <div className="border-b border-slate-100 px-6 py-5 xl:border-b-0 xl:border-r">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Phone
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-900">
                {applicant.phone ||
                  'Not available'}
              </p>
            </div>

            <div className="border-b border-slate-100 px-6 py-5 md:border-r xl:border-b-0 xl:border-r-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Joined
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-900">
                {joinDate}
              </p>
            </div>

            <div className="border-b border-slate-100 px-6 py-5 xl:border-b-0 xl:border-r">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Status
              </p>

              <div className="mt-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
                    isAvailable
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      isAvailable
                        ? 'bg-emerald-500'
                        : 'bg-slate-400'
                    )}
                  />

                  {isAvailable
                    ? 'Available'
                    : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Assigned Clients
              </p>

              {assignedClients.length >
              0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {assignedClients.map(
                    (client) => (
                      <span
                        key={client.id}
                        className="inline-flex max-w-full items-center rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                      >
                        <span className="truncate">
                          {client.fullName}
                        </span>
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm font-medium text-slate-400">
                  No clients assigned
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
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


  const [
    applicantRefreshKey,
    setApplicantRefreshKey,
  ] = useState(0);

  const [
    applicantResetCredentials,
    setApplicantResetCredentials,
  ] = useState(null);

  const [
    applicantCredentialContext,
    setApplicantCredentialContext,
  ] = useState('created');

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
    if (
      section === 'client-management' &&
      detail &&
      !isOperations
    ) {
      return (
        <ClientDetailsPage
          basePath={basePath}
        />
      );
    }
    if (section === 'client-management') {
      return (
        <ClientManagementPage
          mode={
            isOperations
              ? 'operations'
              : 'owner'
          }
        />
      );
    }
    if (section === 'applicants-management') return (
      <ApplicantsManagementPage
        mode={
          isOperations
            ? 'operations'
            : 'owner'
        }
        openAddApplicant={() => {
          setApplicantResetCredentials(
            null
          );
          setApplicantCredentialContext(
            'created'
          );
          openModal(
            'addApplicant'
          );
        }}
        onPasswordReset={(credentials) => {
          setApplicantResetCredentials(
            credentials
          );
          setApplicantCredentialContext(
            'reset'
          );
          openModal(
            'addApplicant'
          );
        }}
        refreshKey={applicantRefreshKey}
      />
    );
    if (section === 'chief-applicants') return <ChiefApplicantsPage openChiefStats={() => openModal('chiefStats')} />;
    if (section === 'application-operations') return <ApplicationOperationsPage openAddApplicant={() => openModal('addApplicant')} openReassign={() => openModal('reassign')} openForcePriority={() => openModal('forcePriority')} openEscalate={() => openModal('escalate')} />;
    if (section === 'subscription-revenue') return <SubscriptionRevenuePage openManagePlans={() => openModal('managePlans')} openEditSubscription={() => openModal('editSubscription')} />;
    if (section === 'prompt-system') return <PromptSystemPage />;
    if (section === 'analytics-reports') return <AnalyticsReportsPage />;
    if (section === 'payroll-system') return <PayrollSystemPage openPaymentHistory={() => openModal('paymentHistory')} />;
    if (section === 'escalations-issues') return <EscalationsIssuesPage />;
    if (section === 'settings') return <SettingsPage />;
    return <PlaceholderPage section={section} />;
  }, [
    applicantRefreshKey,
    basePath,
    detail,
    isOperations,
    section,
  ]);

  const [title, subtitle] = PAGE_META[section] || PAGE_META.dashboard;

  const Shell = isOperations
    ? OperationsShell
    : OwnerShell;

  return (
    <>
      <Head>
        <title>{title} | ApplyLoop</title>
        <meta name="description" content={subtitle} />
      </Head>
      <Shell section={section} portalRole={portalRole} navItems={navItems}>
        {content}
        <AddNewClientModal open={modals.addClient} onClose={() => closeModal('addClient')} />
        <ClientPerformanceModal open={modals.clientPerformance} onClose={() => closeModal('clientPerformance')} />
        <PauseAccountModal open={modals.pauseAccount} onClose={() => closeModal('pauseAccount')} />
        <AddNewApplicantModal
          open={modals.addApplicant}
          initialCredentials={
            applicantResetCredentials
          }
          credentialContext={
            applicantCredentialContext
          }
          onClose={() => {
            closeModal(
              'addApplicant'
            );
            setApplicantResetCredentials(
              null
            );
            setApplicantCredentialContext(
              'created'
            );
          }}
          onCreated={() =>
            setApplicantRefreshKey(
              (current) => current + 1
            )
          }
        />
        <WorkerPerformanceModal open={modals.workerStats} onClose={() => closeModal('workerStats')} />
        <ChiefStatsModal open={modals.chiefStats} onClose={() => closeModal('chiefStats')} />
        <ReassignApplicationModal open={modals.reassign} onClose={() => closeModal('reassign')} />
        <ForcePriorityModal open={modals.forcePriority} onClose={() => closeModal('forcePriority')} />
        <EscalateModal open={modals.escalate} onClose={() => closeModal('escalate')} />
        <EditSubscriptionModal open={modals.editSubscription} onClose={() => closeModal('editSubscription')} />
        <ManagePlansModal open={modals.managePlans} onClose={() => closeModal('managePlans')} />
        <PaymentHistoryModal open={modals.paymentHistory} onClose={() => closeModal('paymentHistory')} />
      </Shell>
    </>
  );
}
