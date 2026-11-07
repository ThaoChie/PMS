import { useState, useEffect, useCallback } from 'react';
import type { Role, Screen, Project } from './types';

import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import ForgotPassword from './features/auth/pages/ForgotPassword';
import ResetPassword from './features/auth/pages/ResetPassword';
import Shell from './components/Shell';
import Dashboard from './components/Dashboard';
import MyProfile from './features/profile/pages/Profile';
import NotificationCenter from './components/profile/NotificationCenter';
import ProjectList from './features/projects/pages/ProjectList';
import ProjectSettings from './features/projects/pages/ProjectSettings';
import Board from './components/board/Board';
import IssueList from './components/board/IssueList';
import IssueDetail from './components/board/IssueDetail';
import SavedFilters from './components/board/SavedFilters';
import MembersRoles from './features/members/pages/Members';
import WorkflowConfig from './features/workflow/pages/WorkflowSettings';
import CustomFieldsConfig from './features/projects/pages/CustomFieldsSettings';
import Reports from './components/reports/Reports';
import CreateIssueModal from './components/shared/CreateIssueModal';
import CreateProjectModal from './components/shared/CreateProjectModal';
import QuickSearch from './components/shared/QuickSearch';
import Invitations from './features/members/pages/Invitations';
import IssueDetailPage from './features/issues/pages/IssueDetailPage';
import { ApprovalsPage } from './features/approvals';

import ToastContainer from './components/common/ToastContainer';
import { useAuthStore } from './store/authStore';
import { useProjectStore } from './store/projectStore';

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password';

