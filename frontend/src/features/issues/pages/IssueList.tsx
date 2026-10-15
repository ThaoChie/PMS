import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { issues, users } from '../../../data/mockData';
import type { Issue, IssueType, IssueStatus, Priority } from '../../../types';
import IssueTable, { type SortField, type SortDir } from '../components/IssueTable';
import ExportButton from '../components/ExportButton';

const QUICK_FILTERS = [
  { id: 'my-open', label: 'Việc của tôi đang mở' },
  { id: 'reported-by-me', label: 'Tôi đã báo cáo' },
  { id: 'done', label: 'Đã hoàn thành' },
  { id: 'recently-updated', label: 'Cập nhật gần đây' },
];

interface IssueListProps {
  onSelectIssue: (id: string) => void;
}

export default function IssueList({ onSelectIssue }: IssueListProps) {
  const [sortField, setSortField] = useState<SortField>('key');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');
  const [activeQuick, setActiveQuick] = useState<string | null>(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);
  const [filterType, setFilterType] = useState<IssueType | ''>('');
  const [filterStatus, setFilterStatus] = useState<IssueStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const [filterAssignee, setFilterAssignee] = useState('');

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const filtered = issues
    .filter((i) => {
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
      if (activeQuick === 'my-open' && i.assignee?.id !== 'u1') return false;
      if (activeQuick === 'reported-by-me' && i.reporter.id !== 'u1') return false;
      return true;
    })
    .sort((a, b) => {
      const va = (a[sortField as keyof Issue] as string) ?? '';
      const vb = (b[sortField as keyof Issue] as string) ?? '';
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });

  function clearFilters() {
    setFilterType('');
    setFilterStatus('');
    setFilterPriority('');
    setFilterAssignee('');
    setSearch('');
    setActiveQuick(null);
  }

  const hasFilters = !!(
    filterType ||
    filterStatus ||
    filterPriority ||
    filterAssignee ||
    search ||
    activeQuick
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
            <div>
              <label className="block text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-2">
                Tìm kiếm từ khóa
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm công việc…"
                className="w-full px-2.5 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] placeholder:text-[#9B9B9F] focus:outline-none focus:border-[#1A1A1A] transition-colors"
              />
            </div>

            {[
              {
                label: 'Loại công việc',
                value: filterType,
                onChange: (v: string) => setFilterType(v as IssueType | ''),
                options: [
                  { label: 'Story', val: 'Story' },
                  { label: 'Task', val: 'Task' },
                  { label: 'Bug', val: 'Bug' },
                  { label: 'Epic', val: 'Epic' },
                  { label: 'Sub-task', val: 'Sub-task' },
                ],
              },
              {
                label: 'Trạng thái',
                value: filterStatus,
                onChange: (v: string) => setFilterStatus(v as IssueStatus | ''),
                options: [
                  { label: 'Cần làm (To Do)', val: 'To Do' },
                  { label: 'Đang thực hiện (In Progress)', val: 'In Progress' },
                  { label: 'Chờ duyệt (Pending Approval)', val: 'Pending Approval' },
                  { label: 'Hoàn thành (Done)', val: 'Done' },
                ],
              },
              {
                label: 'Mức độ ưu tiên',
                value: filterPriority,
                onChange: (v: string) => setFilterPriority(v as Priority | ''),
                options: [
                  { label: 'Khẩn cấp (Critical)', val: 'Critical' },
                  { label: 'Cao (High)', val: 'High' },
                  { label: 'Trung bình (Medium)', val: 'Medium' },
                  { label: 'Thấp (Low)', val: 'Low' },
                ],
              },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-2">
                  {f.label}
                </label>
                <select
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  className="w-full px-2.5 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] bg-white appearance-none transition-colors"
                >
                  <option value="">Tất cả</option>
                  {f.options.map((o) => (
                    <option key={o.val} value={o.val}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div>
              <label className="block text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-2">
                Người thực hiện
              </label>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="w-full px-2.5 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] bg-white appearance-none transition-colors"
              >
                <option value="">Tất cả</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>
      )}

      {/* Main table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-[#E5E5E7] flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setFilterPanelOpen((o) => !o)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
              filterPanelOpen
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'border-[#E5E5E7] text-[#6B6B70] hover:border-[#C5C5C8] hover:text-[#1A1A1A]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Bộ lọc
          </button>

          <div className="flex items-center gap-1.5 flex-wrap">
            {QUICK_FILTERS.map((qf) => (
              <button
                key={qf.id}
                type="button"
                onClick={() => setActiveQuick(activeQuick === qf.id ? null : qf.id)}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors border ${
                  activeQuick === qf.id
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'border-[#E5E5E7] text-[#6B6B70] hover:text-[#1A1A1A] hover:border-[#C5C5C8]'
                }`}
              >
                {qf.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <ExportButton criteria={{ keyword: search, type: filterType, status: filterStatus }} />
            <span className="text-xs text-[#9B9B9F]">{filtered.length} công việc</span>
          </div>
        </div>

        {/* Table component */}
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
