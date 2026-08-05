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
import { Avatar } from './PortalUI';

const pageMeta = {
  '/dashboard': ['Dashboard', 'Track applications, monitor progress, and stay in control of your job search.'],
  '/growth': ['Career Growth', 'Build job-ready skills with a personalized learning plan.'],
  '/loop-lab': ['Loop Lab', 'Prepare for interviews with role-specific practice sessions.'],
  '/billing': ['Billing & Subscription', 'Manage your plan, billing history, and application volume.'],
  '/settings': ['Settings', 'Update your profile, work preferences, and account details.'],
  '/notifications': ['Notifications', 'Review important application and interview updates.'],
  '/applications/[id]': ['Job Application', 'Review the full application, documents, status, and feedback.'],
};

export default function DashboardLayout({ children, logout: logoutProp }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [title, subtitle] = pageMeta[router.pathname] || ['ApplyLoop', ''];

  const navItems = [
    { icon: FiHome, label: 'Home', href: '/dashboard' },
    { icon: FiCpu, label: 'Loop Lab', href: '/loop-lab' },
    { icon: FiCreditCard, label: 'Billing & Subscription', href: '/billing' },
    { icon: FiTrendingUp, label: 'Growth', href: '/growth' },
    { icon: FiSettings, label: 'Settings', href: '/settings' },
  ];

  const handleLogout = () => typeof logoutProp === 'function' ? logoutProp() : logout();

  useEffect(() => {
    if (user?.role && user.role !== USER_ROLES.USER_CLIENT) router.replace(getRoleHome(user.role));
  }, [router, user?.role]);

  return (
    <div className="user-client-compact min-h-screen bg-[#eaf0ff] text-slate-900">
      {mobileOpen && <button className="fixed inset-0 z-30 bg-slate-950/35 md:hidden" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[236px] flex-col border-r border-slate-200 bg-white transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex h-[112px] items-center justify-between border-b border-slate-100 px-6">
          <Link href="/dashboard" className="flex items-center gap-3"><img src="/logo.svg" alt="ApplyLoop" className="h-[26px] w-[26px]" /><span className="text-[15px] font-semibold tracking-tight">ApplyLoop</span></Link>
          <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-500 md:hidden"><FiX /></button>
        </div>
        <div className="px-[14px] pt-0"><div className="rounded border border-blue-100 bg-blue-50 px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-[0.09em] text-blue-500">Workspace</p><p className="mt-1 text-[11px] font-semibold text-blue-950">User/Client portal</p></div></div>
        <nav className="mt-4 flex-1 space-y-[3px] overflow-y-auto px-[14px]">
          {navItems.map(({ icon: Icon, label, href }) => {
            const active = router.pathname === href || (href === '/dashboard' && router.pathname === '/applications/[id]');
            return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-[3px] px-3 py-[11px] text-[12px] font-normal transition ${active ? 'bg-[#eaf0ff] text-[#1f56c6] font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon className="h-4 w-4" />{label}</Link>;
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button className="mb-1 flex w-full items-center gap-3 rounded-[3px] px-3 py-[11px] text-[12px] font-normal text-slate-500 hover:bg-slate-50"><FiHelpCircle /> Help & Support</button>
          <div className="relative">
            <button onClick={() => setProfileOpen((value) => !value)} className="flex w-full items-center gap-3 rounded-[4px] px-2 py-2 text-left hover:bg-slate-50"><Avatar name={user?.name} size="sm" /><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-medium">{user?.name || 'User/Client'}</span><span className="block truncate text-[10px] text-slate-500">{user?.email || 'client@applyloop.com'}</span></span><FiChevronDown className="text-slate-400" /></button>
            {profileOpen && <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"><button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"><FiLogOut /> Sign out</button></div>}
          </div>
        </div>
      </aside>

      <div className="md:pl-[236px]">
        <header className="user-client-compact-header sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="flex min-h-[74px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 md:hidden"><FiMenu className="h-[18px] w-[18px]" /></button><div className="min-w-0"><h1 className="truncate text-[20px] font-medium tracking-[-0.03em] lg:text-[23px]">{title}</h1><p className="mt-1 hidden truncate text-[11px] text-slate-400 sm:block">{subtitle}</p></div></div>
            <div className="flex items-center gap-2">
              <label className="relative hidden xl:block"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input placeholder="Search applications" className="h-[38px] w-[250px] rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-[11px] outline-none focus:border-blue-400" /></label>
              <div className="relative"><button onClick={() => setNotificationsOpen((value) => !value)} className="relative rounded-full border border-blue-600 p-2 text-blue-700 hover:bg-slate-50"><FiBell className="h-[18px] w-[18px]" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" /></button>{notificationsOpen && <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"><p className="px-2 py-2 text-[11px] font-medium">Notifications</p>{['Your Notion application moved to Interview.', 'A new Loop Lab session is available.', 'Your monthly application usage is at 64%.'].map((message) => <div key={message} className="border-t border-slate-100 px-2 py-3 text-xs leading-5 text-slate-600">{message}</div>)}</div>}</div>
            </div>
          </div>
        </header>
        <main className="user-client-compact-main mx-auto w-full max-w-[1600px] p-[13px] sm:p-[14px] lg:p-[14px]"><div className="user-client-page-surface">{children}</div></main>
      </div>
    </div>
  );
}
