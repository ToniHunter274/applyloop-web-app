import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiFileText,
  FiMail,
  FiUserX,
  FiCalendar,
  FiMessageSquare,
  FiChevronLeft,
  FiChevronRight,
  FiFile,
  FiSearch,
  FiX,
} from 'react-icons/fi';
import { HiOutlineSpeakerphone } from 'react-icons/hi';

import SEO from '../shared/components/SEO';
import DashboardLayout from '../shared/components/DashboardLayout';
import { createClient } from '../lib/supabase/client';

// ─── Mock data import (replace with API call when backend is ready) ──────────
// Backend: GET /api/applications

async function getAccessToken() {
  const supabase = createClient();

  if (!supabase) {
    throw new Error('The Supabase connection is unavailable.');
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error(
      'Your session has expired. Please sign in again.'
    );
  }

  return session.access_token;
}

function formatApplicationDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Dashboard() {
  const router = useRouter();

  const previewClientId =
    router.isReady
      ? Array.isArray(router.query.previewClientId)
        ? router.query.previewClientId[0]
        : router.query.previewClientId || ''
      : '';

  const [applications, setApplications] = useState([]);
  const [applicationSummary, setApplicationSummary] = useState({
    totalApplications: 0,
    persistedApplications: 0,
    historicalApplications: 0,
  });
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [applicationsError, setApplicationsError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [announcements, setAnnouncements] = useState([]);
  const [seenAnnouncementIds, setSeenAnnouncementIds] = useState([]);
  const [announcementStorageKey, setAnnouncementStorageKey] = useState('');
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState('');

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const searchParam =
      Array.isArray(router.query.search)
        ? router.query.search[0]
        : router.query.search;

    if (typeof searchParam === 'string') {
      setSearchQuery(searchParam);
    }
  }, [
    router.isReady,
    router.query.search,
  ]);

  useEffect(() => {
    if (!router.isReady) {
      return undefined;
    }

    let cancelled = false;

    const loadApplications = async () => {
      setIsLoadingApplications(true);
      setApplicationsError('');

      try {
        const accessToken = await getAccessToken();

        const query = previewClientId
          ? `?clientId=${encodeURIComponent(previewClientId)}`
          : '';

        const response = await fetch(
          `/api/applications${query}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Unable to load your applications.'
          );
        }

        const applicationRows =
          (Array.isArray(data.applications)
            ? data.applications
            : []
          ).map((application) => ({
            ...application,
            resumeName:
              application.resumeName ||
              (
                application.resume &&
                application.resume !== 'N/A'
                  ? application.resume
                  : null
              ),
            coverLetterName:
              application.coverLetterName ||
              (
                application.coverLetter &&
                application.coverLetter !== 'N/A'
                  ? application.coverLetter
                  : null
              ),
            jobUrl:
              application.jobUrl ||
              application.jobLink ||
              '',
          }));

        if (!cancelled) {
          setApplications(applicationRows);

          setApplicationSummary(
            data.summary || {
              totalApplications:
                applicationRows.length,
              persistedApplications:
                applicationRows.length,
              historicalApplications: 0,
            }
          );
        }
      } catch (error) {
        if (!cancelled) {
          setApplications([]);
          setApplicationSummary({
            totalApplications: 0,
            persistedApplications: 0,
            historicalApplications: 0,
          });

          setApplicationsError(
            error.message ||
              'Unable to load your applications.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingApplications(false);
        }
      }
    };

    loadApplications();

    return () => {
      cancelled = true;
    };
  }, [
    previewClientId,
    router.isReady,
  ]);

  useEffect(() => {
    if (previewClientId) {
      setAnnouncements([]);
      setAnnouncementsError('');
      setIsLoadingAnnouncements(false);

      return undefined;
    }

    let mounted = true;

    const loadAnnouncements = async () => {
      setIsLoadingAnnouncements(true);
      setAnnouncementsError('');

      try {
        const accessToken = await getAccessToken();

        const supabase =
          createClient();

        const {
          data: {
            session,
          },
        } =
          await supabase.auth
            .getSession();

        const storageKey =
          `applyloop:client-announcements-seen:${session?.user?.id || 'client'}`;

        setAnnouncementStorageKey(
          storageKey
        );

        if (
          typeof window !==
          'undefined'
        ) {
          try {
            const stored =
              JSON.parse(
                window.localStorage
                  .getItem(
                    storageKey
                  ) ||
                  '[]'
              );

            setSeenAnnouncementIds(
              Array.isArray(
                stored
              )
                ? stored
                : []
            );
          } catch {
            setSeenAnnouncementIds(
              []
            );
          }
        }

        const response = await fetch(
          '/api/client/announcements',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Unable to load important updates.'
          );
        }

        if (!mounted) return;

        setAnnouncements(
          Array.isArray(data.announcements)
            ? data.announcements
            : []
        );
      } catch (error) {
        if (mounted) {
          setAnnouncementsError(
            error.message ||
              'Unable to load important updates.'
          );
        }
      } finally {
        if (mounted) {
          setIsLoadingAnnouncements(false);
        }
      }
    };

    loadAnnouncements();

    return () => {
      mounted = false;
    };
  }, [previewClientId]);


  const unseenAnnouncements =
    announcements.filter(
      (announcement) =>
        !seenAnnouncementIds
          .includes(
            announcement.id
          )
    );

  const activeAnnouncement =
    unseenAnnouncements[0] ||
    null;

  const markAnnouncementSeen =
    (announcementId) => {
      if (!announcementId) {
        return;
      }

      const nextSeen =
        Array.from(
          new Set([
            ...seenAnnouncementIds,
            announcementId,
          ])
        );

      setSeenAnnouncementIds(
        nextSeen
      );

      if (
        announcementStorageKey &&
        typeof window !==
          'undefined'
      ) {
        window.localStorage
          .setItem(
            announcementStorageKey,
            JSON.stringify(
              nextSeen
            )
          );
      }
    };

  const announcementToneStyles = {
    info: {
      wrap:
        'border-blue-200 bg-blue-50/80',
      icon:
        'bg-blue-100 text-blue-700',
      badge:
        'text-blue-700',
    },
    success: {
      wrap:
        'border-emerald-200 bg-emerald-50/80',
      icon:
        'bg-emerald-100 text-emerald-700',
      badge:
        'text-emerald-700',
    },
    warning: {
      wrap:
        'border-amber-200 bg-amber-50/90',
      icon:
        'bg-amber-100 text-amber-700',
      badge:
        'text-amber-700',
    },
    critical: {
      wrap:
        'border-red-200 bg-red-50/90',
      icon:
        'bg-red-100 text-red-700',
      badge:
        'text-red-700',
    },
  };

  const activeAnnouncementTone =
    announcementToneStyles[
      activeAnnouncement
        ?.tone
    ] ||
    announcementToneStyles
      .info;


  // Status Badge styles helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Interview Scheduled':
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            Interview Scheduled
          </span>
        );
      case 'Offer Received':
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-900/50">
            Offer Received
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-900/50">
            Rejected
          </span>
        );
      case 'Waiting':
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
            Waiting
          </span>
        );
      case 'Submitted':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
            Submitted
          </span>
        );
    }
  };

  const normalizedSearch =
    searchQuery.trim().toLowerCase();

  const filteredApps = applications.filter(
    (app) => {
      const matchesStatus =
        activeFilter === 'All' ||
        app.status === activeFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableValues = [
        app.number,
        app.company,
        app.position,
        app.role,
        app.status,
        app.location,
        app.linkSource,
        app.originLabel,
        app.resumeName,
        app.coverLetterName,
        app.jobUrl,
      ];

      return searchableValues.some(
        (value) =>
          String(value || '')
            .toLowerCase()
            .includes(normalizedSearch)
      );
    }
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  const totalCount = Math.max(
    applications.length,
    Number(
      applicationSummary.totalApplications || 0
    )
  );
  const submittedCount = applications.filter(
    app => app.status === 'Submitted'
  ).length;
  const waitingCount = applications.filter(
    app => app.status === 'Waiting'
  ).length;
  const rejectedCount = applications.filter(
    app => app.status === 'Rejected'
  ).length;
  const interviewCount = applications.filter(
    app => app.status === 'Interview Scheduled'
  ).length;
  const offeredCount = applications.filter(
    app => app.status === 'Offer Received'
  ).length;

  const stats = [
    {
      label: 'TOTAL APPLICATIONS',
      count: totalCount,
      icon: FiFileText,
      color:
        'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'PENDING RESPONSES',
      count: waitingCount,
      icon: FiMail,
      color:
        'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: 'REJECTED ROLES',
      count: rejectedCount,
      icon: FiUserX,
      color:
        'text-red-500 bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'UPCOMING INTERVIEWS',
      count: interviewCount,
      icon: FiCalendar,
      color:
        'text-sky-500 bg-sky-50 dark:bg-sky-900/20',
    },
    {
      label: 'OFFERS RECEIVED',
      count: offeredCount,
      icon: FiMessageSquare,
      color:
        'text-green-500 bg-green-50 dark:bg-green-900/20',
    },
  ];

  const statusFilters = [
    {
      value: 'All',
      label: 'All',
      count: applications.length,
    },
    {
      value: 'Submitted',
      label: 'Submitted',
      count: submittedCount,
    },
    {
      value: 'Waiting',
      label: 'Waiting',
      count: waitingCount,
    },
    {
      value: 'Interview Scheduled',
      label: 'Interviews',
      count: interviewCount,
    },
    {
      value: 'Offer Received',
      label: 'Offers',
      count: offeredCount,
    },
    {
      value: 'Rejected',
      label: 'Rejected',
      count: rejectedCount,
    },
  ];

  const hasActiveFilters =
    activeFilter !== 'All' ||
    Boolean(normalizedSearch);

  const clearSearchQuery = () => {
    setSearchQuery('');

    if (
      router.isReady &&
      router.query.search
    ) {
      const nextQuery = {
        ...router.query,
      };

      delete nextQuery.search;

      router.replace(
        {
          pathname:
            router.pathname,
          query:
            nextQuery,
        },
        undefined,
        {
          shallow: true,
        }
      );
    }
  };

  const clearFilters = () => {
    setActiveFilter('All');
    setCurrentPage(1);
    clearSearchQuery();
  };


  // Pagination config
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredApps.length / ITEMS_PER_PAGE));
  const paginatedApps = filteredApps.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resultStart =
    filteredApps.length === 0
      ? 0
      : (
          currentPage - 1
        ) * ITEMS_PER_PAGE + 1;

  const resultEnd =
    Math.min(
      currentPage * ITEMS_PER_PAGE,
      filteredApps.length
    );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);


  return (
    <DashboardLayout
      showSearch={false}
    >
      <SEO title="Home" />

      {/* Dashboard Summary */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5 xl:gap-5">
        {stats.map(
          (stat) => {
            const Icon =
              stat.icon;

            return (
              <article
                key={
                  stat.label
                }
                className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800 sm:p-5"
              >
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <p className="text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
                  {
                    stat.count
                  }
                </p>

                <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
                  {
                    stat.label
                  }
                </p>
              </article>
            );
          }
        )}
      </div>

      {/* Unseen Client Update */}
      {!isLoadingAnnouncements &&
        !announcementsError &&
        activeAnnouncement && (
          <section
            className={`mb-6 rounded-2xl border px-4 py-3.5 shadow-sm sm:px-5 ${activeAnnouncementTone.wrap}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activeAnnouncementTone.icon}`}
              >
                <HiOutlineSpeakerphone className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-[0.12em] ${activeAnnouncementTone.badge}`}
                  >
                    New Update
                  </span>

                  <span className="text-[10px] font-medium text-gray-400">
                    {formatApplicationDate(
                      activeAnnouncement
                        .published_at
                    )}
                  </span>

                  {unseenAnnouncements.length >
                    1 && (
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                      +
                      {unseenAnnouncements.length -
                        1}{' '}
                      more unseen
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-col gap-1 lg:flex-row lg:items-baseline lg:gap-3">
                  <h2 className="shrink-0 text-sm font-bold text-gray-950 dark:text-white">
                    {
                      activeAnnouncement
                        .title
                    }
                  </h2>

                  <p className="line-clamp-2 text-sm leading-5 text-gray-600 dark:text-gray-300">
                    {
                      activeAnnouncement
                        .message
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  markAnnouncementSeen(
                    activeAnnouncement.id
                  )
                }
                className="shrink-0 rounded-xl border border-white/80 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Got it
              </button>
            </div>
          </section>
        )}

      {/* Applications */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-100 px-5 py-5 dark:border-gray-700 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                Applications
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Search and filter your application history.
              </p>
            </div>

            <div className="relative w-full xl:max-w-md">
              <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="search"
                value={
                  searchQuery
                }
                onChange={(
                  event
                ) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Search company, position, location or status"
                aria-label="Search applications"
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-12 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={
                    clearSearchQuery
                  }
                  aria-label="Clear search"
                  title="Clear search"
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map(
                (filter) => {
                  const active =
                    activeFilter ===
                    filter.value;

                  return (
                    <button
                      type="button"
                      key={
                        filter.value
                      }
                      onClick={() => {
                        setActiveFilter(
                          filter.value
                        );

                        setCurrentPage(
                          1
                        );
                      }}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
                        active
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      <span>
                        {
                          filter.label
                        }
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {
                          filter.count
                        }
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-blue-600 transition hover:text-blue-800 lg:self-auto"
              >
                <FiX />
                Clear filters
              </button>
            )}
          </div>

          <p className="mt-4 text-xs font-medium text-gray-400">
            {hasActiveFilters
              ? `${filteredApps.length} matching application${filteredApps.length === 1 ? '' : 's'}`
              : `${applications.length} application${applications.length === 1 ? '' : 's'}`}
          </p>
        </div>

        <div className="w-full">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 select-none uppercase tracking-wider">
                <th className="px-3 py-3 sm:px-6 sm:py-4.5">App #</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4.5">Date</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4.5">Company</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4.5 hidden sm:table-cell">Position</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4.5 hidden sm:table-cell">Resume</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4.5 hidden md:table-cell">Cover Ltr</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4.5 text-right sm:text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoadingApplications ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-blue-100 border-t-[#1E50C3] animate-spin" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Loading your applications...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : applicationsError ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center"
                  >
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      We could not load your applications.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {applicationsError}
                    </p>
                  </td>
                </tr>
              ) : paginatedApps.length > 0 ? (
                paginatedApps.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-gray-50/40 dark:hover:bg-gray-700/20 transition-colors text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                  >
                    <td className="px-3 py-3 sm:px-6 sm:py-4.5 font-bold text-gray-900 dark:text-white">
                      {app.number}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4.5">
                      <span className="whitespace-nowrap">
                        {formatApplicationDate(app.appliedAt)}
                      </span>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4.5 font-semibold text-gray-900 dark:text-white">
                      <Link
                        href={{
                          pathname: `/applications/${app.id}`,
                          query: previewClientId
                            ? { previewClientId }
                            : {},
                        }}
                        className="hover:text-[#1E50C3] hover:underline transition-colors block"
                      >
                        {app.company}
                      </Link>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4.5 hidden sm:table-cell">
                      {app.position}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4.5 font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors">
                        <FiFile className="text-red-500 w-4 h-4 shrink-0" />
                        <span className="truncate max-w-[120px]">
                          {app.resumeName || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4.5 font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">
                      {app.coverLetterName ? (
                        <div className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors">
                          <FiFile className="text-red-500 w-4 h-4 shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {app.coverLetterName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4.5 text-right sm:text-left">
                      <div className="scale-90 sm:scale-100 origin-right sm:origin-left inline-block">
                        {getStatusBadge(app.status)}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                    {hasActiveFilters
                      ? 'No applications match your search or filters.'
                      : 'No applications have been recorded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        <div className="flex justify-between items-center px-6 py-4 bg-gray-50/50 dark:bg-gray-700/20 border-t border-gray-100 dark:border-gray-700 select-none">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Showing {resultStart}-{resultEnd} of {filteredApps.length} results
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-1.5 border border-gray-200 dark:border-gray-600 rounded-lg transition-all ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600'}`}
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                    currentPage === page
                      ? 'bg-blue-50 text-primary dark:bg-blue-900/30'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`p-1.5 border border-gray-200 dark:border-gray-600 rounded-lg transition-all ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600'}`}
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}
