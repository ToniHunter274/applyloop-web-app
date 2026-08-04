import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '../../shared/components/DashboardLayout';
import {
  FiRefreshCw,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiStar,
  FiLink,
  FiX,
  FiSend,
} from 'react-icons/fi';
import ApproveModal from '../../shared/components/ApproveModal';

// ─── Mock data import (replace with API call when backend is ready) ──────────
// Backend: GET /api/applications/:id
import { MOCK_APPLICATION_DETAIL } from '../../data/mockData';

// ════════════════════════════════════════════════════════════════════════════════
// FEEDBACK HISTORY PANEL — Slide-in side panel
// Backend: GET /api/applications/:id/feedback (list)
// Backend: POST /api/applications/:id/feedback (send message)
// ════════════════════════════════════════════════════════════════════════════════

function FeedbackPanel({ onClose }) {
  const [message, setMessage] = useState('');

  return (
    <div className="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-100 animate-slideInRight"
      style={{ width: '320px', minHeight: '480px' }}
    >
      {/* Close button — top right */}
      <div className="flex justify-end p-4">
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <FiX className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title */}
      <div className="px-5 pb-4">
        <h3 className="text-xl font-bold text-gray-900">Feedback History</h3>
      </div>

      {/* Yellow card — fills remaining space */}
      <div className="flex-1 mx-4 mb-4 bg-[#FFF9C4] rounded-2xl flex flex-col overflow-hidden">
        {/* Messages area */}
        {/* Backend: Each message has { id, title?, sender?, body, author, date } */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {MOCK_APPLICATION_DETAIL.feedbackHistory.map((fb) => (
            <div key={fb.id} className="flex flex-col gap-1">
              {fb.title && (
                <p className="text-sm font-bold text-gray-900 text-center">{fb.title}</p>
              )}
              {fb.sender && (
                <p className="text-xs text-gray-600 text-center">{fb.sender}</p>
              )}
              <p className="text-sm text-gray-700 leading-relaxed mt-1">{fb.body}</p>
              <p className="text-xs text-gray-500 text-right mt-1">
                — {fb.author} | {fb.date}
              </p>
              <hr className="border-yellow-300 mt-2" />
            </div>
          ))}
        </div>

        {/* Message input — bottom of yellow card */}
        <div className="px-4 py-3 flex items-center gap-2 border-t border-yellow-300">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            // Security: Sanitize on backend before storing. No raw HTML rendering.
            className="flex-1 bg-transparent text-sm text-gray-600 placeholder-gray-400 focus:outline-none italic"
          />
          <button
            onClick={() => {
              // TODO(Backend): POST /api/applications/${id}/feedback
              // Payload: { message }
              // Security: Sanitize input, validate auth token
              if (message.trim()) {
                console.log('Sending feedback message:', message);
                setMessage('');
              }
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// STICKY NOTE — Small floating card on right side
// Backend: GET /api/applications/:id (stickyNote field in response)
// ════════════════════════════════════════════════════════════════════════════════

function StickyNote({ note, onClose }) {
  return (
    <div className="absolute -right-4 sm:-right-16 top-4 w-[180px] sm:w-[220px] bg-[#FFF7B3] rounded-xl shadow-xl p-4 z-30">
      {/* Pin icon + close */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-blue-600 text-lg">📌</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-sm font-bold text-gray-900">{note.company}</p>
      <p className="text-xs text-gray-600 mb-3">{note.role}</p>
      <p className="text-xs text-gray-500">
        — {note.author} &nbsp; {note.date}
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE — Job Application Detail
// Backend: GET /api/applications/:id
// ════════════════════════════════════════════════════════════════════════════════

export default function ApplicationDetailPage() {
  const router = useRouter();
  // TODO(Backend): Replace with useSWR or useEffect + fetch
  // Endpoint: GET /api/applications/${router.query.id}
  // Response shape should match MOCK_APPLICATION_DETAIL
  const app = MOCK_APPLICATION_DETAIL;

  const [showStickyNote, setShowStickyNote] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Job Application ({app.company}) | ApplyLoop</title>
        <meta name="description" content={`Job application for ${app.role} at ${app.company}`} />
      </Head>

      <DashboardLayout>
        <div className="max-w-3xl relative">
          {/* ── Sticky note trigger — pin icon on right ── */}
          {!showStickyNote && (
            <button
              onClick={() => setShowStickyNote(true)}
              className="absolute -right-4 sm:-right-16 top-6 w-10 h-10 hidden sm:flex items-center justify-center text-blue-600 hover:scale-110 transition-transform"
            >
              <span className="text-2xl drop-shadow-md">📌</span>
            </button>
          )}

          {/* ── Sticky note overlay ── */}
          {showStickyNote && (
            <StickyNote note={app.stickyNote} onClose={() => setShowStickyNote(false)} />
          )}

          {/* ═══════════════════════════════════════════════════════════════════
           *  SINGLE WHITE CARD — Contains info table, buttons, PDFs
           *  Matches Figma: info rows left, buttons right, PDFs below divider
           * ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-gray-100 rounded-2xl px-6 sm:px-8 py-6 mb-6">

            {/* ── Top section: Info rows (left) + Buttons (right) ── */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between">

              {/* Left side: Info rows */}
              {/* Backend: All fields from GET /api/applications/:id response */}
              <div className="flex-1 divide-y divide-gray-100 min-w-0">

                {/* Status */}
                <div className="flex items-center py-2 sm:py-3 gap-2 sm:gap-6">
                  <div className="flex items-center gap-1 sm:gap-2 w-24 sm:w-44 text-[10px] sm:text-sm text-gray-500 shrink-0">
                    <FiRefreshCw className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                    Status
                  </div>
                  {/* Backend: status field — possible values: Pending, Interview, Offered, Rejected */}
                  <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-md text-[9px] sm:text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                    {app.status}
                  </span>
                </div>

                {/* Role */}
                <div className="flex items-center py-2 sm:py-3 gap-2 sm:gap-6">
                  <div className="flex items-center gap-1 sm:gap-2 w-24 sm:w-44 text-[10px] sm:text-sm text-gray-500 shrink-0">
                    <FiBriefcase className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                    Role
                  </div>
                  <span className="text-[10px] sm:text-sm text-gray-800 break-words">{app.role}</span>
                </div>

                {/* Dates */}
                <div className="flex items-center py-2 sm:py-3 gap-2 sm:gap-6">
                  <div className="flex items-center gap-1 sm:gap-2 w-24 sm:w-44 text-[10px] sm:text-sm text-gray-500 shrink-0">
                    <FiCalendar className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                    Dates
                  </div>
                  <span className="text-[10px] sm:text-sm text-gray-800 break-words">{app.date}</span>
                </div>

                {/* Application Time */}
                <div className="flex items-center py-2 sm:py-3 gap-2 sm:gap-6">
                  <div className="flex items-center gap-1 sm:gap-2 w-24 sm:w-44 text-[10px] sm:text-sm text-gray-500 shrink-0">
                    <FiClock className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                    Application Time
                  </div>
                  <span className="text-[10px] sm:text-sm text-gray-800 break-words">{app.applicationTime}</span>
                </div>

                {/* Preferences */}
                <div className="flex items-center py-2 sm:py-3 gap-2 sm:gap-6">
                  <div className="flex items-center gap-1 sm:gap-2 w-24 sm:w-44 text-[10px] sm:text-sm text-gray-500 shrink-0">
                    <FiStar className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                    Preferences
                  </div>
                  {/* Backend: preferences array — each item: { label, color } */}
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {app.preferences.map((p) => (
                      <span
                        key={p.label}
                        className={`px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-md text-[8px] sm:text-xs font-semibold ${p.color} whitespace-nowrap`}
                      >
                        {p.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Job Link */}
                <div className="flex items-center py-2 sm:py-3 gap-2 sm:gap-6">
                  <div className="flex items-center gap-1 sm:gap-2 w-24 sm:w-44 text-[10px] sm:text-sm text-gray-500 shrink-0">
                    <FiLink className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                    Job Link
                  </div>
                  {/* Security: Validate URL format on backend, use rel="noopener noreferrer" */}
                  <a
                    href={`https://${app.jobLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] sm:text-sm text-[#1E50C3] hover:underline break-words whitespace-normal break-all block w-full"
                  >
                    {app.jobLink}
                  </a>
                </div>
              </div>

              {/* Right side: Action buttons OR Feedback History panel */}
              {/* Backend: PUT /api/applications/:id/approve */}
              {/* Backend: Opens feedback panel for POST /api/applications/:id/feedback */}
              {!showFeedback ? (
                <div className="flex flex-row items-end justify-end gap-1 sm:gap-3 shrink-0 transition-opacity duration-300">
                  <button
                    onClick={() => setIsApproveModalOpen(true)}
                    className="px-2 py-1.5 sm:px-5 sm:py-2.5 rounded-md sm:rounded-xl bg-[#1E50C3] text-white text-[9px] sm:text-sm font-semibold hover:bg-[#1A45A7] transition-colors whitespace-nowrap"
                  >
                    Approve Application
                  </button>
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="px-2 py-1.5 sm:px-5 sm:py-2.5 rounded-md sm:rounded-xl border border-[#1E50C3] text-[#1E50C3] text-[9px] sm:text-sm font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap"
                  >
                    Send Feedback
                  </button>
                </div>
              ) : (
                <div className="shrink-0 scale-75 sm:scale-100 origin-right">
                  <FeedbackPanel onClose={() => setShowFeedback(false)} />
                </div>
              )}
            </div>

            {/* ── Divider between info and PDFs ── */}
            <hr className="border-gray-100 my-6" />

            {/* ── PDF Thumbnails ── */}
            {/* Backend: GET /api/applications/:id/documents */}
            {/* Returns: [{ name, type, url }] — render download links */}
            <div className="flex gap-5">
              {['Submitted Resume .pdf', 'Submitted Cover letter.pdf'].map((label) => (
                <div key={label} className="flex flex-col items-center gap-2 cursor-pointer group">
                  {/* PDF Icon thumbnail */}
                  <div className="w-[100px] sm:w-[120px] h-[120px] sm:h-[140px] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col items-center justify-center relative overflow-hidden group-hover:shadow-md transition-shadow">
                    {/* Red PDF badge */}
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow">
                      PDF
                    </div>
                    {/* Page lines decoration */}
                    <div className="mt-10 w-16 flex flex-col gap-1.5">
                      <div className="h-1 bg-gray-100 rounded" />
                      <div className="h-1 bg-gray-100 rounded" />
                      <div className="h-1 bg-gray-100 rounded w-3/4" />
                    </div>
                    {/* Folded corner */}
                    <div
                      className="absolute bottom-0 right-0 w-8 h-8 bg-gray-100"
                      style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 font-medium text-center">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
           *  JOB DETAILS SECTION
           *  Backend: jobDetails array from GET /api/applications/:id
           * ═══════════════════════════════════════════════════════════════════ */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
              Job Details
            </h3>
            <ul className="space-y-2">
              {app.jobDetails.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-gray-400 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
           *  QUALITIES AND CHARACTERISTICS
           *  Backend: qualities array from GET /api/applications/:id
           * ═══════════════════════════════════════════════════════════════════ */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
              Qualities and Characteristics
            </h3>
            <ul className="space-y-2">
              {app.qualities.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-gray-400 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
           *  OTHER DETAILS
           *  Backend: otherDetails array from GET /api/applications/:id
           * ═══════════════════════════════════════════════════════════════════ */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
              Other Details
            </h3>
            <ul className="space-y-2">
              {app.otherDetails.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-gray-400 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>



        {/* ── Approve Modal ── */}
        {/* Backend: PUT /api/applications/:id/approve */}
        <ApproveModal
          isOpen={isApproveModalOpen}
          onClose={() => setIsApproveModalOpen(false)}
          onConfirm={() => {
            // TODO(Backend): Map to PUT /api/applications/${router.query.id}/approve
            // Security: Validate auth token, check user permissions
            console.log('Application approved!');
          }}
        />
      </DashboardLayout>
    </>
  );
}
