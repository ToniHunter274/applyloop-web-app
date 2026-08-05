import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiBell,
  FiChevronDown,
  FiHelpCircle,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import {
  getRoleHome,
  ROLE_LABELS,
  ROLE_NAVIGATION,
  ROLE_PAGE_META,
} from '../config/roles';
import { Avatar, Badge } from './PortalUI';

const getSection = (router) => {
  const section = router.query?.section;
  if (Array.isArray(section) && section.length) return section[0];
  return 'dashboard';
};

export default function RoleLayout({ role, children, actions }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const section = getSection(router);
  const [title, subtitle] = ROLE_PAGE_META[role]?.[section] || ROLE_PAGE_META[role]?.dashboard || ['ApplyLoop', ''];
  const navigation = ROLE_NAVIGATION[role] || [];

  useEffect(() => {
    if (user?.role && user.role !== role) router.replace(getRoleHome(user.role));
  }, [role, router, user?.role]);

  return (
    <>
      <Head>
        <title>{title} | ApplyLoop</title>
        <meta name="description" content={subtitle} />
      </Head>
      <div className="role-compact min-h-screen bg-[#e8eefc] text-slate-900">
        {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden" onClick={() => setMobileOpen(false)} />}

        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[235px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <div className="flex h-[92px] items-center justify-between border-b border-slate-100 px-5">
            <Link href={navigation[0]?.href || '/dashboard'} className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
              <img src="/logo.svg" alt="ApplyLoop" className="h-7 w-7" />
              <span className="text-[15px] font-semibold tracking-tight text-slate-950">ApplyLoop</span>
            </Link>
            <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><FiX /></button>
          </div>

          <div className="px-4 pt-1">
            <div className="rounded border border-blue-100 bg-blue-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-blue-500">Workspace</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-semibold text-blue-950">{ROLE_LABELS[role]}</span>
                <Badge tone="blue">Live</Badge>
              </div>
            </div>
          </div>

          <nav className="mt-4 flex-1 space-y-[3px] overflow-y-auto px-[15px] pb-5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = item.href === router.asPath.split('?')[0] || (item.href.endsWith(`/${section}`) && section !== 'dashboard') || (section === 'dashboard' && item.href.split('/').filter(Boolean).length === 1);
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-[3px] px-[11px] py-[11px] text-[12px] font-normal transition ${active ? 'bg-[#eaf0ff] text-[#1f56c6] font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <Icon className={`h-4 w-4 ${active ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-700'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-3">
            <button className="mb-1 flex w-full items-center gap-3 rounded-[3px] px-[11px] py-[11px] text-[12px] font-normal text-slate-500 hover:bg-slate-50 hover:text-slate-900">
              <FiHelpCircle className="h-4 w-4" /> Help & Support
            </button>
            <div className="relative">
              <button onClick={() => setProfileOpen((value) => !value)} className="flex w-full items-center gap-3 rounded-[4px] px-2 py-2 text-left hover:bg-slate-50">
                <Avatar name={user?.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium text-slate-700">{user?.name || 'ApplyLoop User'}</span>
                  <span className="block truncate text-[10px] text-slate-500">{user?.email || 'user@applyloop.com'}</span>
                </span>
                <FiChevronDown className="text-slate-400" />
              </button>
              {profileOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  <button onClick={logout} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"><FiLogOut /> Sign out</button>
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="lg:pl-[235px]">
          <header className="role-compact-header sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur">
            <div className="flex min-h-[74px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <button onClick={() => setMobileOpen(true)} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 lg:hidden"><FiMenu className="h-[18px] w-[18px]" /></button>
                <div className="min-w-0">
                  <h1 className="truncate text-[20px] font-medium tracking-[-0.03em] text-slate-950 lg:text-[23px]">{title}</h1>
                  <p className="mt-1 hidden truncate text-[11px] text-slate-400 sm:block">{subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="relative hidden xl:block">
                  <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input placeholder="Search workspace" className="h-[38px] w-[252px] rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-[11px] outline-none focus:border-blue-400 focus:bg-white" />
                </label>
                <button className="relative rounded-full border border-blue-600 bg-white p-2 text-blue-700 hover:bg-blue-50">
                  <FiBell className="h-[18px] w-[18px]" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                </button>
                {actions}
              </div>
            </div>
          </header>

          <main className="role-compact-main mx-auto w-full max-w-[1600px] p-[13px] sm:p-[14px] lg:p-[14px]">{children}</main>
        </div>
      </div>
    </>
  );
}
