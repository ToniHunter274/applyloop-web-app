/**
 * Settings Page
 * ─────────────────────────────────────────────────────────────────────────────
 * Contains 4 tabs for user profile configuration:
 *   1. Basic Information   — Personal details & links
 *   2. Work Preferences    — Job titles, expertise, availability
 *   3. Location & Work Auth — Sponsorship, excluded/priority companies
 *   4. Password & Security — Password change, account deletion
 *
 * All forms use controlled React state. Every interactive element is functional.
 * TODO(Backend) comments mark where API calls should be wired.
 *
 * API Endpoints (for backend team reference):
 *   PUT    /api/users/profile         — Update basic info
 *   PUT    /api/users/preferences     — Update work preferences
 *   PUT    /api/users/authorization   — Update location & work auth
 *   PUT    /api/auth/update-password  — Change password
 *   DELETE /api/users/account         — Delete user account
 *   POST   /api/users/profile-image   — Upload profile image (multipart/form-data)
 *
 * Security Notes:
 *   - All inputs must be sanitized server-side to prevent XSS/SQL injection.
 *   - CSRF tokens must be included in all mutation requests.
 *   - Passwords must never be logged or stored in plain text.
 *   - File uploads must be validated for type & size.
 *   - Account deletion requires confirmation + optional password re-entry.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useRef } from 'react';
import { FiPlus, FiX, FiChevronDown, FiEye, FiEyeOff } from 'react-icons/fi';
import SEO from '../shared/components/SEO';
import DashboardLayout from '../shared/components/DashboardLayout';

// ─── Centralized mock data (replace with API calls when backend is ready) ────
// Backend: GET /api/users/profile, GET /api/users/preferences, etc.
import {
  MOCK_USER_PROFILE,
  MOCK_WORK_PREFERENCES,
  MOCK_WORK_AUTHORIZATION,
  DROPDOWN_OPTIONS,
} from '../data/mockData';

// ─── Reusable: Tag list with removable chips ─────────────────────────────────
function TagList({ items, onRemove, placeholder = 'Type and press Enter...' }) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!items.includes(inputValue.trim())) {
        onRemove([...items, inputValue.trim()], 'add');
      }
      setInputValue('');
    }
  };

  return (
    <div className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center gap-2 flex-wrap min-h-[44px]">
      {items.map((item, idx) => (
        <span key={`${item}-${idx}`} className="inline-flex items-center">
          {idx > 0 && <span className="text-gray-300 mr-2">|</span>}
          <span className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
            {item}
            <button
              type="button"
              onClick={() => {
                const updated = items.filter((_, i) => i !== idx);
                onRemove(updated, 'remove');
              }}
              className="text-gray-400 hover:text-red-500 transition-colors"
              aria-label={`Remove ${item}`}
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </span>
        </span>
      ))}
      {/* Inline input for adding new tags */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={items.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder-gray-400"
      />
      <FiChevronDown className="text-gray-400 flex-shrink-0" />
    </div>
  );
}

