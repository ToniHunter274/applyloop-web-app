import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiAward,
  FiBell,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCopy,
  FiDownload,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiHome,
  FiLink,
  FiLock,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiSend,
  FiSettings,
  FiTarget,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../shared/context/AuthContext';
import { getRoleHome, USER_ROLES } from '../../shared/config/roles';
import {
  ADMIN_FEEDBACK,
  APPLICANT_APPLICATIONS,
  APPLICANT_CLIENTS,
  CLIENT_FEEDBACK,
  LINK_SOURCE_OPTIONS,
  PERFORMANCE_PERIODS,
  STATUS_OPTIONS,
} from '../../data/applicantData';
import styles from './ApplicantPortal.module.css';

async function getAccessToken() {
  const supabase = createClient();

  if (!supabase) {
    throw new Error('The Supabase connection is unavailable.');
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  return session.access_token;
}

const NAVIGATION = [
  { section: 'dashboard', label: 'Dashboard', icon: FiHome, href: '/applicant' },
  { section: 'clients', label: 'My Clients', icon: FiUsers, href: '/applicant/clients' },
  { section: 'workshop', label: 'Workshop', icon: FiMessageSquare, href: '/applicant/workshop' },
  { section: 'feedback', label: 'Feedback and Messages', icon: FiMessageSquare, href: '/applicant/feedback' },
  { section: 'performance', label: 'Performance', icon: FiTrendingUp, href: '/applicant/performance' },
  { section: 'settings', label: 'Settings', icon: FiSettings, href: '/applicant/settings' },
];

const classNames = (...values) => values.filter(Boolean).join(' ');

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'AL';

const getParts = (router) => {
  const section = router.query?.section;
  return Array.isArray(section) ? section : section ? [section] : [];
};

const getStatusClass = (status) => {
  if (status === 'Interview Scheduled') return styles.statusInterview;
  if (status === 'Waiting') return styles.statusWaiting;
  if (status === 'Offer Received') return styles.statusOffer;
  if (status === 'Rejected') return styles.statusRejected;
  return styles.statusSubmitted;
};

const createApplicationRecords = () => {
  const companies = ['Google', 'Meta', 'Amazon', 'Apple', 'Microsoft', 'Shopify', 'HubSpot', 'Atlassian'];
  return Array.from({ length: 48 }, (_, index) => {
    const seed = APPLICANT_APPLICATIONS[index % APPLICANT_APPLICATIONS.length];
    const day = 18 - Math.floor(index / 8);
    return {
      ...seed,
      id: index < APPLICANT_APPLICATIONS.length ? seed.id : `application-${String(index + 1).padStart(3, '0')}`,
      company: index < APPLICANT_APPLICATIONS.length ? seed.company : companies[index % companies.length],
      date: index < APPLICANT_APPLICATIONS.length ? seed.date : `Feb ${Math.max(day, 1)}, 2026`,
      status: STATUS_OPTIONS[index % STATUS_OPTIONS.length],
      linkSource: LINK_SOURCE_OPTIONS[index % LINK_SOURCE_OPTIONS.length],
    };
  });
};

const mapAssignedClient = (client) => ({
  id: client.id,
  name: client.fullName,
  role: client.assignedTeam || client.planLabel || 'Client',
  email: client.email,
  phone: client.phone,
  nationality: client.country || '',
  state: '',
  gender: client.gender || '',
  disability: 'N/A',
  veteran: 'N/A',
  workType: '',
  schedule: client.timezone || '',
  contract: '',
  locations: client.country ? [client.country] : [],
  targetCountries: client.country || '',
  progress: client.onboarding?.progressPercent || 0,
  rejectedRoles: 0,
  interviews: client.interviews || 0,
  feedbacks: 0,
  offers: 0,
  applications: client.applicationsCompleted || 0,
  status: client.status,
  notes: client.notes || '',
  plan: client.plan,
  priority: client.priority,
  hasResume: client.hasResume,
  resumeFilename: client.resumeFilename,
});

function Avatar({ name, large = false }) {
  return <span className={large ? styles.avatarLarge : styles.avatar}>{initials(name)}</span>;
}

function NotificationButton() {
  return (
    <button type="button" className={styles.notification} aria-label="Notifications">
      <FiBell />
    </button>
  );
}

function ApplicantShell({ section, children }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className={styles.app}>
      <div className={styles.shell}>
        {mobileOpen && <button type="button" aria-label="Close menu" className={styles.backdrop} onClick={() => setMobileOpen(false)} />}
        <aside className={classNames(styles.sidebar, mobileOpen && styles.sidebarOpen)}>
          <Link href="/applicant" className={styles.brand} onClick={() => setMobileOpen(false)}>
            <img src="/logo.svg" alt="ApplyLoop" className={styles.brandLogo} />
            <span>ApplyLoop</span>
          </Link>
          <nav className={styles.navigation}>
            {NAVIGATION.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.section}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={classNames(styles.navLink, section === item.section && styles.navLinkActive)}
                >
                  <Icon className={styles.navIcon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className={styles.profileWrap}>
            <button type="button" className={styles.profile} onClick={() => setProfileOpen((value) => !value)}>
              <Avatar name={user?.name || 'Olabanji David T.'} />
              <span className={styles.profileText}>
                <span className={styles.profileName}>{user?.name || 'Olabanji David T.'}</span>
                <span className={styles.profileEmail}>{user?.email || 'banjidhevid216@gmail.com'}</span>
              </span>
            </button>
            {profileOpen && (
              <div className={styles.profileMenu}>
                <button type="button" onClick={logout}><FiLogOut /> Sign out</button>
              </div>
            )}
          </div>
        </aside>

        <div className={styles.mainRail}>
          <div className={styles.mobileBar}>
            <button type="button" aria-label="Open menu" onClick={() => setMobileOpen(true)}><FiMenu size={22} /></button>
            <span>ApplyLoop</span>
            <NotificationButton />
          </div>
          <main className={styles.pageSurface}>{children}</main>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, searchable = false, search = '', onSearch, action }) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeading}>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className={styles.headerActions}>
        {searchable && (
          <label className={styles.searchBox}>
            <FiSearch />
            <input value={search} onChange={(event) => onSearch?.(event.target.value)} placeholder="Search Applications" />
          </label>
        )}
        {action}
        <NotificationButton />
      </div>
    </div>
  );
}

