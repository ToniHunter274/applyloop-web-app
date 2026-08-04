import React, { useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '../shared/components/DashboardLayout';
import { FiBookmark, FiExternalLink, FiCheckCircle, FiClock, FiRefreshCw, FiStar, FiAward } from 'react-icons/fi';

// ─── Centralized mock data (replace with API calls when backend is ready) ────
// Backend: GET /api/growth/stats, GET /api/growth/courses, etc.
import {
  MOCK_GROWTH_STATS as STATS,
  MOCK_SKILL_GAPS as SKILL_GAPS,
  MOCK_COURSES as COURSES,
  MOCK_CERTIFICATIONS as CERTIFICATIONS,
  MOCK_FILTER_TABS as FILTER_TABS,
} from '../data/mockData';

// ─── Sub-components ────────────────────────────────────────────────────────

function StatCard({ label, value, sub, progress, showBar }) {
  return (
    <div className="flex-1 min-w-0 bg-white border border-gray-100 rounded-2xl px-6 py-5 flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">{label}</span>
      <span className="text-3xl font-bold text-gray-900 leading-tight">{value}</span>
      <span className="text-xs text-gray-500">{sub}</span>
      {showBar && (
        <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#1E50C3]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function SkillBar({ skill, priority, current, target }) {
  // The filled bar = current% of a 100% width total
  // The ghost section between current and target
  const filledW = current;
  const ghostW = target - current;

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-800">{skill}</span>
        <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
          {priority}
        </span>
        <span className="ml-auto text-xs text-gray-500 font-medium">
          {current}% → {target}%
        </span>
      </div>
      <div className="flex h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-[#1E50C3] rounded-l-full"
          style={{ width: `${filledW}%` }}
        />
        <div
          className="h-full bg-blue-200"
          style={{ width: `${ghostW}%` }}
        />
      </div>
    </div>
  );
}

function CourseCard({ course, onMarkComplete }) {
  const [completed, setCompleted] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 bg-white">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{course.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{course.provider}</p>
        </div>
        <button
          onClick={() => setSaved(!saved)}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${saved ? 'text-[#1E50C3]' : 'text-gray-300 hover:text-gray-500'}`}
        >
          <FiBookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 leading-relaxed">{course.description}</p>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <FiClock className="w-3 h-3" />
          {course.hours} hours
        </span>
        <span className="flex items-center gap-1">
          <FiStar className="w-3 h-3 text-yellow-400" />
          {course.rating}
        </span>
        <span>{course.level}</span>
      </div>

      {/* Relevance */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Relevance Score</span>
          <span>{course.relevance}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-gray-800 rounded-full"
            style={{ width: `${course.relevance}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors">
          <FiCheckCircle className="w-3.5 h-3.5" />
          Watch Now
        </button>
        <button
          onClick={() => setCompleted(!completed)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
            completed
              ? 'bg-green-50 text-green-600 border-green-200'
              : 'text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <FiExternalLink className="w-3.5 h-3.5" />
          {completed ? 'Completed' : 'Mark as complete'}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function GrowthPage() {
  const [activeFilter, setActiveFilter] = useState('Paid');

  const filteredCourses = COURSES.filter((c) => {
    if (activeFilter === 'All') return true;
    return c.type === activeFilter.toLowerCase();
  });

  return (
    <>
      <Head>
        <title>Career Growth | ApplyLoop</title>
        <meta name="description" content="Upskill with personalized course recommendations and track your progress." />
      </Head>
      <DashboardLayout>
        <div className="max-w-4xl space-y-6">
          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {/* ── Skill Gap Analysis ── */}
          <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Skill Gap Analysis</h2>
            <div>
              {SKILL_GAPS.map((sg) => (
                <SkillBar key={sg.skill} {...sg} />
              ))}
            </div>
          </div>

          {/* ── Recommended Courses ── */}
          <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5">
            {/* Header + filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-semibold text-gray-900">Recommended Courses</h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex bg-gray-50 border border-gray-100 rounded-xl p-1 gap-1">
                  {FILTER_TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        activeFilter === tab
                          ? 'bg-white text-[#1E50C3] shadow-sm border border-gray-100'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                  <FiRefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Course cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>

          {/* ── Recommended Certifications ── */}
          <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5">
            <div className="flex items-center gap-2 mb-2">
              <FiAward className="w-5 h-5 text-[#1E50C3]" />
              <h2 className="text-sm font-semibold text-[#1E50C3]">Recommended Certifications</h2>
            </div>
            <p className="text-sm text-[#1E50C3] mb-3 font-medium">
              Boost your profile with industry-recognized certifications aligned with your career goals.
            </p>
            <ul className="space-y-1.5">
              {CERTIFICATIONS.map((cert) => (
                <li key={cert} className="flex items-center gap-2 text-sm text-[#1E50C3]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E50C3] flex-shrink-0" />
                  {cert}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
