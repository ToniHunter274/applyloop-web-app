import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
} from 'react-icons/fi';
import { useAuth } from '../../shared/context/AuthContext';

export default function ResetPassword() {
  const {
    isAuthenticated,
    isLoading,
    resetPassword,
    logout,
    clearError,
  } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      setFormError('Your password must contain at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('The passwords do not match.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    clearError();

    const result = await resetPassword({
      newPassword,
    });

    if (!result.success) {
      setFormError(result.error);
      setSubmitting(false);
      return;
    }

    setSuccessMessage(
      'Your password has been updated. You will now return to the sign-in page.'
    );

    window.setTimeout(() => {
      logout();
    }, 1800);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fc]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-11 w-11 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
          <p className="text-sm font-medium text-slate-500">
            Verifying your reset link...
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Choose a new password | ApplyLoop</title>
        <meta
          name="description"
          content="Choose a new password for your ApplyLoop account."
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
              Choose a new password
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter and confirm the new password for your account.
            </p>
          </div>

          {!isAuthenticated ? (
            <div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
                <FiAlertCircle className="mx-auto h-9 w-9 text-amber-600" />

                <p className="mt-3 text-sm font-semibold leading-6 text-amber-800">
                  This password-reset link is invalid or has expired.
                </p>
              </div>

              <Link
                href="/auth/forgot-password"
                className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white transition hover:bg-blue-800"
              >
                Request another reset link
              </Link>
            </div>
          ) : successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <FiCheckCircle className="mx-auto h-9 w-9 text-emerald-600" />

              <p className="mt-3 text-sm font-semibold leading-6 text-emerald-800">
                {successMessage}
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  New password
                </span>

                <span className="relative block">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(event.target.value)
                    }
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword((value) => !value)
                    }
                    aria-label={
                      showNewPassword
                        ? 'Hide new password'
                        : 'Show new password'
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirm new password
                </span>

                <span className="relative block">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirmed password'
                        : 'Show confirmed password'
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </span>
              </label>

              {formError && (
                <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {formError}
                </p>
              )}

              <button
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? 'Updating password...'
                  : 'Update password'}
              </button>
            </form>
          )}
        </section>
      </main>
    </>
  );
}