function StatCard({ label, value, foot, positive = false, warning = false }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      {foot && <div className={classNames(styles.statFoot, positive && styles.statPositive, warning && styles.statWarning)}>{foot}</div>}
    </div>
  );
}

function ApplicationTable({ records, onChangeRecord, onOpen, search, clientFilter }) {
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesQuery = !query || [record.client, record.company, record.position, record.location, record.status, record.linkSource]
        .some((value) => String(value).toLowerCase().includes(query));
      const matchesClient = !clientFilter || record.clientId === clientFilter;
      return matchesQuery && matchesClient;
    });
  }, [clientFilter, records, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, clientFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, index) => index + 1);
    if (safePage <= 3) return [1, 2, 3, 'ellipsis', totalPages];
    if (safePage >= totalPages - 2) return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages];
    return [1, 'ellipsis', safePage, 'ellipsis-2', totalPages];
  }, [safePage, totalPages]);

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.applicationTable}>
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '13%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Client</th>
              <th>Company</th>
              <th>Position</th>
              <th>Location</th>
              <th>Date</th>
              <th>Status</th>
              <th>Link Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((record) => (
              <tr key={record.id} onClick={() => onOpen(record)}>
                <td>{record.client}</td>
                <td>{record.company}</td>
                <td>{record.position}</td>
                <td>{record.location}</td>
                <td>{record.date}</td>
                <td>
                  <select
                    aria-label={`Status for ${record.company}`}
                    value={record.status}
                    className={classNames(styles.statusSelect, getStatusClass(record.status))}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => onChangeRecord(record.id, { status: event.target.value })}
                  >
                    {STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </td>
                <td>
                  <div className={styles.sourceCell}>
                    <select
                      aria-label={`Link source for ${record.company}`}
                      value={record.linkSource}
                      className={styles.sourceSelect}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => onChangeRecord(record.id, { linkSource: event.target.value })}
                    >
                      {LINK_SOURCE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                    </select>
                    <button type="button" className={styles.rowLinkButton} aria-label={`Open ${record.company} application`} onClick={(event) => { event.stopPropagation(); onOpen(record); }}>
                      <FiExternalLink />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={7} style={{ height: 120, textAlign: 'center', color: '#8b919a' }}>No client application records match this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.pagination}>
        <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><FiChevronLeft /></button>
        {visiblePages.map((item) => typeof item === 'number'
          ? <button type="button" key={item} className={item === safePage ? styles.paginationActive : ''} onClick={() => setPage(item)}>{item}</button>
          : <span key={item}>…</span>)}
        <button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><FiChevronRight /></button>
      </div>
    </>
  );
}

function Dashboard({ applications, onChangeRecord, onOpenApplication }) {
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Welcome back! Here’s your overview for today." searchable search={search} onSearch={setSearch} />
      <div className={styles.statsGrid}>
        <StatCard label="Total Clients" value="12" />
        <StatCard label="Active Clients" value="9" />
        <StatCard label="Completed Applications" value="120" />
        <StatCard label="Client Feedback" value="5" />
      </div>
      <div className={styles.sectionTitleRow}>
        <h2 className={styles.sectionTitle}>All Assigned Clients</h2>
        <select className={styles.selectPlain} value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
          <option value="">Select Client</option>
          {APPLICANT_CLIENTS.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
        </select>
      </div>
      <ApplicationTable
        records={applications}
        search={search}
        clientFilter={clientFilter}
        onChangeRecord={onChangeRecord}
        onOpen={onOpenApplication}
      />
    </>
  );
}

