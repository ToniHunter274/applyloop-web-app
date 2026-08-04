import Link from 'next/link';
import {
  FiAlertTriangle,
  FiBarChart2,
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiDatabase,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFileText,
  FiGlobe,
  FiPlus,
  FiSend,
  FiSearch,
  FiSettings,
  FiShield,
  FiSliders,
  FiTrash2,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import {
  AxisLineChart,
  GroupedBarChart,
  PieChart,
} from './OwnerCharts';
import styles from './OwnerPortal.module.css';

const cn = (...values) => values.filter(Boolean).join(' ');

function PageHeader({ title, subtitle, actions }) {
  return (
    <header className={styles.pageHeader}>
      <div><h1>{title}</h1><p>{subtitle}</p></div>
      <div className={styles.pageHeaderActions}>{actions}</div>
    </header>
  );
}

function Card({ children, className }) {
  return <section className={cn(styles.card, className)}>{children}</section>;
}

function Button({ children, icon: Icon, secondary = false }) {
  return <button className={cn(styles.button, secondary ? styles.button_secondary : styles.button_primary)}>{Icon && <Icon />}{children}</button>;
}

function Badge({ children, tone = 'green' }) {
  return <span className={cn(styles.extraBadge, styles[`extraBadge_${tone}`])}>{children}</span>;
}

function MetricCard({ icon: Icon, label, value, tone }) {
  return (
    <div className={styles.analyticsMetric}>
      <span className={cn(styles.analyticsMetricIcon, styles[`analyticsMetric_${tone}`])}><Icon /></span>
      <div><small>{label}</small><strong className={styles[`analyticsValue_${tone}`]}>{value}</strong></div>
    </div>
  );
}

const promptRows = [
  ['Professional Resume Builder v3.2', 'Live on 4 teams', 'Resume Prompts', 'v3.2', 'Live', 'All Teams', 1245],
  ['Cover Letter Template - Tech v2.2', 'Testing with Team Alpha', 'Cover Letter Prompts', 'v2.2', 'Testing', 'Team Alpha', 12],
  ['Resume Template - Creative v1.0', 'Design Review with Team Beta', 'Resume Prompts', 'v1.0', 'Draft', 'Team Beta', 8],
  ['Resume Template - Marketing v3.5', 'Strategy Session with Team Gamma', 'Resume Prompts', 'v3.5', 'Archived', 'Team Gamma', 15],
  ['Cover Letter Template - UX v4.1', 'Feedback Analysis with Team Delta', 'Cover Letter Prompts', 'v4.1', 'Live', 'Team Delta', 20],
  ['Professional Resume Builder v1.2', 'Live on 4 teams', 'Resume Prompts', 'v3.2', 'Live', 'All Teams', 1245],
  ['Professional Resume Builder v4.5', 'Live on 4 teams', 'Resume Prompts', 'v3.2', 'Live', 'All Teams', 1245],
];

export function PromptSystemPage() {
  return (
    <>
      <PageHeader title="Prompt System Management" subtitle="Create, test, and deploy AI prompts with team-based testing workflow" actions={<Button icon={FiPlus}>Create New Prompt</Button>} />
      <div className={styles.promptCategoryGrid}>
        <Card className={styles.promptCategory}><div><FiFileText /><span><strong>Resume Prompts</strong><small>12 prompts</small></span></div><button>View All</button></Card>
        <Card className={styles.promptCategory}><div><span className={styles.envelopeIcon}>✉</span><span><strong>Cover Letter Prompts</strong><small>8 prompts</small></span></div><button>View All</button></Card>
      </div>
      <div className={styles.workflowBanner}>
        <span className={styles.workflowIcon}>!</span>
        <div><h3>Testing Workflow</h3><p><strong>1. Draft:</strong> Create and edit prompt → <strong>2. Test:</strong> Deploy to selected team for testing → <strong>3. Review:</strong> Analyze results → <strong>4. Deploy:</strong> Push to all teams or delete</p></div>
      </div>
      <Card className={styles.promptTableCard}>
        <div className={styles.inlineFilters}><label className={styles.inlineSelect}><span>All Categories</span><FiChevronDown /></label><label className={styles.inlineSelect}><span>All Statuses</span><FiChevronDown /></label></div>
        <table className={styles.table}>
          <thead><tr><th>PROMPT NAME</th><th>CATEGORY</th><th>VERSION</th><th>STATUS</th><th>DEPLOYMENT</th><th>USAGE</th><th>ACTIONS</th></tr></thead>
          <tbody>{promptRows.map(([name, sub, category, version, status, deployment, usage]) => <tr key={`${name}-${sub}`}><td><div className={styles.twoLine}><strong>{name}</strong><small>{sub}</small></div></td><td>{category}</td><td><Badge tone="purple">{version}</Badge></td><td><Badge tone={status === 'Live' ? 'green' : status === 'Testing' ? 'blue' : status === 'Archived' ? 'amber' : 'gray'}>{status}</Badge></td><td className={deployment === 'All Teams' ? styles.greenText : styles.blueText}>{deployment}</td><td className={styles.boldText}>{usage}</td><td><div className={styles.actionIcons}><button><FiEye /></button><button><FiEdit2 /></button></div></td></tr>)}</tbody>
        </table>
      </Card>
      <div className={styles.promptTestingGrid}>
        <Card className={styles.promptTestCard}><div className={styles.testCardHead}><div><h3>Cover Letter Template - Tech v2.2</h3><small>Testing with Team Alpha</small></div><Badge tone="blue">Testing</Badge></div><div className={styles.testMetrics}><span><small>Tasks Done</small><strong>12</strong></span><span><small>Success Rate</small><strong className={styles.greenText}>91.7%</strong></span><span><small>Quality</small><strong className={styles.purpleText}>4.5/5.0</strong></span></div><div className={styles.teamFeedback}><small>Team Feedback:</small><p>Positive - Minor improvements needed</p></div><div className={styles.testActions}><Button icon={FiSend}>Deploy to All Teams</Button><Button secondary icon={FiEdit2}>Edit</Button><button className={styles.trashButton}><FiTrash2 /></button></div></Card>
        <Card className={styles.promptTestCard}><div className={styles.testCardHead}><div><h3>Resume Builder - Executive Level</h3><small>Testing with Team Gamma</small></div><Badge tone="blue">Testing</Badge></div><div className={styles.testMetrics}><span><small>Tasks Done</small><strong>8</strong></span><span><small>Success Rate</small><strong className={styles.greenText}>87.5%</strong></span><span><small>Quality</small><strong className={styles.purpleText}>4.2/5.0</strong></span></div><div className={styles.teamFeedback}><small>Team Feedback:</small><p>Good results - Ready for deployment</p></div><div className={styles.testActions}><Button icon={FiSend}>Deploy to All Teams</Button><Button secondary icon={FiEdit2}>Edit</Button><button className={styles.trashButton}><FiTrash2 /></button></div></Card>
      </div>
      <Card className={styles.draftPromptCard}><div className={styles.testCardHead}><div><h3>ATS Keywords Optimizer v4.1</h3><small>ATS Optimization • v4.1</small></div><Badge tone="gray">Draft</Badge></div><div className={styles.draftBody}><p>This prompt is ready to be tested. Select a team to deploy for testing before rolling out to all teams.</p><div className={styles.draftInput} /></div><div className={styles.testActions}><Button icon={FiSend}>Start Test</Button><Button secondary icon={FiEdit2}>Edit</Button><button className={styles.trashButton}><FiTrash2 /></button></div></Card>
      <div className={styles.safeDeployment}><span><FiSend /></span><div><h3>Safe Deployment Process</h3><p>Test prompts with a single team before deploying to your entire workforce. Review performance metrics, gather feedback, and make informed deployment decisions.</p><ul><li>Test with selected team</li><li>Monitor success rates and quality</li><li>Gather real-world feedback</li><li>Deploy or delete based on results</li></ul></div></div>
    </>
  );
}

const topApplicants = [
  ['Sarah Johnson', '342 apps • 98 interviews', '28.7%'],
  ['Emily Rodriguez', '487 apps • 142 interviews', '29.2%'],
  ['Alex Thompson', '321 apps • 89 interviews', '27.7%'],
  ['Michael Chen', '256 apps • 71 interviews', '27.7%'],
  ['David Park', '198 apps • 52 interviews', '26.3%'],
];

export function AnalyticsReportsPage() {
  return (
    <>
      <PageHeader title="Analytics & Reports" subtitle="Advanced analytics and performance insights" actions={<><Button secondary icon={FiDownload}>Export CSV</Button><Button icon={FiDownload}>Export PDF</Button></>} />
      <div className={styles.analyticsMetricGrid}>
        <MetricCard icon={FiTrendingUp} label="AVG SUCCESS RATE" value="27.8%" tone="blue" />
        <MetricCard icon={FiBarChart2} label="CLIENT SATISFACTION" value="4.6/5.0" tone="green" />
        <MetricCard icon={FiGlobe} label="INTERVIEW RATE" value="28.0%" tone="purple" />
        <MetricCard icon={FiTrendingUp} label="OFFER RATE" value="7.5%" tone="amber" />
      </div>
      <div className={styles.analyticsTwoColumn}>
        <Card><h2 className={styles.sectionTitle}>Top Performing Applicants</h2><div className={styles.rankingList}>{topApplicants.map(([name, detail, rate], index) => <div key={name} className={styles.rankingRow}><span className={styles.rankCircle}>{index + 1}</span><div><strong>{name}</strong><small>{detail}</small></div><div className={styles.rankRate}><strong>{rate}</strong><small>Success Rate</small></div></div>)}</div></Card>
        <Card><h2 className={styles.sectionTitle}>Interview Conversion Funnel</h2><div className={styles.pieWrap}><PieChart segments={[{ value: 50, color: '#3b82f6' }, { value: 38, color: '#8b5cf6' }, { value: 12, color: '#10b981' }]} /></div></Card>
      </div>
      <div className={styles.analyticsTwoColumn}>
        <Card><h2 className={styles.sectionTitle}>Job Category Performance</h2><GroupedBarChart groups={['Software\nEngineering', 'Product\nManagement', 'Data Science', 'Design', 'Marketing']} maxY={1400} yStep={350} series={[{ label: 'Applications', color: '#3b82f6', values: [1250, 1260, 1240, 1240, 700] }, { label: 'Interviews', color: '#8b5cf6', values: [770, 760, 1200, 1040, 760] }, { label: 'Offers', color: '#10b981', values: [500, 980, 1040, 760, 500] }]} /></Card>
        <Card><h2 className={styles.sectionTitle}>Client Satisfaction Trends</h2><AxisLineChart values={[4.3, 4.4, 4.6, 4.5, 4.7]} xLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May']} maxY={5} yStep={1} color="#10b981" legend="Satisfaction Score" /></Card>
      </div>
      <Card><h2 className={styles.sectionTitle}>Team Productivity Overview</h2><GroupedBarChart groups={['Alpha', 'Beta', 'Gamma', 'Delta']} maxY={1800} yStep={450} series={[{ label: 'Completed', color: '#2854bd', values: [1500, 1320, 800, 780] }, { label: 'Pending', color: '#b7c6e7', values: [1050, 980, 1320, 1660] }]} height={300} /></Card>
    </>
  );
}

const issues = [
  { title: 'Overdue Application', priority: 'Critical', state: 'Open', description: 'Application deadline missed by 3 days', client: 'Michael Chen', worker: 'Sarah Johnson', date: '2026-05-24 14:32', overdue: '3 days overdue' },
  { title: 'Client Complaint', priority: 'High', state: 'Investigating', description: 'Client reported poor quality on resume submission', client: 'Olabanji David', worker: 'Davies Dan', date: '2026-05-25 09:15' },
  { title: 'Missed Deadline', priority: 'High', state: 'Resolved', description: 'Application delivery 2 days late', client: 'Diego Paloma', worker: 'Emily Rodriguez', date: '2026-05-23 11:20', overdue: '2 days overdue' },
  { title: 'Team Inactivity', priority: 'Medium', state: 'Open', description: 'No activity logged for 5 days', client: 'N/A', worker: 'Jessica Williams', date: '2026-05-22 08:00', overdue: '5 days overdue' },
  { title: 'System Alert', priority: 'Critical', state: 'Open', description: 'Chief Applicant approval rate below 85% threshold', client: 'Rufus Dan', worker: 'Team Alpha', date: '2026-05-26 07:30' },
];

export function EscalationsIssuesPage() {
  return (
    <>
      <PageHeader title="Escalations & Issues" subtitle="Critical issue management and resolution tracking" />
      <div className={styles.issueMetricGrid}>
        <MetricCard icon={FiAlertTriangle} label="CRITICAL ISSUES" value="3" tone="red" />
        <MetricCard icon={FiCheckCircle} label="HIGH PRIORITY" value="1" tone="amber" />
        <MetricCard icon={FiSettings} label="OPEN" value="28.0%" tone="gray" />
        <MetricCard icon={FiBell} label="INVESTIGATING" value="1" tone="amber" />
      </div>
      <div className={styles.criticalBanner}><FiAlertTriangle /><div><h3>Critical Alerts Require Immediate Attention</h3><p>3 critical issues currently open. Review and assign investigations to resolve these issues immediately to prevent client dissatisfaction.</p></div></div>
      <Card className={styles.issueListCard}>
        <div className={styles.searchPanel}><label className={styles.searchField}><FiSearch /><input placeholder="Search clients by name, plan, or team..." /></label><label className={styles.selectField}><select><option>All Plans</option></select><FiChevronDown /></label><label className={styles.selectField}><select><option>All Statuses</option></select><FiChevronDown /></label></div>
        <div>{issues.map((issue) => <div key={`${issue.title}-${issue.worker}`} className={styles.issueRow}><div className={styles.issueHeading}><h3>{issue.title}</h3><Badge tone={issue.priority === 'Critical' ? 'red' : issue.priority === 'High' ? 'amber' : 'yellow'}>{issue.priority}</Badge><Badge tone={issue.state === 'Resolved' ? 'green' : issue.state === 'Investigating' ? 'amber' : 'red'}>{issue.state}</Badge></div><p>{issue.description}</p><div className={styles.issueMeta}><span>Client: <strong>{issue.client}</strong></span><i>•</i><span>Worker: <strong>{issue.worker}</strong></span><i>•</i><span>{issue.date}</span>{issue.overdue && <><i>•</i><span className={styles.redText}>{issue.overdue}</span></>}</div>{issue.state === 'Resolved' ? <div className={styles.resolvedBox}><FiCheckCircle /> Issue Resolved</div> : <div className={styles.issueActions}><Button>Assign Investigation</Button><button className={styles.resolveButton}><FiCheckCircle /> Resolve</button><button className={styles.urgentButton}><FiAlertTriangle /> Mark Urgent</button><Button secondary icon={FiBell}>Notify Chief</Button></div>}</div>)}</div>
      </Card>
    </>
  );
}

function SettingsSection({ icon: Icon, tone, title, subtitle, children, className }) {
  return (
    <Card className={cn(styles.settingsSection, className)}>
      <div className={styles.settingsSectionHead}><span className={cn(styles.settingsSectionIcon, styles[`settingsIcon_${tone}`])}><Icon /></span><div><h2>{title}</h2><p>{subtitle}</p></div></div>
      {children}
    </Card>
  );
}

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings & Permissions" subtitle="Platform configuration and access control management" />
      <SettingsSection icon={FiShield} tone="purple" title="User Roles & Permissions" subtitle="Manage access levels and capabilities">
        <div className={styles.rolesGrid}>{[
          ['Super Admin', '1 user', 'Full system access and control', 'red'],
          ['Chief Applicant', '45 users', 'Team management, review, approval', 'amber'],
          ['Applicant', '892 users', 'Application submission, task completion', 'blue'],
          ['Client', '342 users', 'View applications, submit requests', 'green'],
        ].map(([role, count, detail, tone]) => <div key={role} className={styles.roleCard}><div><Badge tone={tone}>{role}</Badge><span>{count}</span><button>Edit</button></div><p>{detail}</p></div>)}</div><Button>Manage Permissions</Button>
      </SettingsSection>
      <SettingsSection icon={FiUsers} tone="blue" title="Team Structure" subtitle="Organize and manage teams">
        <div className={styles.rolesGrid}>{[
          ['Team Alpha', 'Lead: Marcus Williams', '45 members'], ['Team Beta', 'Lead: Sophia Martinez', '38 members'], ['Team Gamma', 'Lead: James Anderson', '42 members'], ['Team Delta', 'Lead: Olivia Taylor', '51 members'],
        ].map(([name, lead, members]) => <div key={name} className={styles.teamCard}><div><strong>{name}</strong><Badge tone="green">Active</Badge></div><p>{lead}</p><div><span>{members}</span><button>Manage</button></div></div>)}</div><Button>Manage Permissions</Button>
      </SettingsSection>
      <div className={styles.settingsColumns}>
        <SettingsSection icon={FiSliders} tone="green" title="Platform Configuration" subtitle="System-wide settings">
          <div className={styles.configStack}><label><strong>Default Payment Rate - Applicant</strong><small>Application</small><div className={styles.moneyInput}><input defaultValue="4.00" /><span>$</span></div></label><label><strong>Default Payment Rate - Chief Applicant</strong><div className={styles.doubleMoney}><span><small>Application</small><div className={styles.moneyInput}><input defaultValue="4.00" /><span>$</span></div></span><span><small>Application Review</small><div className={styles.moneyInput}><input defaultValue="4.00" /><span>$</span></div></span></div></label><label><strong>Quality Score Threshold</strong><div className={styles.moneyInput}><input defaultValue="4.0" /></div><small>Minimum acceptable quality score</small></label><label><strong>Team Capacity Limit</strong><div className={styles.moneyInput}><input defaultValue="100" /></div><small>Maximum tasks per team</small></label><label><strong>Auto-Assignment</strong><span className={styles.settingsToggle}><i /></span><small>Enable AI-powered task distribution</small></label></div><Button>Save Configuration</Button>
        </SettingsSection>
        <div className={styles.settingsRightStack}>
          <SettingsSection icon={FiBell} tone="purple" title="Notification Settings" subtitle="Configure alert preferences">{['Revenue Alerts', 'Critical Escalations', 'Team Activity', 'Client Complaints', 'Daily Reports'].map((label) => <div key={label} className={styles.notificationRow}><div><strong>{label}</strong><small>{label === 'Revenue Alerts' ? 'Notify on revenue milestones' : label === 'Critical Escalations' ? 'Alert on critical issues' : label === 'Team Activity' ? 'Updates on team performance' : label === 'Client Complaints' ? 'Immediate complaint notifications' : 'End-of-day summary emails'}</small></div><span className={styles.settingsToggle}><i /></span></div>)}</SettingsSection>
          <SettingsSection icon={FiGlobe} tone="blue" title="API & Integrations" subtitle="External service connections">{[['Stripe Payment Gateway', 'Processing subscription payments', 'Connected'], ['Email Service (SendGrid)', 'Automated notifications and alerts', 'Connected'], ['Analytics Platform', 'Advanced reporting and insights', 'Not Connected']].map(([name, detail, state]) => <div key={name} className={styles.integrationRow}><div><strong>{name}</strong><small>{detail}</small></div><Badge tone={state === 'Connected' ? 'green' : 'gray'}>{state}</Badge></div>)}<Button>Manage Integrations</Button></SettingsSection>
        </div>
      </div>
      <SettingsSection icon={FiDatabase} tone="amber" title="Data & Backup" subtitle="System data management"><div className={styles.backupRow}><strong>Export All Data</strong><small>Download complete database backup</small></div><div className={styles.backupRow}><strong>Schedule Automated Backups</strong><small>Configure daily/weekly backup schedule</small></div><div className={cn(styles.backupRow, styles.dangerRow)}><strong>Clear Cache & Logs</strong><small>Remove temporary data and old logs</small></div></SettingsSection>
    </>
  );
}