export default function App() {
  const { user, isAuthenticated, isLoading: authLoading, bootstrap, logout } = useAuthStore();
  const { projects, currentProject, setCurrentProject, fetchProjects } = useProjectStore();

  const [authView, setAuthView] = useState<AuthView>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p === '/register') return 'register';
      if (p === '/forgot-password') return 'forgot-password';
      if (p === '/reset-password' || new URLSearchParams(window.location.search).get('token')) return 'reset-password';
    }
    return 'login';
  });

  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p === '/dashboard' || p === '/') return 'dashboard';
      if (p === '/board') return 'board';
      if (p === '/issues') return 'issues';
      if (p === '/saved-filters') return 'saved-filters';
      if (p === '/reports') return 'reports';
      if (p === '/profile') return 'profile';
      if (p === '/projects') return 'projects';
      if (p.includes('/invitations')) return 'invitations';
      if (p.includes('/approvals')) return 'approvals' as Screen;
      if (p.match(/^\/projects\/[^/]+\/board/)) return 'board';
      if (p.match(/^\/projects\/[^/]+\/issues/)) return 'issues';
      if (p.match(/^\/projects\/[^/]+\/reports/)) return 'reports';
      if (p.match(/^\/projects\/[^/]+\/members/)) return 'members-roles';
      if (p.match(/^\/projects\/[^/]+\/settings/)) return 'project-settings';
      if (p.match(/^\/projects\/[^/]+\/(workflows|workflow)/)) return 'workflow';
      if (p.match(/^\/projects\/[^/]+\/custom-fields/)) return 'custom-fields';
    }
    return 'dashboard';
  });

  const [role, setRole] = useState<Role>('pm');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [activeIssueKey, setActiveIssueKey] = useState<string | null>(null);

  // Sync route from window.location
  const syncRouteFromLocation = useCallback((projectList = projects) => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    // 1. Auth routes
    if (pathname === '/register') {
      setAuthView('register');
      return;
    }
    if (pathname === '/login') {
      setAuthView('login');
      return;
    }
    if (pathname === '/forgot-password') {
      setAuthView('forgot-password');
      return;
    }
    if (pathname === '/reset-password' || searchParams.get('token')) {
      setAuthView('reset-password');
      return;
    }

    // 2. Global app routes
    if (pathname === '/dashboard' || pathname === '/') {
      setCurrentScreen('dashboard');
      return;
    }
    if (pathname === '/board') {
      setCurrentScreen('board');
      return;
    }
    if (pathname === '/issues') {
      setCurrentScreen('issues');
      return;
    }
    if (pathname === '/saved-filters') {
      setCurrentScreen('saved-filters');
      return;
    }
    if (pathname === '/reports') {
      setCurrentScreen('reports');
      return;
    }
    if (pathname === '/profile') {
      setCurrentScreen('profile');
      return;
    }
    if (pathname === '/projects') {
      setCurrentScreen('projects');
      return;
    }
    if (pathname.includes('/invitations')) {
      setCurrentScreen('invitations');
      return;
    }
    if (pathname.includes('/approvals')) {
      setCurrentScreen('approvals' as Screen);
      return;
    }

    // 3. Project scoped routes (/projects/:id/(board|issues|reports|members|settings|workflows|custom-fields))
    const projectSubMatch = pathname.match(/^\/projects\/([^/]+)\/(board|issues|reports|members|settings|workflows|workflow|custom-fields)/);
    if (projectSubMatch) {
      const projIdOrKey = decodeURIComponent(projectSubMatch[1]);
      const sub = projectSubMatch[2];

      if (projectList && projectList.length > 0) {
        const found = projectList.find(
          (p) => String(p.id) === projIdOrKey || p.key.toLowerCase() === projIdOrKey.toLowerCase()
        );
        if (found && (!currentProject || currentProject.id !== found.id)) {
          setCurrentProject(found);
        }
      }

      if (sub === 'board') setCurrentScreen('board');
      else if (sub === 'issues') setCurrentScreen('issues');
      else if (sub === 'reports') setCurrentScreen('reports');
      else if (sub === 'members') setCurrentScreen('members-roles');
      else if (sub === 'settings') setCurrentScreen('project-settings');
      else if (sub === 'workflows' || sub === 'workflow') setCurrentScreen('workflow');
      else if (sub === 'custom-fields') setCurrentScreen('custom-fields');
      return;
    }

    // 4. Issue detail route
    const pathMatch = pathname.match(/\/issues\/([A-Za-z0-9_-]+)/);
    const issueKeyParam = pathMatch ? pathMatch[1] : searchParams.get('issue');
    if (issueKeyParam) {
      setActiveIssueKey(issueKeyParam);
      setCurrentScreen('issue-detail');
      return;
    }

    // Fallback: Nếu không match route nào và pathname không rỗng
    if (pathname && pathname !== '/') {
      setCurrentScreen('dashboard');
      return;
    }
  }, [projects, currentProject, setCurrentProject]);

  // Restore session & sync route on mount
  useEffect(() => {
    bootstrap();
    syncRouteFromLocation();
  }, [bootstrap, syncRouteFromLocation]);

  // Listen to popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      syncRouteFromLocation();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncRouteFromLocation]);

  // Sync projects when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);

  // Sync route after projects list is loaded (e.g. resolve project id in /projects/:id/...)
  useEffect(() => {
    if (projects.length > 0) {
      syncRouteFromLocation(projects);
    }
  }, [projects, syncRouteFromLocation]);

  // Sync active role with current project role
  useEffect(() => {
    if (currentProject?.myRole) {
      setRole(currentProject.myRole);
    } else {
      setRole('pm');
    }
  }, [currentProject]);

  // Guard: Khi chưa đăng nhập -> Nếu URL không phải trang auth, chuẩn hóa URL về /login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const p = window.location.pathname;
      if (p !== '/login' && p !== '/register' && p !== '/forgot-password' && p !== '/reset-password') {
        window.history.replaceState({}, '', '/login');
        setAuthView('login');
      }
    }
  }, [authLoading, isAuthenticated]);

  // Guard: Khi đã đăng nhập -> Nếu URL đang là trang auth hoặc root /, chuyển hướng về /dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const p = window.location.pathname;
      if (p === '/login' || p === '/register' || p === '/forgot-password' || p === '/reset-password' || p === '/') {
        window.history.replaceState({}, '', '/dashboard');
        setCurrentScreen('dashboard');
      }
    }
  }, [authLoading, isAuthenticated]);

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
    const p = window.location.pathname;
    if (p === '/login' || p === '/register' || p === '/forgot-password' || p === '/reset-password' || p === '/') {
      window.history.pushState({}, '', '/dashboard');
      setCurrentScreen('dashboard');
    } else {
      syncRouteFromLocation();
    }
  }

  async function handleLogout() {
    await logout();
    setAuthView('login');
    setSelectedIssueId(null);
    window.history.pushState({}, '', '/login');
  }

  function handleSelectIssue(id: string) {
    setSelectedIssueId(id);
    window.history.pushState({}, '', `/issues/${id}`);
  }

  function handleCloseIssue() {
    setSelectedIssueId(null);
    if (window.location.pathname.startsWith('/issues/')) {
      const pid = currentProject?.id || (projects.length > 0 ? projects[0].id : null);
      if (currentScreen === 'board') {
        window.history.pushState({}, '', pid ? `/projects/${pid}/board` : '/board');
      } else if (currentScreen === 'issues') {
        window.history.pushState({}, '', pid ? `/projects/${pid}/issues` : '/issues');
      } else {
        window.history.pushState({}, '', pid ? `/projects/${pid}/board` : '/dashboard');
      }
    }
  }

  function handleCreateProject() {
    setShowCreateProject(true);
  }

  function handleNavigate(screen: Screen) {
    setCurrentScreen(screen);
    setSelectedIssueId(null);

    const pid = currentProject?.id || (projects.length > 0 ? projects[0].id : null);

    switch (screen) {
      case 'dashboard':
        window.history.pushState({}, '', '/dashboard');
        break;
      case 'board':
        if (pid) {
          window.history.pushState({}, '', `/projects/${pid}/board`);
        } else {
          window.history.pushState({}, '', '/board');
        }
        break;
      case 'issues':
        if (pid) {
          window.history.pushState({}, '', `/projects/${pid}/issues`);
        } else {
          window.history.pushState({}, '', '/issues');
        }
        break;
      case 'saved-filters':
        window.history.pushState({}, '', '/saved-filters');
        break;
      case 'reports':
        if (pid) {
          window.history.pushState({}, '', `/projects/${pid}/reports`);
        } else {
          window.history.pushState({}, '', '/reports');
        }
        break;
      case 'profile':
        window.history.pushState({}, '', '/profile');
        break;
      case 'projects':
        window.history.pushState({}, '', '/projects');
        break;
      case 'members-roles':
        if (pid) {
          window.history.pushState({}, '', `/projects/${pid}/members`);
        } else {
          window.history.pushState({}, '', '/projects');
        }
        break;
      case 'project-settings':
        if (pid) {
          window.history.pushState({}, '', `/projects/${pid}/settings`);
        } else {
          window.history.pushState({}, '', '/projects');
        }
        break;
      case 'workflow':
        if (pid) {
          window.history.pushState({}, '', `/projects/${pid}/workflows`);
        } else {
          window.history.pushState({}, '', '/projects');
        }
        break;
      case 'custom-fields':
        if (pid) {
          window.history.pushState({}, '', `/projects/${pid}/custom-fields`);
        } else {
          window.history.pushState({}, '', '/projects');
        }
        break;
      case 'invitations':
        window.history.pushState({}, '', '/invitations');
        break;
      case 'approvals' as Screen:
        window.history.pushState({}, '', '/approvals');
        break;
      default:
        break;
    }
  }

  function handleSelectProject(proj: Project) {
    setCurrentProject(proj);
    if (currentScreen === 'members-roles') {
      window.history.pushState({}, '', `/projects/${proj.id}/members`);
    } else if (currentScreen === 'project-settings') {
      window.history.pushState({}, '', `/projects/${proj.id}/settings`);
    } else if (currentScreen === 'workflow') {
      window.history.pushState({}, '', `/projects/${proj.id}/workflows`);
    } else if (currentScreen === 'custom-fields') {
      window.history.pushState({}, '', `/projects/${proj.id}/custom-fields`);
    } else if (currentScreen === 'issues') {
      window.history.pushState({}, '', `/projects/${proj.id}/issues`);
    } else if (currentScreen === 'reports') {
      window.history.pushState({}, '', `/projects/${proj.id}/reports`);
    } else {
      setCurrentScreen('board');
      window.history.pushState({}, '', `/projects/${proj.id}/board`);
    }
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
    let authContent = null;
    if (authView === 'register') {
      authContent = (
        <Register
          onLogin={() => {
            setAuthView('login');
            window.history.pushState({}, '', '/login');
          }}
          onBack={() => {
            setAuthView('login');
            window.history.pushState({}, '', '/login');
          }}
        />
      );
    } else if (authView === 'forgot-password') {
      authContent = (
        <ForgotPassword
          onBack={() => {
            setAuthView('login');
            window.history.pushState({}, '', '/login');
          }}
        />
      );
    } else if (authView === 'reset-password') {
      authContent = (
        <ResetPassword
          onSuccess={() => {
            setAuthView('login');
            window.history.pushState({}, '', '/login');
          }}
        />
      );
    } else {
      authContent = (
        <Login
          onLogin={handleLogin}
          onRegister={() => {
            setAuthView('register');
            window.history.pushState({}, '', '/register');
          }}
          onForgotPassword={() => {
            setAuthView('forgot-password');
            window.history.pushState({}, '', '/forgot-password');
          }}
        />
      );
    }
    return (
      <>
        {authContent}
        <ToastContainer />
      </>
    );
  }

  function renderScreen() {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <Dashboard
            role={role}
            onSelectIssue={handleSelectIssue}
            onNavigate={handleNavigate}
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
        return <Invitations onNavigate={handleNavigate} />;
      case 'notifications':
        return <NotificationCenter onNavigate={handleNavigate} />;
      case 'projects':
        return (
          <ProjectList
            role={role}
            onCreateProject={handleCreateProject}
            onSettings={() => handleNavigate('project-settings')}
            onSelectProject={handleSelectProject}
          />
        );
      case 'project-settings':
        return <ProjectSettings role={role} onNavigate={handleNavigate} />;
      case 'custom-fields':
        return <CustomFieldsConfig role={role} />;
      case 'issue-detail':
        return (
          <IssueDetailPage
            issueKey={activeIssueKey || ''}
            role={role}
            onBack={() => {
              const pid = currentProject?.id || (projects.length > 0 ? projects[0].id : null);
              window.history.pushState({}, '', pid ? `/projects/${pid}/issues` : '/issues');
              setCurrentScreen('issues');
              setActiveIssueKey(null);
            }}
            onSelectSubtask={(key) => {
              window.history.pushState({}, '', `/issues/${key}`);
              setActiveIssueKey(key);
            }}
          />
        );
      case 'members-roles':
        return <MembersRoles role={role} />;
      case 'workflow':
        return <WorkflowConfig />;
      case ('approvals' as any):
        return <ApprovalsPage />;
      default:
        return (
          <Dashboard
            role={role}
            onSelectIssue={handleSelectIssue}
            onNavigate={handleNavigate}
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
        onNavigate={handleNavigate}
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

      {/* Global Toasts */}
      <ToastContainer />
    </>
  );
}
