/**
 * Mock Data Layer — Centralized application mock data
 * ─────────────────────────────────────────────────────────────────────────────
 * All mock/seed data lives here. When the backend is ready, each page will
 * fetch real data via the API service (src/shared/services/api.js) instead.
 *
 * This file is the SINGLE SOURCE OF TRUTH for frontend mock data.
 * No page component should define inline mock arrays or objects.
 *
 * Structure:
 *   APPLICATIONS   → Dashboard table + Application detail page
 *   INTERVIEWS     → Loop Lab page
 *   GROWTH_DATA    → Growth page (courses, skill gaps, stats)
 *   BILLING_DATA   → Billing & Subscription page
 *   USER_PROFILE   → Settings page (Basic Information)
 *   USER_PREFS     → Settings page (Work Preferences)
 *   USER_AUTH      → Settings page (Location & Work Authorization)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATIONS — Used by: dashboard.js, applications/[id].js
// Backend: GET /api/applications
// ═══════════════════════════════════════════════════════════════════════════════

export const MOCK_APPLICATIONS = [
  {
    id: 'AND219',
    number: '#AND219',
    date: 'Feb 13, 2026',
    company: 'Paypal',
    position: 'Software Dev.',
    resume: 'Anderson Pdf.',
    coverLetter: 'Anderson..',
    status: 'Interview',
    feedback: 'Interview invitation received. Review the preparation notes in Loop Lab.',
  },
  {
    id: 'AND123',
    number: '#AND123',
    date: 'Feb 10, 2026',
    company: 'Apple Inc.',
    position: 'Software Dev.',
    resume: 'Anderson Pdf.',
    coverLetter: 'Anderson..',
    status: 'Offered',
    feedback: 'Offer details are available for review.',
  },
  {
    id: 'AND122',
    number: '#AND122',
    date: 'Feb 11, 2026',
    company: 'Meta',
    position: 'Software Dev.',
    resume: 'Anderson Pdf.',
    coverLetter: 'N/A',
    status: 'Rejected',
    feedback: 'The employer selected candidates with more role-specific experience.',
  },
  {
    id: 'AND111',
    number: '#AND111',
    date: 'Feb 11, 2026',
    company: 'Oracle',
    position: 'Software Dev.',
    resume: 'Anderson Pdf.',
    coverLetter: 'N/A',
    status: 'Rejected',
    feedback: '',
  },
  {
    id: 'AND218',
    number: '#AND219',
    date: 'Feb 13, 2026',
    company: 'Paypal',
    position: 'Software Dev.',
    resume: 'Anderson Pdf.',
    coverLetter: 'Anderson..',
    status: 'Rejected',
    feedback: '',
  },
  {
    id: 'AND101',
    number: '#AND101',
    date: 'Feb 11, 2026',
    company: 'Chowdeck',
    position: 'Software Dev.',
    resume: 'Anderson Pdf.',
    coverLetter: 'Anderson..',
    status: 'Pending',
    feedback: '',
  },
  {
    id: 'AND102',
    number: '#AND102',
    date: 'Feb 12, 2026',
    company: 'First City',
    position: 'Software Dev.',
    resume: 'Anderson Pdf.',
    coverLetter: 'Anderson..',
    status: 'Pending',
    feedback: '',
  },
  {
    id: 'AND105',
    number: '#AND105',
    date: 'Feb 12, 2026',
    company: 'Microsoft',
    position: 'Software Dev.',
    resume: 'Anderson Pdf.',
    coverLetter: 'Anderson..',
    status: 'Pending',
    feedback: '',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATION DETAIL — Used by: applications/[id].js
// Backend: GET /api/applications/:id
// ═══════════════════════════════════════════════════════════════════════════════

export const MOCK_APPLICATION_DETAIL = {
  id: 'AND123',
  company: 'Apple Inc.',
  status: 'Pending',
  role: 'Software Engineer',
  date: 'February 14th',
  applicationTime: '06:54pm',
  preferences: [
    { label: 'remote', color: 'text-purple-700 bg-purple-50 border border-purple-200' },
    { label: '$100-150k annually', color: 'text-orange-600 bg-orange-50 border border-orange-200' },
    { label: 'full-time', color: 'text-orange-500 bg-orange-50 border border-orange-200' },
  ],
  jobLink: 'www.alphabetreading.com',
  jobDetails: [
    'Work with team members to develop streamlined user experience processes',
    'Proactively pursues opportunities to improve the strategy to better address client and user objectives',
    'Capable of defining consumers, processes, and ideas from an objective point of view based on research and insight, and can effectively communicate this point of view with senior management on both the agency and client sides',
    'Takes personal responsibility for on-time deliverables',
    'Actively educates internal groups about user experience and provides a significant contribution to the development of client relationships',
    'Be an advocate on behalf of "user experience" within the agency at large',
    'Adept at utilizing AI tools to inform and streamline their design process, from research to prototyping',
    'Experience working within or contributing to white-label design systems',
  ],
  qualities: [
    'A portfolio of work demonstrating work experience designing complex systems across multiple platforms, including mobile and touch-based interfaces',
    "A minimum of 3 years' experience in experience and interaction design, and a thorough understanding of existing interaction design patterns across web, mobile, and other digital platforms",
    'Proficiency user-centric design processes and designing for user needs based on research, and able to demonstrate hands-on work taking user needs and translating them into an experience through a combination of techniques including: journey mapping, service blueprinting, content strategy, wire framing, and prototyping',
    'Excellent knowledge of Figma, including setting up and utilizing Figma libraries',
    'Strong proficiency with leading industry-standard UX design and prototyping tools',
  ],
  otherDetails: [
    'Remote (United States only) position',
    'Available during normal business hours, US Eastern Time Zone',
    'Full-time work schedule (40hrs/wk)',
    'Anticipated weekly pay range between $2,600 - $2,800',
  ],
  stickyNote: {
    company: 'Vercel',
    role: 'Product Designer',
    author: 'Sarah J.',
    date: 'Feb 18, 2026',
  },
  feedbackHistory: [
    {
      id: 1,
      title: 'Vercel Designer Application',
      sender: 'Me',
      body: "Your design portfolio caught their attention! They're impressed with your Figma skills. Shortlisted for the next round. Expect a design challenge soon.",
      author: 'Me',
      date: 'Feb 18, 2026',
    },
    {
      id: 2,
      sender: null,
      body: "Your design portfolio caught their attention! They're impressed with your Figma skills. Shortlisted for the next round. Expect a design challenge soon.",
      date: 'Feb 18, 2026',
      author: 'Me',
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERVIEWS — Used by: loop-lab.js
// Backend: GET /api/interviews
// ═══════════════════════════════════════════════════════════════════════════════

export const MOCK_INTERVIEWS = [
  {
    id: 1,
    company: 'Google',
    role: 'Senior Product Designer',
    date: 'Feb 17, 2026',
    time: '01:00 PM',
    topic: 'Django REST Framework',
    status: 'Pending Response',
    statusColor: 'text-yellow-600 bg-yellow-50 border border-yellow-200',
    daysUntil: 11,
    started: false,
  },
  {
    id: 2,
    company: 'Meta',
    role: 'Senior Product Manager',
    date: 'Feb 17, 2026',
    time: '01:00 PM',
    topic: 'Systems Design',
    status: 'Confirmed',
    statusColor: 'text-green-600 bg-green-50 border border-green-200',
    daysUntil: 8,
    started: true,
  },
  {
    id: 3,
    company: 'Apple',
    role: 'Product Designer',
    date: 'Feb 17, 2026',
    time: '01:00 PM',
    topic: 'Design Systems | Visual Design',
    status: 'Confirmed',
    statusColor: 'text-green-600 bg-green-50 border border-green-200',
    daysUntil: 15,
    started: false,
  },
  {
    id: 4,
    company: 'Google',
    role: 'Senior Product Designer',
    date: 'Feb 17, 2026',
    time: '01:00 PM',
    topic: 'Django REST Framework',
    status: 'Pending Response',
    statusColor: 'text-yellow-600 bg-yellow-50 border border-yellow-200',
    daysUntil: 11,
    started: false,
  },
  {
    id: 5,
    company: 'Meta',
    role: 'Senior Product Manager',
    date: 'Feb 17, 2026',
    time: '01:00 PM',
    topic: 'Systems Design',
    status: 'Confirmed',
    statusColor: 'text-green-600 bg-green-50 border border-green-200',
    daysUntil: 8,
    started: false,
  },
  {
    id: 6,
    company: 'Apple',
    role: 'Product Designer',
    date: 'Feb 17, 2026',
    time: '01:00 PM',
    topic: 'Design Systems | Visual Design',
    status: 'Confirmed',
    statusColor: 'text-green-600 bg-green-50 border border-green-200',
    daysUntil: 15,
    started: false,
  },
];

export const LAB_DURATIONS = [
  { label: '30 mins', sub: 'Quick practice session' },
  { label: '1 hour', sub: 'Standard Interview Prep' },
  { label: '2 hours', sub: 'Deep dive session' },
  { label: '4 hours', sub: 'Extended Practice' },
  { label: '8 hours', sub: 'Full day intensive' },
  { label: '12 hours', sub: '24-hour bootcamp' },
  { label: '3 days', sub: 'Multi-day preparation' },
  { label: '7 days', sub: 'Week-long mastery' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// GROWTH — Used by: growth.js
// Backend: GET /api/growth/stats, GET /api/growth/courses, GET /api/growth/skill-gaps
// ═══════════════════════════════════════════════════════════════════════════════

export const MOCK_GROWTH_STATS = [
  { label: 'COMPLETED COURSES', value: '2/6', sub: '17% complete', progress: 17, showBar: true },
  { label: 'SAVED COURSE', value: '2', sub: 'In learning path', showBar: false },
  { label: 'TIME TO JOB READY', value: '6 Weeks', sub: 'Estimated', showBar: false },
];

export const MOCK_SKILL_GAPS = [
  { skill: 'System Design', priority: 'High Priority', current: 60, target: 90 },
  { skill: 'Interaction Design', priority: 'High Priority', current: 60, target: 90 },
  { skill: 'User research', priority: 'High Priority', current: 60, target: 90 },
];

export const MOCK_COURSES = [
  {
    id: 1,
    title: 'Advanced React Patterns',
    provider: 'A Cloud Guru',
    description: 'Prepare for AWS Solutions Architect certification. Learn cloud infrastructure, security, and best practices.',
    hours: 12,
    rating: 4.8,
    level: 'Advanced',
    relevance: 95,
    type: 'paid',
  },
  {
    id: 2,
    title: 'Advanced React Patterns',
    provider: 'A Cloud Guru',
    description: 'Prepare for AWS Solutions Architect certification. Learn cloud infrastructure, security, and best practices.',
    hours: 12,
    rating: 4.8,
    level: 'Advanced',
    relevance: 95,
    type: 'paid',
  },
  {
    id: 3,
    title: 'Advanced React Patterns',
    provider: 'A Cloud Guru',
    description: 'Prepare for AWS Solutions Architect certification. Learn cloud infrastructure, security, and best practices.',
    hours: 12,
    rating: 4.8,
    level: 'Advanced',
    relevance: 95,
    type: 'free',
  },
];

export const MOCK_CERTIFICATIONS = [
  'AWS Certified Solutions Architect',
  'Google Cloud Professional Cloud Architect',
  'Certified Kubernetes Administrator (CKA)',
];

export const MOCK_FILTER_TABS = ['All', 'Paid', 'Free'];

// ═══════════════════════════════════════════════════════════════════════════════
// BILLING — Used by: billing.js
// Backend: GET /api/billing/plan, GET /api/billing/receipts
// ═══════════════════════════════════════════════════════════════════════════════

export const MOCK_PLAN = {
  name: 'Basic',
  appsUsed: 32,
  appsTotal: 50,
  benefits: ['Job matching', '5 Application submissions per day.'],
  status: 'Active',
  nextBilling: 'Feb 9, 2026.',
  price: 'US$150.00',
};

export const MOCK_RECEIPTS = [
  { date: '2026-02-09', type: 'Basic Subscription', total: '$150.00' },
  { date: '2026-02-09', type: 'Basic Subscription', total: '$150.00' },
  { date: '2026-02-09', type: 'Basic Subscription', total: '$150.00' },
];

export const MOCK_PLANS = [
  {
    name: 'Basic Plan',
    price: '$150',
    benefits: ['Job matching', '100 Application submissions monthly.'],
    current: true,
  },
  {
    name: 'Standard Plan',
    price: '$200',
    benefits: ['Job matching', '200 Application submissions monthly.'],
    current: false,
  },
  {
    name: 'Premium Plan',
    price: '$250',
    benefits: ['Job matching', '300 Application submissions monthly.'],
    current: false,
  },
];

export const MOCK_MANAGE_ACTIONS = [
  {
    id: 'pause',
    title: 'Pause Subscription',
    description: 'Pause and resume your subscription to fit your needs.',
  },
  {
    id: 'change',
    title: 'Change Plan',
    description: 'Pause and resume your subscription to fit your needs.',
  },
  {
    id: 'cancel',
    title: 'Cancel Subscription',
    description: 'Cancel your subscription and discontinue application services.',
  },
  {
    id: 'resubscribe',
    title: 'Resubscribe',
    description: 'Pause and resume your subscription to fit your needs.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// USER PROFILE — Used by: settings.js (Basic Information tab)
// Backend: GET /api/users/profile
// ═══════════════════════════════════════════════════════════════════════════════

export const MOCK_USER_PROFILE = {
  fullName: 'Olabanji David T.',
  gender: 'Male',
  email: 'banjidhevid216@gmail.com',
  phone: '+234 811 474 6009',
  address: '28a Oguntona Crescent, Magodo Phase II, CMD Road, Ikeja',
  nationality: 'Nigeria',
  state: 'Lagos',
  disability: 'N/A',
  veteran: 'N/A',
  portfolioLink: 'banji.framer.website',
  linkedinUrl: 'https://www.linkedin.com/in/olabanji-david-t-6050051ba',
  profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
};

// ═══════════════════════════════════════════════════════════════════════════════
// WORK PREFERENCES — Used by: settings.js (Work Preferences tab)
// Backend: GET /api/users/preferences
// ═══════════════════════════════════════════════════════════════════════════════

export const MOCK_WORK_PREFERENCES = {
  jobs: [
    { title: 'Product Designer', level: 'Senior Level', spread: '70%' },
    { title: 'User Interface Designer', level: 'Intermediate Level', spread: '25%' },
    { title: 'User Researcher', level: 'Intermediate Level', spread: '5%' },
  ],
  industry: 'Design and Tech',
  specialization: 'UI Design',
  workType: 'Remote',
  schedule: 'Full-time',
  duration: '3 months',
  locations: ['USA', 'Canada', 'Australia'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// WORK AUTHORIZATION — Used by: settings.js (Location & Work Authorization tab)
// Backend: GET /api/users/authorization
// ═══════════════════════════════════════════════════════════════════════════════

export const MOCK_WORK_AUTHORIZATION = {
  requireSponsorship: 'Yes',
  authorizedToWork: 'Yes',
  excludedCompanies: ['Apple Inc.', 'Meta', 'Oracle'],
  priorityCompanies: ['Awwwards', 'Red Collars', 'One Bit'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// DROPDOWN OPTIONS — Used by: settings.js (all select menus)
// These may also come from the backend as configuration endpoints.
// Backend: GET /api/config/options
// ═══════════════════════════════════════════════════════════════════════════════

export const DROPDOWN_OPTIONS = {
  expertiseLevels: ['Junior Level', 'Intermediate Level', 'Senior Level', 'Lead Level'],
  spreadOptions: ['5%', '10%', '15%', '20%', '25%', '30%', '35%', '40%', '45%', '50%', '55%', '60%', '65%', '70%', '75%', '80%', '85%', '90%', '95%', '100%'],
  workTypes: ['Remote', 'On-site', 'Hybrid'],
  schedulePrefs: ['Full-time', 'Part-time', 'Contract', 'Freelance'],
  durations: ['1 month', '3 months', '6 months', '12 months', 'Indefinite'],
  industries: ['Design and Tech', 'Finance', 'Healthcare', 'Education', 'Marketing', 'Engineering'],
  specializations: ['UI Design', 'UX Design', 'Product Design', 'Visual Design', 'Interaction Design'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATION STATUSES — Shared constant for status badge rendering
// ═══════════════════════════════════════════════════════════════════════════════

export const APPLICATION_STATUSES = {
  PENDING: 'Pending',
  INTERVIEW: 'Interview',
  OFFERED: 'Offered',
  REJECTED: 'Rejected',
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS — Used by: notifications.js
// Backend: GET /api/notifications
// ═══════════════════════════════════════════════════════════════════════════════

export const MOCK_NOTIFICATIONS = [
  { id: 1, message: 'You have an Interview next week', date: '02/Feb', read: true },
  { id: 2, message: 'New Interview Request!', date: '31/Jan', read: true },
  { id: 3, message: 'You just reached 100 jobs application!', date: '31/Jan', read: true },
  { id: 4, message: 'You have an Interview next week', date: '02/Feb', read: false },
  { id: 5, message: 'New Interview Request!', date: '31/Jan', read: false },
  { id: 6, message: 'You just reached 100 jobs application!', date: '31/Jan', read: false },
];

export const MOCK_NOTIFICATION_TABS = ['All', 'Read', 'Unread'];
