import {
  FiHome,
  FiUsers,
  FiFileText,
  FiClipboard,
  FiCheckSquare,
  FiBarChart2,
  FiSettings,
  FiDollarSign,
  FiLayers,
  FiLink,
  FiAlertTriangle,
  FiBriefcase,
  FiCreditCard,
  FiMessageSquare,
} from 'react-icons/fi';

export const USER_ROLES = {
  USER_CLIENT: 'user_client',
  APPLICANT: 'applicant',
  CHIEF_APPLICANT: 'chief_applicant',
  PROMPT_ENGINEER: 'prompt_engineer',
  TEAM_AUDITOR: 'team_auditor',
  CHIEF_AUDITOR: 'chief_auditor',
  OWNER: 'owner',
  OPERATIONS: 'operations',
  LINKER: 'linker',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  [USER_ROLES.USER_CLIENT]: 'User/Client',
  [USER_ROLES.APPLICANT]: 'Applicant',
  [USER_ROLES.CHIEF_APPLICANT]: 'Chief Applicant',
  [USER_ROLES.PROMPT_ENGINEER]: 'Prompt Engineer',
  [USER_ROLES.TEAM_AUDITOR]: 'Team Auditor',
  [USER_ROLES.CHIEF_AUDITOR]: 'Chief Auditor',
  [USER_ROLES.OWNER]: 'Owner',
  [USER_ROLES.OPERATIONS]: 'Operations',
  [USER_ROLES.LINKER]: 'Linker',
  [USER_ROLES.ADMIN]: 'Administrator',
};

export const ROLE_SLUGS = {
  [USER_ROLES.APPLICANT]: 'applicant',
  [USER_ROLES.CHIEF_APPLICANT]: 'chief-applicant',
  [USER_ROLES.PROMPT_ENGINEER]: 'prompt-engineer',
  [USER_ROLES.TEAM_AUDITOR]: 'team-auditor',
  [USER_ROLES.CHIEF_AUDITOR]: 'chief-auditor',
  [USER_ROLES.OWNER]: 'owner',
  [USER_ROLES.OPERATIONS]: 'operations',
  [USER_ROLES.LINKER]: 'linker',
  [USER_ROLES.ADMIN]: 'admin',
};

export const ROLE_FROM_SLUG = Object.fromEntries(
  Object.entries(ROLE_SLUGS).map(([role, slug]) => [slug, role])
);

export const getRoleHome = (role) => {
  if (role === USER_ROLES.USER_CLIENT) return '/onboarding';
  if (!role) return '/dashboard';
  return `/${ROLE_SLUGS[role] || 'dashboard'}`;
};

const withBase = (base, items) => items.map((item) => ({
  ...item,
  href: item.href ? `/${base}/${item.href}` : `/${base}`,
}));