export function ClientDetailsPage() {
  return (
    <>
      <div className={styles.clientDetailsPageHead}><div><Link href="/owner/client-management" className={styles.backLink}>← Back to Client Management</Link><h1>Olabanji David T.</h1><p>Client Performance Overview</p></div><Button icon={FiEdit2}>Edit Client</Button></div>
      <div className={styles.clientDetailMetricGrid}><MetricCard icon={FiFileText} label="Applications" value="245" tone="blue" /><MetricCard icon={FiTrendingUp} label="Interviews" value="68" tone="green" /><MetricCard icon={FiBarChart2} label="Success Rate" value="27.8%" tone="purple" /></div>
      <Card><h2 className={styles.sectionTitle}>Client Information</h2><div className={styles.clientInfoGrid}><div><small>Plan Type</small><strong>Enterprise</strong></div><div><small>Assigned Team</small><strong>Team Alpha</strong></div><div><small>Account Status</small><Badge tone="green">Active</Badge></div><div><small>Total Revenue</small><strong>$12,500</strong></div></div></Card>
      <Card><h2 className={styles.sectionTitle}>Current Onboarding Process</h2><div className={styles.onboardingSteps}>{['Profile Setup', 'Preference Disclosure', 'Payment', 'Resume Alignment', 'Preference Alignment', 'Analyst Onboarding', 'Application Commencement', 'Touch Call 1', 'Touch Call 2', 'Touch Call 3', 'Re-subscription', 'Season'].map((step, index) => <div key={step} className={index < 3 ? styles.onboardingComplete : index < 5 ? styles.onboardingActive : styles.onboardingPending}><span>{index < 3 ? <FiCheck /> : '•'}</span><small>{step}</small></div>)}</div></Card>
      <Card><h2 className={styles.sectionTitle}>Application Trends</h2><AxisLineChart values={[42, 48, 52, 45, 59]} xLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May']} maxY={60} yStep={15} color="#3b82f6" fill /></Card>
    </>
  );
}
