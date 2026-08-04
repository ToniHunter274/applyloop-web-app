import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiBarChart2,
  FiBell,
  FiBriefcase,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiCopy,
  FiEdit3,
  FiEye,
  FiFileText,
  FiFilter,
  FiHome,
  FiLayers,
  FiMenu,
  FiPaperclip,
  FiPlay,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiSettings,
  FiSliders,
  FiTarget,
  FiTrash2,
  FiTrendingUp,
  FiUpload,
  FiUser,
  FiUsers,
  FiX,
  FiZap,
} from 'react-icons/fi';
import { FaRegStar, FaStar } from 'react-icons/fa';
import { useAuth } from '../../shared/context/AuthContext';
import { getRoleHome, USER_ROLES } from '../../shared/config/roles';
import styles from './PromptEngineerPortal.module.css';

const cx = (...values) => values.filter(Boolean).join(' ');

const NAV_ITEMS = [
  { key: 'dashboard', href: '/prompt-engineer', label: 'Dashboard', icon: FiHome },
  { key: 'library', href: '/prompt-engineer/prompt-library', label: 'Prompt Library', icon: FiFileText },
  { key: 'testing', href: '/prompt-engineer/testing', label: 'Testing', icon: FiEdit3 },
  { key: 'clients', href: '/prompt-engineer/clients', label: 'Clients', icon: FiUser },
  { key: 'performance', href: '/prompt-engineer/performance', label: 'Performance Analytics', icon: FiBarChart2 },
  { key: 'settings', href: '/prompt-engineer/settings', label: 'Profile and Settings', icon: FiSliders },
];

const dashboardStats = [
  { value: '48', label: 'Total Prompts', change: '+12%', tone: 'green', icon: FiFileText },
  { value: '32', label: 'Active Prompts', change: '+8%', tone: 'blue', icon: FiCheckCircle },
  { value: '6', label: 'Pending Tests', change: '-3%', tone: 'amber', icon: FiClock },
  { value: '2', label: 'Failed tests', change: '', tone: 'red', icon: FiAlertTriangle },
];

const activities = [
  { text: 'Deployed · Resume Generation v3.2', time: '2 minutes ago', tone: 'green' },
  { text: 'Test Failed · Cover Letter ATS', time: '15 minutes ago', tone: 'red' },
  { text: 'Created · Follow-up Professional', time: '1 hour ago', tone: 'blue' },
  { text: 'Approved · ATS Optimization Pro', time: '3 hours ago', tone: 'green' },
  { text: 'Updated · Resume Tech Stack', time: '5 hours ago', tone: 'blue' },
];

const promptCardsByTab = {
  public: [
    { title: 'Resume Generator Pro', version: 'v3.2', type: 'Resume', status: 'Active', description: 'Generates professional ATS-optimized resumes from candidate data.', usage: '1,240', success: '98%', updated: 'May 26, 2024' },
    { title: 'Cover Letter Builder', version: 'v1.8', type: 'Cover Letter', status: 'Active', description: 'Creates formal cover letters tailored to job descriptions.', usage: '980', success: '96%', updated: 'April 15, 2024' },
    { title: 'ATS Optimization Standard', version: 'v2.5', type: 'ATS', status: 'Testing', description: 'Optimizes resume content for ATS keyword matching.', usage: '430', success: '94%', updated: 'March 10, 2024' },
    { title: 'Resume Enhancer', version: 'v2.3', type: 'Resume', status: 'Inactive', description: 'Generates professional ATS-optimized resumes from candidate data.', usage: '1,250', success: '92%', updated: 'March 30, 2024' },
    { title: 'ATS Optimization Standard', version: 'v1.5', type: 'Portfolio', status: 'Inactive', description: 'Generates professional ATS-optimized resumes from candidate data.', usage: '430', success: '89%', updated: 'January 10, 2024' },
    { title: 'Cover Letter Builder', version: 'v2.7', type: 'Skills', status: 'Testing', description: 'Generates professional ATS-optimized resumes from candidate data.', usage: '1,600', success: '95%', updated: 'April 12, 2024' },
  ],
  client: [
    { title: 'Olabanji David T.', version: 'v3.2', type: 'Resume', status: 'Active', description: 'Generates professional ATS-optimized resumes from candidate data.', usage: '1,240', success: '98%', updated: 'May 26, 2024' },
    { title: 'Olatunji Micheal', version: 'v1.8', type: 'Cover Letter', status: 'Active', description: 'Creates formal cover letters tailored to job descriptions.', usage: '980', success: '96%', updated: 'April 15, 2024' },
    { title: 'Israel Adekunle', version: 'v2.5', type: 'ATS', status: 'Testing', description: 'Optimizes resume content for ATS keyword matching.', usage: '430', success: '94%', updated: 'March 10, 2024' },
    { title: 'Bosun Atanda', version: 'v2.3', type: 'Resume', status: 'Inactive', description: 'Generates professional ATS-optimized resumes from candidate data.', usage: '1,250', success: '92%', updated: 'March 30, 2024' },
    { title: 'Ola Olatunde', version: 'v1.5', type: 'Portfolio', status: 'Inactive', description: 'Generates professional ATS-optimized resumes from candidate data.', usage: '430', success: '89%', updated: 'January 10, 2024' },
  ],
  role: [
    { title: 'Software Engineer Resume', version: 'v3.2', type: 'Resume', status: 'Active', description: 'Generates professional ATS-optimized resumes from candidate data.', usage: '1,240', success: '98%', updated: 'May 26, 2024' },
    { title: 'Product Manager Cover Letter', version: 'v1.8', type: 'Cover Letter', status: 'Active', description: 'Creates formal cover letters tailored to job descriptions.', usage: '980', success: '96%', updated: 'April 15, 2024' },
    { title: 'Data Scientist ATS', version: 'v2.5', type: 'ATS', status: 'Testing', description: 'Optimizes resume content for ATS keyword matching.', usage: '430', success: '94%', updated: 'March 10, 2024' },
    { title: 'Healthcare Resume Builder', version: 'v2.3', type: 'Resume', status: 'Inactive', description: 'Generates professional ATS-optimized resumes from candidate data.', usage: '1,250', success: '92%', updated: 'March 30, 2024' },
    { title: 'Finance Analyst Resume', version: 'v1.5', type: 'Portfolio', status: 'Inactive', description: 'Generates professional ATS-optimized resumes from candidate data.', usage: '430', success: '89%', updated: 'January 10, 2024' },
  ],
};

