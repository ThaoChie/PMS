import React, { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, RefreshCw } from 'lucide-react';
import { useProjectStore } from '../../../store/projectStore';
import { issueService } from '../../../services/issueService';
import { memberService } from '../../../services/memberService';
import type { Issue, IssueType, IssueStatus, Priority } from '../../../types';
import IssueTable, { type SortField, type SortDir } from '../components/IssueTable';
import ExportButton from '../components/ExportButton';

const QUICK_FILTERS = [
  { id: 'all', label: 'Tất cả công việc' },
  { id: 'my-open', label: 'Việc của tôi đang mở' },
  { id: 'reported-by-me', label: 'Tôi đã báo cáo' },
  { id: 'done', label: 'Đã hoàn thành' },
];

interface IssueListProps {
  onSelectIssue: (id: string) => void;
}

export default function IssueList({ onSelectIssue }: IssueListProps) {
  const { currentProject } = useProjectStore();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('key');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');
  const [activeQuick, setActiveQuick] = useState<string>('all');
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);
  const [filterType, setFilterType] = useState<IssueType | ''>('');
  const [filterStatus, setFilterStatus] = useState<IssueStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);

  const loadIssues = useCallback(async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const res = await issueService.getIssues(currentProject.id, {
        page: 1,
        size: 100,
        sort: `${sortField},${sortDir}`,
      });
      const data = res?.data?.content || (res?.data as any) || [];
      const list: Issue[] = Array.isArray(data)
        ? data.map((item: any) => ({
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
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [currentProject, sortField, sortDir]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  useEffect(() => {
    if (currentProject) {
      memberService.getMembers(currentProject.id)
        .then((res) => {
          const raw = res?.data || [];
          const list = Array.isArray(raw) ? raw : (raw as any).content || [];
          setMembers(
            list.map((m: any) => ({
              id: String(m.user?.id || m.userId || m.id),
              name: m.user?.fullName || m.fullName || m.user?.email || m.email || 'Thành viên',
            }))
          );
        })
        .catch(() => setMembers([]));
    }
  }, [currentProject]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const filtered = issues.filter((i) => {
    if (
      search &&
      !i.summary.toLowerCase().includes(search.toLowerCase()) &&
      !i.key.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (filterType && i.type !== filterType) return false;
    if (filterStatus && i.status !== filterStatus) return false;
    if (filterPriority && i.priority !== filterPriority) return false;
    if (filterAssignee && i.assignee?.id !== filterAssignee) return false;
    if (activeQuick === 'done' && i.status !== 'Done') return false;
    return true;
  });

  function clearFilters() {
    setFilterType('');
    setFilterStatus('');
    setFilterPriority('');
    setFilterAssignee('');
    setSearch('');
    setActiveQuick('all');
  }

  const hasFilters = !!(
    filterType ||
    filterStatus ||
    filterPriority ||
    filterAssignee ||
    search ||
    activeQuick !== 'all'
  );

  return (
    <div className="h-full flex bg-white overflow-hidden">
      {/* Filter panel */}
      {filterPanelOpen && (
        <aside className="w-56 shrink-0 border-r border-[#E5E5E7] flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-[#E5E5E7] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1A1A1A]">Bộ lọc</span>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[10px] text-[#E53E3E] hover:text-[#C53030]"
              >
                Xóa tất cả
              </button>
            )}
          </div>
          <div className="p-4 space-y-5 flex-1">
            {/* Quick filters */}
            <div>
              <span className="block text-[11px] font-semibold text-[#6B6B70] uppercase tracking-wider mb-2">
                Bộ lọc nhanh
              </span>
              <div className="space-y-1">
                {QUICK_FILTERS.map((qf) => (
                  <button
                    key={qf.id}
                    type="button"
                    onClick={() => setActiveQuick(qf.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      activeQuick === qf.id
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#6B6B70] hover:bg-[#F7F7F8] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {qf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <span className="block text-[11px] font-semibold text-[#6B6B70] uppercase tracking-wider mb-2">
                Loại
              </span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as IssueType | '')}
                className="w-full px-2.5 py-1.5 border border-[#E5E5E7] rounded-md text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A]"
              >
                <option value="">Tất cả loại</option>
                <option value="TASK">Task (Tác vụ)</option>
                <option value="BUG">Bug (Lỗi)</option>
                <option value="EPIC">Epic (Tính năng lớn)</option>
                <option value="SUB_TASK">Sub-task (Tác vụ con)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <span className="block text-[11px] font-semibold text-[#6B6B70] uppercase tracking-wider mb-2">
                Trạng thái
              </span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as IssueStatus | '')}
                className="w-full px-2.5 py-1.5 border border-[#E5E5E7] rounded-md text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A]"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Done">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <span className="block text-[11px] font-semibold text-[#6B6B70] uppercase tracking-wider mb-2">
                Mức ưu tiên
              </span>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as Priority | '')}
                className="w-full px-2.5 py-1.5 border border-[#E5E5E7] rounded-md text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A]"
              >
                <option value="">Tất cả ưu tiên</option>
                <option value="HIGHEST">Khẩn cấp nhất</option>
                <option value="HIGH">Cao</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="LOW">Thấp</option>
                <option value="LOWEST">Rất thấp</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <span className="block text-[11px] font-semibold text-[#6B6B70] uppercase tracking-wider mb-2">
                Người thực hiện
              </span>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#E5E5E7] rounded-md text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A]"
              >
                <option value="">Tất cả người thực hiện</option>
                {members.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top toolbar */}
        <div className="px-6 py-3 border-b border-[#E5E5E7] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterPanelOpen((o) => !o)}
              className={`p-1.5 rounded-md border text-xs flex items-center gap-1.5 transition-colors ${
                filterPanelOpen
                  ? 'border-[#1A1A1A] bg-[#F7F7F8] text-[#1A1A1A]'
                  : 'border-[#E5E5E7] text-[#6B6B70] hover:border-[#C5C5C8]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Bộ lọc</span>
            </button>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm công việc…"
              className="px-3 py-1.5 border border-[#E5E5E7] rounded-md text-xs text-[#1A1A1A] placeholder:text-[#9B9B9F] w-64 focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadIssues}
              className="p-1.5 rounded-md border border-[#E5E5E7] text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
              title="Tải lại"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <ExportButton issues={filtered} />
          </div>
        </div>

        {/* Table view */}
        <IssueTable
          issues={filtered}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onSelectIssue={onSelectIssue}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
        />
      </div>
    </div>
  );
}