function ClientCard({ client, onOpen }) {
  return (
    <article className={styles.clientCard}>
      <h3 className={styles.clientName}>{client.name}</h3>
      <p className={styles.clientRole}>{client.role}</p>
      <div className={styles.progressHeader}><span>Application Progress</span><span>{client.progress}/100</span></div>
      <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${client.progress}%` }} /></div>
      <div className={styles.clientFacts}>
        <span>Rejected Roles:</span><span>{client.rejectedRoles}</span>
        <span>Client Feedback:</span><span>{client.feedbacks ?? 2}</span>
        <span>Job Offers:</span><span>{client.offers}</span>
        <span>Target Countries:</span><span>{client.targetCountries}</span>
      </div>
      <div className={styles.cardFooter}>
        <button type="button" className={styles.textButton} onClick={() => onOpen(client)}>View Details <FiArrowRight /></button>
      </div>
    </article>
  );
}

function ClientsPage({ clients, onOpenClient }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const visible = useMemo(() => clients.filter((client) => {
    const query = search.trim().toLowerCase();
    const match = !query || `${client.name} ${client.role}`.toLowerCase().includes(query);
    const tabMatch = tab === 'all' || (tab === 'inactive' ? ['paused', 'completed'].includes(client.status) : client.status === tab);
    return match && tabMatch;
  }), [clients, search, tab]);

  return (
    <>
      <PageHeader title="Assigned Clients" subtitle="Welcome back! Here’s your overview for today." />
      <div className={styles.statsGrid}>
        <StatCard label="Total Clients" value="4" />
        <StatCard label="Total Applications" value="50" />
        <StatCard label="Completed Applications" value="12" />
        <StatCard label="Client Feedback" value="5" />
      </div>
      <label className={styles.toolbarSearch}>
        <FiSearch />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Clients" />
      </label>
      <div className={styles.tabs}>
        <button type="button" className={classNames(styles.tab, tab === 'all' && styles.tabActive)} onClick={() => setTab('all')}>All Clients (10)</button>
        <button type="button" className={classNames(styles.tab, tab === 'active' && styles.tabActive)} onClick={() => setTab('active')}>Active Clients (4)</button>
        <button type="button" className={classNames(styles.tab, tab === 'inactive' && styles.tabActive)} onClick={() => setTab('inactive')}>Inactive Clients</button>
      </div>
      <div className={styles.clientGrid}>
        {visible.map((client) => <ClientCard key={client.id} client={client} onOpen={onOpenClient} />)}
      </div>
    </>
  );
}

function ReadonlyField({ label, value, copy = false }) {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      <div className={copy ? styles.fieldWithIcon : undefined}>
        <input readOnly value={value || ''} />
        {copy && <FiCopy />}
      </div>
    </div>
  );
}

function ClientDetail({ client, onBack }) {
  return (
    <>
      <div className={styles.detailHeader}>
        <div className={styles.detailTitleGroup}>
          <button type="button" className={styles.backButton} onClick={onBack}><FiArrowLeft /></button>
          <div>
            <h1 className={styles.detailTitle}>{client.name}</h1>
            <p className={styles.detailSubtitle}>{client.role}</p>
          </div>
        </div>
        <NotificationButton />
      </div>
      <div className={classNames(styles.statsGrid, styles.statsGridFive)}>
        <StatCard label="Total Applications" value={`${client.applications}/100`} />
        <StatCard label="Upcoming Interviews" value={client.interviews} />
        <StatCard label="Total Rejected Roles" value={client.rejectedRoles} />
        <StatCard label="Total Selected Roles" value={client.selectedRoles ?? 3} />
        <StatCard label="Feedbacks" value="2" />
      </div>
      <section className={styles.readiness}>
        <div className={styles.readinessHead}><h3>Client Dashboard Readiness</h3><span className={styles.setupTag}>Setup Required</span></div>
        <div className={styles.readinessGrid}>
          <div className={styles.readinessItem}>
            <div className={styles.readinessTitle}><FiCheckCircle color="#1f56c6" /> Resume</div>
            <p>Current resume version available</p>
          </div>
          <div className={styles.readinessItem}>
            <div className={styles.readinessTitle}><FiTarget color="#1f56c6" /> Tracker</div>
            <p>Application tracking system active</p>
          </div>
          <div className={classNames(styles.readinessItem, styles.readinessDanger)}>
            <div className={styles.readinessTitle}><FiAlertCircle color="#e12b49" /> Prompt Available</div>
            <p>AI prompt template needs setup</p>
          </div>
        </div>
      </section>
      <div className={styles.formGrid}>
        <ReadonlyField label="Full Name" value={`${client.name} T.`} copy />
        <ReadonlyField label="Gender" value={client.gender} />
        <ReadonlyField label="Email Address" value={client.email} copy />
        <ReadonlyField label="Phone Number" value={client.phone} copy />
        <ReadonlyField label="Nationality" value={client.nationality} />
        <ReadonlyField label="State/Province" value={client.state} />
        <ReadonlyField label="Disability" value={client.disability} />
        <ReadonlyField label="Veteran" value={client.veteran} />
      </div>
      <section className={styles.formSection}>
        <h3>Work Availability</h3>
        <div className={styles.formGrid}>
          <ReadonlyField label="Work Type" value={client.workType} />
          <ReadonlyField label="Work Schedule Preference" value={client.schedule} />
          <ReadonlyField label="Duration of Contract" value={client.contract} />
          <div className={styles.field}>
            <label>Location Preferences</label>
            <div className={styles.locationPills}>{client.locations.map((location) => <span key={location}>{location}</span>)}</div>
          </div>
        </div>
      </section>
      <section className={styles.noteBlock}>
        <div className={styles.noteTitle}><FiFileText /> Notes from Admin</div>
        <p>{client.notes}</p>
      </section>
    </>
  );
}

function PdfDocument({ name }) {
  return (
    <div className={styles.pdfDocument}>
      <div className={styles.pdfSheet}><span className={styles.pdfBadge}>PDF</span></div>
      <p>{name}</p>
    </div>
  );
}

function ApplicationDetail({ application, onBack }) {
  return (
    <div className={styles.applicationDetail}>
      <div className={styles.detailHeader}>
        <div className={styles.applicationIntro}>
          <h1>Job Application ({application.company})</h1>
          <p>Track your applications, monitor progress, and stay in control of your job search.</p>
        </div>
        <NotificationButton />
      </div>
      <button type="button" className={styles.textButton} style={{ marginBottom: 17 }} onClick={onBack}><FiArrowLeft /> Back to client</button>
      <dl className={styles.applicationMeta}>
        <dt><FiRefreshCw /> Status</dt><dd><span className={classNames(styles.statusSelect, getStatusClass(application.status))}>{application.status}</span></dd>
        <dt><FiBriefcase /> Role</dt><dd>{application.role}</dd>
        <dt><FiCalendar /> Date</dt><dd>{application.date}</dd>
        <dt><FiClock /> Application Time</dt><dd>{application.applicationTime}</dd>
        <dt><FiTarget /> Preferences</dt>
        <dd className={styles.preferenceTags}>
          {(application.preferences || []).map((item, index) => <span key={item} className={classNames(styles.preferenceTag, index === 0 ? styles.preferenceBlue : index === 1 ? styles.preferencePurple : styles.preferenceYellow)}>{item}</span>)}
        </dd>
        <dt><FiLink /> Job Link</dt><dd><u>{application.jobLink}</u></dd>
      </dl>
      <div className={styles.documentRow}>
        <PdfDocument name="Submitted Resume.pdf" />
        <PdfDocument name="Submitted Cover letter.pdf" />
      </div>
      <section className={styles.copySection}>
        <h3>Job Details</h3>
        <ul>
          <li>Work with team members to develop streamlined user experience processes.</li>
          <li>Proactively pursue opportunities to improve the strategy to better address client and user objectives.</li>
          <li>Capable of defining consumers, processes, and ideas from an objective point of view based on research and insight.</li>
          <li>Communicate this point of view with senior management on both the agency and client sides.</li>
          <li>Take personal responsibility for on-time deliverables.</li>
          <li>Actively educate internal groups about user experience and provide a significant contribution to client relationships.</li>
          <li>Be an advocate on behalf of user experience within the agency at large.</li>
          <li>Adept at utilizing AI tools to inform and streamline their design process, from research to prototyping.</li>
          <li>Experience working within or contributing to white-label design systems.</li>
        </ul>
      </section>
      <section className={styles.copySection}>
        <h3>Qualities and Characteristics</h3>
        <ul>
          <li>A portfolio of work demonstrating experience designing complex systems across multiple platforms, including mobile and touch-based interfaces.</li>
          <li>A minimum of 3 years’ experience in experience and interaction design, and a thorough understanding of existing interaction design patterns across web, mobile, and other digital platforms.</li>
          <li>Proficiency using user-centric design processes and designing for user needs based on research.</li>
          <li>Excellent knowledge of Figma, including setting up and utilizing Figma libraries.</li>
          <li>Strong proficiency with leading industry-standard UX design and prototyping tools.</li>
        </ul>
      </section>
      <section className={styles.copySection}>
        <h3>Other Details</h3>
        <ul>
          <li>Remote (United States only) position.</li>
          <li>Available during normal business hours, US Eastern Time Zone.</li>
          <li>Full-time work schedule (40hrs/wk).</li>
          <li>Anticipated weekly pay range between $2,600–$2,800.</li>
        </ul>
      </section>
    </div>
  );
}

function ScoreCard({ label, value, note, state, icon: Icon }) {
  return (
    <div className={classNames(styles.scoreCard, state === 'green' && styles.scoreGreen, state === 'red' && styles.scoreRed)}>
      <div>
        <div className={styles.scoreLabel}>{label}</div>
        <div className={styles.scoreValue}>{value}%</div>
        <div className={styles.scoreNote}>{note}</div>
      </div>
      <Icon className={styles.scoreIcon} />
    </div>
  );
}

function WorkshopPage({ onRecordApplication, onPreview }) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysisState, setAnalysisState] = useState('neutral');
  const [processing, setProcessing] = useState(false);
  const selectedClient = APPLICANT_CLIENTS.find((client) => client.id === selectedClientId);
  const score = analysisState === 'green' ? { resume: 80, fit: 100 } : { resume: 0, fit: 0 };

  const runAnalysis = () => {
    const goodMatch = jobDescription.trim().length > 30 || /software|product|remote|design/i.test(jobDescription);
    setAnalysisState(goodMatch ? 'green' : 'red');
  };

  const generate = (type) => {
    if (!selectedClient) return;
    setProcessing(true);
    window.setTimeout(() => {
      setProcessing(false);
      setAnalysisState('green');
      onPreview(type);
    }, 1300);
  };

  return (
    <>
      <PageHeader
        title="Prompt Center"
        subtitle="Analyze job fit, generate tailored resumes and cover letters"
        action={selectedClient ? <button type="button" className={styles.primaryButton} onClick={() => onRecordApplication(selectedClient, jobUrl, jobDescription)}><FiSave /> Record Application</button> : null}
      />
      <section className={styles.workshopPanel}>
        <div className={styles.clientSelector}>
          <label className={styles.fieldLabel}>Select Client</label>
          <select value={selectedClientId} onChange={(event) => { setSelectedClientId(event.target.value); setAnalysisState('neutral'); }}>
            <option value="">Select a client</option>
            {APPLICANT_CLIENTS.slice(0, 4).map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </div>
        {selectedClient && (
          <div className={styles.selectedClient}>
            <Avatar name={selectedClient.name} />
            <div className={styles.selectedClientInfo}>
              <strong>{selectedClient.name}</strong>
              <p>{selectedClient.role} · Remote</p>
              <p>Job Type: Full-time | Location: Remote | Salary: $40k–$70k | Industry: Technology | Role DevOps Engineer | Experience: 6+ years | Skills: Kubernetes, Docker, AWS, Terraform</p>
            </div>
            <button type="button" className={styles.resumeLink} onClick={() => onPreview('resume')}>Client’s Resume</button>
          </div>
        )}
      </section>

      {!selectedClient ? (
        <section className={styles.workshopPanel}>
          <div className={styles.emptyWorkshop}>
            <FiUser />
            <h3>No Client Selected</h3>
            <p>Select a client above to load their preferences, resume, and analyze job fit.</p>
          </div>
        </section>
      ) : (
        <>
          {processing && (
            <div className={styles.processingList}>
              <div className={styles.processingItem}>
                <div className={styles.processingHead}><span>Request Processing</span><span>Ongoing</span></div>
                <div className={styles.processingBar}><div className={styles.processingFill} /></div>
              </div>
              <div className={styles.processingItem}>
                <div className={styles.processingHead}><span>Request Processing</span><span>Ongoing</span></div>
                <div className={styles.processingBar}><div className={styles.processingFill} /></div>
              </div>
            </div>
          )}
          <div className={styles.scoreGrid}>
            <ScoreCard label="Resume Match Score" value={score.resume} note="Based on skills & experience alignment" state={analysisState} icon={FiTarget} />
            <ScoreCard label="Applicability Score" value={score.fit} note="Based on client preferences vs job" state={analysisState} icon={FiBriefcase} />
          </div>
          <div className={styles.field} style={{ marginBottom: 14 }}>
            <label>Job Posting URL</label>
            <input value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} placeholder="https://..." />
          </div>
          <div className={styles.field}>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}><span>Job Description</span><button type="button" className={styles.resumeLink} onClick={runAnalysis}>Analyze Job Fit</button></label>
            <textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Job Title: Software Engineer (Remote)" />
          </div>
          <div className={styles.analysisGrid}>
            <div className={styles.analysisBox}>
              <div className={styles.analysisTitle}><FiTarget color="#18a66d" /> Resume Analysis</div>
              <ul className={styles.analysisList}>
                <li className={styles.analysisGood}>Matching Skills</li>
                <li>• Python</li><li>• AWS</li><li>• Docker</li><li>• Kubernetes</li>
                <li className={styles.analysisWarn}>Skills to Highlight</li>
                <li>• React</li><li>• Agile</li><li>• Node</li>
              </ul>
            </div>
            <div className={styles.analysisBox}>
              <div className={styles.analysisTitle}><FiTrendingUp color="#18a66d" /> Preference Alignment</div>
              <ul className={styles.analysisList}>
                <li className={styles.analysisGood}>Matches</li>
                <li>• Location: Remote match</li>
                <li>• Role: Software Engineer match found</li>
              </ul>
            </div>
          </div>
          <section className={styles.generatePanel}>
            <h3>Generate Documents</h3>
            <div className={styles.generateButtons}>
              <button type="button" className={classNames(styles.generateButton, styles.generateButtonActive)} onClick={() => generate('resume')}><FiFileText /> Generate Tailored Resume</button>
              <button type="button" className={styles.generateButton} onClick={() => generate('cover')}><FiFileText /> Generate Cover Letter</button>
            </div>
            <div className={styles.recommendation}>
              <strong>Recommendation:</strong>
              <p>{analysisState === 'green' ? 'Very good match. This job aligns with client preferences.' : 'Low match. This job may not align with client preferences. Consider discussing with the client before applying.'}</p>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function FeedbackPage() {
  const [tab, setTab] = useState('client');
  const [selectedId, setSelectedId] = useState(ADMIN_FEEDBACK[0].id);
  const [response, setResponse] = useState('');
  const [sent, setSent] = useState(false);
  const selected = ADMIN_FEEDBACK.find((item) => item.id === selectedId) || ADMIN_FEEDBACK[0];

  return (
    <>
      <PageHeader title="Feedback & Messages" subtitle="Review and respond to feedback from clients and admins" />
      <div className={styles.feedbackTabs}>
        <button type="button" className={classNames(styles.tab, tab === 'client' && styles.tabActive)} onClick={() => setTab('client')}>Client Feedback (2)</button>
        <button type="button" className={classNames(styles.tab, tab === 'admin' && styles.tabActive)} onClick={() => setTab('admin')}>Admin Feedback</button>
      </div>
      {tab === 'client' ? (
        <div className={styles.feedbackList} style={{ maxWidth: 540 }}>
          {CLIENT_FEEDBACK.map((item) => (
            <article key={item.id} className={styles.feedbackCard}>
              <div className={styles.feedbackCardHead}>
                <div><strong>{item.client}</strong><div className={styles.feedbackRole}>{item.role}</div></div>
                <span className={classNames(styles.statusSelect, item.status === 'Received' ? styles.statusOffer : styles.statusWaiting)}>{item.status}</span>
              </div>
              <p className={styles.feedbackMessage}>{item.message}</p>
              <p className={styles.feedbackDate}>{item.date}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.feedbackLayout}>
          <div className={styles.feedbackList}>
            {ADMIN_FEEDBACK.map((item) => (
              <button key={item.id} type="button" className={classNames(styles.feedbackCard, item.id === selectedId && styles.feedbackCardActive)} onClick={() => { setSelectedId(item.id); setSent(false); }}>
                <div className={styles.feedbackCardHead}>
                  <div><strong>{item.sender}</strong><div className={styles.feedbackRole}>{item.role}</div></div>
                  <span className={classNames(styles.statusSelect, item.status === 'Resolved' ? styles.statusOffer : styles.statusWaiting)}>{item.status}</span>
                </div>
                <p className={styles.feedbackMessage}>{item.message}</p>
                <p className={styles.feedbackDate}>{item.date}</p>
              </button>
            ))}
          </div>
          <section className={styles.feedbackDetails}>
            <h3>Feedback Details</h3>
            <div className={styles.feedbackMeta}><strong>John Smith</strong><br />Job ID: 2026-1003-401<br /><br />Re: Google - Senior Software Engineer<br />Please emphasize my leadership experience more. Also, add more details about the recent services project.</div>
            <div className={styles.responseBox}>
              <label className={styles.fieldLabel}>Your Response</label>
              <textarea className={styles.textArea} value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Type your response..." />
              <div className={styles.responseActions}>
                <button type="button" className={styles.primaryButton} onClick={() => setSent(true)}><FiSend /> Send Reply</button>
                <button type="button" className={styles.secondaryButton}><FiCheckCircle /> Mark as Resolved</button>
              </div>
              {sent && <p style={{ color: '#159a66', fontSize: 9, marginTop: 9 }}>Reply sent successfully.</p>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function PerformancePage() {
  return (
    <>
      <PageHeader title="Performance" subtitle="Track your productivity and quality metrics" />
      <div className={styles.performanceStats}>
        <div className={styles.performanceCard}><span>Total Applications</span><strong>328</strong><small className={styles.statPositive}>↗ 12% from last month</small></div>
        <div className={styles.performanceCard}><span>Total Rejection</span><strong>100</strong><small>30.5% rejection rate</small></div>
        <div className={styles.performanceCard}><span>Total Interviews</span><strong>90</strong><small>27.4% interview rate</small></div>
        <div className={styles.performanceCard}><span>Total Offers</span><strong>90</strong><small className={styles.statPositive}>↗ 8% success rate</small></div>
        <div className={styles.performanceCard}><span>Client Satisfaction</span><strong>4.8/5.0</strong><small className={styles.statWarning}>★ Excellent Rating</small></div>
      </div>
      <section className={styles.performanceLevel}>
        <div className={styles.levelHeader}>
          <div className={styles.levelIdentity}><span className={styles.goldMedal}><FiAward /></span><div><strong>Gold</strong><p>328 points to Platinum</p></div></div>
          <div className={styles.levelStatus}><p>Highest Reached</p><strong>Gold</strong></div>
        </div>
        <div className={styles.levelBar}><span /></div>
        <div className={styles.levelLabels}><span>Bronze</span><span>Silver</span><span className={styles.levelCurrent}>Gold (Current)</span><span>Platinum</span><span>Diamond</span></div>
      </section>
      <section className={styles.performancePanel}>
        <h3>Recent Performance</h3>
        {PERFORMANCE_PERIODS.map((period) => (
          <div className={styles.periodRow} key={period.label}>
            <div><strong>{period.label}</strong><span>Applications<br />Interviews</span></div>
            <div className={classNames(styles.periodMetric, styles.metricBlue)}>{period.applications}<br />{period.interviews}</div>
            <div className={styles.periodMetric}>Rejections<br />Offers</div>
            <div className={classNames(styles.periodMetric, styles.metricRed)}>{period.rejections}<br /><span className={styles.metricGreen}>{period.offers}</span></div>
            <div />
          </div>
        ))}
      </section>
      <section className={styles.achievements}><h3>Achievements</h3></section>
    </>
  );
}

function Toggle({ value, onChange, label }) {
  return <button type="button" aria-label={label} className={classNames(styles.toggle, value && styles.toggleOn)} onClick={() => onChange(!value)} />;
}

function SettingsPage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const nameParts = (user?.name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const [profile, setProfile] = useState({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' '),
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || '',
    timezone: user?.timezone || '',
  });
  const [emailNotifications, setEmailNotifications] = useState(user?.emailNotifications ?? true);
  const [pushNotifications, setPushNotifications] = useState(user?.pushNotifications ?? false);
  const [saved, setSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const update = (key, value) => setProfile((current) => ({ ...current, [key]: value }));

  const handleNotificationChange = async (key, value) => {
    if (key === 'emailNotifications') setEmailNotifications(value);
    if (key === 'pushNotifications') setPushNotifications(value);

    const result = await updateProfile({
      name: `${profile.firstName} ${profile.lastName}`,
      [key]: value,
    });

    if (!result.success) {
      if (key === 'emailNotifications') setEmailNotifications(!value);
      if (key === 'pushNotifications') setPushNotifications(!value);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordStatus('');

    if (newPassword !== confirmPassword) {
      setPasswordStatus('New passwords do not match.');
      return;
    }

    const result = await changePassword({ currentPassword, newPassword });

    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStatus('Password updated successfully.');
      return;
    }

    setPasswordStatus(result.error);
  };

  return (
    <div className={styles.settingsPage}>
      <PageHeader title="Profile & Settings" subtitle="Manage your account and preferences" />
      <div className={styles.settingsAvatar}><Avatar name={`${profile.firstName} ${profile.lastName}`} large /></div>
      <section className={styles.settingsSection}>
        <h3>Personal Information</h3>
        <div className={styles.settingsGrid}>
          <div className={styles.field}><label>First Name</label><input value={profile.firstName} onChange={(event) => update('firstName', event.target.value)} /></div>
          <div className={styles.field}><label>Last Name</label><input value={profile.lastName} onChange={(event) => update('lastName', event.target.value)} /></div>
          <div className={styles.field}><label>Email Address</label><input value={profile.email} readOnly title="Contact an ApplyLoop administrator to change your login email." /></div>
          <div className={styles.field}><label>Phone Number</label><input value={profile.phone} onChange={(event) => update('phone', event.target.value)} /></div>
          <div className={styles.field}><label>Country</label><input value={profile.country} onChange={(event) => update('country', event.target.value)} /></div>
          <div className={styles.field}><label>Timezone</label><input value={profile.timezone} onChange={(event) => update('timezone', event.target.value)} /></div>
        </div>
        <button
          type="button"
          className={styles.primaryButton}
          style={{ marginTop: 15 }}
          onClick={async () => {
            setSaved(false);

            const result = await updateProfile({
              name: `${profile.firstName} ${profile.lastName}`,
              phone: profile.phone,
              country: profile.country,
              timezone: profile.timezone,
            });

            if (result.success) {
              setSaved(true);
            }
          }}
        >
          <FiSave /> Save Changes
        </button>
        {saved && <span style={{ marginLeft: 12, color: '#159a66', fontSize: 9 }}>Saved.</span>}
      </section>
      <section className={styles.settingsSection}>
        <h3>Security</h3>
        <div className={styles.settingsSingle}>
          <div className={styles.field}><label>Current Password</label><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Enter current password" /></div>
          <div className={styles.field} style={{ marginTop: 11 }}><label>New Password</label><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Enter new password" /></div>
          <div className={styles.field} style={{ marginTop: 11 }}><label>Confirm New Password</label><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" /></div>
          <button type="button" className={styles.primaryButton} style={{ marginTop: 13 }} onClick={handlePasswordChange}><FiLock /> Change Password</button>
          {passwordStatus && <p style={{ marginTop: 10, fontSize: 9, color: passwordStatus === "Password updated successfully." ? "#159a66" : "#d14343" }}>{passwordStatus}</p>}
        </div>
      </section>
      <section className={styles.settingsSection}>
        <h3>Notification Preferences</h3>
        <div className={styles.settingRow}><div><strong>Email Notifications</strong><p>Receive important updates by email</p></div><Toggle value={emailNotifications} onChange={(value) => handleNotificationChange('emailNotifications', value)} label="Email notifications" /></div>
        <div className={styles.settingRow}><div><strong>Push Notifications</strong><p>Receive notifications in the browser</p></div><Toggle value={pushNotifications} onChange={(value) => handleNotificationChange('pushNotifications', value)} label="Push notifications" /></div>
      </section>
      <section className={styles.settingsSection}>
        <h3>Company · ApplyLoop</h3>
        <div className={styles.accountAction}><span>Live Manager</span><button type="button"><FiEdit3 /></button></div>
        <div className={styles.accountAction}><span>Non-Disclosure Agreement (NDA)</span><button type="button"><FiDownload /></button></div>
        <div className={styles.accountAction}><span>Sign out of this account</span><button type="button" onClick={logout}><FiLogOut /></button></div>
        <div className={classNames(styles.accountAction, styles.accountDanger)}><span>Delete account data</span><button type="button"><FiX /></button></div>
      </section>
    </div>
  );
}

function PreviewModal({ type, onClose }) {
  if (!type) return null;
  return (
    <div className={styles.modalBackdrop} onMouseDown={onClose}>
      <div className={styles.previewModal} onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.previewHeader}><h2>Preview</h2><button type="button" onClick={onClose}><FiX /></button></div>
        <div className={styles.previewBody}>
          <article className={styles.paper}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8 }}><span>Cover Letter</span><span>Download</span></div>
            <div className={styles.paperRule} />
            <p><strong>Your Name</strong><br />Your Title<br />City, State<br />email@example.com</p>
            <p style={{ marginTop: 22 }}>Hiring Manager<br />Apple Inc.<br />February 18, 2026</p>
            <p style={{ marginTop: 22 }}>Dear Hiring Manager,</p>
            <p>I am excited to apply for the Software Engineer position. My background in building scalable products, collaborating across teams, and creating reliable user experiences aligns strongly with the role.</p>
            <p>Throughout my experience, I have translated complex requirements into practical solutions while maintaining a clear focus on quality, usability, and measurable business outcomes.</p>
            <p>Thank you for your time and consideration. I would welcome the opportunity to discuss how my skills can contribute to your team.</p>
            <p style={{ marginTop: 30 }}>Sincerely,<br /><strong style={{ color: '#15a765' }}>Your Name</strong></p>
          </article>
          <article className={styles.paper}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3>Your Name</h3><div style={{ fontSize: 7, textAlign: 'right' }}>123 Your Street<br />City, ST 00000<br />email@example.com</div></div>
            <p>Senior software professional with experience delivering reliable, user-centered applications.</p>
            <h4>Experience</h4>
            <p><strong>Company Name — Job Title</strong><br />January 2022–Present</p>
            <ul><li>Delivered scalable application features across product and engineering teams.</li><li>Improved delivery quality through structured reviews and measurable standards.</li></ul>
            <p><strong>Company Name — Job Title</strong><br />January 2020–December 2021</p>
            <ul><li>Built responsive interfaces and collaborated with stakeholders to refine requirements.</li></ul>
            <h4>Education</h4>
            <p><strong>School Name, Location — Degree</strong><br />Graduation year</p>
            <h4>Skills</h4>
            <p>JavaScript, React, Next.js, APIs, SQL, Git, Agile, Product Collaboration</p>
          </article>
        </div>
      </div>
    </div>
  );
}

export default function ApplicantPortal() {
  const router = useRouter();
  const { user } = useAuth();
  const parts = getParts(router);
  const section = parts[0] || 'dashboard';
  const clientId = parts[1];
  const applicationId = parts[2] === 'applications' ? parts[3] : null;
  const [applications, setApplications] = useState(createApplicationRecords);
  const [assignedClients, setAssignedClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState('');
  const [previewType, setPreviewType] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (user?.role && user.role !== USER_ROLES.APPLICANT) router.replace(getRoleHome(user.role));
  }, [router, user?.role]);

  useEffect(() => {
    if (user?.role !== USER_ROLES.APPLICANT) return;

    let active = true;

    const loadAssignedClients = async () => {
      setClientsLoading(true);
      setClientsError('');

      try {
        const accessToken = await getAccessToken();
        const response = await fetch('/api/applicant/clients', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error || 'Your assigned clients could not be loaded.');
        }

        if (active) {
          setAssignedClients(result.clients || []);
        }
      } catch (error) {
        if (active) {
          setClientsError(error.message || 'Your assigned clients could not be loaded.');
        }
      } finally {
        if (active) setClientsLoading(false);
      }
    };

    loadAssignedClients();

    return () => {
      active = false;
    };
  }, [user?.role]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const changeApplication = (id, patch) => setApplications((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  const clientRecords = useMemo(() => assignedClients.map(mapAssignedClient), [assignedClients]);
  const openApplication = (application) => router.push(`/applicant/clients/${application.clientId}/applications/${application.id}`);
  const openClient = (client) => router.push(`/applicant/clients/${client.id}`);
  const selectedClient = clientRecords.find((client) => client.id === clientId);
  const selectedApplication = applications.find((application) => application.id === applicationId);

  const recordApplication = (client, jobUrl, jobDescription) => {
    const next = {
      id: `application-${Date.now()}`,
      clientId: client.id,
      client: client.name,
      company: 'New Application',
      position: jobDescription.split('\n')[0].replace(/^Job Title:\s*/i, '') || client.role,
      location: 'Remote',
      date: 'Jul 27, 2026',
      status: 'Submitted',
      linkSource: 'Applicant',
      role: client.role,
      applicationTime: 'Now',
      preferences: ['remote', 'full-time'],
      jobLink: jobUrl || 'Not supplied',
    };
    setApplications((current) => [next, ...current]);
    setToast('Application recorded in the client database.');
  };

  let page;
  if (section === 'clients' && applicationId && selectedApplication) {
    page = <ApplicationDetail application={selectedApplication} onBack={() => router.push(`/applicant/clients/${selectedApplication.clientId}`)} />;
  } else if (section === 'clients' && selectedClient) {
    page = <ClientDetail client={selectedClient} onBack={() => router.push('/applicant/clients')} />;
  } else if (section === 'clients') {
    page = <ClientsPage clients={clientRecords} onOpenClient={openClient} />;
  } else if (section === 'workshop') {
    page = <WorkshopPage onRecordApplication={recordApplication} onPreview={setPreviewType} />;
  } else if (section === 'feedback') {
    page = <FeedbackPage />;
  } else if (section === 'performance') {
    page = <PerformancePage />;
  } else if (section === 'settings') {
    page = <SettingsPage />;
  } else {
    page = <Dashboard applications={applications} onChangeRecord={changeApplication} onOpenApplication={openApplication} />;
  }

  return (
    <>
      <Head><title>Applicant Workspace | ApplyLoop</title><meta name="description" content="ApplyLoop applicant workspace" /></Head>
      <ApplicantShell section={section}>{page}</ApplicantShell>
      <PreviewModal type={previewType} onClose={() => setPreviewType(null)} />
      {toast && <div className={styles.toast}>{toast}</div>}
    </>
  );
}
