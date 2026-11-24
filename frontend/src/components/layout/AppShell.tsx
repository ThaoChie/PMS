import React from 'react';
import type { Role, Screen, Project, User, Notification } from '../../types';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import UserAvatar, { Avatar } from '../common/UserAvatar';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useUIStore } from '../../store/uiStore';
import { useNotificationPolling } from '../../hooks/useNotificationPolling';

interface AppShellProps {
  currentScreen: Screen;
  role: Role;
  onNavigate: (screen: Screen) => void;
  onRoleChange: (role: Role) => void;
  onCreateIssue: () => void;
  onSearch: () => void;
  onLogout: () => void;
  onSelectProject?: (project: Project) => void;
  onCreateProject?: () => void;
  projects?: Project[];
  selectedProject?: Project | null;
  currentUser?: User;
  notifications?: Notification[];
  children: React.ReactNode;
}

export default function AppShell({
  currentScreen,
  role,
  onNavigate,
  onRoleChange,
  onCreateIssue,
  onSearch,
  onLogout,
  onSelectProject: propOnSelectProject,
  onCreateProject: propOnCreateProject,
  projects: propProjects,
  selectedProject: propSelectedProject,
  currentUser: propUser,
  notifications: propNotifications,
  children,
}: AppShellProps) {
  const { projects: storeProjects, currentProject, setCurrentProject } = useProjectStore();
  const { user: authUser } = useAuthStore();
  const { notifications: storeNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

  // Tải thông báo nền mỗi 20 giây + ngay khi quay lại tab (gần thời gian thực)
  useNotificationPolling(20000);

  const projects = propProjects || storeProjects;
  const selectedProject = propSelectedProject || currentProject || projects[0] || null;
  const notifications = propNotifications && propNotifications.length > 0 ? propNotifications : storeNotifications;

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    if (propOnSelectProject) {
      propOnSelectProject(project);
    }
  };

  const currentUser: User = propUser || authUser || {
    id: '',
    name: 'Người dùng',
    email: '',
    initials: 'U',
    role: role || 'member',
    status: 'Active',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white w-full max-w-full relative">
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        role={role}
        user={currentUser}
        projects={projects}
        selectedProject={selectedProject}
        onNavigate={(screen) => {
          setMobileSidebarOpen(false);
          onNavigate(screen);
        }}
        onSelectProject={(project) => {
          setMobileSidebarOpen(false);
          handleSelectProject(project);
        }}
        onCreateProject={() => {
          setMobileSidebarOpen(false);
          if (propOnCreateProject) propOnCreateProject();
        }}
        onLogout={onLogout}
      />

      {/* Main container */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        {/* Topbar */}
        <Topbar
          role={role}
          user={currentUser}
          notifications={notifications}
          onRoleChange={onRoleChange}
          onSearch={onSearch}
          onCreateIssue={onCreateIssue}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}

export { UserAvatar, Avatar };
