export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },
  DASHBOARD: '/dashboard',
  PROJECTS: {
    LIST: '/projects',
    DETAIL: (key: string) => `/projects/${key}`,
    BOARD: (key: string) => `/projects/${key}/board`,
    ISSUES: (key: string) => `/projects/${key}/issues`,
    ISSUE_DETAIL: (key: string, issueKey: string) => `/projects/${key}/issues/${issueKey}`,
    REPORTS: (key: string) => `/projects/${key}/reports`,
    SETTINGS: (key: string) => `/projects/${key}/settings`,
    MEMBERS: (key: string) => `/projects/${key}/settings/members`,
    WORKFLOW: (key: string) => `/projects/${key}/settings/workflow`,
  },
  FILTERS: '/filters',
  INVITATIONS: '/invitations',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
} as const;
