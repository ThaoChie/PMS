import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, AlertCircle, Filter, User as UserIcon, Search, CheckCircle2 } from 'lucide-react';
import { useProjectStore } from '../../../store/projectStore';
import { useAuthStore } from '../../../store/authStore';
import { toast } from '../../../store/toastStore';
import { issueService } from '../../../services/issueService';
import { workflowService } from '../../../services/workflowService';
import { mapUserResponseToUser } from '../../../store/authStore';
import type { Issue, IssueStatus, Role, WorkflowStatus } from '../../../types';
import KanbanColumn from '../components/KanbanColumn';

interface BoardProps {
  role: Role;
  onSelectIssue: (id: string) => void;
}

export default function Board({ role, onSelectIssue }: BoardProps) {
  const { currentProject } = useProjectStore();
  const currentUser = useAuthStore((s) => s.user);

  const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Filters
  const [onlyMyIssues, setOnlyMyIssues] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

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
            assignee: item.assignee ? mapUserResponseToUser(item.assignee) : undefined,
            reporter: mapUserResponseToUser(item.reporter),
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

  // Filter issues based on quick filters
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // 1. My issues filter
      if (onlyMyIssues) {
        if (!currentUser?.id || !issue.assignee || String(issue.assignee.id) !== String(currentUser.id)) {
          return false;
        }
      }

      // 2. Type filter
      if (selectedType !== 'ALL') {
        const iType = (issue.type || '').toUpperCase();
        const sType = selectedType.toUpperCase();
        if (sType === 'SUB-TASK' || sType === 'SUB_TASK') {
          if (iType !== 'SUB-TASK' && iType !== 'SUB_TASK') return false;
        } else if (iType !== sType) {
          return false;
        }
      }

      // 3. Keyword filter
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const matchKey = (issue.key || '').toLowerCase().includes(kw);
        const matchSummary = (issue.summary || '').toLowerCase().includes(kw);
        const matchLabels = (issue.labels || []).some((l) => l.toLowerCase().includes(kw));
        if (!matchKey && !matchSummary && !matchLabels) return false;
      }

      return true;
    });
  }, [issues, onlyMyIssues, selectedType, searchKeyword, currentUser?.id]);

  const isDroppingRef = React.useRef(false);

  // Handle Drag & Drop with API transition and revert on failure
  async function handleDrop(targetStatusName: string) {
    setDragOver(null);
    if (!draggedIssue) return;
    if (draggedIssue.status?.toLowerCase() === targetStatusName.toLowerCase()) {
      setDraggedIssue(null);
      return;
    }
    if (isDroppingRef.current) return;
    isDroppingRef.current = true;

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
        // Check if issue is already at targetStatus in DB (e.g. concurrent or prior update)
        const currentDetail = await issueService.getIssueDetail(issueKey).catch(() => null);
        const currentDbStatus = currentDetail?.data?.status;
        if (currentDbStatus && currentDbStatus.toLowerCase() === targetStatusName.toLowerCase()) {
          toast.success(`Đã chuyển trạng thái ${issueKey} sang "${targetStatusName}"`);
          loadData();
          return;
        }

        // Special case: Approve / Reject transitions
        if (targetStatusName.toLowerCase() === 'done' && (role === 'pm' || role === 'admin')) {
          await workflowService.approveIssue(issueKey, 'Approved via Board');
          toast.success(`Đã phê duyệt và hoàn thành công việc ${issueKey}`);
        } else {
          throw new Error(`Không có luồng chuyển hợp lệ từ "${prevStatus}" sang "${targetStatusName}"`);
        }
      } else {
        await workflowService.executeTransition(issueKey, String(targetTrans.id));
        toast.success(`Đã chuyển trạng thái ${issueKey} sang "${targetStatusName}"`);
      }

      // Refresh board data to keep all columns in sync
      loadData();
    } catch (err: any) {
      // Revert state
      setIssues((prev) =>
        prev.map((i) => (i.key === issueKey ? { ...i, status: prevStatus } : i))
      );
      const msg = err?.response?.data?.message || err?.message || 'Chuyển trạng thái không thành công';
      setErrorMessage(msg);
      toast.error(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setDraggedIssue(null);
      isDroppingRef.current = false;
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Board header */}
      <div className="px-6 py-4 border-b border-[#E5E5E7] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Bảng công việc (Kanban)</h2>
          <span className="text-xs text-[#6B6B70]">
            {currentProject ? `${currentProject.name} (${currentProject.key})` : 'Dự án'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6B6B70]">
            Hiển thị {filteredIssues.length}/{issues.length} công việc
          </span>
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

      {/* Quick Filter Bar */}
      <div className="px-6 py-2.5 border-b border-[#F0F0F2] bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* My issues button */}
          <button
            type="button"
            onClick={() => setOnlyMyIssues((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-all ${
              onlyMyIssues
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                : 'bg-white text-[#6B6B70] border-[#E5E5E7] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Việc của tôi</span>
          </button>

          {/* Type filter pills */}
          <div className="flex items-center gap-1 bg-white border border-[#E5E5E7] rounded-lg p-0.5">
            {['ALL', 'Story', 'Task', 'Bug', 'Epic', 'Sub-task'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedType === t
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#F7F7F8]'
                }`}
              >
                {t === 'ALL' ? 'Tất cả loại' : t}
              </button>
            ))}
          </div>

          {(onlyMyIssues || selectedType !== 'ALL' || searchKeyword) && (
            <button
              type="button"
              onClick={() => {
                setOnlyMyIssues(false);
                setSelectedType('ALL');
                setSearchKeyword('');
              }}
              className="text-[11px] text-[#E53E3E] hover:underline ml-1"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Search input in board */}
        <div className="relative w-48 sm:w-60">
          <Search className="w-3.5 h-3.5 text-[#9B9B9F] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Lọc mã hoặc tiêu đề..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-white border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
          />
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
            const colIssues = filteredIssues.filter(
              (i) => i.status && i.status.toLowerCase() === col.name.toLowerCase()
            );
            const isDragTarget = dragOver === col.name;

            return (
              <div
                key={col.id || col.name}
                className="h-full flex"
              >
                <KanbanColumn
                  status={col.name as IssueStatus}
                  label={col.name}
                  issues={colIssues}
                  isDragTarget={isDragTarget}
                  onDragStart={(issue) => setDraggedIssue(issue)}
                  onDragEnd={() => setDraggedIssue(null)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOver(col.name);
                  }}
                  onDragLeave={(e) => {
                    e.stopPropagation();
                    setDragOver((prev) => (prev === col.name ? null : prev));
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDrop(col.name);
                  }}
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
