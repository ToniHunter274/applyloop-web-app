import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiCheckSquare,
  FiClock,
  FiClipboard,
  FiCreditCard,
  FiDollarSign,
  FiDownload,
  FiEdit3,
  FiFileText,
  FiFlag,
  FiLayers,
  FiMessageSquare,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiTarget,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import RoleLayout from '../../shared/components/RoleLayout';
import {
  Avatar,
  Badge,
  BarChart,
  Button,
  Card,
  DataTable,
  Donut,
  ExportButton,
  Field,
  Modal,
  ProgressBar,
  SectionHeading,
  Sparkline,
  StatCard,
  Toolbar,
} from '../../shared/components/PortalUI';
import { USER_ROLES } from '../../shared/config/roles';
import {
  activity,
  applications,
  audits,
  escalations,
  messages,
  monthlyRevenue,
  monthlyVolume,
  people,
  qualityTrend,
  reports,
  subscriptions,
  tasks,
} from '../../data/portalData';

const sectionFromRouter = (router) => {
  const value = router.query?.section;
  return Array.isArray(value) && value.length ? value[0] : 'dashboard';
};

const matching = (row, search) => {
  if (!search.trim()) return true;
  const needle = search.toLowerCase();
  return Object.values(row).some((value) => String(value).toLowerCase().includes(needle));
};

const PersonCell = ({ name, sub }) => (
  <div className="flex items-center gap-3">
    <Avatar name={name} size="sm" />
    <div className="min-w-0">
      <p className="truncate font-semibold text-slate-900">{name}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-slate-400">{sub}</p>}
    </div>
  </div>
);

const MetricGrid = ({ items }) => <div className={`grid gap-4 sm:grid-cols-2 ${items.length > 4 ? 'xl:grid-cols-4 2xl:grid-cols-5' : 'xl:grid-cols-4'}`}>{items.map((item) => <StatCard key={item.label} {...item} />)}</div>;

const ActivityList = ({ limit = activity.length }) => (
  <div className="space-y-1">
    {activity.slice(0, limit).map((item) => (
      <div key={`${item.title}-${item.time}`} className="flex gap-3 rounded-xl px-2 py-3 hover:bg-slate-50">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.tone === 'green' ? 'bg-emerald-500' : item.tone === 'red' ? 'bg-rose-500' : item.tone === 'purple' ? 'bg-violet-500' : item.tone === 'amber' ? 'bg-amber-500' : 'bg-blue-500'}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{item.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
        </div>
        <span className="whitespace-nowrap text-[11px] text-slate-400">{item.time}</span>
      </div>
    ))}
  </div>
);

const QueuePreview = ({ title = 'Priority queue', data = audits, onOpen }) => (
  <Card>
    <SectionHeading title={title} subtitle="Items requiring attention" action={<button className="text-sm font-semibold text-blue-700">View all</button>} />
    <div className="space-y-3">
      {data.slice(0, 4).map((item) => (
        <button key={item.id} onClick={() => onOpen?.(item)} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:border-blue-200 hover:bg-blue-50/30">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">{item.company?.[0] || item.title?.[0]}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-slate-900">{item.company || item.title}</span>
            <span className="mt-1 block truncate text-xs text-slate-500">{item.role || item.application}</span>
          </span>
          <Badge>{item.status || item.priority}</Badge>
        </button>
      ))}
    </div>
  </Card>
);

function ChiefApplicantDashboard({ setSelected }) {
  const stats = [
    { label: 'Active applicants', value: '24', change: '+8.2%', note: 'this month', icon: FiUsers, tone: 'blue' },
    { label: 'Applications today', value: '89', change: '+12.4%', note: 'vs yesterday', icon: FiBriefcase, tone: 'green' },
    { label: 'Awaiting review', value: '18', change: '-4.1%', note: 'queue change', icon: FiClock, tone: 'amber' },
    { label: 'Approval rate', value: '94.6%', change: '+2.1%', note: 'last 30 days', icon: FiCheckCircle, tone: 'purple' },
  ];
  return (
    <div className="space-y-6">
      <MetricGrid items={stats} />
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <Card>
          <SectionHeading title="Application throughput" subtitle="Daily applications completed by your team" action={<select className="rounded-lg border border-slate-200 px-3 py-2 text-xs"><option>Last 12 weeks</option></select>} />
          <Sparkline values={monthlyVolume} height={220} />
          <div className="mt-2 flex justify-between border-t border-slate-100 pt-4 text-xs text-slate-400"><span>May</span><span>June</span><span>July</span></div>
        </Card>
        <QueuePreview title="Applications at risk" data={applications.filter((item) => ['Revision', 'Draft', 'In audit'].includes(item.status))} onOpen={setSelected} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <SectionHeading title="Applicant workload" subtitle="Capacity and quality across the team" />
          <div className="space-y-4">
            {people.filter((person) => person.role === 'Applicant').map((person) => (
              <div key={person.id} className="grid items-center gap-4 rounded-xl border border-slate-100 p-4 sm:grid-cols-[1.2fr_1fr_90px]">
                <PersonCell name={person.name} sub={`${person.team} team · ${person.lastActive}`} />
                <ProgressBar value={person.workload} label="Workload" tone={person.workload > 85 ? 'red' : person.workload > 65 ? 'amber' : 'blue'} />
                <div className="text-right"><p className="text-lg font-extrabold text-slate-900">{person.quality}%</p><p className="text-[11px] text-slate-400">quality</p></div>
              </div>
            ))}
          </div>
        </Card>
        <Card><SectionHeading title="Recent activity" subtitle="Latest updates from your team" /><ActivityList limit={5} /></Card>
      </div>
    </div>
  );
}

