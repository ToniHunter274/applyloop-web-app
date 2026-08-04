import React, { useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '../shared/components/DashboardLayout';
import { FiX, FiArrowLeft, FiDownload, FiPause, FiRefreshCw } from 'react-icons/fi';
import { HiOutlineSwitchVertical } from 'react-icons/hi';

// ─── Cancel / Pause Modals ────────────────────────────────────────────────────

function ManageSubscriptionModal({ type, onClose }) {
  const config = {
    cancel: {
      title: 'Cancel Subscription',
      description: 'Cancel your subscription and discontinue application services.',
      buttonLabel: 'Cancel Subscription',
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    pause: {
      title: 'Pause Subscription',
      description: 'Take a break while keeping your account and data safe.',
      buttonLabel: 'Pause Subscription',
      buttonClass: 'bg-[#1E50C3] hover:bg-[#1A45A7] text-white',
    },
  };
  const c = config[type];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-[440px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Manage Subscription</span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{c.title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{c.description}</p>
        </div>
        <div className="px-6 pb-6 flex justify-end">
          <button onClick={onClose} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${c.buttonClass}`}>
            {c.buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────

// ─── Centralized mock data (replace with API calls when backend is ready) ────
// Backend: GET /api/billing/plan, GET /api/billing/receipts
import {
  MOCK_PLAN as PLAN,
  MOCK_PLANS as PLANS,
  MOCK_RECEIPTS as RECEIPTS,
  MOCK_MANAGE_ACTIONS as MANAGE_ACTIONS_DATA,
} from '../data/mockData';

const MANAGE_ACTIONS = MANAGE_ACTIONS_DATA.map(action => {
  let icon = null;
  if (action.id === 'pause') icon = <FiPause className="w-5 h-5 text-gray-700" />;
  if (action.id === 'change') icon = <HiOutlineSwitchVertical className="w-5 h-5 text-gray-700" />;
  if (action.id === 'cancel') icon = <FiX className="w-5 h-5 text-gray-700" />;
  if (action.id === 'resubscribe') icon = <FiRefreshCw className="w-5 h-5 text-gray-700" />;
  return { ...action, icon };
});

// ─── Sub-views ────────────────────────────────────────────────────────────────

function ManageSubscriptionView({ onBack, onSelectAction }) {
  return (
    <div className="max-w-4xl">
      {/* Back nav */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 mb-6 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        Manage Subscription
      </button>

      {/* Action cards grid */}
      <div className="grid grid-cols-3 gap-4">
        {MANAGE_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => onSelectAction(action.id)}
            className="text-left bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 hover:shadow-sm transition-all"
          >
            <div className="mb-3">{action.icon}</div>
            <p className="text-sm font-bold text-gray-900 mb-1.5">{action.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChangePlanView({ onBack }) {
  const [selectedPlan, setSelectedPlan] = useState('Basic Plan');

  return (
    <div className="max-w-4xl">
      {/* Back nav */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 mb-6 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        Change Plan
      </button>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.name === selectedPlan || plan.current;
          return (
            <div
              key={plan.name}
              onClick={() => setSelectedPlan(plan.name)}
              className={`cursor-pointer rounded-2xl p-6 border-2 transition-all ${
                isCurrent
                  ? 'bg-[#E8EDF8] border-[#1E50C3]'
                  : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              {/* Name + price row */}
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-bold text-gray-900">{plan.name}</p>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-gray-900">{plan.price}</p>
                  <p className="text-xs text-gray-500">per month</p>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-gray-200 mb-4" />

              {/* Benefits */}
              <ul className="space-y-1.5 mb-6">
                {plan.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-1 h-1 rounded-full bg-gray-600 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                className={`w-full py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  isCurrent
                    ? 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'
                    : 'border-[#1E50C3] text-[#1E50C3] hover:bg-[#eef2fb]'
                }`}
                onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan.name); }}
              >
                {isCurrent ? 'Current Subscription' : 'Choose Subscription'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// view: 'main' | 'manage' | 'change-plan'
export default function BillingPage() {
  const [view, setView] = useState('main');
  const [modal, setModal] = useState(null); // 'cancel' | 'pause'

  const usagePercent = Math.round((PLAN.appsUsed / PLAN.appsTotal) * 100);

  function handleManageAction(id) {
    if (id === 'pause') setModal('pause');
    else if (id === 'cancel') setModal('cancel');
    else if (id === 'change') setView('change-plan');
    // resubscribe is a no-op for now
  }

  return (
    <>
      <Head>
        <title>Billing &amp; Subscription | ApplyLoop</title>
        <meta name="description" content="Manage your plan, billing, and application volume with ease." />
      </Head>

      <DashboardLayout>
        {/* ── Manage Subscription view ── */}
        {view === 'manage' && (
          <ManageSubscriptionView
            onBack={() => setView('main')}
            onSelectAction={handleManageAction}
          />
        )}

        {/* ── Change Plan view ── */}
        {view === 'change-plan' && (
          <ChangePlanView onBack={() => setView('manage')} />
        )}

        {/* ── Main view ── */}
        {view === 'main' && (
          <div className="max-w-4xl space-y-6">
            {/* Plan Card */}
            <div className="bg-white border border-gray-100 rounded-2xl px-6 sm:px-8 py-6">
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
                {/* Left: plan name + usage */}
                <div className="flex-1">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Plan</p>
                  <p className="text-xl font-bold text-gray-900 mb-4">{PLAN.name}</p>

                  <p className="text-xs text-gray-500 mb-1.5">
                    Applications Used: {PLAN.appsUsed} / {PLAN.appsTotal}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1E50C3] rounded-full"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{usagePercent}%</span>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => setView('manage')}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Manage subscription
                    </button>
                  </div>
                </div>

                {/* Right: benefits + status */}
                <div className="flex-1">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Plan Benefits</p>
                  <ul className="space-y-1 mb-6">
                    {PLAN.benefits.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-1 h-1 rounded-full bg-gray-700 flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-8 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Status</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">{PLAN.status}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Next Billing</p>
                      <p className="text-sm font-semibold text-gray-900">{PLAN.nextBilling}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Price/month</p>
                      <p className="text-sm font-semibold text-gray-900">{PLAN.price}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipts */}
            <div className="bg-white border border-gray-100 rounded-2xl px-8 py-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Receipts</h2>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {RECEIPTS.map((r, i) => (
                    <tr key={i} className="text-sm text-gray-700">
                      <td className="py-4">{r.date}</td>
                      <td className="py-4">{r.type}</td>
                      <td className="py-4 font-medium">{r.total}</td>
                      <td className="py-4 text-right">
                        <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1E50C3] text-white text-xs font-semibold hover:bg-[#1A45A7] transition-colors ml-auto">
                          <FiDownload className="w-3.5 h-3.5" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modals */}
        {modal && (
          <ManageSubscriptionModal type={modal} onClose={() => setModal(null)} />
        )}
      </DashboardLayout>
    </>
  );
}
