import React, { useEffect, useState } from 'react';
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
} from 'react-icons/fi';
import ApproveModal from '../../shared/components/ApproveModal';
import { createClient } from '../../lib/supabase/client';

// ════════════════════════════════════════════════════════════════════════════════
// FEEDBACK HISTORY PANEL — Slide-in side panel
// Backend: GET /api/applications/:id/feedback (list)
// Backend: POST /api/applications/:id/feedback (send message)
// ════════════════════════════════════════════════════════════════════════════════

function FeedbackPanel({
  onClose,
  feedback,
}) {
  return (
    <div
      className="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-100 animate-slideInRight"
      style={{
        width: '320px',
        minHeight: '480px',
      }}
    >
      <div className="flex justify-end p-4">
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <FiX className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-5 pb-4">
        <h3 className="text-xl font-bold text-gray-900">
          Feedback History
        </h3>
      </div>

      <div className="flex-1 mx-4 mb-4 bg-[#FFF9C4] rounded-2xl p-5">
        {feedback ? (
          <p className="text-sm text-gray-700 leading-relaxed">
            {feedback}
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            No feedback has been recorded for this Application.
          </p>
        )}
      </div>
    </div>
  );
}

const preferenceColors = [
  'text-purple-700 bg-purple-50 border border-purple-200',
  'text-orange-600 bg-orange-50 border border-orange-200',
  'text-orange-500 bg-orange-50 border border-orange-200',
];

function normalizePreference(
  preference,
  index
) {
  if (
    preference &&
    typeof preference === 'object'
  ) {
    return {
      label:
        preference.label || '',
      color:
        preference.color ||
        preferenceColors[
          index %
            preferenceColors.length
        ],
    };
  }

  return {
    label:
      String(
        preference || ''
      ),
    color:
      preferenceColors[
        index %
          preferenceColors.length
      ],
  };
}

function formatApplicationDate(
  value
) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return date.toLocaleDateString(
    'en-US',
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );
}

function formatApplicationTime(
  value
) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return date.toLocaleTimeString(
    'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
    }
  );
}

function getExternalHref(value) {
  const link =
    String(value || '').trim();

  if (!link) {
    return '#';
  }

  if (
    /^https?:\/\//i.test(link)
  ) {
    return link;
  }

  return `https://${link}`;
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE — Job Application Detail
// Backend: GET /api/applications/:id
// ════════════════════════════════════════════════════════════════════════════════

export default function ApplicationDetailPage() {
  const router = useRouter();
  const [app, setApp] = useState(null);
  const [isLoadingApplication, setIsLoadingApplication] = useState(true);
  const [applicationError, setApplicationError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

  useEffect(() => {
    if (!router.isReady) {
      return undefined;
    }

    const applicationId =
      Array.isArray(router.query.id)
        ? router.query.id[0]
        : router.query.id;

    if (!applicationId) {
      return undefined;
    }

    const previewClientId =
      Array.isArray(
        router.query.previewClientId
      )
        ? router.query
            .previewClientId[0]
        : router.query
            .previewClientId ||
          '';

    let cancelled = false;

    const loadApplication =
      async () => {
        setIsLoadingApplication(
          true
        );
        setApplicationError('');

        try {
          const supabase =
            createClient();

          if (!supabase) {
            throw new Error(
              'The Supabase connection is unavailable.'
            );
          }

          const {
            data: { session },
            error: sessionError,
          } =
            await supabase.auth.getSession();

          if (
            sessionError ||
            !session?.access_token
          ) {
            throw new Error(
              'Your session has expired. Please sign in again.'
            );
          }

          const query =
            previewClientId
              ? `?previewClientId=${encodeURIComponent(
                  previewClientId
                )}`
              : '';

          const response =
            await fetch(
              `/api/applications/${encodeURIComponent(
                applicationId
              )}${query}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${session.access_token}`,
                },
              }
            );

          const result =
            await response
              .json()
              .catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              result.error ||
                'The Application could not be loaded.'
            );
          }

          const application =
            result.application;

          if (!application) {
            throw new Error(
              'The Application could not be found.'
            );
          }

          const normalized = {
            ...application,
            date:
              formatApplicationDate(
                application.appliedAt
              ),
            applicationTime:
              formatApplicationTime(
                application.appliedAt
              ),
            preferences:
              (
                application.preferences ||
                []
              ).map(
                normalizePreference
              ),
            jobDetails:
              Array.isArray(
                application.jobDetails
              )
                ? application.jobDetails
                : [],
            qualities:
              Array.isArray(
                application.qualities
              )
                ? application.qualities
                : [],
            otherDetails:
              Array.isArray(
                application.otherDetails
              )
                ? application.otherDetails
                : [],
          };

          if (!cancelled) {
            setApp(normalized);
          }
        } catch (error) {
          if (!cancelled) {
            setApp(null);
            setApplicationError(
              error?.message ||
                'The Application could not be loaded.'
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoadingApplication(
              false
            );
          }
        }
      };

    loadApplication();

    return () => {
      cancelled = true;
    };
  }, [
    router.isReady,
    router.query.id,
    router.query.previewClientId,
  ]);

  if (
    isLoadingApplication
  ) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[420px] items-center justify-center">
          <p className="text-sm font-medium text-gray-500">
            Loading Application...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (
    applicationError ||
    !app
  ) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[420px] items-center justify-center px-5">
          <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-6 text-center">
            <h2 className="font-bold text-gray-900">
              Application unavailable
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {applicationError ||
                'The Application could not be loaded.'}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Job Application ({app.company}) | ApplyLoop</title>
        <meta name="description" content={`Job application for ${app.role} at ${app.company}`} />
      </Head>

      <DashboardLayout>
        <div className="max-w-3xl relative">
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
                    href={getExternalHref(app.jobLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] sm:text-sm text-[#1E50C3] hover:underline break-words whitespace-normal break-all block w-full"
                  >
                    {app.jobLink || 'Not supplied'}
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
                  <FeedbackPanel
                    onClose={() => setShowFeedback(false)}
                    feedback={app.feedback}
                  />
                </div>
              )}
            </div>

            {/* ── Divider between info and PDFs ── */}
            <hr className="border-gray-100 my-6" />

            {/* ── PDF Thumbnails ── */}
            {/* Backend: GET /api/applications/:id/documents */}
            {/* Returns: [{ name, type, url }] — render download links */}
            <div className="flex gap-5">
              {[
                app.resumeName || 'No resume attached',
                app.coverLetterName || 'No cover letter attached',
              ].map((label) => (
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
