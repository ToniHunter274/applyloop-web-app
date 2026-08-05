import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
} from 'react-icons/fi';
import { useAuth } from '../../shared/context/AuthContext';

export default function Login() {
  const { login, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const submit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setFormError('Enter your email address and password.');
      return;
    }

    setLoading(true);
    setFormError('');
    clearError();

    const result = await login({
      email,
      password,
    });

    if (!result.success) {
      setFormError(result.error);
    }

    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Sign in | ApplyLoop</title>
        <meta
          name="description"
          content="Sign in to your ApplyLoop workspace."
        />
      </Head>

      <main className="min-h-screen bg-[#f4f7fc] p-4 sm:p-6 lg:p-10">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1240px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-blue-900/10 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-gradient-to-br from-[#0b3ea8] via-[#1554cc] to-[#5477e8] p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <img
                  src="/logo.svg"
                  alt="ApplyLoop"
                  className="h-8 w-8"
                />
              </span>

              <span className="text-2xl font-extrabold">
                ApplyLoop
              </span>
            </div>

            <div className="max-w-xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-100">
                One connected workspace
              </p>

              <h1 className="mt-5 text-5xl font-extrabold leading-[1.08] tracking-tight">
                Job applications managed from discovery to quality approval.
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-blue-100">
                Clients and ApplyLoop team members use secure,
                role-specific workspaces connected to the same
                operational platform.
              </p>
            </div>

            <p className="text-sm text-blue-100">
              Access is available only to approved clients and team members.
            </p>
          </section>

          <section className="flex items-center p-6 sm:p-10 lg:p-14">
            <div className="mx-auto w-full max-w-lg">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <img
                  src="/logo.svg"
                  alt="ApplyLoop"
                  className="h-10 w-10"
                />

                <span className="text-xl font-extrabold">
                  ApplyLoop
                </span>
              </div>

              <p className="text-sm font-bold text-blue-700">
                Welcome back
              </p>

              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
                Sign in to your workspace
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Use the login details provided by ApplyLoop.
                Your workspace will open automatically based on your assigned role.
              </p>

              <form
                onSubmit={submit}
                className="mt-8 space-y-5"
              >
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Email address
                  </span>

                  <span className="relative block">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      autoComplete="email"
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </span>

                  <span className="relative block">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type={visible ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />

                    <button
                      type="button"
                      onClick={() => setVisible((value) => !value)}
                      aria-label={visible ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {visible ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </span>
                </label>

                {(formError || error) && (
                  <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {formError || error}
                  </p>
                )}

                <button
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                  {!loading && <FiArrowRight />}
                </button>
              </form>

              <div className="mt-7 text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-semibold text-blue-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <p className="mt-8 text-center text-xs leading-5 text-slate-400">
                Accounts are created and assigned by ApplyLoop administrators.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
