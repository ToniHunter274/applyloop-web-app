/**
 * ApplyLoop API Service
 * ─────────────────────────────────────────────────────────────────────────────
 * All API calls for ApplyLoop features (applications, settings, billing, etc.)
 * are defined here. The backend team should implement these endpoints.
 *
 * Currently, each method falls back to mock data from src/data/mockData.js.
 * When the backend is ready, remove the mock fallbacks and use the real
 * axios calls (already stubbed below each mock).
 *
 * Usage in components:
 *   import applyLoopApi from '@/shared/services/applyLoopApi';
 *   const apps = await applyLoopApi.applications.getAll();
 *
 * Security Notes:
 *   - Auth token is automatically injected via the axios interceptor in api.js.
 *   - All mutations should include CSRF token (handled by backend middleware).
 *   - File uploads use multipart/form-data with size/type validation.
 *   - Passwords are never logged client-side. Use HTTPS only.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import apiService from './api';
import {
  MOCK_APPLICATIONS,
  MOCK_APPLICATION_DETAIL,
  MOCK_INTERVIEWS,
  MOCK_GROWTH_STATS,
  MOCK_SKILL_GAPS,
  MOCK_COURSES,
  MOCK_PLAN,
  MOCK_RECEIPTS,
  MOCK_USER_PROFILE,
  MOCK_WORK_PREFERENCES,
  MOCK_WORK_AUTHORIZATION,
  DROPDOWN_OPTIONS,
} from '../../data/mockData';

/**
 * Helper: Simulate network delay for mock data to test loading states.
 * Remove this when backend is connected.
 */
const mockDelay = (data, ms = 300) =>
  new Promise((resolve) => setTimeout(() => resolve({ data }), ms));

