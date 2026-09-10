/**
 * Centralized API Endpoints Configuration
 * Mandatory rule according to AGENTS.md
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    PASSWORD: '/auth/password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  DONORS: {
    LIST: '/donors',
    STOCK_SUMMARY: '/donors/stock-summary',
    DETAIL: (id) => `/donors/${id}`,
    UPDATE_STATUS: (id) => `/donors/${id}/status`,
    VERIFY: (id) => `/donors/${id}/verify`,
    DELETE: (id) => `/donors/${id}`,
  },

  GALLERIES: {
    LIST: '/galleries',
    DETAIL: (id) => `/galleries/${id}`,
    CREATE: '/galleries',
    UPDATE: (id) => `/galleries/${id}`,
    DELETE: (id) => `/galleries/${id}`,
  },

  BANNERS: {
    LIST: '/banners',
    DETAIL: (id) => `/banners/${id}`,
    CREATE: '/banners',
    UPDATE: (id) => `/banners/${id}`,
    DELETE: (id) => `/banners/${id}`,
    TOGGLE: (id) => `/banners/${id}/toggle`,
  },

  BLOOD_REQUESTS: {
    LIST: '/blood-requests',
    DETAIL: (id) => `/blood-requests/${id}`,
    CREATE: '/blood-requests',
    UPDATE: (id) => `/blood-requests/${id}`,
    UPDATE_STATUS: (id) => `/blood-requests/${id}/status`,
    DELETE: (id) => `/blood-requests/${id}`,
    RESPOND: (id) => `/blood-requests/${id}/respond`,
    MATCHING_DONORS: (id) => `/blood-requests/${id}/matching-donors`,
  },

  DONATION_HISTORIES: {
    LIST: '/donation-histories',
    CREATE: '/donation-histories',
    DELETE: (id) => `/donation-histories/${id}`,
  },

  ACTIVITIES: {
    LIST: '/activities',
    DETAIL: (slug) => `/activities/${slug}`,
    CREATE: '/activities',
    UPDATE: (id) => `/activities/${id}`,
    DELETE: (id) => `/activities/${id}`,
  },

  SCHEDULES: {
    LIST: '/schedules',
    CREATE: '/schedules',
    UPDATE: (id) => `/schedules/${id}`,
    DELETE: (id) => `/schedules/${id}`,
  },

  HOSPITALS: {
    LIST: '/hospitals',
    CREATE: '/hospitals',
    UPDATE: (id) => `/hospitals/${id}`,
    DELETE: (id) => `/hospitals/${id}`,
  },

  FEEDBACK: {
    LIST: '/feedbacks',
    CREATE: '/feedbacks',
    REPLY: (id) => `/feedbacks/${id}/reply`,
    DELETE: (id) => `/feedbacks/${id}`,
  },

  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
  },

  WA_GATEWAY: {
    STATUS: '/wa-gateway/status',
    CONNECT: '/wa-gateway/connect',
    DISCONNECT: '/wa-gateway/disconnect',
    TEST_SEND: '/wa-gateway/test-send',
    BROADCAST_REQUEST: (id) => `/blood-requests/${id}/broadcast-wa`,
  },
};