const clients = [
  ['Maya Patel', 'Olabanji David', 'Raya Dava', '250 uses', '2026-05-23'],
  ['Israel Moon', 'Olabanji David', 'Raya Dava', '250 uses', '2026-05-23'],
  ['Israel Moon', 'Olabanji David', 'Raya Dava', '250 uses', '2026-05-23'],
  ['Luna Vega', 'Ethan Brooks', 'Maya Patel', '250 uses', '2025-11-14'],
  ['Orion Starling', 'Maya Patel', 'Nebula Nexus', '250 uses', '2026-01-30'],
  ['Sirius Blaze', "Liam O'Connor", 'Mateo Ruiz', '250 uses', '2025-12-05'],
  ['Nova Pulse', 'Aria Chen', "Liam O'Connor", '180 uses', '2025-11-20'],
  ['Orion Drift', 'Mateo Ruiz', 'Ethan Brooks', '320 uses', '2026-01-15'],
  ['Celeste Wave', 'Nia Johnson', 'Aria Chen', '275 uses', '2025-12-30'],
].map(([name, applicant, chief, usages, success]) => ({ name, applicant, chief, usages, success }));

const clientPrompts = [
  { title: 'Resume Builder', version: 'v3.5', status: 'Active' },
  { title: 'Resume Builder', version: 'v1.5', status: 'Paused' },
  { title: 'Cover Letter', version: 'v1.5', status: 'Paused' },
  { title: 'Cover Letter', version: 'v2.5', status: 'Active' },
];

const topPrompts = [
  ['Role Based Prompt - Product Designer', '342 used', '28.7%'],
  ['Client Based Prompt - Olabanji David', '240 used', '29.2%'],
  ['Public Based Prompt - Resume Generation', '230 used', '27.7%'],
  ['Client Based Prompt - Tola Davies', '342 used', '27.7%'],
  ['Public Based Prompt - Resume Generation', '230 used', '27.7%'],
].map(([name, used, rate], index) => ({ rank: index === 4 ? 3 : index + 1, name, used, rate }));

const promptTemplate = `You are an expert resume writer with 10+ years of experience in career development.

Your task is to create a professional, ATS-optimized resume that highlights the candidate's strengths and achievements.

# Input Variables
- {{candidate_name}}: Full name of the candidate
- {{job_title}}: Target job title
- {{experience}}: Work experience details
- {{skills}}: Key skills and competencies
- {{education}}: Educational background

# Instructions
1. Start with a compelling professional summary
2. Highlight quantifiable achievements
3. Use action verbs and power words
4. Optimize for ATS scanning with relevant keywords
5. Ensure proper formatting and structure

# Output Format
Return a structured resume in markdown format with clear sections.`;

function getSegments(router) {
  const raw = router.query?.section;
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
}

function currentNavKey(segments) {
  if (!segments.length) return 'dashboard';
  if (segments[0] === 'prompt-library') return 'library';
  if (segments[0] === 'testing') return 'testing';
  if (segments[0] === 'clients') return 'clients';
  if (segments[0] === 'performance') return 'performance';
  if (segments[0] === 'settings') return 'settings';
  return 'dashboard';
}

function titleForSegments(segments) {
  if (!segments.length) return 'Dashboard';
  if (segments[0] === 'prompt-library') return 'Prompt Library';
  if (segments[0] === 'testing') return 'Testing Ground';
  if (segments[0] === 'clients') return 'Clients';
  if (segments[0] === 'performance') return 'Performance Analysis';
  if (segments[0] === 'settings') return 'Profile & Settings';
  return 'Prompt Engineer';
}

function Brand() {
  return (
    <span className={styles.brand}>
      <img src="/logo.svg" alt="ApplyLoop" />
      <span>ApplyLoop</span>
    </span>
  );
}

