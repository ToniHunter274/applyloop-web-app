import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiMail,
} from 'react-icons/fi';
import { useAuth } from '../../shared/context/AuthContext';

export default function ForgotPassword() {
  const {
    requestPasswordReset,
    clearError,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setFormError('Enter your email address.');
      return;
    }

    setLoading(true);
    setFormError('');
    setMessage('');
    clearError();

    const result = await requestPasswordReset(email);

    if (!result.success) {
      setFormError(result.error);
    } else {
      setMessage(
        'Check your email for a secure password-reset link. You can close this page after opening the email.'
      );
    }

    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Forgot password | ApplyLoop</title>
        <meta
          name="description"
          content="Reset your ApplyLoop password."
        />
      </Head>

      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fc] p-4">
        <section className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-2xl shadow-blue-900/10 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mb-5 flex items-center justify-center gap-2">
              <img
                src="/logo.svg"
                alt="ApplyLoop"
                className="h-9 w-9"
              />

              <span className="text-xl font-extrabold text-slate-950">
                ApplyLoop
              </span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
              Reset your password
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter the email address connected to your ApplyLoop account.
            </p>
          </div>

          {message ? (
            <div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                <FiCheckCircle className="mx-auto h-9 w-9 text-emerald-600" />

                <p className="mt-3 text-sm font-semibold leading-6 text-emerald-800">
                  {message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMessage('');
                  setEmail('');
                }}
                className="mt-5 h-12 w-full rounded-xl border border-slate-200 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Send another email
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
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

              {formError && (
                <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {formError}
                </p>
              )}

              <button
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}

          <div className="mt-7 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
            >
              <FiArrowLeft />
              Back to sign in
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
