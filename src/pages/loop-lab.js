import React, { useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '../shared/components/DashboardLayout';
import { FiCalendar, FiClock, FiX, FiPlay } from 'react-icons/fi';

// ─── Mock data import (replace with API calls when backend is ready) ─────────
// Backend: GET /api/interviews
import { MOCK_INTERVIEWS as INTERVIEWS, LAB_DURATIONS } from '../data/mockData';

function StartLabModal({ interview, onClose, onStart }) {
  const [selected, setSelected] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[680px] p-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Choose Lab Duration</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* 4x2 duration grid */}
        <div className="grid grid-cols-4 gap-3">
          {LAB_DURATIONS.map((opt, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`text-center py-5 px-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-[#1E50C3] bg-[#eef2fb]'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className={`text-base font-bold ${isSelected ? 'text-[#1E50C3]' : 'text-gray-900'}`}>
                  {opt.label}
                </p>
                <p className={`text-xs mt-1 ${isSelected ? 'text-[#1E50C3]/70' : 'text-gray-400'}`}>
                  {opt.sub}
                </p>
              </button>
            );
          })}
        </div>

        {/* Divider + action */}
        <div className="border-t border-gray-100 pt-4 flex justify-end">
          <button
            onClick={onStart || onClose}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1E50C3] text-white font-semibold text-sm hover:bg-[#1A45A7] transition-colors"
          >
            Start Lab Session
            <FiPlay className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function SkeletonLines() {
  const lines = [
    'w-3/4', 'w-full', 'w-5/6', 'w-full', 'w-4/5',
    'w-full', 'w-3/4', 'w-full', 'w-5/6', 'w-full',
    'w-4/5', 'w-full', 'w-3/4', 'w-5/6', 'w-4/5',
    'w-full', 'w-3/4',
  ];
  return (
    <div className="flex flex-col gap-2.5 p-6">
      {lines.map((w, i) => (
        <div key={i} className={`h-3 rounded-sm bg-gray-200 animate-pulse ${w}`} />
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LoopLabPage() {
  const [activeModal, setActiveModal] = useState(null);   // interview object for duration modal
  const [activeSession, setActiveSession] = useState(null); // interview object for active session

  function handleBeginSession(interview) {
    setActiveModal(null);
    setActiveSession(interview);
  }

  // ── Active Session View ──
  if (activeSession) {
    return (
      <>
        <Head>
          <title>Active Lab Session | ApplyLoop</title>
          <meta name="description" content="Your active interview preparation lab session." />
        </Head>
        <DashboardLayout>
          <div className="max-w-4xl flex flex-col gap-4">
            {/* Session banner */}
            <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5">
              <h2 className="text-base font-bold text-gray-900">Active Lab Session</h2>
              <p className="text-sm text-gray-500 mt-1">
                Preparing for{' '}
                <span className="font-semibold text-gray-800">{activeSession.role}</span>{' '}
                at{' '}
                <span className="font-semibold text-gray-800">{activeSession.company}</span>
              </p>
            </div>

            {/* Skeleton content area */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden min-h-[380px]">
              <SkeletonLines />
            </div>

            {/* Update button — bottom right */}
            <div className="flex justify-end">
              <button
                onClick={() => setActiveSession(null)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1E50C3] text-white text-sm font-semibold hover:bg-[#1A45A7] transition-colors"
              >
                Update Interview Session
                <FiClock className="w-4 h-4" />
              </button>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  // ── Default: Upcoming Interviews ──
  return (
    <>
      <Head>
        <title>Loop Lab | ApplyLoop</title>
        <meta name="description" content="Your personal interview preparation workspace." />
      </Head>

      <DashboardLayout>
        <div className="max-w-4xl">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Upcoming Interviews</h2>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {INTERVIEWS.map((iv) => (
              <div
                key={iv.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-5 gap-4 sm:gap-0 hover:bg-gray-50/60 transition-colors"
              >
                {/* Left: company + role + meta */}
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div>
                    <span className="text-sm font-bold text-gray-900">{iv.company}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{iv.role}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" />
                      {iv.date}
                    </span>
                    <span className="text-gray-200">•</span>
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {iv.time}
                    </span>
                    <span className="text-gray-200">•</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-md text-gray-600 text-[11px] font-medium">
                      {iv.topic}
                    </span>
                    <span className="text-gray-200">•</span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${iv.statusColor}`}>
                      {iv.status}
                    </span>
                  </div>
                </div>

                {/* Right: days until + button */}
                <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-4 flex-shrink-0 sm:ml-4 border-t sm:border-0 border-gray-100 pt-4 sm:pt-0 mt-2 sm:mt-0">
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    <span className="font-semibold text-gray-700">{iv.daysUntil} days</span> until
                  </span>
                  <button
                    onClick={() => setActiveModal(iv)}
                    className="px-5 py-2.5 rounded-xl bg-[#1E50C3] text-white text-sm font-semibold hover:bg-[#1A45A7] transition-colors whitespace-nowrap"
                  >
                    {iv.started ? 'Continue Lab' : 'Start Lab'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lab Duration Modal */}
        {activeModal && (
          <StartLabModal
            interview={activeModal}
            onClose={() => setActiveModal(null)}
            onStart={() => handleBeginSession(activeModal)}
          />
        )}
      </DashboardLayout>
    </>
  );
}
