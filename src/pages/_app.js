import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../shared/context/AuthContext';
import AppProvider from '../shared/context/AppProvider';
import { getRoleHome } from '../shared/config/roles';

const AuthWrapper = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading || !router.isReady) return;
    const path = router.pathname;
    const isAuthPage = path.startsWith('/auth/');

    if (!isAuthenticated && !isAuthPage && path !== '/') {
      router.replace('/auth/login');
      return;
    }

    if (isAuthenticated && (isAuthPage || path === '/')) {
      router.replace(getRoleHome(user?.role));
      return;
    }

    if (!isAuthenticated && path === '/') router.replace('/auth/login');
  }, [isAuthenticated, isLoading, router.isReady, router.pathname, user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-11 w-11 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
          <p className="text-sm font-medium text-slate-500">Loading ApplyLoop…</p>
        </div>
      </div>
    );
  }

  return children;
};

export default function MyApp({ Component, pageProps }) {
  return (
    <AppProvider>
      <AuthProvider>
        <AuthWrapper>
          <Component {...pageProps} />
        </AuthWrapper>
      </AuthProvider>
    </AppProvider>
  );
}
