import React from 'react';
import type { IssueType, IssueStatus, Priority, User } from '../../../types';

interface AdvancedSearchPanelProps {
  search: string;
  onSearchChange: (val: string) => void;
  type: IssueType | '';
  onTypeChange: (val: IssueType | '') => void;
  status: IssueStatus | '';
  onStatusChange: (val: IssueStatus | '') => void;
  priority: Priority | '';
  onPriorityChange: (val: Priority | '') => void;
  assignee: string;
  onAssigneeChange: (val: string) => void;
  users: User[];
  hasFilters: boolean;
  onClearFilters: () => void;
}

export default function AdvancedSearchPanel({
  search,
  onSearchChange,
  type,
  onTypeChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  assignee,
  onAssigneeChange,
  users,
  hasFilters,
  onClearFilters,
}: AdvancedSearchPanelProps) {
  return (
    <aside className="w-56 shrink-0 border-r border-[#E5E5E7] flex flex-col overflow-y-auto bg-white">
      <div className="px-4 py-3 border-b border-[#E5E5E7] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#1A1A1A]">Filters</span>
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-[10px] text-[#E53E3E] hover:text-[#C53030]"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="p-4 space-y-5 flex-1">
        <div>
          <label className="block text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-2">
            Keyword search
          </label>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search issues…"
            className="w-full px-2.5 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] placeholder:text-[#9B9B9F] focus:outline-none focus:border-[#1A1A1A] transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-2">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value as IssueType | '')}
            className="w-full px-2.5 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] bg-white appearance-none transition-colors"
          >
            <option value="">All</option>
            {['Story', 'Bug', 'Task', 'Epic', 'Sub-task'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as IssueStatus | '')}
            className="w-full px-2.5 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] bg-white appearance-none transition-colors"
          >
            <option value="">All</option>
            {['To Do', 'In Progress', 'Pending Approval', 'Done'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-2">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value as Priority | '')}
            className="w-full px-2.5 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] bg-white appearance-none transition-colors"
          >
            <option value="">All</option>
            {['Critical', 'High', 'Medium', 'Low'].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-2">
            Assignee
          </label>
          <select
            value={assignee}
            onChange={(e) => onAssigneeChange(e.target.value)}
            className="w-full px-2.5 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] bg-white appearance-none transition-colors"
          >
            <option value="">All</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
}