export const ROLE_NAVIGATION = {
  [USER_ROLES.APPLICANT]: withBase('applicant', [
    { label: 'Dashboard', href: '', icon: FiHome },
    { label: 'My Clients', href: 'clients', icon: FiUsers },
    { label: 'Job Links', href: 'job-links', icon: FiLink },
    { label: 'Workshop', href: 'workshop', icon: FiClipboard },
    { label: 'Feedback & Messages', href: 'feedback', icon: FiMessageSquare },
    { label: 'Performance', href: 'performance', icon: FiBarChart2 },
    { label: 'Profile & Settings', href: 'settings', icon: FiSettings },
  ]),
  [USER_ROLES.CHIEF_APPLICANT]: withBase('chief-applicant', [
    { label: 'Dashboard', href: '', icon: FiHome },
    { label: 'Team Overview', href: 'team', icon: FiUsers },
    { label: 'Client Assignments', href: 'clients', icon: FiBriefcase },
    { label: 'Workshop', href: 'workshop', icon: FiMessageSquare },
    { label: 'Application Review', href: 'review', icon: FiClipboard },
    { label: 'Deadlines', href: 'deadlines', icon: FiAlertTriangle },
    { label: 'Feedback & Approvals', href: 'feedback', icon: FiMessageSquare },
    { label: 'Performance Analytics', href: 'performance', icon: FiBarChart2 },
    { label: 'Profile & Settings', href: 'settings', icon: FiSettings },
  ]),
  [USER_ROLES.PROMPT_ENGINEER]: withBase('prompt-engineer', [
    { label: 'Dashboard', href: '', icon: FiHome },
    { label: 'Prompt Library', href: 'prompt-library', icon: FiFileText },
    { label: 'Testing', href: 'testing', icon: FiClipboard },
    { label: 'Clients', href: 'clients', icon: FiUsers },
    { label: 'Performance Analytics', href: 'performance', icon: FiBarChart2 },
    { label: 'Profile & Settings', href: 'settings', icon: FiSettings },
  ]),
  [USER_ROLES.TEAM_AUDITOR]: withBase('team-auditor', [
    { label: 'Dashboard', href: '', icon: FiHome },
    { label: 'Audit Queue', href: 'audit-queue', icon: FiCheckSquare },
    { label: 'AI Auditing System', href: 'ai-auditing-system', icon: FiCheckSquare },
    { label: 'Application Reviews', href: 'application-reviews', icon: FiFileText },
    { label: 'Team Quality Scores', href: 'team-quality-scores', icon: FiUsers },
    { label: 'Client Complaints', href: 'client-complaints', icon: FiMessageSquare },
    { label: 'Audit Reports', href: 'audit-report', icon: FiFileText },
    { label: 'Analytics & Trends', href: 'analytics-and-trends', icon: FiBarChart2 },
    { label: 'Profile & Settings', href: 'profile-settings', icon: FiSettings },
  ]),
  [USER_ROLES.CHIEF_AUDITOR]: withBase('chief-auditor', [
    { label: 'Dashboard', href: '', icon: FiHome },
    { label: 'Audit Queue', href: 'audit-queue', icon: FiCheckSquare },
    { label: 'AI Auditing System', href: 'ai-auditing-system', icon: FiCheckSquare },
    { label: 'Application Reviews', href: 'application-reviews', icon: FiFileText },
    { label: 'Team Quality Scores', href: 'team-quality-scores', icon: FiUsers },
    { label: 'Client Complaints', href: 'client-complaints', icon: FiMessageSquare },
    { label: 'Audit Reports', href: 'audit-report', icon: FiFileText },
    { label: 'Analytics & Trends', href: 'analytics-and-trends', icon: FiBarChart2 },
    { label: 'Profile & Settings', href: 'profile-settings', icon: FiSettings },
  ]),
    [USER_ROLES.ADMIN]: withBase('admin', [
    { label: 'Client Management', href: '', icon: FiUsers },
  ]),
  [USER_ROLES.OWNER]: withBase('owner', [
    { label: 'Dashboard', href: '', icon: FiHome },
    { label: 'Client Management', href: 'client-management', icon: FiUsers },
    { label: 'Applicants Management', href: 'applicants-management', icon: FiBriefcase },
    { label: 'Chief Applicants', href: 'chief-applicants', icon: FiUsers },
    { label: 'Application Operations', href: 'application-operations', icon: FiFileText },
    { label: 'Subscription & Revenue', href: 'subscription-revenue', icon: FiCreditCard },
    { label: 'Prompt System', href: 'prompt-system', icon: FiLayers },
    { label: 'Analytics & Reports', href: 'analytics-reports', icon: FiBarChart2 },
    { label: 'Payroll System', href: 'payroll-system', icon: FiDollarSign },
    { label: 'Escalations & Issues', href: 'escalations-issues', icon: FiAlertTriangle },
    { label: 'Updates', href: 'updates', icon: FiMessageSquare },
    { label: 'Settings', href: 'settings', icon: FiSettings },
  ]),
  [USER_ROLES.LINKER]: withBase('linker', [
    { label: 'Dashboard', href: '', icon: FiHome },
    { label: 'Assigned Clients', href: 'clients', icon: FiBriefcase },
    { label: 'Assigned Applicants', href: 'applicants', icon: FiUsers },
    { label: 'Send Job Link', href: 'record-link', icon: FiLink },
    { label: 'Job Links', href: 'job-links', icon: FiLink },
    { label: 'Feedback & Messages', href: 'feedback', icon: FiMessageSquare },
    { label: 'Performance', href: 'performance', icon: FiBarChart2 },
    { label: 'Profile & Settings', href: 'settings', icon: FiSettings },
  ]),
  [USER_ROLES.OPERATIONS]: withBase('operations', [
    { label: 'Application Operations', href: 'application-operations', icon: FiFileText },
    { label: 'Client Management', href: 'client-management', icon: FiUsers },
    { label: 'Applicants Management', href: 'applicants-management', icon: FiBriefcase },
  ]),
};

