import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  FiLogOut,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import WorkspaceAnnouncements from './WorkspaceAnnouncements';

function getNavigationSection(
  item,
  homeHref
) {
  if (item.section) {
    return item.section;
  }

  const normalizedHref = String(
    item.href || ''
  )
    .split('?')[0]
    .replace(/\/+$/, '');

  const normalizedHome = String(
    homeHref || ''
  ).replace(/\/+$/, '');

  if (
    normalizedHref ===
    normalizedHome
  ) {
    return 'dashboard';
  }

  const parts = normalizedHref
    .split('/')
    .filter(Boolean);

  return (
    parts[parts.length - 1] ||
    'dashboard'
  );
}

function getInitials(value) {
  return String(
    value || 'ApplyLoop User'
  )
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function WorkspaceShell({
  children,
  navigation = [],
  activeSection = 'dashboard',
  homeHref = '/',
  title = 'ApplyLoop',
  subtitle = '',
  workspaceLabel = 'Workspace',
  roleLabel = 'Team Member',
  user,
  onLogout,
  headerActions = null,
}) {
  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const displayName =
    user?.name ||
    roleLabel ||
    'ApplyLoop User';

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() =>
            setMobileOpen(false)
          }
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ${
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-24 items-center justify-between border-b border-slate-200 px-6">
          <Link
            href={homeHref}
            onClick={() =>
              setMobileOpen(false)
            }
            className="flex min-w-0 items-center gap-3"
          >
            <Image
              src="/logo.svg"
              alt="ApplyLoop logo"
              width={48}
              height={48}
              priority
              className="h-12 w-12 rounded-xl object-cover"
            />

            <div className="min-w-0">
              <p className="truncate text-xl font-bold tracking-tight text-slate-950">
                ApplyLoop
              </p>

              <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                {workspaceLabel}
              </p>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={() =>
              setMobileOpen(false)
            }
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {navigation.map((item) => {
            const Icon = item.icon;

            const itemSection =
              getNavigationSection(
                item,
                homeHref
              );

            const active =
              itemSection ===
              activeSection;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() =>
                  setMobileOpen(false)
                }
                aria-current={
                  active
                    ? 'page'
                    : undefined
                }
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {Icon && (
                  <Icon className="h-5 w-5 shrink-0" />
                )}

                <span className="min-w-0 flex-1 truncate">
                  {item.label}
                </span>

                {Number(item.count) > 0 && (
                  <span
                    className={`ml-auto inline-flex min-w-6 shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                      active
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {getInitials(
                  displayName
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {displayName}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {roleLabel}
                </p>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  aria-label="Sign out"
                  title="Sign out"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <FiLogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 max-w-full lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-24 items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() =>
                  setMobileOpen(true)
                }
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm lg:hidden"
              >
                <FiMenu className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  {roleLabel}
                </p>

                <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                  {title}
                </h1>

                {subtitle && (
                  <p className="mt-1 hidden truncate text-sm text-slate-500 sm:block">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {headerActions}

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="hidden items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:inline-flex"
                >
                  <FiLogOut className="h-4 w-4" />
                  Sign out
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 max-w-full overflow-x-hidden px-5 py-9 sm:px-8 lg:py-10">
          <WorkspaceAnnouncements />

          {children}
        </main>
      </div>
    </div>
  );
}
