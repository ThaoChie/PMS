import React from 'react';
import type { Role, Screen, Project, User, Notification } from '../../types';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import UserAvatar, { Avatar } from '../common/UserAvatar';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';

interface AppShellProps {
  currentScreen: Screen;
  role: Role;
  onNavigate: (screen: Screen) => void;
  onRoleChange: (role: Role) => void;
  onCreateIssue: () => void;
  onSearch: () => void;
  onLogout: () => void;
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
  projects: propProjects,
  selectedProject: propSelectedProject,
  currentUser: propUser,
  notifications = [],
  children,
}: AppShellProps) {
  const { projects: storeProjects, currentProject, setCurrentProject } = useProjectStore();
  const { user: authUser } = useAuthStore();

  const projects = propProjects || storeProjects;
  const selectedProject = propSelectedProject || currentProject || projects[0] || null;

  const currentUser: User = propUser || authUser || {
    id: '',
    name: 'Người dùng',
    email: '',
    initials: 'U',
    role: role || 'member',
    status: 'Active',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        role={role}
        user={currentUser}
        projects={projects}
        selectedProject={selectedProject}
        onNavigate={onNavigate}
        onSelectProject={setSelectedProject}
        onLogout={onLogout}
      />

      {/* Main container */}
      <div className="flex-1 flex flex-col min-w-0">
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
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export { UserAvatar, Avatar };
