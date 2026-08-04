import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import { useAuth } from '../../shared/context/AuthContext';
import { ROLE_LABELS, USER_ROLES } from '../../shared/config/roles';

export default function Login() {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('client@applyloop.com');
  const [password, setPassword] = useState('applyloop');
  const [role, setRole] = useState(USER_ROLES.USER_CLIENT);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setFormError('Enter an email address and password.');
      return;
    }
    setLoading(true);
    setFormError('');
    const result = await login({ email, password, role });
    if (!result.success) setFormError(result.error);
    setLoading(false);
  };

  const openDemo = async (demoRole) => {
    setRole(demoRole);
    setLoading(true);
    setFormError('');
    const result = await login({ email: `${demoRole}@applyloop.com`, password: 'applyloop', role: demoRole });
    if (!result.success) setFormError(result.error);
    setLoading(false);
  };

  return (
    <>
      <Head><title>Sign in | ApplyLoop</title><meta name="description" content="Sign in to the ApplyLoop workspace." /></Head>
      <main className="min-h-screen bg-[#f4f7fc] p-4 sm:p-6 lg:p-10">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1240px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-blue-900/10 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-gradient-to-br from-[#0b3ea8] via-[#1554cc] to-[#5477e8] p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><img src="/logo.svg" alt="ApplyLoop" className="h-8 w-8" /></span><span className="text-2xl font-extrabold">ApplyLoop</span></div>
            <div className="max-w-xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-100">One connected workspace</p>
              <h1 className="mt-5 text-5xl font-extrabold leading-[1.08] tracking-tight">Job applications managed from discovery to quality approval.</h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-blue-100">Users/clients, applicant teams, prompt engineers, auditors, managers, and owners work from role-specific dashboards built on the same operational data.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center"><div className="rounded-2xl bg-white/10 p-4"><p className="text-2xl font-extrabold">8.4K</p><p className="mt-1 text-xs text-blue-100">Applications</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-2xl font-extrabold">96.4%</p><p className="mt-1 text-xs text-blue-100">Quality</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-2xl font-extrabold">1.2K</p><p className="mt-1 text-xs text-blue-100">Subscribers</p></div></div>
          </section>

          <section className="flex items-center p-6 sm:p-10 lg:p-14">
            <div className="mx-auto w-full max-w-lg">
              <div className="mb-8 flex items-center gap-3 lg:hidden"><img src="/logo.svg" alt="ApplyLoop" className="h-10 w-10" /><span className="text-xl font-extrabold">ApplyLoop</span></div>
              <p className="text-sm font-bold text-blue-700">Welcome back</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Sign in to your workspace</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">Use the form or open any role demo below. Demo data is included so every screen is immediately accessible.</p>

              <form onSubmit={submit} className="mt-8 space-y-5">
                <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span><span className="relative block"><FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" /></span></label>
                <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Password</span><span className="relative block"><FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={password} onChange={(event) => setPassword(event.target.value)} type={visible ? 'text' : 'password'} className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" /><button type="button" onClick={() => setVisible((value) => !value)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">{visible ? <FiEyeOff /> : <FiEye />}</button></span></label>
                <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Workspace role</span><select value={role} onChange={(event) => setRole(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500">{Object.values(USER_ROLES).map((option) => <option key={option} value={option}>{ROLE_LABELS[option]}</option>)}</select></label>
                {(formError || error) && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{formError || error}</p>}
                <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:opacity-60">{loading ? 'Opening workspace…' : 'Sign in'}{!loading && <FiArrowRight />}</button>
              </form>

              <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200" /><span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Role demos</span><span className="h-px flex-1 bg-slate-200" /></div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{Object.values(USER_ROLES).map((option) => <button key={option} disabled={loading} onClick={() => openDemo(option)} className="rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">{ROLE_LABELS[option]}</button>)}</div>
              <div className="mt-8 flex items-center justify-between text-sm"><Link href="/auth/forgot-password" className="font-semibold text-blue-700 hover:underline">Forgot password?</Link><Link href="/auth/signup" className="font-semibold text-slate-600 hover:text-blue-700">Create client account</Link></div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