function PromptEngineerDashboard({ setSelected }) {
  const stats = [
    { label: 'Assigned today', value: '8', change: '+2', note: 'new tasks', icon: FiClipboard, tone: 'blue' },
    { label: 'Completed', value: '5', change: '+25%', note: 'vs yesterday', icon: FiCheckCircle, tone: 'green' },
    { label: 'Average quality', value: '94.2%', change: '+1.8%', note: '30-day trend', icon: FiTarget, tone: 'purple' },
    { label: 'Due soon', value: '2', change: '-1', note: 'within 2 hours', icon: FiClock, tone: 'amber' },
  ];
  return (
    <div className="space-y-6">
      <MetricGrid items={stats} />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <SectionHeading title="Current task" subtitle="Continue from where you stopped" action={<Button icon={FiArrowRight} onClick={() => setSelected(tasks[0])}>Continue task</Button>} />
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2"><Badge tone="red">High priority</Badge><span className="text-xs text-slate-400">{tasks[0].id}</span></div>
                <h3 className="mt-4 text-xl font-extrabold text-slate-950">{tasks[0].role} at {tasks[0].company}</h3>
                <p className="mt-2 text-sm text-slate-500">{tasks[0].type} · Due {tasks[0].due}</p>
              </div>
              <div className="w-full md:w-56"><ProgressBar value={tasks[0].progress} label="Task progress" /></div>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Target role</p><p className="mt-2 font-bold text-slate-900">Product Manager</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Required documents</p><p className="mt-2 font-bold text-slate-900">Resume + cover letter</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Latest feedback</p><p className="mt-2 font-bold text-emerald-700">No open issues</p></div>
          </div>
        </Card>
        <Card>
          <SectionHeading title="Weekly target" subtitle="5 of 7 tasks completed" />
          <Donut value={71} label="On track" sublabel="Complete two more tasks to reach this week’s goal." />
          <div className="mt-6 border-t border-slate-100 pt-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Average turnaround</p><p className="mt-2 text-2xl font-extrabold text-slate-950">42 min</p></div>
        </Card>
      </div>
      <Card>
        <SectionHeading title="My task queue" subtitle="Tasks ordered by priority and due date" action={<button className="text-sm font-semibold text-blue-700">Open all tasks</button>} />
        <div className="grid gap-4 lg:grid-cols-2">
          {tasks.slice(0, 4).map((task) => (
            <button key={task.id} onClick={() => setSelected(task)} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:shadow-sm">
              <div className="flex items-start justify-between gap-4"><div><p className="font-bold text-slate-900">{task.company} · {task.role}</p><p className="mt-1 text-xs text-slate-500">{task.type}</p></div><Badge>{task.status}</Badge></div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400"><span>{task.due}</span><span>{task.progress}%</span></div>
              <div className="mt-2"><ProgressBar value={task.progress} /></div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AuditorDashboard({ chief = false, setSelected }) {
  const stats = chief ? [
    { label: 'Open audits', value: '128', change: '+6.3%', note: 'today', icon: FiClipboard, tone: 'blue' },
    { label: 'Within SLA', value: '93.8%', change: '+1.2%', note: 'this week', icon: FiClock, tone: 'green' },
    { label: 'Escalations', value: '7', change: '-12.5%', note: 'vs last week', icon: FiAlertTriangle, tone: 'red' },
    { label: 'Quality score', value: '96.4%', change: '+0.9%', note: 'network average', icon: FiCheckSquare, tone: 'purple' },
  ] : [
    { label: 'My queue', value: '12', change: '-3', note: 'since morning', icon: FiClipboard, tone: 'blue' },
    { label: 'Completed today', value: '18', change: '+20%', note: 'vs average', icon: FiCheckCircle, tone: 'green' },
    { label: 'Average review', value: '11m', change: '-2m', note: 'faster', icon: FiClock, tone: 'amber' },
    { label: 'Quality score', value: '97.1%', change: '+1.1%', note: '30-day trend', icon: FiTarget, tone: 'purple' },
  ];
  return (
    <div className="space-y-6">
      <MetricGrid items={stats} />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <SectionHeading title={chief ? 'Audit performance' : 'My quality trend'} subtitle="Approval rate and review consistency" />
          <Sparkline values={qualityTrend} height={220} />
          <div className="mt-3 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center"><div><p className="text-xl font-extrabold">97%</p><p className="text-xs text-slate-400">Approved</p></div><div><p className="text-xl font-extrabold">2%</p><p className="text-xs text-slate-400">Revision</p></div><div><p className="text-xl font-extrabold">1%</p><p className="text-xs text-slate-400">Escalated</p></div></div>
        </Card>
        <QueuePreview title={chief ? 'Critical escalations' : 'Next in queue'} data={chief ? escalations : audits} onOpen={setSelected} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <SectionHeading title={chief ? 'Auditor performance' : 'Recent reviews'} subtitle={chief ? 'Capacity, output, and review quality' : 'Your latest audit decisions'} />
          <div className="space-y-3">
            {(chief ? people.filter((item) => /Auditor/.test(item.role)) : audits).slice(0, 5).map((item) => (
              <button key={item.id} onClick={() => setSelected(item)} className="grid w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50 sm:grid-cols-[1.2fr_0.7fr_0.5fr]">
                {chief ? <PersonCell name={item.name} sub={`${item.role} · ${item.lastActive}`} /> : <div><p className="font-bold text-slate-900">{item.company}</p><p className="mt-1 text-xs text-slate-500">{item.role} · {item.id}</p></div>}
                <div><ProgressBar value={chief ? item.workload : item.score} label={chief ? 'Capacity' : 'Score'} tone={(chief ? item.workload : item.score) < 80 ? 'red' : 'green'} /></div>
                <div className="sm:text-right"><Badge>{chief ? item.status : item.status}</Badge></div>
              </button>
            ))}
          </div>
        </Card>
        <Card><SectionHeading title="Live activity" subtitle="Recent audit events" /><ActivityList limit={5} /></Card>
      </div>
    </div>
  );
}

function OwnerDashboard() {
  const stats = [
    { label: 'Monthly revenue', value: '$21,850', change: '+11.4%', note: 'vs last month', icon: FiDollarSign, tone: 'green' },
    { label: 'Active subscribers', value: '1,284', change: '+8.7%', note: 'this month', icon: FiCreditCard, tone: 'blue' },
    { label: 'Applications', value: '8,496', change: '+14.1%', note: 'last 30 days', icon: FiBriefcase, tone: 'purple' },
    { label: 'Active staff', value: '86', change: '+4', note: 'new this month', icon: FiUsers, tone: 'amber' },
    { label: 'Platform quality', value: '96.4%', change: '+1.2%', note: '30-day average', icon: FiCheckSquare, tone: 'green' },
  ];
  return (
    <div className="space-y-6">
      <MetricGrid items={stats} />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <SectionHeading title="Revenue growth" subtitle="Recurring and one-time revenue" action={<select className="rounded-lg border border-slate-200 px-3 py-2 text-xs"><option>Last 12 months</option></select>} />
          <Sparkline values={monthlyRevenue} height={225} />
          <div className="mt-3 flex items-center gap-5 border-t border-slate-100 pt-4 text-xs"><span className="font-semibold text-blue-700">● Monthly revenue</span><span className="text-slate-400">Current run rate: $262,200/year</span></div>
        </Card>
        <Card><SectionHeading title="Live operations" subtitle="Latest platform events" /><ActivityList limit={6} /></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card><SectionHeading title="Application volume" subtitle="Last 12 months" /><BarChart values={monthlyVolume.slice(4)} labels={['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']} /></Card>
        <Card><SectionHeading title="Plan distribution" subtitle="Active subscriptions" /><Donut value={64} label="Premium + Standard" sublabel="64% of subscribers use higher-volume plans." /><div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs"><span className="rounded-lg bg-blue-50 p-2 text-blue-700">Basic 36%</span><span className="rounded-lg bg-violet-50 p-2 text-violet-700">Standard 39%</span><span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">Premium 25%</span></div></Card>
        <Card><SectionHeading title="Service health" subtitle="Current operational status" /><div className="space-y-3">{[['Application delivery', 98, 'green'], ['Prompt production', 94, 'blue'], ['Audit SLA', 92, 'amber'], ['Billing success', 99, 'green']].map(([label, value, tone]) => <div key={label} className="rounded-xl border border-slate-100 p-3"><ProgressBar label={label} value={value} tone={tone} /></div>)}</div></Card>
      </div>
    </div>
  );
}

function ApplicationsPage({ role, setSelected }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const rows = applications.filter((item) => matching(item, search) && (!status || item.status === status));
  const columns = [
    { key: 'id', label: 'Application', render: (value, row) => <div><p className="font-bold text-blue-700">{value}</p><p className="mt-1 text-xs text-slate-400">{row.created}</p></div> },
    { key: 'company', label: 'Company & role', render: (value, row) => <div><p className="font-semibold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{row.position}</p></div> },
    { key: 'applicant', label: 'Applicant', render: (value) => <PersonCell name={value} /> },
    { key: role === USER_ROLES.CHIEF_APPLICANT ? 'owner' : 'promptEngineer', label: role === USER_ROLES.CHIEF_APPLICANT ? 'Applicant owner' : 'Prompt engineer' },
    { key: 'score', label: 'Quality', render: (value) => <div className="w-28"><ProgressBar value={value} label={`${value}%`} tone={value < 80 ? 'red' : value < 90 ? 'amber' : 'green'} /></div> },
    { key: 'status', label: 'Status', render: (value) => <Badge>{value}</Badge> },
  ];
  return (
    <div className="space-y-5">
      <MetricGrid items={[
        { label: 'All applications', value: '8,496', change: '+14.1%', note: '30 days', icon: FiBriefcase, tone: 'blue' },
        { label: 'In production', value: '184', change: '+9', note: 'today', icon: FiLayers, tone: 'amber' },
        { label: 'Approved', value: '7,941', change: '+13.2%', note: '30 days', icon: FiCheckCircle, tone: 'green' },
        { label: 'Needs revision', value: '43', change: '-8.5%', note: '30 days', icon: FiRefreshCw, tone: 'red' },
      ]} />
      <Toolbar search={search} setSearch={setSearch} filters={[{ label: 'All statuses', value: status, onChange: setStatus, options: [...new Set(applications.map((item) => item.status))] }]} primaryAction={<Button icon={FiPlus}>New application</Button>} secondaryAction={<ExportButton />} />
      <DataTable columns={columns} rows={rows} onRowClick={setSelected} />
    </div>
  );
}

function PeoplePage({ owner = false, auditorsOnly = false, setSelected }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  let source = auditorsOnly ? people.filter((item) => /Auditor/.test(item.role)) : people;
  if (!owner && !auditorsOnly) source = people.filter((item) => item.role === 'Applicant');
  const rows = source.filter((item) => matching(item, search) && (!roleFilter || item.role === roleFilter));
  const columns = [
    { key: 'name', label: 'User', render: (value, row) => <PersonCell name={value} sub={row.email} /> },
    { key: 'role', label: 'Role', render: (value) => <Badge tone="blue">{value}</Badge> },
    { key: 'team', label: 'Team' },
    { key: 'workload', label: 'Workload', render: (value) => <div className="w-32"><ProgressBar value={value} label={`${value}%`} tone={value > 85 ? 'red' : value > 65 ? 'amber' : 'blue'} /></div> },
    { key: 'quality', label: 'Quality', render: (value) => <span className="font-bold text-slate-900">{value}%</span> },
    { key: 'status', label: 'Status', render: (value) => <Badge>{value}</Badge> },
    { key: 'lastActive', label: 'Last active' },
  ];
  return (
    <div className="space-y-5">
      <MetricGrid items={[
        { label: 'Total users', value: owner ? '1,472' : String(source.length), change: '+6.4%', note: 'this month', icon: FiUsers, tone: 'blue' },
        { label: 'Active now', value: owner ? '318' : String(source.filter((item) => item.status === 'Active').length), change: '+18', note: 'today', icon: FiUserCheck, tone: 'green' },
        { label: 'At capacity', value: owner ? '22' : String(source.filter((item) => item.workload > 85).length), change: '-3', note: 'today', icon: FiAlertTriangle, tone: 'amber' },
        { label: 'Average quality', value: '95.1%', change: '+1.4%', note: '30 days', icon: FiTarget, tone: 'purple' },
      ]} />
      <Toolbar search={search} setSearch={setSearch} filters={owner ? [{ label: 'All roles', value: roleFilter, onChange: setRoleFilter, options: [...new Set(people.map((item) => item.role))] }] : []} primaryAction={<Button icon={FiPlus}>Invite user</Button>} secondaryAction={<ExportButton />} />
      <DataTable columns={columns} rows={rows} onRowClick={setSelected} />
    </div>
  );
}

function TasksPage({ history = false, setSelected }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const source = history ? tasks.filter((item) => ['Approved', 'Ready for review'].includes(item.status)) : tasks;
  const rows = source.filter((item) => matching(item, search) && (!status || item.status === status));
  const columns = [
    { key: 'id', label: 'Task', render: (value, row) => <div><p className="font-bold text-blue-700">{value}</p><p className="mt-1 text-xs text-slate-400">{row.application}</p></div> },
    { key: 'company', label: 'Company & role', render: (value, row) => <div><p className="font-semibold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{row.role}</p></div> },
    { key: 'type', label: 'Deliverable' },
    { key: 'priority', label: 'Priority', render: (value) => <Badge>{value}</Badge> },
    { key: 'due', label: 'Due' },
    { key: 'progress', label: 'Progress', render: (value) => <div className="w-28"><ProgressBar value={value} label={`${value}%`} /></div> },
    { key: 'status', label: 'Status', render: (value) => <Badge>{value}</Badge> },
  ];
  return <div className="space-y-5"><Toolbar search={search} setSearch={setSearch} filters={[{ label: 'All statuses', value: status, onChange: setStatus, options: [...new Set(tasks.map((item) => item.status))] }]} /><DataTable columns={columns} rows={rows} onRowClick={setSelected} /></div>;
}

function AuditsPage({ setSelected, escalatedOnly = false }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const source = escalatedOnly ? escalations : audits;
  const rows = source.filter((item) => matching(item, search) && (!status || item.status === status));
  const columns = escalatedOnly ? [
    { key: 'id', label: 'Escalation', render: (value, row) => <div><p className="font-bold text-rose-700">{value}</p><p className="mt-1 text-xs text-slate-400">{row.application}</p></div> },
    { key: 'title', label: 'Issue', render: (value) => <p className="font-semibold text-slate-900">{value}</p> },
    { key: 'owner', label: 'Owner', render: (value) => <PersonCell name={value} /> },
    { key: 'severity', label: 'Severity', render: (value) => <Badge>{value}</Badge> },
    { key: 'age', label: 'Age' },
    { key: 'status', label: 'Status', render: (value) => <Badge>{value}</Badge> },
  ] : [
    { key: 'id', label: 'Audit', render: (value, row) => <div><p className="font-bold text-blue-700">{value}</p><p className="mt-1 text-xs text-slate-400">{row.application}</p></div> },
    { key: 'company', label: 'Company & role', render: (value, row) => <div><p className="font-semibold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{row.role}</p></div> },
    { key: 'engineer', label: 'Prompt engineer', render: (value) => <PersonCell name={value} /> },
    { key: 'submitted', label: 'Submitted' },
    { key: 'sla', label: 'SLA', render: (value) => <span className={value === 'Overdue' ? 'font-bold text-rose-600' : 'text-slate-700'}>{value}</span> },
    { key: 'risk', label: 'Risk', render: (value) => <Badge>{value}</Badge> },
    { key: 'status', label: 'Status', render: (value) => <Badge>{value}</Badge> },
  ];
  return <div className="space-y-5"><Toolbar search={search} setSearch={setSearch} filters={[{ label: 'All statuses', value: status, onChange: setStatus, options: [...new Set(source.map((item) => item.status))] }]} secondaryAction={<ExportButton />} /><DataTable columns={columns} rows={rows} onRowClick={setSelected} /></div>;
}

function QualityPage({ role }) {
  const isOwner = role === USER_ROLES.OWNER;
  return (
    <div className="space-y-6">
      <MetricGrid items={[
        { label: 'Overall quality', value: '96.4%', change: '+1.2%', note: '30 days', icon: FiTarget, tone: 'green' },
        { label: 'First-pass approval', value: '92.8%', change: '+2.6%', note: '30 days', icon: FiCheckCircle, tone: 'blue' },
        { label: 'Defect rate', value: '3.6%', change: '-1.2%', note: '30 days', icon: FiXCircle, tone: 'red' },
        { label: 'Open escalations', value: '7', change: '-3', note: 'this week', icon: FiAlertTriangle, tone: 'amber' },
      ]} />
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card><SectionHeading title="Quality trend" subtitle="Weekly quality and first-pass approval" /><Sparkline values={qualityTrend} height={250} /></Card>
        <Card><SectionHeading title="Defect categories" subtitle="Share of issues detected" /><div className="space-y-4">{[['Unsupported metrics', 38, 'red'], ['Weak job alignment', 27, 'amber'], ['Formatting errors', 18, 'blue'], ['Missing evidence', 11, 'purple'], ['Other', 6, 'green']].map(([label, value, tone]) => <ProgressBar key={label} label={label} value={value} tone={tone} />)}</div></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card><SectionHeading title="Quality by team" subtitle="Current rolling 30-day score" /><BarChart values={[97, 95, 94, 98, 92, 96]} labels={['Alpha', 'Beta', 'Gamma', 'Audit', 'PE North', 'PE South']} /></Card>
        <Card><SectionHeading title={isOwner ? 'Quality governance' : 'Recommended actions'} subtitle="Highest-impact improvements" /><div className="space-y-3">{['Run a calibration session on quantified-impact validation.', 'Review the two prompt templates with the highest revision rate.', 'Rebalance three overloaded auditors before tomorrow’s peak.', 'Publish the updated job-title tailoring rule.'].map((item, index) => <div key={item} className="flex gap-3 rounded-xl border border-slate-100 p-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{index + 1}</span><p className="text-sm leading-6 text-slate-600">{item}</p></div>)}</div></Card>
      </div>
    </div>
  );
}

function PerformancePage() {
  return (
    <div className="space-y-6">
      <MetricGrid items={[
        { label: 'Applications completed', value: '1,942', change: '+13.8%', note: '30 days', icon: FiBriefcase, tone: 'blue' },
        { label: 'Average turnaround', value: '54m', change: '-9m', note: 'faster', icon: FiClock, tone: 'green' },
        { label: 'Team utilization', value: '76%', change: '+4.2%', note: '30 days', icon: FiActivity, tone: 'amber' },
        { label: 'Interview rate', value: '18.6%', change: '+2.1%', note: '90 days', icon: FiTrendingUp, tone: 'purple' },
      ]} />
      <div className="grid gap-6 xl:grid-cols-2"><Card><SectionHeading title="Output by applicant" subtitle="Applications completed this month" /><BarChart values={[82, 76, 91, 69, 87, 73]} labels={['Amina', 'Chinedu', 'Lola', 'Maya', 'John', 'Tara']} /></Card><Card><SectionHeading title="Application outcome trend" subtitle="Interview and offer conversion" /><Sparkline values={[9, 11, 12, 10, 14, 15, 16, 18, 17, 19, 21, 22]} height={230} /></Card></div>
      <PeoplePage />
    </div>
  );
}

function ReportsPage() {
  const [generated, setGenerated] = useState('');
  return (
    <div className="space-y-6">
      <Card>
        <SectionHeading title="Create a report" subtitle="Choose a date range and export format" />
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Report type"><select className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option>Operations summary</option><option>Quality report</option><option>Performance report</option></select></Field>
          <Field label="Date range"><select className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option>Last 30 days</option><option>Last 90 days</option><option>Year to date</option></select></Field>
          <Field label="Format"><select className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option>PDF</option><option>CSV</option><option>XLSX</option></select></Field>
          <div className="flex items-end"><Button icon={FiDownload} className="w-full" onClick={() => setGenerated('Report generated successfully.')}>Generate report</Button></div>
        </div>
        {generated && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{generated}</p>}
      </Card>
      <div className="grid gap-5 md:grid-cols-2">
        {reports.map((report) => <Card key={report.title}><div className="flex items-start gap-4"><span className="rounded-xl bg-blue-50 p-3 text-blue-700"><FiFileText className="h-5 w-5" /></span><div className="flex-1"><h3 className="font-bold text-slate-900">{report.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{report.description}</p><div className="mt-4 flex items-center justify-between"><span className="text-xs text-slate-400">Last run {report.lastRun}</span><Button variant="secondary" icon={FiDownload}>{report.format}</Button></div></div></div></Card>)}
      </div>
    </div>
  );
}

function SubscriptionsPage() {
  const [search, setSearch] = useState('');
  const rows = subscriptions.filter((item) => matching(item, search));
  const columns = [
    { key: 'id', label: 'Subscription', render: (value) => <span className="font-bold text-blue-700">{value}</span> },
    { key: 'customer', label: 'Customer', render: (value) => <PersonCell name={value} /> },
    { key: 'plan', label: 'Plan', render: (value) => <Badge tone="purple">{value}</Badge> },
    { key: 'price', label: 'Monthly value', render: (value) => <span className="font-bold text-slate-900">{value}</span> },
    { key: 'renewal', label: 'Next renewal' },
    { key: 'usage', label: 'Usage', render: (value) => <div className="w-28"><ProgressBar value={value} label={`${value}%`} tone={value > 85 ? 'red' : 'blue'} /></div> },
    { key: 'status', label: 'Status', render: (value) => <Badge>{value}</Badge> },
  ];
  return <div className="space-y-5"><MetricGrid items={[{ label: 'MRR', value: '$21,850', change: '+11.4%', note: 'this month', icon: FiDollarSign, tone: 'green' }, { label: 'Active plans', value: '1,284', change: '+8.7%', note: 'this month', icon: FiCreditCard, tone: 'blue' }, { label: 'Renewals due', value: '146', change: '+12', note: 'next 7 days', icon: FiRefreshCw, tone: 'amber' }, { label: 'Past due', value: '19', change: '-4', note: 'this week', icon: FiAlertTriangle, tone: 'red' }]} /><Toolbar search={search} setSearch={setSearch} primaryAction={<Button icon={FiPlus}>Create plan</Button>} secondaryAction={<ExportButton />} /><DataTable columns={columns} rows={rows} /></div>;
}

function RevenuePage() {
  return <div className="space-y-6"><MetricGrid items={[{ label: 'Gross revenue', value: '$262,200', change: '+18.2%', note: 'year to date', icon: FiDollarSign, tone: 'green' }, { label: 'Net revenue', value: '$238,540', change: '+16.7%', note: 'year to date', icon: FiTrendingUp, tone: 'blue' }, { label: 'Average plan value', value: '$196', change: '+$8', note: 'this quarter', icon: FiCreditCard, tone: 'purple' }, { label: 'Failed payments', value: '1.4%', change: '-0.6%', note: 'this month', icon: FiXCircle, tone: 'red' }]} /><div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><Card><SectionHeading title="Revenue trend" subtitle="Monthly recurring revenue" /><Sparkline values={monthlyRevenue} height={260} /></Card><Card><SectionHeading title="Revenue by plan" subtitle="Current month" /><Donut value={61} label="Higher-tier revenue" sublabel="Standard and Premium generate 61% of monthly revenue." /><div className="mt-6 space-y-3">{[['Basic', 39, 'blue'], ['Standard', 35, 'purple'], ['Premium', 26, 'green']].map(([label, value, tone]) => <ProgressBar key={label} label={label} value={value} tone={tone} />)}</div></Card></div><Card><SectionHeading title="Monthly revenue" subtitle="Revenue by month" /><BarChart values={monthlyRevenue.slice(4).map((value) => Math.round(value / 1000))} labels={['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']} /></Card></div>;
}

function OperationsPage() {
  return <div className="space-y-6"><MetricGrid items={[{ label: 'Open work items', value: '247', change: '+17', note: 'today', icon: FiLayers, tone: 'blue' }, { label: 'Completed today', value: '312', change: '+14.6%', note: 'vs average', icon: FiCheckCircle, tone: 'green' }, { label: 'SLA compliance', value: '94.1%', change: '+1.7%', note: 'this week', icon: FiClock, tone: 'purple' }, { label: 'Blocked items', value: '11', change: '-5', note: 'today', icon: FiAlertTriangle, tone: 'red' }]} /><div className="grid gap-6 xl:grid-cols-2"><Card><SectionHeading title="Workflow capacity" subtitle="Workload by functional team" /><div className="space-y-4">{[['Applicant teams', 76, 'blue'], ['Prompt engineering', 68, 'purple'], ['Team audit', 83, 'amber'], ['Chief audit', 51, 'green']].map(([label, value, tone]) => <ProgressBar key={label} label={label} value={value} tone={tone} />)}</div></Card><Card><SectionHeading title="Operational activity" subtitle="Latest workflow changes" /><ActivityList /></Card></div><ApplicationsPage role={USER_ROLES.OWNER} /></div>;
}

function MessagesPage() {
  const [active, setActive] = useState(messages[0]);
  const [draft, setDraft] = useState('');
  return <div className="grid min-h-[650px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[330px_1fr]"><aside className="border-b border-slate-200 lg:border-b-0 lg:border-r"><div className="border-b border-slate-100 p-4"><input className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" placeholder="Search messages" /></div>{messages.map((message) => <button key={message.id} onClick={() => setActive(message)} className={`flex w-full gap-3 border-b border-slate-100 p-4 text-left ${active.id === message.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}><Avatar name={message.name} /><span className="min-w-0 flex-1"><span className="flex items-center justify-between"><span className="font-bold text-slate-900">{message.name}</span><span className="text-[10px] text-slate-400">{message.time}</span></span><span className="mt-1 block truncate text-xs text-slate-500">{message.preview}</span></span>{message.unread > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-700 text-[10px] font-bold text-white">{message.unread}</span>}</button>)}</aside><section className="flex min-h-[500px] flex-col"><div className="flex items-center gap-3 border-b border-slate-100 p-5"><Avatar name={active.name} /><div><p className="font-bold">{active.name}</p><p className="text-xs text-slate-400">{active.role}</p></div></div><div className="flex-1 space-y-4 bg-slate-50/60 p-6"><div className="max-w-lg rounded-2xl rounded-tl-sm bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">{active.preview}</div><div className="ml-auto max-w-lg rounded-2xl rounded-tr-sm bg-blue-700 p-4 text-sm leading-6 text-white">Thanks. I am reviewing it now and will send the updated version shortly.</div></div><div className="flex gap-3 border-t border-slate-100 p-4"><input value={draft} onChange={(event) => setDraft(event.target.value)} className="h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm" placeholder="Write a message" /><Button icon={FiSend} onClick={() => setDraft('')}>Send</Button></div></section></div>;
}

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  return <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]"><Card><SectionHeading title="Platform configuration" subtitle="Global ApplyLoop controls" /><div className="space-y-2">{['General', 'Applications', 'Quality rules', 'Notifications', 'Billing', 'Security'].map((label, index) => <button key={label} className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold ${index === 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>{label}</button>)}</div></Card><Card><SectionHeading title="General settings" subtitle="Core platform preferences" /><div className="grid gap-5 md:grid-cols-2"><Field label="Platform name"><input defaultValue="ApplyLoop" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></Field><Field label="Support email"><input defaultValue="support@applyloop.com" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></Field><Field label="Default time zone"><select className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option>West Africa Time (UTC+1)</option><option>Eastern Time</option></select></Field><Field label="Default currency"><select className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option>USD ($)</option><option>NGN (₦)</option></select></Field></div><div className="mt-6 space-y-3">{[['Allow new applicant registrations', true], ['Require audit before final submission', true], ['Enable automated status email', true], ['Maintenance mode', false]].map(([label, checked]) => <label key={label} className="flex items-center justify-between rounded-xl border border-slate-100 p-4"><span className="text-sm font-semibold text-slate-700">{label}</span><input type="checkbox" defaultChecked={checked} className="h-5 w-5 accent-blue-700" /></label>)}</div><div className="mt-6 flex items-center justify-end gap-3">{saved && <span className="text-sm font-semibold text-emerald-600">Changes saved.</span>}<Button onClick={() => setSaved(true)}>Save changes</Button></div></Card></div>;
}

function ActivityPage() {
  return <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"><Card><SectionHeading title="Activity timeline" subtitle="All recent workspace events" /><ActivityList limit={activity.length} /></Card><Card><SectionHeading title="Activity summary" subtitle="Last 24 hours" /><div className="space-y-4">{[['Applications created', 89, 'blue'], ['Tasks completed', 74, 'green'], ['Audits completed', 68, 'purple'], ['Revisions requested', 12, 'amber']].map(([label, value, tone]) => <ProgressBar key={label} label={label} value={value} tone={tone} />)}</div></Card></div>;
}

function DetailModal({ item, role, onClose }) {
  const [note, setNote] = useState('');
  const isTask = item?.id?.startsWith('TSK');
  const isAudit = item?.id?.startsWith('AUD') || item?.id?.startsWith('ESC');
  const isPerson = item?.id?.startsWith('USR');
  return (
    <Modal open={Boolean(item)} onClose={onClose} title={isTask ? 'Prompt task workspace' : isAudit ? 'Quality review' : isPerson ? 'User details' : 'Application details'} width="max-w-3xl" footer={<><Button variant="secondary" onClick={onClose}>Close</Button>{isTask && <Button variant="success" icon={FiSend} onClick={onClose}>Submit for audit</Button>}{isAudit && <><Button variant="danger" icon={FiRefreshCw}>Request revision</Button><Button variant="success" icon={FiCheckCircle} onClick={onClose}>Approve</Button></>}{!isTask && !isAudit && !isPerson && <Button icon={FiEdit3}>Edit assignment</Button>}</>}>
      {item && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">{item.id}</p><h3 className="mt-2 text-xl font-extrabold text-slate-950">{item.company || item.name || item.title}</h3><p className="mt-1 text-sm text-slate-500">{item.role || item.position || item.application || item.email}</p></div>
            <Badge>{item.status || item.priority || item.severity}</Badge>
          </div>
          {(isTask || isAudit) && <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl border border-slate-100 p-4"><p className="text-xs text-slate-400">Quality score</p><p className="mt-2 text-2xl font-extrabold">{item.quality || item.score || 92}%</p></div><div className="rounded-xl border border-slate-100 p-4"><p className="text-xs text-slate-400">Priority</p><p className="mt-2 font-bold">{item.priority || item.risk || item.severity}</p></div><div className="rounded-xl border border-slate-100 p-4"><p className="text-xs text-slate-400">Deadline / SLA</p><p className="mt-2 font-bold">{item.due || item.sla || item.age}</p></div></div>}
          {isTask && <><div className="grid gap-5 lg:grid-cols-2"><Field label="Job description"><textarea rows="10" defaultValue="We are seeking a Product Manager who can lead discovery, define product strategy, coordinate cross-functional delivery, and use customer and performance data to drive measurable outcomes." className="w-full rounded-xl border border-slate-200 p-4 text-sm leading-6" /></Field><Field label="Generated prompt"><textarea rows="10" defaultValue="Tailor the candidate resume to the Product Manager role. Preserve factual employer and date information, prioritize end-to-end lifecycle ownership, and use credible quantified impact without inventing unsupported claims." className="w-full rounded-xl border border-slate-200 p-4 text-sm leading-6" /></Field></div><Field label="Working notes"><textarea rows="4" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add notes for the auditor…" className="w-full rounded-xl border border-slate-200 p-4 text-sm" /></Field></>}
          {isAudit && <><div className="space-y-3">{[['Job alignment', 96], ['Factual consistency', 91], ['Writing quality', 94], ['Formatting and ATS', 98]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 p-4"><ProgressBar label={label} value={value} tone={value < 90 ? 'amber' : 'green'} /></div>)}</div><Field label="Audit feedback"><textarea rows="5" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Document the decision and any required changes…" className="w-full rounded-xl border border-slate-200 p-4 text-sm" /></Field></>}
          {isPerson && <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-slate-100 p-4"><p className="text-xs text-slate-400">Role</p><p className="mt-2 font-bold">{item.role}</p></div><div className="rounded-xl border border-slate-100 p-4"><p className="text-xs text-slate-400">Team</p><p className="mt-2 font-bold">{item.team}</p></div><div className="rounded-xl border border-slate-100 p-4"><ProgressBar label="Workload" value={item.workload} /></div><div className="rounded-xl border border-slate-100 p-4"><ProgressBar label="Quality" value={item.quality} tone="green" /></div></div>}
          {!isTask && !isAudit && !isPerson && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[['Applicant', item.applicant], ['Prompt engineer', item.promptEngineer], ['Auditor', item.auditor], ['Country', item.country], ['Quality score', `${item.score}%`], ['Last updated', item.updated]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 font-bold text-slate-900">{value}</p></div>)}</div>}
        </div>
      )}
    </Modal>
  );
}

export default function RolePortal({ role }) {
  const router = useRouter();
  const section = sectionFromRouter(router);
  const [selected, setSelected] = useState(null);

  const page = useMemo(() => {
    if (section === 'dashboard') {
      if (role === USER_ROLES.CHIEF_APPLICANT) return <ChiefApplicantDashboard setSelected={setSelected} />;
      if (role === USER_ROLES.PROMPT_ENGINEER) return <PromptEngineerDashboard setSelected={setSelected} />;
      if (role === USER_ROLES.TEAM_AUDITOR) return <AuditorDashboard setSelected={setSelected} />;
      if (role === USER_ROLES.CHIEF_AUDITOR) return <AuditorDashboard chief setSelected={setSelected} />;
      if (role === USER_ROLES.OWNER) return <OwnerDashboard />;
    }

    if (section === 'applications') return <ApplicationsPage role={role} setSelected={setSelected} />;
    if (section === 'applicants') return <PeoplePage setSelected={setSelected} />;
    if (section === 'users') return <PeoplePage owner setSelected={setSelected} />;
    if (section === 'auditors') return <PeoplePage auditorsOnly setSelected={setSelected} />;
    if (section === 'tasks') return <TasksPage setSelected={setSelected} />;
    if (section === 'history') return <TasksPage history setSelected={setSelected} />;
    if (section === 'queue' || section === 'audits' || section === 'reviews') return role === USER_ROLES.CHIEF_APPLICANT ? <ApplicationsPage role={role} setSelected={setSelected} /> : <AuditsPage setSelected={setSelected} />;
    if (section === 'escalations') return <AuditsPage escalatedOnly setSelected={setSelected} />;
    if (section === 'quality' || section === 'insights') return <QualityPage role={role} />;
    if (section === 'performance') return <PerformancePage />;
    if (section === 'reports') return <ReportsPage />;
    if (section === 'subscriptions') return <SubscriptionsPage />;
    if (section === 'revenue') return <RevenuePage />;
    if (section === 'operations') return <OperationsPage />;
    if (section === 'messages') return <MessagesPage />;
    if (section === 'settings') return <SettingsPage />;
    if (section === 'activity') return <ActivityPage />;
    return <Card><div className="py-20 text-center"><FiFlag className="mx-auto h-10 w-10 text-blue-600" /><h2 className="mt-4 text-xl font-extrabold">Page ready for configuration</h2><p className="mt-2 text-sm text-slate-500">This route is part of the shared ApplyLoop portal foundation.</p></div></Card>;
  }, [role, section]);

  return <RoleLayout role={role}>{page}<DetailModal item={selected} role={role} onClose={() => setSelected(null)} /></RoleLayout>;
}
