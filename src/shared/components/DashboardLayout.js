import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiBell,
  FiChevronDown,
  FiCpu,
  FiCreditCard,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiSettings,
  FiTrendingUp,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getRoleHome, USER_ROLES } from '../config/roles';
import { createClient } from '../../lib/supabase/client';
import { Avatar } from './PortalUI';

async function getClientAccessToken() {
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
      'Your session has expired.'
    );
  }

  return session.access_token;
}

function formatNotificationDate(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const pageMeta = {
  '/dashboard': ['Dashboard', 'Track applications, monitor progress, and stay in control of your job search.'],
  '/growth': ['Career Growth', 'Build job-ready skills with a personalized learning plan.'],
  '/loop-lab': ['Loop Lab', 'Prepare for interviews with role-specific practice sessions.'],
  '/billing': ['Billing & Subscription', 'Manage your plan, billing history, and application volume.'],
  '/settings': ['Settings', 'Update your profile, work preferences, and account details.'],
  '/notifications': ['Notifications', 'Review important application and interview updates.'],
  '/support': ['Help & Support', 'Get help with your account, applications, or technical issues.'],
  '/applications/[id]': ['Job Application', 'Review the full application, documents, status, and feedback.'],
};

export default function DashboardLayout({
  children,
  logout: logoutProp,
  searchValue = '',
  onSearchChange,
}) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [headerSearchValue, setHeaderSearchValue] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [
    isLoadingNotifications,
    setIsLoadingNotifications,
  ] = useState(false);
  const [
    notificationsError,
    setNotificationsError,
  ] = useState('');
  const [title, subtitle] = pageMeta[router.pathname] || ['ApplyLoop', ''];

  const navItems = [
    { icon: FiHome, label: 'Home', href: '/dashboard' },
    { icon: FiCpu, label: 'Loop Lab', href: '/loop-lab' },
    { icon: FiCreditCard, label: 'Billing & Subscription', href: '/billing' },
    { icon: FiTrendingUp, label: 'Growth', href: '/growth' },
    { icon: FiSettings, label: 'Settings', href: '/settings' },
  ];

  const handleLogout = () => typeof logoutProp === 'function' ? logoutProp() : logout();

  const displayedSearchValue =
    typeof onSearchChange === 'function'
      ? searchValue
      : headerSearchValue;

  const handleHeaderSearchChange = (value) => {
    if (typeof onSearchChange === 'function') {
      onSearchChange(value);
      return;
    }

    setHeaderSearchValue(value);
  };

  const handleHeaderSearchSubmit = (event) => {
    event.preventDefault();

    const query =
      displayedSearchValue.trim();

    if (!query) {
      if (router.pathname !== '/dashboard') {
        router.push('/dashboard');
      }

      return;
    }

    if (router.pathname === '/dashboard') {
      return;
    }

    router.push({
      pathname: '/dashboard',
      query: {
        search: query,
      },
    });
  };

  useEffect(() => {
    if (user?.role && user.role !== USER_ROLES.USER_CLIENT) router.replace(getRoleHome(user.role));
  }, [router, user?.role]);

  useEffect(() => {
    if (
      !router.isReady ||
      user?.role !== USER_ROLES.USER_CLIENT
    ) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    let cancelled = false;

    const loadNotifications = async () => {
      setIsLoadingNotifications(true);
      setNotificationsError('');

      try {
        const accessToken =
          await getClientAccessToken();

        const response = await fetch(
          '/api/client/notifications',
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Notifications could not be loaded.'
          );
        }

        if (!cancelled) {
          setNotifications(
            Array.isArray(data.notifications)
              ? data.notifications
              : []
          );

          setUnreadCount(
            Number(data.unreadCount) || 0
          );
        }
      } catch (error) {
        if (!cancelled) {
          setNotificationsError(
            error.message ||
              'Notifications could not be loaded.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingNotifications(false);
        }
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [
    router.isReady,
    user?.role,
  ]);

  const markNotificationRead =
    async (notification) => {
      try {
        if (!notification.read) {
          const accessToken =
            await getClientAccessToken();

          const response = await fetch(
            '/api/client/notifications',
            {
              method: 'PATCH',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                notificationId:
                  notification.id,
              }),
            }
          );

          const data = await response
            .json()
            .catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              data.error ||
                'Notification could not be updated.'
            );
          }

          setNotifications((current) =>
            current.map((item) =>
              item.id === notification.id
                ? {
                    ...item,
                    read: true,
                    readAt:
                      new Date().toISOString(),
                  }
                : item
            )
          );

          setUnreadCount(
            Number(data.unreadCount) || 0
          );
        }
      } catch (error) {
        setNotificationsError(
          error.message ||
            'Notification could not be updated.'
        );
      }

      setNotificationsOpen(false);

      if (notification.href) {
        router.push(notification.href);
      }
    };

  const markAllNotificationsRead =
    async () => {
      try {
        const accessToken =
          await getClientAccessToken();

        const response = await fetch(
          '/api/client/notifications',
          {
            method: 'PATCH',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              markAllRead: true,
            }),
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Notifications could not be updated.'
          );
        }

        const readAt =
          new Date().toISOString();

        setNotifications((current) =>
          current.map((notification) => ({
            ...notification,
            read: true,
            readAt,
          }))
        );

        setUnreadCount(0);
        setNotificationsError('');
      } catch (error) {
        setNotificationsError(
          error.message ||
            'Notifications could not be updated.'
        );
      }
    };

  return (
    <div className="user-client-compact min-h-screen bg-[#eaf0ff] text-slate-900">
      {mobileOpen && <button className="fixed inset-0 z-30 bg-slate-950/35 md:hidden" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-slate-200/80 bg-white shadow-[0_0_30px_rgba(15,23,42,0.04)] transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex h-[88px] items-center justify-between border-b border-slate-100 px-6">
          <Link href="/dashboard" className="flex items-center gap-3"><img src="/logo.svg" alt="ApplyLoop" className="h-8 w-8" /><span className="text-base font-bold tracking-tight text-slate-950">ApplyLoop</span></Link>
          <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-500 md:hidden"><FiX /></button>
        </div>
        
        <nav className="mt-3 flex-1 space-y-1.5 overflow-y-auto px-4 py-2">
          {navItems.map(({ icon: Icon, label, href }) => {
            const active = router.pathname === href || (href === '/dashboard' && router.pathname === '/applications/[id]');
            return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-blue-50 font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100/70'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}><Icon className="h-4 w-4" />{label}</Link>;
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <Link
            href="/support"
            className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
              router.pathname === '/support'
                ? 'bg-blue-50 font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100/70'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            <FiHelpCircle />
            Help & Support
          </Link>
          <div className="relative">
            <button onClick={() => setProfileOpen((value) => !value)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"><Avatar name={user?.name} size="sm" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{user?.name || 'Client'}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{user?.email || 'client@applyloop.com'}</span></span><FiChevronDown className="text-slate-400" /></button>
            {profileOpen && <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"><button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"><FiLogOut /> Sign out</button></div>}
          </div>
        </div>
      </aside>

      <div className="md:pl-[264px]">
        <header className="user-client-compact-header sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="flex min-h-[74px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 md:hidden"><FiMenu className="h-[18px] w-[18px]" /></button><div className="min-w-0"><h1 className="truncate text-[20px] font-medium tracking-[-0.03em] lg:text-[23px]">{title}</h1><p className="mt-1 hidden truncate text-[11px] text-slate-400 sm:block">{subtitle}</p></div></div>
            <div className="flex items-center gap-2">
              <form
                onSubmit={handleHeaderSearchSubmit}
                className="hidden xl:block"
              >
                <label className="relative block">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    type="search"
                    value={displayedSearchValue}
                    onChange={(event) =>
                      handleHeaderSearchChange(
                        event.target.value
                      )
                    }
                    placeholder="Search applications"
                    aria-label="Search applications"
                    className="h-[38px] w-[250px] rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-[11px] outline-none focus:border-blue-400"
                  />
                </label>
              </form>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setNotificationsOpen(
                      (value) => !value
                    )
                  }
                  className="relative rounded-full border border-blue-600 p-2 text-blue-700 hover:bg-slate-50"
                  aria-label="Notifications"
                >
                  <FiBell className="h-[18px] w-[18px]" />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white">
                      {unreadCount > 9
                        ? '9+'
                        : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <p className="text-[12px] font-semibold text-slate-900">
                        Notifications
                      </p>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={
                            markAllNotificationsRead
                          }
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto">
                      {isLoadingNotifications ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-xs text-slate-400">
                            Loading notifications...
                          </p>
                        </div>
                      ) : notificationsError ? (
                        <div className="px-4 py-6 text-center">
                          <p className="text-xs text-rose-500">
                            {notificationsError}
                          </p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-xs text-slate-400">
                            No notifications.
                          </p>
                        </div>
                      ) : (
                        notifications
                          .slice(0, 5)
                          .map((notification) => (
                            <button
                              type="button"
                              key={notification.id}
                              onClick={() =>
                                markNotificationRead(
                                  notification
                                )
                              }
                              className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                                notification.read
                                  ? 'bg-white'
                                  : 'bg-blue-50/60'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {!notification.read && (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                )}

                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold text-slate-900">
                                    {notification.title}
                                  </p>

                                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                                    {notification.message}
                                  </p>

                                  <p className="mt-1.5 text-[9px] text-slate-400">
                                    {formatNotificationDate(
                                      notification.createdAt
                                    )}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                      )}
                    </div>

                    <Link
                      href="/notifications"
                      onClick={() =>
                        setNotificationsOpen(false)
                      }
                      className="block border-t border-slate-100 px-4 py-3 text-center text-[11px] font-semibold text-blue-600 hover:bg-slate-50"
                    >
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="user-client-compact-main mx-auto w-full max-w-[1600px] p-[13px] sm:p-[14px] lg:p-[14px]"><div className="user-client-page-surface">{children}</div></main>
      </div>
    </div>
  );
}
