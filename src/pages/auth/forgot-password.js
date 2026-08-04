import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../shared/context/AuthContext';

const AUTH_BG = {
  background: 'radial-gradient(ellipse at 50% 0%, #e4ecf9 0%, #f0f4fb 40%, #f8f9fd 100%)',
};

const LOGO = (
  <div className="flex items-center justify-center gap-2 mb-3">
    <img
      src="/logo.svg"
      alt="ApplyLoop Logo"
      className="w-6 h-6 object-contain select-none"
    />
    <span className="text-[15px] font-bold text-gray-900">ApplyLoop</span>
  </div>
);

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();

  // Steps: 1 = email, 2 = recovery code, 3 = new password
  const [step, setStep] = useState(1);

  // Step 1
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);

  // Step 2
  const [recoveryCode, setRecoveryCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  // Step 3
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isLoadingReset, setIsLoadingReset] = useState(false);

  // ──────────── Step 1: Submit email ────────────
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setEmailError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Email is invalid'); return; }
    setEmailError('');
    setIsLoadingEmail(true);
    try {
      await requestPasswordReset(email);
    } catch (_) {}
    setIsLoadingEmail(false);
    setStep(2);
  };

  // ──────────── Step 2: Verify code ────────────
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!recoveryCode) { setCodeError('Recovery code is required'); return; }
    setCodeError('');
    setIsLoadingCode(true);
    // Simulate code verification
    await new Promise((r) => setTimeout(r, 800));
    setIsLoadingCode(false);
    setStep(3);
  };

  // ──────────── Step 3: Update password ────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordError('');
    setIsLoadingReset(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoadingReset(false);
    // Redirect to login after success
    window.location.href = '/auth/login';
  };

  return (
    <>
      <Head>
        <title>Forgot Password | ApplyLoop</title>
        <meta name="description" content="Reset your ApplyLoop password" />
      </Head>

      <div
        className="min-h-screen flex items-center justify-center p-4 bg-gray-50"
        style={AUTH_BG}
      >
        {/* ─── STEP 1: Enter Email ─── */}
        {step === 1 && (
          <div className="w-[440px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 flex flex-col gap-8">
            <div className="text-center space-y-4">
              {LOGO}
              <h2 className="text-[22px] font-bold text-gray-900">
                Forgot Password
              </h2>
              <p className="text-[13px] text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                Please provide your email address below so we can send you a recovery code.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-6">
              <div>
                <label htmlFor="fp-email" className="block text-[12px] text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="fp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full px-4 py-3 border ${emailError ? 'border-red-400' : 'border-gray-100'} rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1E50C3] focus:ring-1 focus:ring-[#1E50C3] transition-all text-[13px]`}
                  placeholder="banjidhevid216@gmail.com"
                />
                {emailError && <p className="mt-1 text-[11px] text-red-500">{emailError}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoadingEmail}
                  className="w-full flex justify-center py-3.5 px-4 rounded-full text-white font-medium bg-[#2453CA] hover:bg-[#1E46AA] transition-colors disabled:opacity-50 text-[14px]"
                >
                  {isLoadingEmail ? 'Sending...' : 'Confirm'}
                </button>
              </div>
            </form>

            <div className="text-center mt-2">
              <Link href="/auth/forgot-password" className="text-[13px] text-gray-500 hover:text-gray-700 transition-colors">
                Forgot Password?
              </Link>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Enter Recovery Code ─── */}
        {step === 2 && (
          <div className="w-[440px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 flex flex-col gap-8">
            <div className="text-center space-y-4">
              {LOGO}
              <h2 className="text-[22px] font-bold text-gray-900">
                Forgot Password
              </h2>
              <p className="text-[13px] text-gray-800">
                A code has been sent to <span className="font-bold">{email}</span>
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} className="flex flex-col gap-6">
              <div>
                <label htmlFor="recovery-code" className="block text-[12px] text-gray-700 mb-2">
                  Recovery Code
                </label>
                <input
                  id="recovery-code"
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  className={`block w-full px-4 py-3 border ${codeError ? 'border-red-400' : 'border-gray-100'} rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1E50C3] focus:ring-1 focus:ring-[#1E50C3] transition-all text-[13px]`}
                  placeholder="banjidhevid216@gmail.com"
                />
                {codeError && <p className="mt-1 text-[11px] text-red-500">{codeError}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoadingCode}
                  className="w-full flex justify-center py-3.5 px-4 rounded-full text-white font-medium bg-[#2453CA] hover:bg-[#1E46AA] transition-colors disabled:opacity-50 text-[14px]"
                >
                  {isLoadingCode ? 'Verifying...' : 'Confirm'}
                </button>
              </div>
            </form>

            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[13px] text-[#2453CA] hover:text-[#1E46AA] underline decoration-1 underline-offset-2 transition-colors"
              >
                Change Email Address
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Update Password ─── */}
        {step === 3 && (
          <div className="w-[440px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 flex flex-col gap-8">
            <div className="text-center space-y-4">
              {LOGO}
              <h2 className="text-[22px] font-bold text-gray-900">
                Update password
              </h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6">
              {/* New Password */}
              <div>
                <label htmlFor="new-password" className="block text-[12px] text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`block w-full pl-4 pr-11 py-3 border ${passwordError ? 'border-red-400' : 'border-gray-100'} rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1E50C3] focus:ring-1 focus:ring-[#1E50C3] transition-all text-[13px] tracking-widest`}
                    placeholder="***********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showNew ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirm-password" className="block text-[12px] text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`block w-full pl-4 pr-11 py-3 border ${passwordError ? 'border-red-400' : 'border-gray-100'} rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1E50C3] focus:ring-1 focus:ring-[#1E50C3] transition-all text-[13px] tracking-widest`}
                    placeholder="***********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirm ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && <p className="mt-1 text-[11px] text-red-500">{passwordError}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoadingReset}
                  className="w-full flex justify-center py-3.5 px-4 rounded-full text-white font-medium bg-[#2453CA] hover:bg-[#1E46AA] transition-colors disabled:opacity-50 text-[14px]"
                >
                  {isLoadingReset ? 'Updating...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
