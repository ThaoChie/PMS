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
    APPROVALS: (key: string) => `/projects/${key}/approvals`,
  },
  FILTERS: '/filters',
  INVITATIONS: '/invitations',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  APPROVALS: '/approvals',
} as const;

export function buildIssueDetailPath(
  issueKey: string,
  projectIdOrKey?: string | number | null,
): string {
  const cleanKey = encodeURIComponent(issueKey);
  const cleanProj =
    projectIdOrKey !== undefined && projectIdOrKey !== null
      ? String(projectIdOrKey).trim()
      : '';
  return cleanProj
    ? `/projects/${encodeURIComponent(cleanProj)}/issues/${cleanKey}`
    : `/issues/${cleanKey}`;
}

export function resolveIssueProject<T extends { id: string | number; name: string; key?: string }>(
  issue: { projectId?: string | number | null; projectKey?: string | null; projectName?: string | null } | null | undefined,
  projects: ReadonlyArray<T>,
): T | undefined {
  if (!issue || !projects || projects.length === 0) return undefined;
  const issueProjId = issue.projectId !== undefined && issue.projectId !== null ? String(issue.projectId).trim() : '';
  if (issueProjId) {
    const byId = projects.find((p) => String(p.id) === issueProjId);
    if (byId) return byId;
  }
  const issueProjKey = (issue.projectKey || '').trim().toLowerCase();
  if (issueProjKey) {
    return projects.find((p) => (p.key || '').trim().toLowerCase() === issueProjKey);
  }
  return undefined;
}
