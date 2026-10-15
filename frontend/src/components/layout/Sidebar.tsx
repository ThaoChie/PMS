import React from 'react';
import {
  LayoutDashboard,
  KanbanSquare,
  ListTodo,
  Bookmark,
  BarChart3,
  Settings,
  Users,
  GitBranch,
} from 'lucide-react';
import type { Role, Screen, Project, User } from '../../types';
import ProjectSwitcher from './ProjectSwitcher';
import UserMenu from './UserMenu';

const NAV_ITEMS = [
  { id: 'dashboard' as Screen, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'board' as Screen, label: 'Board', icon: KanbanSquare },
  { id: 'issues' as Screen, label: 'Issues', icon: ListTodo },
  { id: 'saved-filters' as Screen, label: 'Saved Filters', icon: Bookmark },
  { id: 'reports' as Screen, label: 'Reports', icon: BarChart3 },
];

const SETTINGS_NAV = [
  { id: 'members-roles' as Screen, label: 'Members & Roles', icon: Users },
  { id: 'workflow' as Screen, label: 'Workflow', icon: GitBranch },
  { id: 'project-settings' as Screen, label: 'Project Settings', icon: Settings },
];

interface SidebarProps {
  currentScreen: Screen;
  role: Role;
  user: User;
  projects: Project[];
  selectedProject: Project;
  onNavigate: (screen: Screen) => void;
  onSelectProject: (project: Project) => void;
  onLogout: () => void;
}

export default function Sidebar({
  currentScreen,
  role,
  user,
  projects,
  selectedProject,
  onNavigate,
  onSelectProject,
  onLogout,
}: SidebarProps) {
  const canSeeSettings = role === 'admin' || role === 'pm';

  return (
    <aside
      className="w-60 shrink-0 bg-[#F7F7F8] border-r border-[#E5E5E7] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-[#E5E5E7]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#E53E3E] flex items-center justify-center">
            <KanbanSquare className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[#1A1A1A] text-sm tracking-tight">EPMS</span>
        </div>
      </div>

      {/* Project switcher */}
      <div className="px-3 pt-3 pb-2">
        <ProjectSwitcher
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={onSelectProject}
          onCreateProject={() => onNavigate('projects')}
        />
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
              currentScreen === id
                ? 'bg-white text-[#1A1A1A] font-medium border border-[#E5E5E7]'
                : 'text-[#6B6B70] hover:bg-white/60 hover:text-[#1A1A1A]'
            }`}
            onClick={() => onNavigate(id)}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}

        {canSeeSettings && (
          <>
            <div className="pt-3 pb-1">
              <div className="h-px bg-[#E5E5E7] mx-1" />
              <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider px-2 pt-3 pb-1">
                Project Settings
              </p>
            </div>
            {SETTINGS_NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  currentScreen === id
                    ? 'bg-white text-[#1A1A1A] font-medium border border-[#E5E5E7]'
                    : 'text-[#6B6B70] hover:bg-white/60 hover:text-[#1A1A1A]'
                }`}
                onClick={() => onNavigate(id)}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Bottom user section */}
      <div className="p-3 border-t border-[#E5E5E7]">
        <UserMenu
          user={user}
          onNavigateProfile={() => onNavigate('profile')}
          onNavigateInvitations={() => onNavigate('invitations')}
          onLogout={onLogout}
        />
      </div>
    </aside>
  );
}
