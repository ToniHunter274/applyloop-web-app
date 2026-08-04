import React, { useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '../shared/components/DashboardLayout';

// ─── Centralized mock data (replace with API calls when backend is ready) ────
// Backend: GET /api/notifications
import {
  MOCK_NOTIFICATIONS as ALL_NOTIFICATIONS,
  MOCK_NOTIFICATION_TABS as TABS,
} from '../data/mockData';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('All');

  const filtered = ALL_NOTIFICATIONS.filter((n) => {
    if (activeTab === 'Read') return n.read;
    if (activeTab === 'Unread') return !n.read;
    return true;
  });

  const sectionTitle =
    activeTab === 'All'
      ? 'All Notifications'
      : activeTab === 'Read'
      ? 'Read Notifications'
      : 'Unread Notifications';

  return (
    <>
      <Head>
        <title>Notifications | ApplyLoop</title>
        <meta name="description" content="View all your ApplyLoop notifications." />
      </Head>

      <DashboardLayout>
        <div className="max-w-4xl">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {/* Section title */}
            <div className="px-8 py-5 border-b border-gray-100 text-center">
              <h2 className="text-sm font-semibold text-gray-500">{sectionTitle}</h2>
            </div>

            <div className="flex">
              {/* Left tab list */}
              <div className="w-40 flex-shrink-0 border-r border-gray-100 py-4 px-3 flex flex-col gap-1">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        isActive
                          ? 'text-[#1E50C3] font-semibold border-l-2 border-[#1E50C3] rounded-none pl-3'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* Right notification list */}
              <div className="flex-1 divide-y divide-gray-100">
                {filtered.length > 0 ? (
                  filtered.map((n) => (
                    <div
                      key={n.id}
                      className="px-6 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer"
                    >
                      <p className="text-sm text-gray-800 font-medium">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.date}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-sm text-gray-400">No {activeTab.toLowerCase()} notifications</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
