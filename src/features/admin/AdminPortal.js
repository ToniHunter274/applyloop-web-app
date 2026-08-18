import { useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FiLogOut } from 'react-icons/fi';
import { HiOutlineUserGroup } from 'react-icons/hi';
import ClientManagementWorkspace from '../../shared/components/ClientManagementWorkspace';
import { useAuth } from '../../shared/context/AuthContext';
import {
  getRoleHome,
  USER_ROLES,
} from '../../shared/config/roles';

export default function AdminPortal() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    logout,
  } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    if (user?.role !== USER_ROLES.ADMIN) {
      router.replace(getRoleHome(user?.role));
    }
  }, [
    isAuthenticated,
    isLoading,
    router,
    user?.role,
  ]);

  const initials = (user?.name || 'Administrator')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0])
    .join('')
    .toUpperCase();

  if (
    isLoading ||
    !isAuthenticated ||
    user?.role !== USER_ROLES.ADMIN
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Client Management | ApplyLoop</title>

        <meta
          name="description"
          content="Manage ApplyLoop client accounts and subscriptions."
        />
      </Head>

      <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
          <div className="flex h-24 items-center border-b border-slate-200 px-6">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="ApplyLoop logo"
                width={48}
                height={48}
                priority
                className="h-12 w-12 rounded-xl object-cover"
              />

              <div>
                <p className="text-xl font-bold tracking-tight text-slate-950">
                  ApplyLoop
                </p>

                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  Admin Portal
                </p>
              </div>
            </div>
          </div>

          <nav className="p-4">
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3.5 text-sm font-semibold text-blue-700">
              <HiOutlineUserGroup className="h-5 w-5" />

              <span>Client Management</span>
            </div>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {initials}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user.name}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Administrator
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 max-w-full lg:pl-64">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex min-h-24 items-center justify-between gap-4 px-5 py-4 sm:px-8">
              <div className="flex items-center gap-3 lg:hidden">
                <Image
                  src="/logo.svg"
                  alt="ApplyLoop logo"
                  width={42}
                  height={42}
                  priority
                  className="h-11 w-11 rounded-xl object-cover"
                />

                <span className="text-lg font-bold text-slate-950">
                  ApplyLoop
                </span>
              </div>

              <div className="hidden lg:block">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Administrator
                </p>

                <p className="mt-1.5 text-base font-semibold text-slate-800">
                  {user.name}
                </p>
              </div>

              <button
                type="button"
                onClick={logout}
                className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <FiLogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </header>

          <main className="min-w-0 max-w-full overflow-x-hidden px-5 py-9 sm:px-8 lg:py-10">
            <ClientManagementWorkspace mode="admin" />
          </main>
        </div>
      </div>
    </>
  );
}
