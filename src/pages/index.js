import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../shared/context/AuthContext';
import { getRoleHome } from '../shared/config/roles';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) router.replace(isAuthenticated ? getRoleHome(user?.role) : '/auth/login');
  }, [isAuthenticated, isLoading, router, user?.role]);

  return (
    <>
      <Head><title>ApplyLoop</title></Head>
      <div className="min-h-screen bg-slate-50" />
    </>
  );
}
