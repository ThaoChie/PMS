import React, { useCallback, useEffect, useState } from 'react';
import { KanbanSquare, ListTodo, Bug, Clock, FolderGit2, RefreshCw } from 'lucide-react';
import type { Issue, NotificationItem, Role, SavedFilter } from '../../types';
import { useProjectStore } from '../../store/projectStore';
import { issueService } from '../../services/issueService';
import { dashboardService, type DashboardActivity } from '../../services/dashboardService';
import { mapUserResponseToUser } from '../../store/authStore';
import { MESSAGES } from '../../constants/messages';
import ErrorState from '../../components/common/ErrorState';
import { AssignedIssuesWidget } from './AssignedIssuesWidget';
import { RecentActivityWidget } from './RecentActivityWidget';
import { WatchingWidget } from './WatchingWidget';
import { SavedFiltersWidget } from './SavedFiltersWidget';

interface DashboardProps {
  role: Role;
  onSelectIssue: (id: string) => void;
  onNavigate: (screen: any) => void;
}

function mapIssue(item: any): Issue {
  return {
    id: String(item?.id ?? ''),
    key: item?.key || item?.issueKey || '',
    summary: item?.summary || '',
    description: item?.description || '',
    type: item?.type,
    status: item?.status,
    priority: item?.priority,
    assignee: item?.assignee ? mapUserResponseToUser(item.assignee) : undefined,
    reporter: item?.reporter
      ? mapUserResponseToUser(item.reporter)
      : ({ id: '0', name: '', email: '', initials: 'U', role: 'member', status: 'Active' } as any),
    labels: item?.labels || [],
    estimates: item?.estimates,
    dueDate: item?.dueDate,
    environment: item?.environment,
    attachments: item?.attachments || [],
    subtasks: item?.subtasks || [],
    linkedIssues: item?.linkedIssues || [],
    comments: item?.comments || [],
    projectId: String(item?.projectId || ''),
    createdAt: item?.createdAt || '',
    updatedAt: item?.updatedAt || '',
  } as Issue;
}

/** Hoạt động từ audit log hiển thị lại bằng khung NotificationItem của widget */
function activityToItem(a: DashboardActivity): NotificationItem {
  return {
    id: String(a.id),
    type: 'workflow',
    title: `${a.actor || 'Ai đó'} ${a.action || 'đã cập nhật'} ${a.issueKey || ''}`.trim(),
    description: a.issueSummary || '',
    isRead: true,
    createdAt: a.timestamp || new Date().toISOString(),
  };
}

function mapSavedFilter(raw: any): SavedFilter {
  return {
    id: String(raw?.id ?? ''),
    name: raw?.name || '',
    owner: mapUserResponseToUser(raw?.owner),
    sharedWith: Array.isArray(raw?.sharedWith)
      ? raw.sharedWith.map((u: any) => mapUserResponseToUser(u))
      : [],
    emailSubscription: !!raw?.emailSubscription,
    frequency: raw?.frequency === 'daily' ? 'daily' : undefined,
    filters: (raw?.filters as any) || {},
    isShared: !!raw?.isShared,
  };
}

function isDone(status: any): boolean {
  const s = String(status || '').toUpperCase();
  return s === 'DONE' || s === 'HOÀN THÀNH';
}

