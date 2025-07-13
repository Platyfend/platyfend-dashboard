// Application constants

// API Routes
export const API_ROUTES = {
  AUTH: '/api/auth',
  WORKSPACES: '/api/workspaces',
  REPOSITORIES: '/api/repositories',
  GITHUB: {
    WEBHOOK: '/api/github/webhook',
    REVIEW_CALLBACK: '/api/github/review-callback',
  },
} as const;

// App Routes
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  REPOSITORIES: '/dashboard/repositories',
  SETTINGS: '/dashboard/settings',
  PROFILE: '/dashboard/profile',
} as const;

// Queue Names
export const QUEUE_NAMES = {
  PR_REVIEW: 'pr_review_queue',
  REVIEW_RESULT: 'review_result_queue',
} as const;

// User Roles
export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

// Pull Request Status
export const PR_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  MERGED: 'merged',
} as const;

// Review Status
export const REVIEW_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// VCS Providers
export const VCS_PROVIDERS = {
  GITHUB: 'github',
  GITLAB: 'gitlab',
  BITBUCKET: 'bitbucket',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// File size limits
export const FILE_LIMITS = {
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'text/markdown'],
} as const;

// Cache durations (in seconds)
export const CACHE_DURATION = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  VALIDATION_ERROR: 'Please check your input and try again',
  INTERNAL_ERROR: 'An internal server error occurred',
  NETWORK_ERROR: 'Network error. Please check your connection',
  RATE_LIMIT: 'Too many requests. Please try again later',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  WORKSPACE_CREATED: 'Workspace created successfully',
  REPOSITORY_CONNECTED: 'Repository connected successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
} as const;

// Loading states
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

// Theme constants
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'platyfend-theme',
  SIDEBAR_STATE: 'platyfend-sidebar-state',
  USER_PREFERENCES: 'platyfend-user-preferences',
} as const;

// External URLs
export const EXTERNAL_URLS = {
  GITHUB: 'https://github.com',
  DOCUMENTATION: 'https://docs.platyfend.com',
  SUPPORT: 'https://support.platyfend.com',
  STATUS: 'https://status.platyfend.com',
} as const;
