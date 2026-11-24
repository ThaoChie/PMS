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
  X,
} from 'lucide-react';
import type { Role, Screen, Project, User } from '../../types';
import ProjectSwitcher from './ProjectSwitcher';
import ProjectBadge from '../../features/projects/components/ProjectBadge';
import UserMenu from './UserMenu';
import { useUIStore } from '../../store/uiStore';
import ApprovalNavItem from '../../features/approvals/components/ApprovalNavItem';

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
  onCreateProject?: () => void;
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
  onCreateProject,
  onLogout,
}: SidebarProps) {
  const isSidebarCollapsed = useUIStore((s) => s.isSidebarCollapsed);
  const isMobileSidebarOpen = useUIStore((s) => s.isMobileSidebarOpen);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const canSeeSettings = role === 'admin' || role === 'pm';

  const handleNavClick = (id: Screen) => {
    setMobileSidebarOpen(false);
    onNavigate(id);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#F7F7F8] border-r border-[#E5E5E7] flex flex-col shadow-2xl md:shadow-none transition-transform md:transition-all duration-300 ease-in-out md:static shrink-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${
        isSidebarCollapsed ? 'md:w-16' : 'md:w-60'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Logo & Mobile Close */}
      <div className={`h-14 flex items-center justify-between border-b border-[#E5E5E7] ${isSidebarCollapsed ? 'md:justify-center px-4 md:px-2' : 'px-4'}`}>
        <div className="flex items-center gap-2.5">
          <img
            src="/logoVJU.png"
            alt="VJU Logo"
            className="w-7 h-7 object-contain select-none shrink-0"
          />
          {(!isSidebarCollapsed || isMobileSidebarOpen) && (
            <span className={`font-bold text-[#1A1A1A] text-sm tracking-tight truncate ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
              EPMS
            </span>
          )}
        </div>

        {/* Mobile close button (min 44x44px clickable target) */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="w-11 h-11 flex items-center justify-center rounded-lg text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-white/80 transition-colors md:hidden"
          aria-label="Đóng thanh điều hướng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Project switcher */}
      {(!isSidebarCollapsed || isMobileSidebarOpen) ? (
        <div className={`px-3 pt-3 pb-2 ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
          <ProjectSwitcher
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={(p) => {
              setMobileSidebarOpen(false);
              onSelectProject(p);
            }}
            onCreateProject={() => {
              setMobileSidebarOpen(false);
              if (onCreateProject) onCreateProject();
              else onNavigate('projects');
            }}
          />
        </div>
      ) : (
        <div className="p-2 hidden md:flex justify-center">
          <div
            title={selectedProject ? `${selectedProject.name} (${selectedProject.key})` : 'Chọn dự án'}
            className="cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleNavClick('projects')}
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
      <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={isSidebarCollapsed ? label : undefined}
            className={`w-full flex items-center rounded-lg text-sm min-h-[44px] transition-colors text-left ${
              isSidebarCollapsed ? 'md:justify-center md:px-0 md:py-2.5 gap-2.5 px-3 py-2.5' : 'gap-2.5 px-3 py-2.5'
            } ${
              currentScreen === id
                ? 'bg-white text-[#1A1A1A] font-medium border border-[#E5E5E7]'
                : 'text-[#6B6B70] hover:bg-white/60 hover:text-[#1A1A1A]'
            }`}
            onClick={() => handleNavClick(id)}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className={`truncate ${isSidebarCollapsed ? 'md:hidden' : ''}`}>{label}</span>
          </button>
        ))}

        <ApprovalNavItem
          currentScreen={currentScreen}
          isCollapsed={isSidebarCollapsed && !isMobileSidebarOpen}
          onNavigate={handleNavClick}
        />

        {Boolean(selectedProject) &&
          (canSeeSettings || Boolean(selectedProject?.allowMemberManageCustomFields)) && (
          <>
            <div className="pt-3 pb-1">
              <div className="h-px bg-[#E5E5E7] mx-1" />
              {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                <p className={`text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider px-2 pt-3 pb-1 truncate ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
                  Cài đặt dự án
                </p>
              )}
            </div>
            {SETTINGS_NAV.filter(({ id }) => canSeeSettings || (id === 'custom-fields' && selectedProject?.allowMemberManageCustomFields)).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={isSidebarCollapsed ? label : undefined}
                className={`w-full flex items-center rounded-lg text-sm min-h-[44px] transition-colors text-left ${
                  isSidebarCollapsed ? 'md:justify-center md:px-0 md:py-2.5 gap-2.5 px-3 py-2.5' : 'gap-2.5 px-3 py-2.5'
                } ${
                  currentScreen === id
                    ? 'bg-white text-[#1A1A1A] font-medium border border-[#E5E5E7]'
                    : 'text-[#6B6B70] hover:bg-white/60 hover:text-[#1A1A1A]'
                }`}
                onClick={() => handleNavClick(id)}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className={`truncate ${isSidebarCollapsed ? 'md:hidden' : ''}`}>{label}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Bottom user section */}
      <div className={`border-t border-[#E5E5E7] ${isSidebarCollapsed ? 'md:p-2 md:flex md:justify-center p-3' : 'p-3'}`}>
        {(!isSidebarCollapsed || isMobileSidebarOpen) ? (
          <div className={`${isSidebarCollapsed ? 'md:hidden' : ''}`}>
            <UserMenu
              user={user}
              onNavigateProfile={() => handleNavClick('profile')}
              onNavigateInvitations={() => handleNavClick('invitations')}
              onLogout={onLogout}
            />
          </div>
        ) : null}

        {isSidebarCollapsed && (
          <div
            title={`${user.name} - Hồ sơ`}
            className="cursor-pointer hidden md:flex items-center justify-center min-w-[44px] min-h-[44px]"
            onClick={() => handleNavClick('profile')}
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