// ─── Reusable: Styled select wrapper ─────────────────────────────────────────
function StyledSelect({ value, onChange, options, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none appearance-none pr-10 focus:ring-2 focus:ring-[#1E50C3] focus:border-transparent transition-all"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ─── Reusable: Text input with label ─────────────────────────────────────────
function FormInput({ label, id, type = 'text', value, onChange, colSpan, ...rest }) {
  return (
    <div className={colSpan ? 'md:col-span-2' : ''}>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#1E50C3] focus:border-transparent outline-none transition-all placeholder-gray-400"
        autoComplete="off"
        {...rest}
      />
    </div>
  );
}

// ─── Main Settings Component ─────────────────────────────────────────────────
export default function Settings() {
  const [activeTab, setActiveTab] = useState('Basic Information');

  // ── Tab 1: Basic Information State ──
  // TODO(Backend): Replace with useEffect + applyLoopApi.users.getProfile()
  const [profile, setProfile] = useState(MOCK_USER_PROFILE);
  const [extraLinks, setExtraLinks] = useState([]); // Additional link rows beyond the 2 defaults
  const fileInputRef = useRef(null);

  const updateProfile = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  // ── Tab 2: Work Preferences State ──
  // TODO(Backend): Replace with useEffect + applyLoopApi.users.getPreferences()
  const [jobs, setJobs] = useState(MOCK_WORK_PREFERENCES.jobs);
  const [industry, setIndustry] = useState(MOCK_WORK_PREFERENCES.industry);
  const [specialization, setSpecialization] = useState(MOCK_WORK_PREFERENCES.specialization);
  const [workType, setWorkType] = useState(MOCK_WORK_PREFERENCES.workType);
  const [schedule, setSchedule] = useState(MOCK_WORK_PREFERENCES.schedule);
  const [duration, setDuration] = useState(MOCK_WORK_PREFERENCES.duration);
  const [locations, setLocations] = useState(MOCK_WORK_PREFERENCES.locations);

  // ── Tab 3: Location & Work Authorization State ──
  // TODO(Backend): Replace with useEffect + applyLoopApi.users.getAuthorization()
  const [requireSponsorship, setRequireSponsorship] = useState(MOCK_WORK_AUTHORIZATION.requireSponsorship);
  const [authorizedToWork, setAuthorizedToWork] = useState(MOCK_WORK_AUTHORIZATION.authorizedToWork);
  const [excludedCompanies, setExcludedCompanies] = useState(MOCK_WORK_AUTHORIZATION.excludedCompanies);
  const [priorityCompanies, setPriorityCompanies] = useState(MOCK_WORK_AUTHORIZATION.priorityCompanies);

  // ── Tab 4: Password & Security State ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // ── Tab list ──
  const tabs = [
    'Basic Information',
    'Work Preferences',
    'Location & Work Authorization',
    'Password & Security',
  ];

  // ── Shared input class ──
  const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#1E50C3] focus:border-transparent outline-none transition-all placeholder-gray-400';

  return (
    <DashboardLayout>
      <SEO title="Settings" />

      {/* Hidden file input for profile image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          // Security: Validate file type and size on client before upload
          const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
          const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

          if (!ALLOWED_TYPES.includes(file.type)) {
            alert('Please upload a PNG, JPEG, or WebP image.');
            return;
          }
          if (file.size > MAX_SIZE) {
            alert('Image must be under 5 MB.');
            return;
          }

          // TODO(Backend): Upload to POST /api/users/profile-image (multipart/form-data)
          console.log('Profile image selected:', file.name);
        }}
      />

      {/* ── Settings Container ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">

        {/* ── Tab Navigation ── */}
        <div className="flex px-8 border-b border-gray-100 dark:border-gray-700 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 mr-8 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#1E50C3] text-[#1E50C3]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="p-8">

          {/* ═══════════════════════════════════════════════════════════════
           *  TAB 1: BASIC INFORMATION
           *  API: PUT /api/users/profile
           * ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'Basic Information' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // TODO(Backend): PUT /api/users/profile
                // Payload: { ...profile, extraLinks }
                // Security: Sanitize all string inputs to prevent XSS.
                // Security: Include CSRF token in request headers.
                console.log('Saving profile:', profile, extraLinks);
              }}
              className="max-w-4xl space-y-8 animate-fadeIn"
            >
              {/* Profile Image */}
              <div className="flex items-center gap-6">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Update Profile Image
                </button>
              </div>

              {/* Personal Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput label="Full Name" id="fullName" value={profile.fullName} onChange={(v) => updateProfile('fullName', v)} />
                <FormInput label="Gender" id="gender" value={profile.gender} onChange={(v) => updateProfile('gender', v)} />
                <FormInput label="Email Address" id="email" type="email" value={profile.email} onChange={(v) => updateProfile('email', v)} />
                <FormInput label="Phone Number" id="phone" type="tel" value={profile.phone} onChange={(v) => updateProfile('phone', v)} />
                <FormInput label="Physical Address" id="address" value={profile.address} onChange={(v) => updateProfile('address', v)} colSpan />
                <FormInput label="Nationality" id="nationality" value={profile.nationality} onChange={(v) => updateProfile('nationality', v)} />
                <FormInput label="State/Province" id="state" value={profile.state} onChange={(v) => updateProfile('state', v)} />
                <FormInput label="Disability" id="disability" value={profile.disability} onChange={(v) => updateProfile('disability', v)} />
                <FormInput label="Veteran" id="veteran" value={profile.veteran} onChange={(v) => updateProfile('veteran', v)} />
              </div>

              {/* Links and Portfolio */}
              <div className="pt-6">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6">Links and Portfolio</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <FormInput label="Portfolio Link" id="portfolioLink" type="url" value={profile.portfolioLink} onChange={(v) => updateProfile('portfolioLink', v)} />
                  <FormInput label="LinkedIn URL" id="linkedinUrl" type="url" value={profile.linkedinUrl} onChange={(v) => updateProfile('linkedinUrl', v)} />

                  {/* Dynamic extra link rows */}
                  {extraLinks.map((link, idx) => (
                    <div key={idx} className="relative">
                      <label className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">
                        Link {idx + 1}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => {
                            const updated = [...extraLinks];
                            updated[idx] = e.target.value;
                            setExtraLinks(updated);
                          }}
                          placeholder="https://example.com"
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() => setExtraLinks(extraLinks.filter((_, i) => i !== idx))}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Remove link"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setExtraLinks([...extraLinks, ''])}
                  className="flex items-center gap-2 text-sm font-semibold text-[#1E50C3] hover:text-[#1A45A7] transition-colors"
                >
                  <FiPlus className="text-lg" />
                  <span>Add New Link</span>
                </button>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#1E50C3] hover:bg-[#1A45A7] rounded-xl hover:shadow-lg hover:shadow-blue-500/10 transition-all active:scale-[0.98]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════════════
           *  TAB 2: WORK PREFERENCES
           *  API: PUT /api/users/preferences
           * ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'Work Preferences' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // TODO(Backend): PUT /api/users/preferences
                // Payload: { jobs, industry, specialization, workType, schedule, duration, locations }
                // Validation: Ensure total spread across jobs sums to 100%.
                const totalSpread = jobs.reduce((sum, j) => sum + parseInt(j.spread), 0);
                if (totalSpread !== 100) {
                  alert(`Application spread must total 100%. Currently: ${totalSpread}%`);
                  return;
                }
                console.log('Saving preferences:', { jobs, industry, specialization, workType, schedule, duration, locations });
              }}
              className="max-w-4xl space-y-8 animate-fadeIn"
            >
              {/* Job Title / Expertise / Spread Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Job Titles Column */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">Job Title</label>
                  {jobs.map((job, idx) => (
                    <div key={idx} className={`w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm flex items-center justify-between ${idx > 0 ? 'mt-3' : ''}`}>
                      <input
                        type="text"
                        value={job.title}
                        onChange={(e) => {
                          const updated = [...jobs];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setJobs(updated);
                        }}
                        className="bg-transparent text-gray-900 dark:text-white outline-none flex-1 mr-2"
                      />
                      <div className="flex items-center gap-1">
                        {jobs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setJobs(jobs.filter((_, i) => i !== idx))}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            aria-label={`Remove ${job.title}`}
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        )}
                        <FiChevronDown className="text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expertise Level Column */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">Expertise Level</label>
                  {jobs.map((job, idx) => (
                    <StyledSelect
                      key={idx}
                      value={job.level}
                      onChange={(v) => {
                        const updated = [...jobs];
                        updated[idx] = { ...updated[idx], level: v };
                        setJobs(updated);
                      }}
                      options={DROPDOWN_OPTIONS.expertiseLevels}
                      className={idx > 0 ? 'mt-3' : ''}
                    />
                  ))}
                </div>

                {/* Application Spread Column */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">Application Spread %</label>
                  {jobs.map((job, idx) => (
                    <StyledSelect
                      key={idx}
                      value={job.spread}
                      onChange={(v) => {
                        const updated = [...jobs];
                        updated[idx] = { ...updated[idx], spread: v };
                        setJobs(updated);
                      }}
                      options={DROPDOWN_OPTIONS.spreadOptions}
                      className={idx > 0 ? 'mt-3' : ''}
                    />
                  ))}
                </div>
              </div>

              {/* Add New Job */}
              <div>
                <button
                  type="button"
                  onClick={() => setJobs([...jobs, { title: '', level: 'Intermediate Level', spread: '10%' }])}
                  className="flex items-center gap-2 text-sm font-semibold text-[#1E50C3] hover:text-[#1A45A7] transition-colors mb-1"
                >
                  <FiPlus className="text-lg" />
                  <span>Add New Job</span>
                </button>
                <p className="text-[10px] text-gray-500">* a minimum of 10% per application spread</p>
              </div>

              {/* Industry & Specialization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">Industry</label>
                  <StyledSelect value={industry} onChange={setIndustry} options={DROPDOWN_OPTIONS.industries} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">Specialization</label>
                  <StyledSelect value={specialization} onChange={setSpecialization} options={DROPDOWN_OPTIONS.specializations} />
                </div>
              </div>

              {/* Work Availability */}
              <div className="pt-6">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6">Work Availability</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">Work Type</label>
                    <StyledSelect value={workType} onChange={setWorkType} options={DROPDOWN_OPTIONS.workTypes} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">Work Schedule Preference</label>
                    <StyledSelect value={schedule} onChange={setSchedule} options={DROPDOWN_OPTIONS.schedulePrefs} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">Duration of Contract</label>
                    <StyledSelect value={duration} onChange={setDuration} options={DROPDOWN_OPTIONS.durations} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">Location Preferences</label>
                    <TagList
                      items={locations}
                      onRemove={(updated) => setLocations(updated)}
                      placeholder="Add a location..."
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#1E50C3] hover:bg-[#1A45A7] rounded-xl hover:shadow-lg hover:shadow-blue-500/10 transition-all active:scale-[0.98]"
                >
                  Save Preferences
                </button>
              </div>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════════════
           *  TAB 3: LOCATION & WORK AUTHORIZATION
           *  API: PUT /api/users/authorization
           * ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'Location & Work Authorization' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // TODO(Backend): PUT /api/users/authorization
                // Payload: { requireSponsorship, authorizedToWork, excludedCompanies, priorityCompanies }
                console.log('Saving authorization:', { requireSponsorship, authorizedToWork, excludedCompanies, priorityCompanies });
              }}
              className="max-w-4xl space-y-8 animate-fadeIn"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">
                  Will you now or in the future require sponsorship?
                </label>
                <StyledSelect
                  value={requireSponsorship}
                  onChange={setRequireSponsorship}
                  options={['Yes', 'No']}
                  className="max-w-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">
                  Are you authorized lawfully to work in the United States?
                </label>
                <StyledSelect
                  value={authorizedToWork}
                  onChange={setAuthorizedToWork}
                  options={['Yes', 'No']}
                  className="max-w-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">
                  Companies you <strong>DO NOT</strong> want us to apply to
                </label>
                <div className="max-w-md">
                  <TagList
                    items={excludedCompanies}
                    onRemove={(updated) => setExcludedCompanies(updated)}
                    placeholder="Add a company..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">
                  Priority Company(s) of Interests (e.g. Apple, Microsoft)
                </label>
                <div className="max-w-md">
                  <TagList
                    items={priorityCompanies}
                    onRemove={(updated) => setPriorityCompanies(updated)}
                    placeholder="Add a company..."
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#1E50C3] hover:bg-[#1A45A7] rounded-xl hover:shadow-lg hover:shadow-blue-500/10 transition-all active:scale-[0.98]"
                >
                  Save Authorization
                </button>
              </div>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════════════
           *  TAB 4: PASSWORD & SECURITY
           *  API: PUT /api/auth/update-password
           *  API: DELETE /api/users/account
           * ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'Password & Security' && (
            <div className="max-w-4xl space-y-12 animate-fadeIn">

              {/* Update Password Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPasswordError('');

                  // Client-side validation
                  if (!currentPassword) {
                    setPasswordError('Please enter your current password.');
                    return;
                  }
                  if (newPassword.length < 8) {
                    setPasswordError('New password must be at least 8 characters.');
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setPasswordError('New passwords do not match.');
                    return;
                  }
                  if (currentPassword === newPassword) {
                    setPasswordError('New password must differ from current password.');
                    return;
                  }

                  // TODO(Backend): PUT /api/auth/update-password
                  // Payload: { currentPassword, newPassword }
                  // Security: Hash passwords on the server. Never log raw passwords.
                  // Security: Invalidate existing sessions after password change.
                  // Security: Rate-limit this endpoint to prevent brute-force attacks.
                  console.log('Password update requested');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Current Password */}
                <div>
                  <label htmlFor="currentPassword" className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">
                    Enter Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                    autoComplete="new-password"
                  />
                </div>

                {/* Error message */}
                {passwordError && (
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-sm text-red-600 font-medium">{passwordError}</p>
                  </div>
                )}

                <div className="col-span-1 md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-[#1E50C3] hover:bg-[#1A45A7] rounded-xl hover:shadow-lg hover:shadow-blue-500/10 transition-all active:scale-[0.98]"
                  >
                    Update Password
                  </button>
                </div>
              </form>

              {/* ── Delete Account Section ── */}
              <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Delete Account</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-3xl">
                  We&apos;re sorry to see you go. Deleting your account will permanently remove your profile,
                  applications, and stored data from our system. You can reactivate your account within 14 days.
                </p>

                <div className="flex items-center gap-3 mb-6">
                  <input
                    id="deleteConfirm"
                    type="checkbox"
                    checked={deleteConfirmed}
                    onChange={(e) => setDeleteConfirmed(e.target.checked)}
                    className="w-4 h-4 text-[#1E50C3] border-gray-300 rounded focus:ring-[#1E50C3]"
                  />
                  <label htmlFor="deleteConfirm" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                    I confirm that I want to delete my account
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    disabled={!deleteConfirmed}
                    onClick={() => {
                      if (!deleteConfirmed) return;

                      // TODO(Backend): DELETE /api/users/account
                      // Security: Require password re-entry or 2FA before deletion.
                      // Security: Soft-delete first, hard-delete after 14-day grace period.
                      // Security: Revoke all active sessions upon deletion.
                      const confirmed = window.confirm(
                        'This action cannot be undone. Are you sure you want to delete your account?'
                      );
                      if (confirmed) {
                        console.log('Account deletion confirmed by user');
                      }
                    }}
                    className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all ${
                      deleteConfirmed
                        ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                        : 'bg-red-300 cursor-not-allowed'
                    }`}
                  >
                    Delete Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // TODO(Backend): Open support channel or navigate to /support
                      window.open('mailto:support@applyloop.com', '_blank');
                    }}
                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}