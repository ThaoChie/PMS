import { useState, useEffect } from 'react';
import type { Role, Screen, Project } from './types';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Shell from './components/Shell';
import Dashboard from './components/Dashboard';
import MyProfile from './components/profile/MyProfile';
import NotificationCenter from './components/profile/NotificationCenter';
import ProjectList from './components/projects/ProjectList';
import ProjectSettings from './components/projects/ProjectSettings';
import Board from './components/board/Board';
import IssueList from './components/board/IssueList';
import IssueDetail from './components/board/IssueDetail';
import SavedFilters from './components/board/SavedFilters';
import MembersRoles from './components/admin/MembersRoles';
import WorkflowConfig from './components/admin/WorkflowConfig';
import Reports from './components/reports/Reports';
import CreateIssueModal from './components/shared/CreateIssueModal';
import CreateProjectModal from './components/shared/CreateProjectModal';
import QuickSearch from './components/shared/QuickSearch';
import Invitations from './features/members/pages/Invitations';

import ForgotPassword from './features/auth/pages/ForgotPassword';
import ResetPassword from './features/auth/pages/ResetPassword';
import { useAuthStore } from './store/authStore';
import { useProjectStore } from './store/projectStore';

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password';

export default function App() {
  const { user, isAuthenticated, isLoading: authLoading, bootstrap, logout } = useAuthStore();
  const { projects, currentProject, setCurrentProject, fetchProjects } = useProjectStore();

  const [authView, setAuthView] = useState<AuthView>('login');
  const [currentScreen, setCurrentScreen] = useState<Screen>('projects');
  const [role, setRole] = useState<Role>('member');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);

  // Restore session & check query params
  useEffect(() => {
    bootstrap();

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('token')) {
      setAuthView('reset-password');
    }
  }, [bootstrap]);

  // Sync role and projects when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role) {
        setRole(user.role);
      }
      fetchProjects();
    }
  }, [isAuthenticated, user?.role, fetchProjects]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickSearch((s) => !s);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function handleLogin() {
    setAuthView('login');
    setCurrentScreen('projects');
  }

  async function handleLogout() {
    await logout();
    setAuthView('login');
    setSelectedIssueId(null);
  }

  function handleSelectIssue(id: string) {
    setSelectedIssueId(id);
  }

  function handleCloseIssue() {
    setSelectedIssueId(null);
  }

  function handleCreateProject() {
    setShowCreateProject(true);
  }

  function handleSelectProject(proj: Project) {
    setCurrentProject(proj);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <div className="w-8 h-8 border-2 border-[#E53E3E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#1E293B]">Đang khởi tạo phiên làm việc…</p>
          <p className="text-xs text-[#94A3B8]">
            Nếu hệ thống đang ở trạng thái ngủ (Render Cold Start), quá trình có thể mất ít giây.
          </p>
          <button
            type="button"
            onClick={() => useAuthStore.setState({ isLoading: false, isAuthenticated: false })}
            className="mt-1 text-xs text-[#E53E3E] font-medium hover:underline"
          >
            Bỏ qua &amp; đến màn hình Đăng nhập &rarr;
          </button>
        </div>
      </div>
    );
  }

  // Auth screens
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onLogin={handleLogin} onBack={() => setAuthView('login')} />;
    }
    if (authView === 'forgot-password') {
      return <ForgotPassword onBack={() => setAuthView('login')} />;
    }
    if (authView === 'reset-password') {
      return <ResetPassword onSuccess={() => setAuthView('login')} />;
    }
    return (
      <Login
        onLogin={handleLogin}
        onRegister={() => setAuthView('register')}
        onForgotPassword={() => setAuthView('forgot-password')}
      />
    );
  }

  function renderScreen() {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <Dashboard
            role={role}
            onSelectIssue={handleSelectIssue}
            onNavigate={setCurrentScreen}
          />
        );
      case 'board':
        return <Board role={role} onSelectIssue={handleSelectIssue} />;
      case 'issues':
        return <IssueList onSelectIssue={handleSelectIssue} />;
      case 'saved-filters':
        return <SavedFilters />;
      case 'reports':
        return <Reports role={role} />;
      case 'profile':
        return <MyProfile />;
      case 'invitations':
        return <Invitations />;
      case 'notifications':
        return <NotificationCenter />;
      case 'projects':
        return (
          <ProjectList
            role={role}
            onCreateProject={handleCreateProject}
            onSettings={() => setCurrentScreen('project-settings')}
            onSelectProject={handleSelectProject}
          />
        );
      case 'project-settings':
        return <ProjectSettings role={role} />;
      case 'members-roles':
        return <MembersRoles role={role} />;
      case 'workflow':
        return <WorkflowConfig />;
      default:
        return (
          <Dashboard
            role={role}
            onSelectIssue={handleSelectIssue}
            onNavigate={setCurrentScreen}
          />
        );
    }
  }

  return (
    <>
      <Shell
        currentScreen={currentScreen}
        role={role}
        projects={projects}
        selectedProject={currentProject}
        currentUser={user || undefined}
        onNavigate={(screen) => {
          setCurrentScreen(screen);
          setSelectedIssueId(null);
        }}
        onRoleChange={setRole}
        onCreateIssue={() => setShowCreateIssue(true)}
        onSearch={() => setShowQuickSearch(true)}
        onLogout={handleLogout}
      >
        <div className="h-full relative">
          {renderScreen()}

          {/* Issue detail drawer */}
          {selectedIssueId && (
            <IssueDetail
              issueId={selectedIssueId}
              role={role}
              onClose={handleCloseIssue}
            />
          )}
        </div>
      </Shell>

      {/* Modals */}
      {showCreateIssue && <CreateIssueModal onClose={() => setShowCreateIssue(false)} />}
      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onSubmitSuccess={() => fetchProjects()}
        />
      )}
      {showQuickSearch && (
        <QuickSearch
          onClose={() => setShowQuickSearch(false)}
          onSelectIssue={(id) => {
            handleSelectIssue(id);
            setShowQuickSearch(false);
          }}
        />
      )}
    </>
  );
}