const applyLoopApi = {
  // ─── Applications ────────────────────────────────────────────────────────────
  // Backend endpoints: /api/applications/*
  applications: {
    /** GET /api/applications — List all user applications */
    getAll: () => mockDelay(MOCK_APPLICATIONS),
    // Real: () => api.get('/api/applications'),

    /** GET /api/applications/:id — Get application detail by ID */
    getById: (id) => mockDelay(MOCK_APPLICATION_DETAIL),
    // Real: (id) => api.get(`/api/applications/${id}`),

    /** POST /api/applications — Create a new application from job link */
    create: (payload) => {
      // payload: { jobLink: string, comment?: string }
      // Security: Validate URL format, sanitize comment text
      console.log('[API Stub] POST /api/applications', payload);
      return mockDelay({ id: `AND${Math.floor(100 + Math.random() * 900)}`, ...payload });
      // Real: () => api.post('/api/applications', payload),
    },

    /** PUT /api/applications/:id/approve — Approve an application */
    approve: (id) => {
      console.log(`[API Stub] PUT /api/applications/${id}/approve`);
      return mockDelay({ success: true });
      // Real: (id) => api.put(`/api/applications/${id}/approve`),
    },

    /** DELETE /api/applications/:id — Delete an application */
    delete: (id) => {
      console.log(`[API Stub] DELETE /api/applications/${id}`);
      return mockDelay({ success: true });
      // Real: (id) => api.delete(`/api/applications/${id}`),
    },

    /** POST /api/applications/:id/feedback — Send feedback message */
    sendFeedback: (id, message) => {
      // Security: Sanitize message to prevent XSS
      console.log(`[API Stub] POST /api/applications/${id}/feedback`, { message });
      return mockDelay({ success: true });
      // Real: (id, message) => api.post(`/api/applications/${id}/feedback`, { message }),
    },
  },

  // ─── Interviews / Loop Lab ───────────────────────────────────────────────────
  // Backend endpoints: /api/interviews/*
  interviews: {
    /** GET /api/interviews — List upcoming interviews */
    getAll: () => mockDelay(MOCK_INTERVIEWS),
    // Real: () => api.get('/api/interviews'),

    /** POST /api/interviews/:id/start-lab — Start a lab session */
    startLab: (id, duration) => {
      console.log(`[API Stub] POST /api/interviews/${id}/start-lab`, { duration });
      return mockDelay({ sessionId: `session_${Date.now()}` });
      // Real: (id, duration) => api.post(`/api/interviews/${id}/start-lab`, { duration }),
    },
  },

  // ─── Growth / Courses ────────────────────────────────────────────────────────
  // Backend endpoints: /api/growth/*
  growth: {
    /** GET /api/growth/stats — Get learning progress stats */
    getStats: () => mockDelay(MOCK_GROWTH_STATS),
    // Real: () => api.get('/api/growth/stats'),

    /** GET /api/growth/skill-gaps — Get identified skill gaps */
    getSkillGaps: () => mockDelay(MOCK_SKILL_GAPS),
    // Real: () => api.get('/api/growth/skill-gaps'),

    /** GET /api/growth/courses — Get recommended courses */
    getCourses: () => mockDelay(MOCK_COURSES),
    // Real: () => api.get('/api/growth/courses'),
  },

  // ─── Billing ─────────────────────────────────────────────────────────────────
  // Backend endpoints: /api/billing/*
  billing: {
    /** GET /api/billing/plan — Get current plan details */
    getPlan: () => mockDelay(MOCK_PLAN),
    // Real: () => api.get('/api/billing/plan'),

    /** GET /api/billing/receipts — Get payment history */
    getReceipts: () => mockDelay(MOCK_RECEIPTS),
    // Real: () => api.get('/api/billing/receipts'),

    /** POST /api/billing/cancel — Cancel subscription */
    cancel: () => {
      console.log('[API Stub] POST /api/billing/cancel');
      return mockDelay({ success: true });
    },

    /** POST /api/billing/pause — Pause subscription */
    pause: () => {
      console.log('[API Stub] POST /api/billing/pause');
      return mockDelay({ success: true });
    },
  },

  // ─── User Profile / Settings ─────────────────────────────────────────────────
  // Backend endpoints: /api/users/*
  users: {
    /** GET /api/users/profile — Get user profile */
    getProfile: () => mockDelay(MOCK_USER_PROFILE),
    // Real: () => api.get('/api/users/profile'),

    /** PUT /api/users/profile — Update user profile */
    updateProfile: (profileData) => {
      // Security: Sanitize all string fields to prevent stored XSS
      console.log('[API Stub] PUT /api/users/profile', profileData);
      return mockDelay({ success: true });
      // Real: (profileData) => api.put('/api/users/profile', profileData),
    },

    /** POST /api/users/profile-image — Upload profile image */
    uploadProfileImage: (file) => {
      // Security: Validate file type (image/*) and size (< 5MB)
      // Use FormData for multipart upload
      console.log('[API Stub] POST /api/users/profile-image', file.name);
      const formData = new FormData();
      formData.append('image', file);
      return mockDelay({ imageUrl: URL.createObjectURL(file) });
      // Real: (file) => {
      //   const formData = new FormData();
      //   formData.append('image', file);
      //   return api.post('/api/users/profile-image', formData, {
      //     headers: { 'Content-Type': 'multipart/form-data' },
      //   });
      // },
    },

    /** GET /api/users/preferences — Get work preferences */
    getPreferences: () => mockDelay(MOCK_WORK_PREFERENCES),
    // Real: () => api.get('/api/users/preferences'),

    /** PUT /api/users/preferences — Update work preferences */
    updatePreferences: (prefsData) => {
      console.log('[API Stub] PUT /api/users/preferences', prefsData);
      return mockDelay({ success: true });
      // Real: (prefsData) => api.put('/api/users/preferences', prefsData),
    },

    /** GET /api/users/authorization — Get work authorization info */
    getAuthorization: () => mockDelay(MOCK_WORK_AUTHORIZATION),
    // Real: () => api.get('/api/users/authorization'),

    /** PUT /api/users/authorization — Update work authorization */
    updateAuthorization: (authData) => {
      console.log('[API Stub] PUT /api/users/authorization', authData);
      return mockDelay({ success: true });
      // Real: (authData) => api.put('/api/users/authorization', authData),
    },

    /** DELETE /api/users/account — Delete user account */
    deleteAccount: () => {
      // Security: Require password re-entry or 2FA
      // Backend: Soft-delete first, hard-delete after 14-day grace period
      console.log('[API Stub] DELETE /api/users/account');
      return mockDelay({ success: true });
      // Real: () => api.delete('/api/users/account'),
    },
  },

  // ─── Auth ────────────────────────────────────────────────────────────────────
  // Backend endpoints: /api/auth/*
  auth: {
    /** PUT /api/auth/update-password — Change user password */
    updatePassword: (currentPassword, newPassword) => {
      // Security: Never log raw passwords
      // Security: Invalidate existing sessions after password change
      // Security: Rate-limit this endpoint to prevent brute-force
      console.log('[API Stub] PUT /api/auth/update-password');
      return mockDelay({ success: true });
      // Real: (currentPassword, newPassword) =>
      //   api.put('/api/auth/update-password', { currentPassword, newPassword }),
    },
  },

  // ─── Config / Dropdown Options ───────────────────────────────────────────────
  // Backend endpoints: /api/config/*
  config: {
    /** GET /api/config/options — Get dropdown options for forms */
    getOptions: () => mockDelay(DROPDOWN_OPTIONS),
    // Real: () => api.get('/api/config/options'),
  },
};

export default applyLoopApi;
