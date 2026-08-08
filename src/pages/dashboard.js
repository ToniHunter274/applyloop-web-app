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
  FiPlus,
  FiCheck,
  FiFile,
  FiTrash2
} from 'react-icons/fi';
import { HiOutlineSpeakerphone } from 'react-icons/hi';

import SEO from '../shared/components/SEO';
import DashboardLayout from '../shared/components/DashboardLayout';
import ApproveModal from '../shared/components/ApproveModal';
import AddJobLinkModal from '../shared/components/AddJobLinkModal';

// ─── Mock data import (replace with API call when backend is ready) ──────────
// Backend: GET /api/applications
import { MOCK_APPLICATIONS } from '../data/mockData';

export default function Dashboard() {
  const router = useRouter();

  const previewClientId =
    router.isReady
      ? Array.isArray(
          router.query.previewClientId
        )
        ? router.query
            .previewClientId[0]
        : router.query
            .previewClientId || ''
      : '';

  // TODO(Backend): Replace with useEffect + applyLoopApi.applications.getAll()
  const [applications, setApplications] = useState(MOCK_APPLICATIONS);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedApp, setSelectedApp] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [updateSlideIndex, setUpdateSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setUpdateSlideIndex((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Status Badge styles helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Interview':
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            Interview
          </span>
        );
      case 'Offered':
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-900/50">
            Offered
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-900/50">
            Rejected
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
            Pending
          </span>
        );
    }
  };

  // Filter application list
  const filteredApps = applications.filter(app => {
    if (activeFilter === 'All') return true;
    return app.status === activeFilter;
  });

  // Reset pagination whenever the user changes dashboard sections.
  // This prevents a page-2 selection from carrying into a section with only one page.
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  // Calculate stats count dynamically
  const totalCount = applications.length;
  const pendingCount = applications.filter(app => app.status === 'Pending').length;
  const rejectedCount = applications.filter(app => app.status === 'Rejected').length;
  const interviewCount = applications.filter(app => app.status === 'Interview').length;
  const offeredCount = applications.filter(app => app.status === 'Offered').length;

  const stats = [
    { label: 'TOTAL APPLICATIONS', count: totalCount, filterKey: 'All', icon: FiFileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'PENDING RESPONSES', count: pendingCount, filterKey: 'Pending', icon: FiMail, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
    { label: 'REJECTED ROLES', count: rejectedCount, filterKey: 'Rejected', icon: FiUserX, color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
    { label: 'UPCOMING INTERVIEWS', count: interviewCount, filterKey: 'Interview', icon: FiCalendar, color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20' },
    { label: 'FEEDBACKS', count: offeredCount, filterKey: 'Offered', icon: FiMessageSquare, color: 'text-green-500 bg-green-50 dark:bg-green-900/20' }
  ];

  // Pagination config
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.max(1, Math.ceil(filteredApps.length / ITEMS_PER_PAGE));
  const paginatedApps = filteredApps.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Action: Approve Application
  // TODO(Backend): Replace with applyLoopApi.applications.approve(selectedApp.id)
  const handleApprove = () => {
    if (selectedApp) {
      setApplications(prev => prev.map(app =>
        app.id === selectedApp.id
          ? { ...app, status: 'Offered' }
          : app
      ));
      setSelectedApp(null);
    }
  };

  return (
    <DashboardLayout>
      <SEO title="Home" />

      {/* Stat Cards Container */}
      <div className="grid grid-cols-5 gap-1 sm:gap-4 md:gap-6 mb-8 select-none">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const isActive = activeFilter === stat.filterKey;

          return (
            <div 
              key={i}
              onClick={() => { setActiveFilter(stat.filterKey); setCurrentPage(1); }}
              className={`p-1 sm:p-6 bg-white dark:bg-gray-800 border rounded-xl sm:rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                isActive 
                  ? 'border-primary ring-2 ring-primary/10' 
                  : 'border-gray-100 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1 sm:mb-4">
                <div className={`p-1 sm:p-2.5 rounded-lg sm:rounded-xl ${stat.color}`}>
                  <Icon className="h-2.5 w-2.5 sm:h-5 sm:w-5" />
                </div>
              </div>
              <p className="text-xs sm:text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">
                {stat.count}
              </p>
              <p className="text-[6px] sm:text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wider mt-0.5 sm:mt-1.5 uppercase leading-tight sm:leading-normal line-clamp-2">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Important Updates */}
      <div className="bg-white dark:bg-gray-800 border border-[#1E50C3] rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-[#1E50C3] p-3 rounded-xl flex items-center justify-center shrink-0">
            <HiOutlineSpeakerphone className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-950 dark:text-white">Important Updates</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Latest news and announcements</p>
          </div>
        </div>

        <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-5 md:p-6 mb-4">
          <div className="flex items-start gap-3">
            <span className="w-2 h-2 rounded-full bg-[#1E50C3] shrink-0 mt-1.5" />
            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm md:text-base font-bold text-gray-800 dark:text-gray-200">Loop Lab Enhanced</h3>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                New interview scenarios added! Practice with company-specific questions from Google, Meta, Amazon, and more.
              </p>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Feb 18, 2026.</span>
            </div>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center items-center gap-2 mt-4">
          {[0, 1, 2].map((idx) => (
            <span 
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                updateSlideIndex === idx ? 'bg-[#1E50C3]' : 'bg-blue-200 dark:bg-blue-900'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Interactive Updates / Action Bar */}
      <div className="mb-4 flex items-center">
        <button 
          onClick={() => setIsAddJobModalOpen(true)}
          className="flex items-center gap-2 text-[#1E50C3] hover:text-[#1A45A7] font-semibold text-sm transition-colors"
        >
          <FiPlus className="text-lg" />
          <span>Add Job Link</span>
        </button>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
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
              {paginatedApps.length > 0 ? (
                paginatedApps.map((app) => (
                  <tr 
                    key={app.id}
                    className="hover:bg-gray-50/40 dark:hover:bg-gray-700/20 transition-colors text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                  >
                    <td className="px-3 py-3 sm:px-6 sm:py-4.5 font-bold text-gray-900 dark:text-white">
                      {app.number}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4.5">
                      <span className="whitespace-nowrap">{app.date}</span>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4.5 font-semibold text-gray-900 dark:text-white">
                      <Link
                        href={{
                          pathname: `/applications/${app.number.replace('#', '')}`,
                          query: previewClientId
                            ? {
                                previewClientId,
                              }
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
                        <span className="truncate max-w-[120px]">{app.resume}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4.5 font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">
                      {app.coverLetter !== 'N/A' ? (
                        <div className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors">
                          <FiFile className="text-red-500 w-4 h-4 shrink-0" />
                          <span className="truncate max-w-[120px]">{app.coverLetter}</span>
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
                    No applications found matching status &quot;{activeFilter}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        <div className="flex justify-between items-center px-6 py-4 bg-gray-50/50 dark:bg-gray-700/20 border-t border-gray-100 dark:border-gray-700 select-none">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Showing {paginatedApps.length} of {filteredApps.length} results
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

      {/* Modal Integration */}
      <ApproveModal 
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleApprove}
      />

      <AddJobLinkModal
        isOpen={isAddJobModalOpen}
        onClose={() => setIsAddJobModalOpen(false)}
        onConfirm={(data) => {
          // TODO(Backend): Replace with applyLoopApi.applications.create(data)
          // Security: Validate URL format, sanitize comment text
          const newId = `AND${Date.now()}`;
          const newApp = {
            id: newId,
            number: `#${newId}`,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            company: 'New Company',
            position: 'Role',
            resume: 'Anderson Pdf.',
            coverLetter: 'Anderson..',
            status: 'Pending',
          };
          setApplications([newApp, ...applications]);
          setCurrentPage(1); // Jump to first page to show new entry
        }}
      />
    </DashboardLayout>
  );
}