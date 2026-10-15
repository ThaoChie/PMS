export { default as ProtectedRoute } from './ProtectedRoute';
export { default as ProjectRoleRoute } from './ProjectRoleRoute';
export { ROUTES } from '../constants/routes';

export interface RouteConfig {
  path: string;
  isProtected?: boolean;
  allowedRoles?: ('admin' | 'pm' | 'member')[];
  title?: string;
}

export const APP_ROUTES: Record<string, RouteConfig> = {
  LOGIN: { path: '/login', isProtected: false, title: 'Đăng nhập' },
  REGISTER: { path: '/register', isProtected: false, title: 'Đăng ký' },
  FORGOT_PASSWORD: { path: '/forgot-password', isProtected: false, title: 'Quên mật khẩu' },
  RESET_PASSWORD: { path: '/reset-password', isProtected: false, title: 'Đặt lại mật khẩu' },
  DASHBOARD: { path: '/dashboard', isProtected: true, title: 'Dashboard' },
  PROJECTS: { path: '/projects', isProtected: true, title: 'Dự án' },
  PROJECT_BOARD: { path: '/projects/:key/board', isProtected: true, title: 'Kanban Board' },
  PROJECT_ISSUES: { path: '/projects/:key/issues', isProtected: true, title: 'Danh sách Issue' },
  PROJECT_REPORTS: { path: '/projects/:key/reports', isProtected: true, title: 'Báo cáo' },
  PROJECT_SETTINGS: {
    path: '/projects/:key/settings',
    isProtected: true,
    allowedRoles: ['admin', 'pm'],
    title: 'Cài đặt dự án',
  },
  PROJECT_MEMBERS: {
    path: '/projects/:key/settings/members',
    isProtected: true,
    allowedRoles: ['admin', 'pm'],
    title: 'Thành viên & Vai trò',
  },
  PROJECT_WORKFLOW: {
    path: '/projects/:key/settings/workflow',
    isProtected: true,
    allowedRoles: ['admin', 'pm'],
    title: 'Quy trình xử lý (Workflow)',
  },
  FILTERS: { path: '/filters', isProtected: true, title: 'Bộ lọc đã lưu' },
  INVITATIONS: { path: '/invitations', isProtected: true, title: 'Lời mời dự án' },
  PROFILE: { path: '/profile', isProtected: true, title: 'Hồ sơ cá nhân' },
  NOTIFICATIONS: { path: '/notifications', isProtected: true, title: 'Thông báo' },
};