function PromptEngineerShell({ segments, children }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeKey = currentNavKey(segments);

  useEffect(() => {
    if (user?.role && user.role !== USER_ROLES.PROMPT_ENGINEER) {
      router.replace(getRoleHome(user.role));
    }
  }, [router, user?.role]);

  return (
    <div className={styles.app}>
      {menuOpen && <button className={styles.backdrop} onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
      <aside className={cx(styles.sidebar, menuOpen && styles.sidebarOpen)}>
        <div className={styles.logoWrap}><Brand /></div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.key} href={item.href} className={cx(styles.navItem, activeKey === item.key && styles.navActive)} onClick={() => setMenuOpen(false)}>
                <Icon />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button className={styles.profileFooter} onClick={logout}>
          <img src="/images/profile.jpg" alt="Team Lead" />
          <span><strong>Team Lead</strong><small>Administrator</small></span>
        </button>
      </aside>
      <div className={styles.mainRail}>
        <div className={styles.mobileHeader}>
          <button onClick={() => setMenuOpen(true)} aria-label="Open navigation"><FiMenu /></button>
          <Brand />
          <button className={styles.mobileBell} aria-label="Notifications"><FiBell /></button>
        </div>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

function PageHeading({ title, subtitle, actions, backHref }) {
  return (
    <div className={styles.pageHeading}>
      <div className={styles.headingCopy}>
        {backHref && <Link href={backHref} className={styles.backLink}><FiArrowLeft /></Link>}
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className={styles.headingActions}>{actions}</div>}
    </div>
  );
}

function PrimaryButton({ children, icon: Icon, onClick, href, className }) {
  const body = <>{Icon && <Icon />}{children}</>;
  if (href) return <Link href={href} className={cx(styles.primaryButton, className)}>{body}</Link>;
  return <button className={cx(styles.primaryButton, className)} onClick={onClick}>{body}</button>;
}

function SecondaryButton({ children, icon: Icon, onClick, className }) {
  return <button className={cx(styles.secondaryButton, className)} onClick={onClick}>{Icon && <Icon />}{children}</button>;
}

function StatCard({ value, label, change, tone, icon: Icon }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statTop}>
        <span className={cx(styles.statIcon, styles[`statIcon_${tone}`])}><Icon /></span>
        {change && <span className={cx(styles.statChange, styles[`text_${tone}`])}>{change}</span>}
      </div>
      <strong>{value}</strong>
      <p>{label}</p>
    </div>
  );
}

function Card({ children, className }) {
  return <section className={cx(styles.card, className)}>{children}</section>;
}

