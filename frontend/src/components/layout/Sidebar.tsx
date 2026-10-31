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
  Sliders,
  Mail,
} from 'lucide-react';
import type { Role, Screen, Project, User } from '../../types';
import ProjectSwitcher from './ProjectSwitcher';
import ProjectBadge from '../../features/projects/components/ProjectBadge';
import UserMenu from './UserMenu';
import { useUIStore } from '../../store/uiStore';

const NAV_ITEMS = [
  { id: 'dashboard' as Screen, label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'board' as Screen, label: 'Bảng công việc', icon: KanbanSquare },
  { id: 'issues' as Screen, label: 'Danh sách công việc', icon: ListTodo },
  { id: 'saved-filters' as Screen, label: 'Bộ lọc đã lưu', icon: Bookmark },
  { id: 'reports' as Screen, label: 'Báo cáo', icon: BarChart3 },
  { id: 'invitations' as Screen, label: 'Lời mời dự án', icon: Mail },
];

const SETTINGS_NAV = [
  { id: 'members-roles' as Screen, label: 'Thành viên & Vai trò', icon: Users },
  { id: 'workflow' as Screen, label: 'Quy trình làm việc', icon: GitBranch },
  { id: 'custom-fields' as Screen, label: 'Trường tùy chỉnh', icon: Sliders },
  { id: 'project-settings' as Screen, label: 'Cài đặt dự án', icon: Settings },
];

interface SidebarProps {
  currentScreen: Screen;
  role: Role;
  user: User;
  projects: Project[];
  selectedProject: Project | null;
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
  const isSidebarCollapsed = useUIStore((s) => s.isSidebarCollapsed);
  const canSeeSettings = role === 'admin' || role === 'pm';

  return (
    <aside
      className={`shrink-0 bg-[#F7F7F8] border-r border-[#E5E5E7] flex flex-col transition-all duration-200 ${
        isSidebarCollapsed ? 'w-16' : 'w-60'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Logo */}
      <div className={`h-14 flex items-center border-b border-[#E5E5E7] ${isSidebarCollapsed ? 'justify-center px-2' : 'px-4'}`}>
        <div className="flex items-center gap-2.5">
          <img
            src="/logoVJU.png"
            alt="VJU Logo"
            className="w-7 h-7 object-contain select-none shrink-0"
          />
          {!isSidebarCollapsed && (
            <span className="font-bold text-[#1A1A1A] text-sm tracking-tight truncate">EPMS</span>
          )}
        </div>
      </div>

      {/* Project switcher */}
      {!isSidebarCollapsed ? (
        <div className="px-3 pt-3 pb-2">
          <ProjectSwitcher
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={onSelectProject}
            onCreateProject={() => onNavigate('projects')}
          />
        </div>
      ) : (
        <div className="p-2 flex justify-center">
          <div
            title={selectedProject ? `${selectedProject.name} (${selectedProject.key})` : 'Chọn dự án'}
            className="cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onNavigate('projects')}
          >
            <ProjectBadge
              color={selectedProject?.color}
              icon={selectedProject?.icon}
              projectKey={selectedProject?.key}
              size="md"
            />
          </div>
        </div>
      )}

      {/* Main navigation */}
      <nav className="flex-1 px-2.5 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={isSidebarCollapsed ? label : undefined}
            className={`w-full flex items-center rounded-lg text-sm transition-colors text-left ${
              isSidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2'
            } ${
              currentScreen === id
                ? 'bg-white text-[#1A1A1A] font-medium border border-[#E5E5E7]'
                : 'text-[#6B6B70] hover:bg-white/60 hover:text-[#1A1A1A]'
            }`}
            onClick={() => onNavigate(id)}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">{label}</span>}
          </button>
        ))}

        {(canSeeSettings || Boolean(selectedProject?.allowMemberManageCustomFields)) && (
          <>
            <div className="pt-3 pb-1">
              <div className="h-px bg-[#E5E5E7] mx-1" />
              {!isSidebarCollapsed && (
                <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider px-2 pt-3 pb-1 truncate">
                  Cài đặt dự án
                </p>
              )}
            </div>
            {SETTINGS_NAV.filter(({ id }) => canSeeSettings || (id === 'custom-fields' && selectedProject?.allowMemberManageCustomFields)).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={isSidebarCollapsed ? label : undefined}
                className={`w-full flex items-center rounded-lg text-sm transition-colors text-left ${
                  isSidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2'
                } ${
                  currentScreen === id
                    ? 'bg-white text-[#1A1A1A] font-medium border border-[#E5E5E7]'
                    : 'text-[#6B6B70] hover:bg-white/60 hover:text-[#1A1A1A]'
                }`}
                onClick={() => onNavigate(id)}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">{label}</span>}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Bottom user section */}
      <div className={`border-t border-[#E5E5E7] ${isSidebarCollapsed ? 'p-2 flex justify-center' : 'p-3'}`}>
        {!isSidebarCollapsed ? (
          <UserMenu
            user={user}
            onNavigateProfile={() => onNavigate('profile')}
            onNavigateInvitations={() => onNavigate('invitations')}
            onLogout={onLogout}
          />
        ) : (
          <div
            title={`${user.name} - Hồ sơ`}
            className="cursor-pointer"
            onClick={() => onNavigate('profile')}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-[#E5E5E7]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs font-semibold">
                {user.initials || 'U'}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