export const ROLE_DEMO_USERS = {
  [USER_ROLES.USER_CLIENT]: {
    name: 'Olabanji David T.',
    email: 'banjidhevid216@gmail.com',
    role: USER_ROLES.USER_CLIENT,
  },
  [USER_ROLES.APPLICANT]: {
    name: 'Olabanji David T.',
    email: 'banjidhevid216@gmail.com',
    role: USER_ROLES.APPLICANT,
  },
  [USER_ROLES.CHIEF_APPLICANT]: {
    name: 'Team Lead',
    email: 'administrator@applyloop.com',
    role: USER_ROLES.CHIEF_APPLICANT,
  },
  [USER_ROLES.PROMPT_ENGINEER]: {
    name: 'Daniel Okafor',
    email: 'daniel@applyloop.com',
    role: USER_ROLES.PROMPT_ENGINEER,
  },
  [USER_ROLES.TEAM_AUDITOR]: {
    name: 'Sophia Martins',
    email: 'sophia@applyloop.com',
    role: USER_ROLES.TEAM_AUDITOR,
  },
  [USER_ROLES.CHIEF_AUDITOR]: {
    name: 'Michael Adeyemi',
    email: 'michael@applyloop.com',
    role: USER_ROLES.CHIEF_AUDITOR,
  },
  [USER_ROLES.OWNER]: {
    name: 'ApplyLoop Owner',
    email: 'owner@applyloop.com',
    role: USER_ROLES.OWNER,
  },
  [USER_ROLES.OPERATIONS]: {
    name: 'Operations Manager',
    email: 'operations@applyloop.com',
    role: USER_ROLES.OPERATIONS,
  },
};