function LineChart({ values = [56, 65, 77, 73, 95], labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May'], max = 100, ticks = [0, 25, 50, 75, 100], color = '#0db581', fill = false }) {
  const width = 520;
  const height = 210;
  const left = 44;
  const right = 14;
  const top = 12;
  const bottom = 32;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const step = plotWidth / Math.max(values.length - 1, 1);
  const points = values.map((value, index) => `${left + index * step},${top + plotHeight - (value / max) * plotHeight}`).join(' ');
  const areaPoints = `${left},${top + plotHeight} ${points} ${left + plotWidth},${top + plotHeight}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} preserveAspectRatio="none">
      {ticks.map((tick) => {
        const y = top + plotHeight - (tick / max) * plotHeight;
        return <g key={tick}><line x1={left} y1={y} x2={left + plotWidth} y2={y} className={styles.gridLine} /><text x={left - 8} y={y + 4} className={styles.axisText} textAnchor="end">{tick}</text></g>;
      })}
      {labels.map((label, index) => {
        const x = left + index * step;
        return <g key={label}><line x1={x} y1={top} x2={x} y2={top + plotHeight} className={styles.verticalGrid} /><text x={x} y={height - 8} className={styles.axisText} textAnchor="middle">{label}</text></g>;
      })}
      <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} className={styles.axisLine} />
      <line x1={left} y1={top} x2={left} y2={top + plotHeight} className={styles.axisLine} />
      {fill && <polygon points={areaPoints} fill="rgba(59,130,246,.14)" />}
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((value, index) => {
        const x = left + index * step;
        const y = top + plotHeight - (value / max) * plotHeight;
        return <circle key={`${value}-${index}`} cx={x} cy={y} r="5" fill={color} />;
      })}
    </svg>
  );
}

function BarChart({ values = [800, 1000, 1200], labels = ['Resume\nGeneration', 'Cover Letter', 'ATS Optimization'], max = 1400, ticks = [0, 350, 700, 1050, 1400] }) {
  const width = 520;
  const height = 210;
  const left = 46;
  const right = 12;
  const top = 12;
  const bottom = 40;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const groupWidth = plotWidth / values.length;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} preserveAspectRatio="none">
      {ticks.map((tick) => {
        const y = top + plotHeight - (tick / max) * plotHeight;
        return <g key={tick}><line x1={left} y1={y} x2={left + plotWidth} y2={y} className={styles.gridLine} /><text x={left - 8} y={y + 4} className={styles.axisText} textAnchor="end">{tick}</text></g>;
      })}
      <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} className={styles.axisLine} />
      <line x1={left} y1={top} x2={left} y2={top + plotHeight} className={styles.axisLine} />
      {values.map((value, index) => {
        const barWidth = groupWidth * 0.72;
        const x = left + index * groupWidth + (groupWidth - barWidth) / 2;
        const barHeight = (value / max) * plotHeight;
        const y = top + plotHeight - barHeight;
        return (
          <g key={`${labels[index]}-${value}`}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx="10" fill="#8957ef" />
            {String(labels[index]).split('\n').map((part, partIndex) => <text key={part} x={x + barWidth / 2} y={height - 16 + partIndex * 11} className={styles.axisText} textAnchor="middle">{part}</text>)}
          </g>
        );
      })}
    </svg>
  );
}

function DashboardPage() {
  return (
    <>
      <PageHeading title="Welcome back, David" subtitle="Here's what's happening with your prompts today." />
      <div className={styles.statsGrid}>{dashboardStats.map((item) => <StatCard key={item.label} {...item} />)}</div>
      <div className={styles.twoColumnCharts}>
        <Card>
          <h2>Prompt Performance</h2><p className={styles.cardSubtitle}>Success rate over time</p>
          <LineChart />
        </Card>
        <Card>
          <h2>Prompt Usage</h2><p className={styles.cardSubtitle}>This Month</p>
          <BarChart />
        </Card>
      </div>
      <Card className={styles.activityCard}>
        <h2>Recent Activity</h2>
        <div className={styles.activityList}>
          {activities.map((item) => <div key={item.text} className={styles.activityRow}><span className={cx(styles.activityDot, styles[`activity_${item.tone}`])} /><strong>{item.text}</strong><time>{item.time}</time></div>)}
        </div>
      </Card>
    </>
  );
}

function LibraryTabs({ active }) {
  return (
    <div className={styles.tabs}>
      <Link href="/prompt-engineer/prompt-library/public" className={cx(styles.tab, active === 'public' && styles.tabActive)}><FiLayers />Public Prompt</Link>
      <Link href="/prompt-engineer/prompt-library/client" className={cx(styles.tab, active === 'client' && styles.tabActive)}><FiUser />Client Based Prompt</Link>
      <Link href="/prompt-engineer/prompt-library/role" className={cx(styles.tab, active === 'role' && styles.tabActive)}><FiBriefcase />Role Based Prompt</Link>
    </div>
  );
}

function PromptCard({ prompt }) {
  return (
    <Card className={styles.promptCard}>
      <div className={styles.promptCardTitle}><h3>{prompt.title}</h3><span>{prompt.version}</span></div>
      <div className={styles.tagRow}><span className={styles.typeTag}>{prompt.type}</span><StatusBadge value={prompt.status} /></div>
      <p className={styles.promptDescription}>{prompt.description}</p>
      <div className={styles.promptMetrics}><div><span>Usage</span><strong>{prompt.usage}</strong></div><div><span>Success Rate</span><strong>{prompt.success}</strong></div></div>
      <p className={styles.updatedText}>Update {prompt.updated}</p>
      <div className={styles.promptActions}>
        <Link href={`/prompt-engineer/prompt-library/edit?name=${encodeURIComponent(prompt.title)}`} className={styles.editButton}><FiEdit3 /> Edit</Link>
        <button className={styles.iconButton}><FiEye /></button>
        <button className={cx(styles.iconButton, styles.copyButton)}><FiCopy /></button>
        <button className={cx(styles.iconButton, styles.deleteButton)}><FiTrash2 /></button>
      </div>
    </Card>
  );
}

function PromptLibraryPage({ segments }) {
  const activeTab = ['public', 'client', 'role'].includes(segments[1]) ? segments[1] : 'public';
  const prompts = promptCardsByTab[activeTab];
  return (
    <>
      <PageHeading title="Prompts Library" subtitle="Manage and organize all your prompt templates." actions={<PrimaryButton href="/prompt-engineer/prompt-library/new" icon={FiPlus}>New Prompt</PrimaryButton>} />
      <LibraryTabs active={activeTab} />
      <div className={styles.libraryToolbar}>
        <label className={styles.searchBox}><FiSearch /><input placeholder="Search prompts..." /></label>
        <button className={styles.filterIcon}><FiFilter /></button>
        <label className={styles.selectBox}><select defaultValue=""><option value="">{activeTab === 'role' ? 'All Clients' : 'All'}</option></select><FiChevronDown /></label>
        {activeTab === 'role' && <label className={styles.selectBox}><select defaultValue=""><option value="">All Roles</option></select><FiChevronDown /></label>}
      </div>
      <div className={styles.promptGrid}>{prompts.map((prompt) => <PromptCard key={`${prompt.title}-${prompt.version}`} prompt={prompt} />)}</div>
    </>
  );
}

function StatusBadge({ value }) {
  const key = value.toLowerCase().replace(/[^a-z]+/g, '-');
  return <span className={cx(styles.statusBadge, styles[`status_${key}`])}>{value === 'Active' && <FiCheckCircle />}{value === 'Testing' && <FiClock />}{value === 'Inactive' && <FiCheckCircle />}{value === 'Paused' && <FiClock />}{value}</span>;
}

function EditorHeader({ title = 'Testing Prompt', subtitle, newPrompt = false }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  return (
    <div className={styles.editorHeading}>
      <div className={styles.headingCopy}><Link href="/prompt-engineer/prompt-library" className={styles.backLink}><FiArrowLeft /></Link><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div></div>
      <div className={styles.headingActions}>
        {!newPrompt && <div className={styles.historyWrap}><SecondaryButton icon={FiRefreshCw} onClick={() => setHistoryOpen((value) => !value)}>Version History</SecondaryButton>{historyOpen && <VersionHistoryDropdown />}</div>}
        <SecondaryButton icon={FiPlay}>Test Prompt</SecondaryButton>
        <PrimaryButton icon={FiSave}>Save Changes</PrimaryButton>
      </div>
    </div>
  );
}

function VersionHistoryDropdown() {
  const versions = [
    ['JD', 'v2.4.1 — Current', 'Just now', 'purple', true],
    ['AM', 'v2.4.0', '2 hours ago', 'green'],
    ['SK', 'v2.3.5', 'Yesterday', 'amber'],
    ['JD', 'v2.3.0', '3 days ago', 'purple'],
    ['PL', 'v2.2.1', '1 week ago', 'pink'],
    ['AM', 'v2.2.0', '2 weeks ago', 'green'],
  ];
  return (
    <div className={styles.historyDropdown}>
      <strong>REVISION HISTORY</strong>
      {versions.map(([initials, version, time, tone, current]) => <button key={version} className={cx(styles.historyItem, current && styles.historyCurrent)}><span className={cx(styles.historyAvatar, styles[`history_${tone}`])}>{initials}</span><span><b>{version}</b><small>{time}</small></span>{current && <i />}</button>)}
    </div>
  );
}

function ConfigPanel({ withVariables = false }) {
  return (
    <aside className={styles.configPanel}>
      {withVariables && <><div className={styles.configSectionHeader}><h2>Variables</h2><button><FiPlus /> Add Variable</button></div><div className={styles.variableList}>{[
        ['{{candidate_name}}', 'string', 'Required'], ['{{job_title}}', 'string', 'Required'], ['{{experience}}', 'text', 'Required'], ['{{skills}}', 'array', 'Required'], ['{{education}}', 'text', 'Optional'],
      ].map(([name, type, required]) => <div key={name} className={styles.variableItem}><code>{name}</code><span>{type}</span><small>{required}</small></div>)}</div></>}
      <div className={styles.configSection}><h2>Configuration</h2><FormSelect label="Category" value="Resume" /><FormSelect label="Models" value="GPT-4o" /><SliderField label="Temperature" left="Precise" right="Creative" /><SliderField label="Creativity" left="Market Tailored" right="Exaggerated" /><FormInput label="Max Tokens" value="2000" /><FormInput label="Upload Resume" value="Attach a file" icon={FiPaperclip} /></div>
      <div className={styles.metadata}><h2>Metadata</h2><dl><div><dt>Created</dt><dd>Jan 15, 2024</dd></div><div><dt>Last Updated</dt><dd>May 26, 2024</dd></div><div><dt>Version</dt><dd>v3.2</dd></div><div><dt>Status</dt><dd className={styles.activeText}>Active</dd></div></dl></div>
    </aside>
  );
}

function FormInput({ label, value, icon: Icon }) {
  return <label className={styles.formField}><span>{label}</span><div className={styles.fieldControl}><input defaultValue={value} />{Icon && <Icon />}</div></label>;
}

function FormSelect({ label, value }) {
  return <label className={styles.formField}><span>{label}</span><div className={styles.fieldControl}><select defaultValue={value}><option>{value}</option></select><FiChevronDown /></div></label>;
}

function SliderField({ label, left, right }) {
  return <div className={styles.sliderField}><span>{label}</span><input type="range" min="0" max="100" defaultValue="74" /><div><small>{left}</small><small>{right}</small></div></div>;
}

function PromptEditorPage({ newPrompt = false }) {
  return (
    <>
      <EditorHeader title={newPrompt ? 'Product Manager Cover Letter' : 'Testing Prompt'} subtitle={newPrompt ? 'Role Based Prompt' : undefined} newPrompt={newPrompt} />
      <div className={styles.editorLayout}>
        <section className={styles.editorMain}>
          <FormInput label="Prompt Title" value={newPrompt ? 'Resume Generator 1' : 'Resume Testing Prompt'} />
          <div className={styles.promptTemplateHeader}><h2>Prompt Template</h2><label className={styles.selectBox}><select defaultValue={newPrompt ? 'Public' : 'Testing'}><option>{newPrompt ? 'Public' : 'Testing'}</option></select><FiChevronDown /></label></div>
          <textarea className={cx(styles.codeEditor, newPrompt && styles.blankEditor)} defaultValue={newPrompt ? '' : promptTemplate} />
        </section>
        <ConfigPanel withVariables={newPrompt} />
      </div>
    </>
  );
}

function TestingTabs({ active }) {
  return (
    <div className={styles.tabs}>
      <Link href="/prompt-engineer/testing/prompt" className={cx(styles.tab, active === 'prompt' && styles.tabActive)}><FiFileText />Prompt Testing</Link>
      <Link href="/prompt-engineer/testing/document" className={cx(styles.tab, active === 'document' && styles.tabActive)}><FiFileText />Document Testing</Link>
      <Link href="/prompt-engineer/testing/comparison" className={cx(styles.tab, active === 'comparison' && styles.tabActive)}><FiLayers />Document Comparison</Link>
    </div>
  );
}

function ScoreCard({ label, value, icon: Icon }) {
  return <div className={styles.scoreCard}><div><span>{label}</span><strong>{value}</strong></div><Icon /></div>;
}

function StarRating({ filled = 5 }) {
  return <span className={styles.starRating}>{[1, 2, 3, 4, 5].map((item) => item <= filled ? <FaStar key={item} /> : <FaRegStar key={item} />)}</span>;
}

function AssessmentPanel({ prompt = false }) {
  return (
    <Card className={styles.assessmentPanel}>
      <h2>Prompt Assessment Results</h2>
      <ScoreCard label="Resume ATS Score" value="80%" icon={FiTarget} />
      <ScoreCard label={prompt ? 'Formatting Match' : 'Formatting Match'} value="100%" icon={FiBriefcase} />
      <div className={styles.metricList}><h3>{prompt ? 'Response Quality Metrics' : 'Content Breakdown'}</h3>{(prompt ? [['Relevance', 5], ['Completeness', 4], ['Coherence', 5]] : [['Structure & Formatting', 4], ['Keyword Relevance', 5], ['Grammar & Clarity', 4], ['Section Completeness', 4]]).map(([label, filled]) => <div key={label}><span>{label}</span><StarRating filled={filled} /></div>)}</div>
      <hr />
      <h2>{prompt ? 'Sample Output Preview' : 'Extracted Highlights'}</h2>
      {prompt ? <div className={styles.sampleOutput}># Alex Morgan<br />**Senior Product Designer**<br /><br />Highly creative UX leader with over 5 years of experience delivering cross-platform interactive software and robust layout...</div> : <div className={styles.highlights}><p>✓ Strong action verbs used consistently</p><p>✓ Quantified achievements in 4 of 5 roles</p><p className={styles.warningText}>▲ Missing keywords: agile, scrum, CI/CD</p><p>✓ Contact information complete and well-formatted</p></div>}
    </Card>
  );
}

function UploadDocumentCard() {
  return (
    <Card className={styles.uploadCard}>
      <h2>Upload Document</h2>
      <div className={styles.dropZone}><span><FiPaperclip /></span><strong>Drag & drop your document here</strong><a>or browse files</a><small>Supports PDF, DOCX, TXT (Max 10MB)</small></div>
      <div className={styles.activeDocument}><span>Active Document</span><div><strong>Alex_Morgan_Resume.pdf</strong><small>245 KB</small><StatusBadge value="Uploaded" /></div></div>
    </Card>
  );
}

function TestingPage({ segments }) {
  const active = ['prompt', 'document', 'comparison'].includes(segments[1]) ? segments[1] : 'prompt';
  return (
    <>
      <PageHeading title="Testing Ground" subtitle={active === 'prompt' ? 'Run and manage test suites for your prompts.' : 'Run and manage test suites for your prompts, documents, and comparisons.'} actions={<><SecondaryButton icon={FiEdit3}>Edit Prompt</SecondaryButton><PrimaryButton icon={FiZap}>Deploy Prompt</PrimaryButton></>} />
      <TestingTabs active={active} />
      {active === 'prompt' && <PromptTestingView />}
      {active === 'document' && <DocumentTestingView />}
      {active === 'comparison' && <DocumentComparisonView />}
    </>
  );
}

function PromptTestingView() {
  return (
    <div className={styles.testingGrid}>
      <Card className={styles.promptTestCard}>
        <div className={styles.testTitleRow}><h2>Resume Generated Prompt Template</h2><span>Public <FiChevronDown /></span></div>
        <pre className={styles.promptPreview}>{`You are an expert resume writer with 10+ years of experience in career development.
Your task is to create a professional, ATS-optimized resume that highlights the candidate's strengths.

# Input Variables
- {{candidate_name}}: Full name of the candidate
- {{job_title}}: Target job title
- {{experience}}: Work experience details...`}</pre>
        <div className={styles.variablesSection}><h2>Test Variables Configuration</h2><div className={styles.variableInputs}><FormInput label="candidate_name" value="Alex Morgan" /><FormInput label="job_title" value="Senior Product Designer" /><div className={styles.fullField}><FormInput label="experience" value="5 years at LoopTech leading interface design, specialized in constraint-bas..." /></div><div className={styles.fullField}><FormInput label="skills" value="Figma, Design Systems, UX Research, React, Rapid Prototyping" /></div></div></div>
        <div className={styles.runButtonRow}><PrimaryButton icon={FiZap}>Run Integration Test</PrimaryButton></div>
      </Card>
      <AssessmentPanel prompt />
    </div>
  );
}

function DocumentTestingView() {
  return (
    <div className={styles.testingGrid}>
      <UploadDocumentCard />
      <AssessmentPanel />
      <div className={styles.documentRun}><PrimaryButton icon={FiZap}>Run Integration Test</PrimaryButton></div>
    </div>
  );
}

function DocumentComparisonView() {
  const comparisonRows = [
    ['Structure & Formatting', 5, 4], ['Keyword Relevance', 5, 4], ['Grammar & Clarity', 4, 4], ['Section Completeness', 5, 4], ['Readability', 5, 4],
  ];
  return (
    <>
      <div className={styles.comparisonUploads}><UploadDocumentCard /><UploadDocumentCard /></div>
      <div className={styles.compareButtonRow}><PrimaryButton icon={FiZap}>Compare Documents</PrimaryButton></div>
      <Card className={styles.verdictCard}><h2>Overall Verdict</h2><div><span><small>Document A</small><strong className={styles.greenText}>88%</strong></span><b>Winner</b><span><small>Document B</small><strong className={styles.orangeText}>72%</strong></span></div></Card>
      <Card className={styles.detailedComparison}><h2>Detailed Comparison</h2>{comparisonRows.map(([label, left, right]) => <div key={label}><span>{label}</span><span><StarRating filled={left} /> <b>{left}/5</b></span><span><StarRating filled={right} /> <b>{right}/5</b></span></div>)}</Card>
      <Card><h2>Key Differences</h2><div className={styles.keyDifferences}><div><h3>Document A</h3><p>Stronger action verbs used consistently</p><p>Quantified achievements in 4 of 5 roles</p><p>Missing keywords: agile, scrum, CI/CD</p></div><div><h3>Document B</h3><p>Contact information complete and well-formatted</p><p>Formatting inconsistent in work history section</p><p>Grammar errors found in summary paragraph</p></div></div></Card>
    </>
  );
}

function ClientsPage({ segments }) {
  const detail = segments[1] === 'maya-patel';
  return detail ? <ClientDetailPage /> : <ClientListPage />;
}

function ClientListPage() {
  return (
    <>
      <PageHeading title="Clients" subtitle="Manage client accounts and their custom prompt libraries." />
      <div className={styles.statsGrid}>{[
        { value: '6', label: 'Total Clients', change: '+12%', tone: 'green', icon: FiBriefcase },
        { value: '5', label: 'Active Clients', change: '+8%', tone: 'blue', icon: FiUser },
        { value: '45', label: 'Total Prompt', change: '-3%', tone: 'purple', icon: FiFileText },
        { value: '28,140', label: 'Total Usage', change: '', tone: 'green', icon: FiTrendingUp },
      ].map((item) => <StatCard key={item.label} {...item} />)}</div>
      <div className={styles.clientToolbar}><label className={styles.searchBox}><FiSearch /><input placeholder="Search prompts..." /></label><button className={styles.filterIcon}><FiFilter /></button><label className={styles.selectBox}><select defaultValue=""><option value="">All</option></select><FiChevronDown /></label></div>
      <div className={styles.clientTableWrap}><table className={styles.table}><thead><tr><th>CLIENT NAME</th><th>APPLICANT</th><th>CHIEF APPLICANT</th><th>USAGES</th><th>SUCCESS RATE</th></tr></thead><tbody>{clients.map((client) => <tr key={`${client.name}-${client.success}`}><td><Link href="/prompt-engineer/clients/maya-patel" className={styles.clientName}>{client.name}</Link></td><td>{client.applicant}</td><td>{client.chief}</td><td>{client.usages}</td><td>{client.success}</td></tr>)}</tbody></table></div>
    </>
  );
}

function ClientDetailPage() {
  return (
    <>
      <PageHeading title="Maya Patel" backHref="/prompt-engineer/clients" actions={<PrimaryButton icon={FiFileText}>New Prompt</PrimaryButton>} />
      <div className={styles.statsGrid}>{[
        { value: '12', label: 'Total Prompt', change: '+12%', tone: 'green', icon: FiFileText },
        { value: '5', label: 'Active Prompts', change: '+8%', tone: 'blue', icon: FiZap },
        { value: '8,420', label: 'Total Usage', change: '', tone: 'green', icon: FiTrendingUp },
        { value: '97%', label: 'Success Rate', change: '', tone: 'green', icon: FiZap },
      ].map((item) => <StatCard key={item.label} {...item} />)}</div>
      <label className={styles.clientDetailSearch}><FiSearch /><input placeholder="Search clients..." /></label>
      <div className={styles.clientPromptTable}><div className={styles.clientPromptHeader}><span>CLIENT NAME</span><strong>4 Prompts</strong></div>{clientPrompts.map((prompt) => <div key={`${prompt.title}-${prompt.version}`} className={styles.clientPromptRow}><div><h3>{prompt.title} <small>{prompt.version}</small></h3><div className={styles.tagRow}><span className={styles.typeTag}>Resume</span><StatusBadge value={prompt.status} /></div></div><div className={styles.clientPromptMetrics}><span><strong>320</strong><small>Usage</small></span><span><strong>97%</strong><small>Success</small></span><span><strong>May 24</strong><small>Updated</small></span><SecondaryButton icon={FiEdit3}>Edit</SecondaryButton></div></div>)}</div>
    </>
  );
}

function PerformancePage() {
  return (
    <>
      <PageHeading title="Performance Analysis" subtitle="Advanced analytics and performance insights" />
      <div className={styles.statsGrid}>{[
        { value: '48', label: 'TOTAL PROMPTS', change: '+12%', tone: 'green', icon: FiFileText },
        { value: '32', label: 'TOTAL SUCCESSFUL PROMPTS', change: '+8%', tone: 'blue', icon: FiCheckCircle },
        { value: '6', label: 'TOTAL ACTIVE PROMPTS', change: '-3%', tone: 'amber', icon: FiClock },
        { value: '2', label: 'FAILED PROMPTS', change: '', tone: 'red', icon: FiAlertTriangle },
      ].map((item) => <StatCard key={item.label} {...item} />)}</div>
      <Card className={styles.topPrompts}><h2>Top Performing Prompts</h2>{topPrompts.map((prompt) => <div key={`${prompt.name}-${prompt.rank}`} className={styles.topPromptRow}><span className={styles.rankCircle}>{prompt.rank}</span><div><strong>{prompt.name}</strong><small>{prompt.used}</small></div><span><strong>{prompt.rate}</strong><small>Success Rate</small></span></div>)}</Card>
      <div className={styles.twoColumnCharts}><Card><h2>Prompt Performance</h2><p className={styles.cardSubtitle}>Success rate over time</p><LineChart /></Card><Card><h2>Prompt Usage</h2><p className={styles.cardSubtitle}>This Month</p><BarChart /></Card></div>
      <Card className={styles.levelCard}><div className={styles.levelTitle}><FiTarget /> Performance Level</div><div className={styles.levelDetails}><span className={styles.goldIcon}>✹</span><div><strong>Gold</strong><small>75% progress to Platinum</small></div><span className={styles.pointsNeeded}><small>Points Needed</small><strong>Gold</strong></span></div><div className={styles.levelTrack}><span /></div><div className={styles.levelLabels}><span>Bronze</span><span>Silver</span><strong>Gold (Current)</strong><span>Platinum</span><span>Diamond</span></div></Card>
    </>
  );
}

function Toggle({ on = true }) {
  return <button className={cx(styles.toggle, on && styles.toggleOn)}><span /></button>;
}

function SettingsPage() {
  return (
    <>
      <PageHeading title="Profile & Settings" subtitle="manage your account setting and preference" actions={<button className={styles.notificationButton}><FiBell /></button>} />
      <div className={styles.settingsContainer}>
        <img src="/images/profile.jpg" alt="Olabanji David" className={styles.profileImage} />
        <h2>Personal Information</h2>
        <div className={styles.settingsForm}><div className={styles.fullField}><FormInput label="Full Name" value="Olabanji David T." /></div><div className={styles.fullField}><FormInput label="Designation" value="Super Admin" /></div><FormInput label="Email Address" value="banjidhevid216@gmail.com" /><FormInput label="Phone Number" value="+234 811 474 6609" /><FormInput label="Nationality" value="Nigeria" /><FormInput label="State/Province" value="Lagos" /></div>
        <PrimaryButton className={styles.saveSmall}>Save Changes</PrimaryButton>
        <h2 className={styles.settingsSectionTitle}>Security</h2>
        <div className={styles.securityFields}><FormInput label="Current Password" value="********" /><FormInput label="New Password" value="********" /><FormInput label="Confirm New Password" value="********" /></div>
        <PrimaryButton className={styles.saveSmall}>Save Changes</PrimaryButton>
        <h2 className={styles.settingsSectionTitle}>Notification Preferencessss</h2>
        <div className={styles.notificationList}>{[
          ['Email Notifications', 'Receive updates via Email', true], ['Deadline Alerts', 'Get notified about upcoming deadlines', true], ['Escalation Notifications', 'Alert on new escalations', true], ['Team Activity', 'Updates on team performance', false],
        ].map(([title, subtitle, on]) => <div key={title}><span><strong>{title}</strong><small>{subtitle}</small></span><Toggle on={on} /></div>)}</div>
      </div>
    </>
  );
}

export default function PromptEngineerPortal() {
  const router = useRouter();
  const segments = getSegments(router);
  const title = titleForSegments(segments);

  let page = <DashboardPage />;
  if (segments[0] === 'prompt-library' && segments[1] === 'edit') page = <PromptEditorPage />;
  else if (segments[0] === 'prompt-library' && segments[1] === 'new') page = <PromptEditorPage newPrompt />;
  else if (segments[0] === 'prompt-library') page = <PromptLibraryPage segments={segments} />;
  else if (segments[0] === 'testing') page = <TestingPage segments={segments} />;
  else if (segments[0] === 'clients') page = <ClientsPage segments={segments} />;
  else if (segments[0] === 'performance') page = <PerformancePage />;
  else if (segments[0] === 'settings') page = <SettingsPage />;

  return (
    <>
      <Head><title>{title} | ApplyLoop</title><meta name="description" content="ApplyLoop Prompt Engineer workspace" /></Head>
      <PromptEngineerShell segments={segments}>{page}</PromptEngineerShell>
    </>
  );
}
