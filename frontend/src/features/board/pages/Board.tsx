import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useProjectStore } from '../../../store/projectStore';
import { issueService } from '../../../services/issueService';
import { workflowService } from '../../../services/workflowService';
import type { Issue, IssueStatus, Role, WorkflowStatus, WorkflowTransition } from '../../../types';
import KanbanColumn from '../components/KanbanColumn';

interface BoardProps {
  role: Role;
  onSelectIssue: (id: string) => void;
}

export default function Board({ role, onSelectIssue }: BoardProps) {
  const { currentProject } = useProjectStore();

  const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!currentProject) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Load workflow statuses
      const wfRes = await workflowService.getWorkflow(currentProject.id);
      const stList: WorkflowStatus[] = wfRes?.data?.statuses || [];
      if (stList.length > 0) {
        setStatuses(stList.sort((a, b) => a.position - b.position));
      } else {
        setStatuses([
          { id: '1', name: 'To Do', category: 'TODO', position: 0, isInitial: true },
          { id: '2', name: 'In Progress', category: 'IN_PROGRESS', position: 1, isInitial: false },
          { id: '3', name: 'Pending Approval', category: 'IN_PROGRESS', position: 2, isInitial: false },
          { id: '4', name: 'Done', category: 'DONE', position: 3, isInitial: false },
        ]);
      }

      // 2. Load issues
      const issueRes = await issueService.getIssues(currentProject.id, { page: 1, size: 100 });
      const rawList = issueRes?.data?.content || (issueRes?.data as any) || [];
      const list: Issue[] = Array.isArray(rawList)
        ? rawList.map((item: any) => ({
            id: String(item.id),
            key: item.key || item.issueKey || '',
            summary: item.summary || '',
            description: item.description || '',
            type: item.type,
            status: item.status,
            priority: item.priority,
            assignee: item.assignee ? {
              id: String(item.assignee.id),
              name: item.assignee.fullName || item.assignee.name || item.assignee.email,
              email: item.assignee.email,
              avatarUrl: item.assignee.avatarUrl,
              role: 'member'
            } : undefined,
            reporter: item.reporter ? {
              id: String(item.reporter.id),
              name: item.reporter.fullName || item.reporter.name || item.reporter.email,
              email: item.reporter.email,
              avatarUrl: item.reporter.avatarUrl,
              role: 'member'
            } : { id: '0', name: 'Unknown', email: '', role: 'member' },
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
            version: item.version,
          }))
        : [];
      setIssues(list);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể tải dữ liệu bảng công việc');
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Drag & Drop with API transition and revert on failure
  async function handleDrop(targetStatusName: string) {
    setDragOver(null);
    if (!draggedIssue || draggedIssue.status === targetStatusName) {
      setDraggedIssue(null);
      return;
    }

    const prevStatus = draggedIssue.status;
    const issueKey = draggedIssue.key;

    // Optimistic UI update
    setIssues((prev) =>
      prev.map((i) => (i.key === issueKey ? { ...i, status: targetStatusName as IssueStatus } : i))
    );

    try {
      // Find available transitions for this issue
      const transRes = await workflowService.getTransitions(issueKey);
      const availableTrans: any[] = transRes?.data || [];

      const targetTrans = availableTrans.find(
        (t) =>
          (t.toStatusName && t.toStatusName.toLowerCase() === targetStatusName.toLowerCase()) ||
          (t.to && t.to.toLowerCase() === targetStatusName.toLowerCase()) ||
          (t.name && t.name.toLowerCase() === targetStatusName.toLowerCase())
      );

      if (!targetTrans) {
        // Special case: Approve / Reject transitions
        if (targetStatusName.toLowerCase() === 'done' && (role === 'pm' || role === 'admin')) {
          await workflowService.approveIssue(issueKey, 'Approved via Board');
        } else {
          throw new Error(`Không có luồng chuyển hợp lệ từ "${prevStatus}" sang "${targetStatusName}"`);
        }
      } else {
        await workflowService.executeTransition(issueKey, String(targetTrans.id));
      }
    } catch (err: any) {
      // Revert state
      setIssues((prev) =>
        prev.map((i) => (i.key === issueKey ? { ...i, status: prevStatus } : i))
      );
      const msg = err?.response?.data?.message || err?.message || 'Chuyển trạng thái không thành công';
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setDraggedIssue(null);
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Board header */}
      <div className="px-6 py-4 border-b border-[#E5E5E7] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Bảng công việc</h2>
          <span className="text-xs text-[#6B6B70]">
            {currentProject ? `${currentProject.name} (${currentProject.key})` : 'Dự án'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6B6B70]">{issues.length} công việc</span>
          <button
            type="button"
            onClick={loadData}
            className="p-1.5 rounded-md border border-[#E5E5E7] text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-800 text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full min-w-max">
          {statuses.map((col) => {
            const colIssues = issues.filter(
              (i) => i.status && i.status.toLowerCase() === col.name.toLowerCase()
            );
            const isDragTarget = dragOver === col.name;

            return (
              <div
                key={col.id || col.name}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(col.name);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(col.name)}
                className="h-full flex"
              >
                <KanbanColumn
                  status={col.name as IssueStatus}
                  label={col.name}
                  issues={colIssues}
                  isDragTarget={isDragTarget}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(col.name);
                  }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => handleDrop(col.name)}
                  onSelectIssue={(id) => {
                    const found = issues.find((x) => x.id === id);
                    onSelectIssue(found ? found.key : id);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
