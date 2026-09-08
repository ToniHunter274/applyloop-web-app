import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiBriefcase,
  FiExternalLink,
  FiLink,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiTrendingUp,
  FiUsers,
  FiX,
} from 'react-icons/fi';

import { useAuth } from '../../shared/context/AuthContext';
import {
  getRoleHome,
  ROLE_NAVIGATION,
  ROLE_PAGE_META,
  USER_ROLES,
} from '../../shared/config/roles';
import styles from './LinkerPortal.module.css';

const validSections = new Set([
  'dashboard',
  'clients',
  'applicants',
  'record-link',
  'feedback',
  'performance',
  'settings',
]);

function getRequestedSection(router) {
  const value = router.query?.section;
  const segments = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];

  return segments[0] || 'dashboard';
}

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <section className={styles.emptyState}>
      <span className={styles.emptyIcon}>
        <Icon aria-hidden="true" />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}

function DashboardPage() {
  return (
    <div className={styles.pageGrid}>
      <section className={styles.welcomeCard}>
        <div>
          <span className={styles.eyebrow}>
            Linker workspace
          </span>
          <h2>Your assignment queue is ready</h2>
          <p>
            Assigned clients, applicants and verified job-link
            activity will appear here when assignment services
            are connected.
          </p>
        </div>
        <FiLink aria-hidden="true" />
      </section>

      <EmptyState
        icon={FiBriefcase}
        title="No assignments available"
        description="You do not currently have any Linker assignments."
      />
    </div>
  );
}

function ClientsPage() {
  return (
    <EmptyState
      icon={FiBriefcase}
      title="No assigned clients"
      description="Clients assigned to you will appear here."
    />
  );
}

function ApplicantsPage() {
  return (
    <EmptyState
      icon={FiUsers}
      title="No assigned applicants"
      description="Applicants connected to your assignments will appear here."
    />
  );
}

function RecordLinkPage() {
  return (
    <section className={styles.recordCard}>
      <span className={styles.emptyIcon}>
        <FiExternalLink aria-hidden="true" />
      </span>
      <h2>No eligible assignment selected</h2>
      <p>
        A verified client and applicant assignment is required
        before a job link can be recorded.
      </p>

      <button type="button" disabled>
        Record job link
      </button>
    </section>
  );
}

function FeedbackPage() {
  return (
    <EmptyState
      icon={FiMessageSquare}
      title="No feedback or messages"
      description="Assignment-related feedback and messages will appear here."
    />
  );
}

function PerformancePage() {
  return (
    <EmptyState
      icon={FiTrendingUp}
      title="No verified performance data"
      description="Performance results will appear after recorded links are processed."
    />
  );
}

function SettingsPage({ user }) {
  return (
    <section className={styles.settingsCard}>
      <h2>Account profile</h2>
      <p>
        Your authenticated ApplyLoop profile is shown below.
      </p>

      <dl>
        <div>
          <dt>Name</dt>
          <dd>{user?.name || 'Not provided'}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user?.email || 'Not provided'}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>Linker</dd>
        </div>
      </dl>
    </section>
  );
}

function renderPage(section, user) {
  if (section === 'clients') {
    return <ClientsPage />;
  }

  if (section === 'applicants') {
    return <ApplicantsPage />;
  }

  if (section === 'record-link') {
    return <RecordLinkPage />;
  }

  if (section === 'feedback') {
    return <FeedbackPage />;
  }

  if (section === 'performance') {
    return <PerformancePage />;
  }

  if (section === 'settings') {
    return <SettingsPage user={user} />;
  }

  return <DashboardPage />;
}

export default function LinkerPortal() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const requestedSection =
    getRequestedSection(router);

  const section =
    validSections.has(requestedSection)
      ? requestedSection
      : 'dashboard';

  const metadata =
    ROLE_PAGE_META[USER_ROLES.LINKER][section];

  const navigation =
    ROLE_NAVIGATION[USER_ROLES.LINKER];

  useEffect(() => {
    if (
      user?.role &&
      user.role !== USER_ROLES.LINKER
    ) {
      router.replace(getRoleHome(user.role));
    }
  }, [router, user?.role]);

  useEffect(() => {
    if (
      router.isReady &&
      requestedSection !== section
    ) {
      router.replace('/linker');
    }
  }, [
    requestedSection,
    router,
    router.isReady,
    section,
  ]);

  if (
    user?.role &&
    user.role !== USER_ROLES.LINKER
  ) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{metadata[0]} | ApplyLoop</title>
        <meta
          name="description"
          content={metadata[1]}
        />
      </Head>

      <div className={styles.workspace}>
        {menuOpen && (
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <aside
          className={
            menuOpen
              ? styles.sidebarOpen
              : styles.sidebar
          }
        >
          <div className={styles.brandRow}>
            <Link
              href="/linker"
              className={styles.brand}
            >
              <img src="/logo.svg" alt="" />
              <span>ApplyLoop</span>
            </Link>

            <button
              type="button"
              className={styles.closeMenu}
              aria-label="Close navigation"
              onClick={() => setMenuOpen(false)}
            >
              <FiX />
            </button>
          </div>

          <nav aria-label="Linker workspace">
            {navigation.map((item) => {
              const Icon = item.icon;

              const itemSection =
                item.href === '/linker'
                  ? 'dashboard'
                  : item.href.split('/').pop();

              const active =
                itemSection === section;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? styles.navActive
                      : styles.navItem
                  }
                  aria-current={
                    active ? 'page' : undefined
                  }
                  onClick={() =>
                    setMenuOpen(false)
                  }
                >
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className={styles.account}>
            <span className={styles.avatar}>
              {(user?.name || user?.email || 'L')
                .charAt(0)
                .toUpperCase()}
            </span>

            <span className={styles.accountText}>
              <strong>
                {user?.name || 'Linker'}
              </strong>
              <small>
                {user?.email ||
                  'Authenticated account'}
              </small>
            </span>

            <button
              type="button"
              aria-label="Sign out"
              onClick={logout}
            >
              <FiLogOut />
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.mobileHeader}>
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
            >
              <FiMenu />
            </button>

            <Link href="/linker">
              ApplyLoop
            </Link>
          </header>

          <div className={styles.content}>
            <header className={styles.pageHeader}>
              <div>
                <h1>{metadata[0]}</h1>
                <p>{metadata[1]}</p>
              </div>
            </header>

            {renderPage(section, user)}
          </div>
        </main>
      </div>
    </>
  );
}