export default function Dashboard({ onSelectIssue, onNavigate }: DashboardProps) {
  const currentProject = useProjectStore((s) => s.currentProject);

  // Dữ liệu cá nhân — GET /dashboard
  const [assignedIssues, setAssignedIssues] = useState<Issue[]>([]);
  const [watchingIssues, setWatchingIssues] = useState<Issue[]>([]);
  const [activities, setActivities] = useState<NotificationItem[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardFailed, setDashboardFailed] = useState(false);

  // Dữ liệu chỉ số của dự án đang chọn
  const [projectIssues, setProjectIssues] = useState<Issue[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    setDashboardFailed(false);
    try {
      const res = await dashboardService.getDashboardData();
      const data = res?.data;
      setAssignedIssues((data?.assignedIssues || []).map(mapIssue));
      setWatchingIssues((data?.watchingIssues || []).map(mapIssue));
      setActivities((data?.recentActivities || []).map(activityToItem));
      setSavedFilters((data?.savedFilters || []).map(mapSavedFilter));
    } catch {
      setDashboardFailed(true);
      setAssignedIssues([]);
      setWatchingIssues([]);
      setActivities([]);
      setSavedFilters([]);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!currentProject?.id) {
      setProjectIssues([]);
      return;
    }
    let active = true;
    setLoadingStats(true);
    issueService
      .getIssues(currentProject.id, { page: 1, size: 100 })
      .then((res) => {
        if (!active) return;
        const raw: any = res?.data?.content || (res?.data as any) || [];
        setProjectIssues(Array.isArray(raw) ? raw.map(mapIssue) : []);
      })
      .catch(() => {
        if (active) setProjectIssues([]);
      })
      .finally(() => {
        if (active) setLoadingStats(false);
      });
    return () => {
      active = false;
    };
  }, [currentProject?.id]);

  const openIssues = projectIssues.filter((i) => !isDone(i.status));
  const bugCount = projectIssues.filter((i) => String(i.type).toUpperCase() === 'BUG').length;
  const pendingApproval = projectIssues.filter(
    (i) =>
      String(i.status).toLowerCase().includes('approval') ||
      String(i.status).toLowerCase().includes('xác nhận'),
  ).length;
  const overdueCount = projectIssues.filter(
    (i) => i.dueDate && new Date(i.dueDate) < new Date() && !isDone(i.status),
  ).length;

  const stats = [
    {
      label: 'Việc đang mở',
      value: openIssues.length,
      icon: ListTodo,
      sub: currentProject ? `Dự án ${currentProject.name}` : 'Chưa chọn dự án',
    },
    {
      label: 'Lỗi chưa sửa',
      value: bugCount,
      icon: Bug,
      sub: 'trong dự án hiện tại',
      atRisk: bugCount > 2,
    },
    {
      label: 'Chờ phê duyệt',
      value: pendingApproval,
      icon: KanbanSquare,
      sub: 'đang chờ xem xét',
    },
    {
      label: 'Quá hạn',
      value: overdueCount,
      icon: Clock,
      sub: 'đã qua hạn chót',
      atRisk: overdueCount > 0,
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">{MESSAGES.DASHBOARD.TITLE}</h1>
            <p className="text-sm text-[#6B6B70] mt-0.5">
              {currentProject
                ? `Chào mừng bạn quay lại — dự án đang chọn: ${currentProject.name} (${currentProject.key})`
                : 'Chào mừng bạn quay lại — hãy chọn hoặc tạo một dự án để bắt đầu'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDashboard}
              title={MESSAGES.COMMON.RETRY}
              className="p-2 rounded-lg border border-[#E5E5E7] text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingDashboard ? 'animate-spin' : ''}`} />
            </button>
            {!currentProject && (
              <button
                onClick={() => onNavigate('projects')}
                className="px-3.5 py-2 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition-colors flex items-center gap-2"
              >
                <FolderGit2 className="w-4 h-4" />
                <span>Xem danh sách dự án</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`border rounded-xl p-5 ${
                s.atRisk ? 'border-[#E53E3E]/30 bg-[#FDECEC]' : 'border-[#E5E5E7] bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider">
                  {s.label}
                </p>
                <s.icon className={`w-4 h-4 ${s.atRisk ? 'text-[#E53E3E]' : 'text-[#C5C5C8]'}`} />
              </div>
              <p className={`text-3xl font-bold ${s.atRisk ? 'text-[#E53E3E]' : 'text-[#1A1A1A]'}`}>
                {loadingStats ? '—' : s.value}
              </p>
              <p className={`text-xs mt-0.5 ${s.atRisk ? 'text-[#E53E3E]' : 'text-[#6B6B70]'}`}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {dashboardFailed && (
          <ErrorState
            title={MESSAGES.DASHBOARD.LOAD_FAILED}
            message={MESSAGES.COMMON.NETWORK_ERROR}
            onRetry={fetchDashboard}
            className="mb-6"
          />
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Việc được giao cho tôi */}
          <AssignedIssuesWidget
            issues={assignedIssues.slice(0, 5)}
            onSelectIssue={onSelectIssue}
            onNavigate={onNavigate}
          />

          {/* Việc tôi đang theo dõi (giả định A-07) */}
          <WatchingWidget
            issues={watchingIssues.slice(0, 5)}
            onSelectIssue={onSelectIssue}
            onNavigate={onNavigate}
          />

          {/* Hoạt động gần đây — lấy từ audit log (giả định A-08) */}
          <RecentActivityWidget notifications={activities.slice(0, 5)} onNavigate={onNavigate} />

          {/* Bộ lọc đã lưu */}
          <SavedFiltersWidget filters={savedFilters} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}