export const ROLE_PAGE_META = {
  [USER_ROLES.APPLICANT]: {
    dashboard: ['Dashboard', 'Review Clients, Applications, and current workload.'],
    clients: ['My Clients', 'Review assigned Client profiles and application progress.'],
    'job-links': ['Job Links', 'Review job opportunities sent to your workspace.'],
    workshop: ['Workshop', 'Work through job opportunities and prepare tailored applications.'],
    feedback: ['Feedback & Messages', 'Review Client and ApplyLoop feedback.'],
    performance: ['Performance', 'Track application outcomes and Client satisfaction.'],
    settings: ['Profile & Settings', 'Manage profile, security, employment, and notifications.'],
  },
  [USER_ROLES.CHIEF_APPLICANT]: {
    dashboard: ['Dashboard', "Welcome back! Here's your team's overview"],
    team: ['Team Overview', "Monitor your team's performance and availability"],
    clients: ['Client Assignments', 'Assign and manage Client workload distribution.'],
    workshop: ['Workshop', 'Analyze job fit, generate tailored resumes and cover letters.'],
    review: ['Application Review', 'Review and approve submitted applications'],
    deadlines: ['Deadlines & Escalations', 'Monitor critical deadlines and manage escalated issues'],
    feedback: ['Feedback & Approvals', 'Review Client feedback and approval work.'],
    performance: ['Performance Analytics', 'Track your team performance and quality metrics'],
    settings: ['Profile & Settings', 'Manage your account settings and preferences.'],
  },
  [USER_ROLES.PROMPT_ENGINEER]: {
    dashboard: ['Dashboard', 'Monitor prompt activity, usage, testing, and performance.'],
    'prompt-library': ['Prompt Library', 'Manage and organize ApplyLoop prompt templates.'],
    testing: ['Testing', 'Run and compare prompt and document tests before deployment.'],
    clients: ['Clients', 'Manage Client-specific prompt libraries and usage.'],
    performance: ['Performance Analytics', 'Review prompt success, usage, and quality trends.'],
    settings: ['Profile & Settings', 'Manage your Prompt Engineer profile and preferences.'],
  },
  [USER_ROLES.TEAM_AUDITOR]: {
    dashboard: ['Audit Dashboard', 'Monitor audit workload, quality signals, and compliance.'],
    queue: ['Audit Queue', 'Review applications pending audit review.'],
    ai: ['AI Auditing System', 'Use AI-assisted checks to support application audits.'],
    reviews: ['Application Reviews', 'Review application quality decisions and audit outcomes.'],
    quality: ['Team Quality Scores', 'Monitor individual quality scores and pass rates.'],
    complaints: ['Client Complaints', 'Investigate and resolve Client complaints.'],
    reports: ['Audit Reports', 'Generate and export audit performance reports.'],
    analytics: ['Analytics & Trends', 'Review quality, rework, query, and complaint trends.'],
    settings: ['Profile & Settings', 'Manage your auditor profile and audit preferences.'],
  },
  [USER_ROLES.CHIEF_AUDITOR]: {
    dashboard: ['Audit Control Center', 'Monitor audit workload, quality signals, and compliance.'],
    queue: ['Audit Queue', 'Review and supervise applications pending audit.'],
    ai: ['AI Auditing System', 'Use AI-assisted checks to support audit operations.'],
    reviews: ['Application Reviews', 'Review application quality decisions and audit outcomes.'],
    quality: ['Team Quality Scores', 'Monitor team-wide quality scores and pass rates.'],
    complaints: ['Client Complaints', 'Investigate and supervise Client complaint resolution.'],
    reports: ['Audit Reports', 'Generate and export audit performance reports.'],
    analytics: ['Analytics & Trends', 'Review quality, rework, query, and complaint trends.'],
    settings: ['Profile & Settings', 'Manage your Chief Auditor profile and audit preferences.'],
  },

  [USER_ROLES.ADMIN]: {
    dashboard: [
      'Client Management',
      'Create and manage ApplyLoop client accounts.',
    ],
  },

  [USER_ROLES.OWNER]: {
    dashboard: ['Dashboard', 'Mission Control for ApplyLoop operations and platform performance.'],
    'client-management': ['Client Management', 'Manage Client accounts, subscriptions, and assignments.'],
    'applicants-management': ['Applicants Management', 'Manage Applicants, workload, availability, and performance.'],
    'chief-applicants': ['Chief Applicants', 'Review Chief Applicant supervision and operational coverage.'],
    'application-operations': ['Application Operations', 'Monitor opportunities, Applications, feedback, and workflow exceptions.'],
    'subscription-revenue': ['Subscription & Revenue', 'Review subscriptions, pricing, and revenue performance.'],
    'prompt-system': ['Prompt System', 'Manage prompt configurations and workflow templates.'],
    'analytics-reports': ['Analytics & Reports', 'Review opportunity sources and Application outcomes across ApplyLoop.'],
    'payroll-system': ['Payroll System', 'Track staff earnings, payouts, and completed work.'],
    'escalations-issues': ['Escalations & Issues', 'Review operational escalations and urgent account issues.'],
    updates: ['Updates & Announcements', 'Publish platform updates to everyone or selected ApplyLoop workspaces.'],
    settings: ['Settings', 'Manage Owner workspace settings and platform rules.'],
  },
  [USER_ROLES.LINKER]: {
    dashboard: ['Dashboard', 'Review assigned work and sent job links.'],
    clients: ['Assigned Clients', 'Review clients assigned to your Linker workspace.'],
    applicants: ['Assigned Applicants', 'Review applicants connected to your assignments.'],
    'record-link': ['Send Job Link', 'Send a verified employer opportunity to an assigned Applicant for a Client.'],
    'job-links': ['Job Links', 'Track every job link you have sent and its Applicant progress.'],
    feedback: ['Feedback & Messages', 'Review feedback and workspace messages.'],
    performance: ['Performance', 'Review verified Linker activity and outcomes.'],
    settings: ['Profile & Settings', 'Manage your profile and account preferences.'],
  },
  [USER_ROLES.OPERATIONS]: {
    'application-operations': ['Application Operations', 'Manage opportunities, Applications, priorities, and workflow progress.'],
    'client-management': ['Client Management', 'Manage Client accounts, statuses, plans, and assignments.'],
    'applicants-management': ['Applicants Management', 'Manage Applicants, workload, availability, and performance.'],
  },
};
