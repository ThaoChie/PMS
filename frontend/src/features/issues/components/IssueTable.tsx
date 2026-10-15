import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { Issue } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';

const PRIORITY_BADGE: Record<string, string> = {
  Critical: 'text-[#E53E3E] bg-[#FDECEC]',
  High: 'text-[#1A1A1A] bg-[#F7F7F8]',
  Medium: 'text-[#6B6B70] bg-[#F7F7F8]',
  Low: 'text-[#9B9B9F] bg-[#F7F7F8]',
};

const STATUS_BADGE: Record<string, string> = {
  'To Do': 'text-[#6B6B70] bg-[#F7F7F8]',
  'In Progress': 'text-[#1A1A1A] bg-[#EBEBEC]',
  'Pending Approval': 'text-[#6B6B70] bg-[#F0F0F1]',
  Done: 'text-[#9B9B9F] bg-[#F7F7F8]',
};

const TYPE_BADGE: Record<string, string> = {
  Story: 'text-[#6B6B70] bg-[#F7F7F8]',
  Bug: 'text-[#E53E3E] bg-[#FDECEC]',
  Task: 'text-[#6B6B70] bg-[#F7F7F8]',
  Epic: 'text-[#1A1A1A] bg-[#EBEBEC]',
  'Sub-task': 'text-[#9B9B9F] bg-[#F7F7F8]',
};

export type SortField = 'key' | 'summary' | 'status' | 'priority' | 'dueDate';
export type SortDir = 'asc' | 'desc';

interface IssueTableProps {
  issues: Issue[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onSelectIssue: (id: string) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export default function IssueTable({
  issues,
  sortField,
  sortDir,
  onSort,
  onSelectIssue,
  hasFilters = false,
  onClearFilters,
}: IssueTableProps) {
  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 text-[#D1D1D3]" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-[#1A1A1A]" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[#1A1A1A]" />
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-white">
      <table className="w-full">
        <thead className="sticky top-0 bg-[#F7F7F8] border-b border-[#E5E5E7] z-10">
          <tr>
            {[
              { field: 'key' as SortField, label: 'Key', w: 'w-24' },
              { field: 'summary' as SortField, label: 'Summary', w: 'w-auto' },
              { field: null, label: 'Type', w: 'w-24' },
              { field: 'status' as SortField, label: 'Status', w: 'w-36' },
              { field: null, label: 'Assignee', w: 'w-32' },
              { field: 'priority' as SortField, label: 'Priority', w: 'w-24' },
              { field: 'dueDate' as SortField, label: 'Due date', w: 'w-28' },
            ].map((col) => (
              <th
                key={col.label}
                className={`${col.w} px-4 py-2.5 text-left text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider ${
                  col.field ? 'cursor-pointer hover:text-[#6B6B70] select-none' : ''
                }`}
                onClick={() => col.field && onSort(col.field)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.field && <SortIcon field={col.field} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0F0F1]">
          {issues.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-16 text-center">
                <p className="text-sm text-[#6B6B70]">No issues match your filters</p>
                {hasFilters && onClearFilters && (
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="mt-2 text-xs text-[#E53E3E] hover:text-[#C53030]"
                  >
                    Clear filters
                  </button>
                )}
              </td>
            </tr>
          ) : (
            issues.map((issue) => (
              <tr
                key={issue.id}
                className="hover:bg-[#F7F7F8] cursor-pointer transition-colors group"
                onClick={() => onSelectIssue(issue.id)}
              >
                <td className="px-4 py-3">
                  <span className="text-[11px] font-mono text-[#9B9B9F] font-medium">
                    {issue.key}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-[#1A1A1A] group-hover:text-[#E53E3E] transition-colors line-clamp-1">
                    {issue.summary}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      TYPE_BADGE[issue.type]
                    }`}
                  >
                    {issue.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                      STATUS_BADGE[issue.status]
                    }`}
                  >
                    {issue.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {issue.assignee ? (
                    <div className="flex items-center gap-1.5">
                      <UserAvatar initials={issue.assignee.initials} size="xs" />
                      <span className="text-xs text-[#6B6B70] truncate">
                        {issue.assignee.name.split(' ')[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#C5C5C8]">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      PRIORITY_BADGE[issue.priority]
                    }`}
                  >
                    {issue.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {issue.dueDate ? (
                    <span
                      className={`text-xs ${
                        new Date(issue.dueDate) < new Date()
                          ? 'text-[#E53E3E] font-medium'
                          : 'text-[#6B6B70]'
                      }`}
                    >
                      {issue.dueDate}
                    </span>
                  ) : (
                    <span className="text-xs text-[#C5C5C8]">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
