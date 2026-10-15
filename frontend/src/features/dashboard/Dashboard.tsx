import React, { useState, useEffect } from 'react';
import { KanbanSquare, ListTodo, Bug, Clock, FolderGit2 } from 'lucide-react';
import type { Role, Issue, NotificationItem } from '../../types';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { issueService } from '../../services/issueService';
import { AssignedIssuesWidget } from './AssignedIssuesWidget';
import { RecentActivityWidget } from './RecentActivityWidget';

interface DashboardProps {
  role: Role;
  onSelectIssue: (id: string) => void;
  onNavigate: (screen: any) => void;
}

export default function Dashboard({ onSelectIssue, onNavigate }: DashboardProps) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const user = useAuthStore((s) => s.user);
  const notifications = useNotificationStore((s) => s.notifications);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentProject?.id) {
      setIssues([]);
      return;
    }

    let active = true;
    setLoading(true);

    issueService
      .getIssues(currentProject.id, { page: 1, size: 100 })
      .then((res) => {
        if (!active) return;
        const rawList = res?.data?.content || (res?.data as any) || [];
        const list: Issue[] = Array.isArray(rawList)
          ? rawList.map((item: any) => ({
              id: String(item.id),
              key: item.key || item.issueKey || '',
              summary: item.summary || '',
              description: item.description || '',
              type: item.type,
              status: item.status,
              priority: item.priority,
              assignee: item.assignee
                ? {
                    id: String(item.assignee.id),
                    name: item.assignee.fullName || item.assignee.name || item.assignee.email,
                    email: item.assignee.email,
                    avatarUrl: item.assignee.avatarUrl,
                    role: 'member',
                  }
                : undefined,
              reporter: item.reporter
                ? {
                    id: String(item.reporter.id),
                    name: item.reporter.fullName || item.reporter.name || item.reporter.email,
                    email: item.reporter.email,
                    avatarUrl: item.reporter.avatarUrl,
                    role: 'member',
                  }
                : { id: '0', name: 'Unknown', email: '', role: 'member' },
              labels: item.labels || [],
              estimates: item.estimates,
              dueDate: item.dueDate,
              environment: item.environment,
              attachments: item.attachments || [],
              subtasks: item.subtasks || [],
              linkedIssues: item.linkedIssues || [],
              comments: item.comments || [],
              projectId: String(item.projectId || currentProject.id),
              createdAt: item.createdAt || '',
              updatedAt: item.updatedAt || '',
            }))
          : [];
        setIssues(list);
      })
      .catch(() => {
        if (active) setIssues([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentProject?.id]);

  const openIssues = issues.filter(
    (i) => i.status !== 'Done' && i.status !== 'DONE' && i.status !== 'Hoàn thành',
  );
  const bugCount = issues.filter((i) => String(i.type).toUpperCase() === 'BUG').length;
  const pendingApproval = issues.filter(
    (i) =>
      String(i.status).toLowerCase().includes('approval') ||
      String(i.status).toLowerCase().includes('xác nhận'),
  ).length;
  const overdueIssues = issues.filter(
    (i) =>
      i.dueDate &&
      new Date(i.dueDate) < new Date() &&
      i.status !== 'Done' &&
      i.status !== 'DONE' &&
      i.status !== 'Hoàn thành',
  );

  const myIssues = issues
    .filter((i) => {
      const isMe =
        (user?.id && String(i.assignee?.id) === String(user.id)) ||
        (user?.email && i.assignee?.email === user.email);
      return isMe && i.status !== 'Done' && i.status !== 'DONE' && i.status !== 'Hoàn thành';
    })
    .slice(0, 5);

  const recentActivity: NotificationItem[] = notifications.slice(0, 5).map((n: any) => ({
    id: String(n.id),
    type: (n.type?.toLowerCase() || 'workflow') as any,
    title: n.title || 'Thông báo',
    description: n.description || n.message || '',
    isRead: !!n.read || !!n.isRead,
    createdAt: n.createdAt || new Date().toISOString(),
  }));

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
      value: overdueIssues.length,
      icon: Clock,
      sub: 'đã qua hạn chót',
      atRisk: overdueIssues.length > 0,
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Tổng quan</h1>
            <p className="text-sm text-[#6B6B70] mt-0.5">
              {currentProject
                ? `Chào mừng bạn quay lại — dự án đang chọn: ${currentProject.name} (${currentProject.key})`
                : 'Chào mừng bạn quay lại — hãy chọn hoặc tạo một dự án để bắt đầu'}
            </p>
          </div>
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
                {loading ? '—' : s.value}
              </p>
              <p className={`text-xs mt-0.5 ${s.atRisk ? 'text-[#E53E3E]' : 'text-[#6B6B70]'}`}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* My issues */}
          <AssignedIssuesWidget
            issues={myIssues}
            onSelectIssue={onSelectIssue}
            onNavigate={onNavigate}
          />

          {/* Recent activity */}
          <RecentActivityWidget
            notifications={recentActivity}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
}
