import React from 'react';
import type { Issue, IssueStatus } from '../../../types';
import IssueCard from './IssueCard';

interface KanbanColumnProps {
  status: IssueStatus;
  label: string;
  issues: Issue[];
  isDragTarget?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: () => void;
  onSelectIssue: (id: string) => void;
}

export default function KanbanColumn({
  status,
  label,
  issues,
  isDragTarget,
  onDragOver,
  onDragLeave,
  onDrop,
  onSelectIssue,
}: KanbanColumnProps) {
  return (
    <div
      className="flex flex-col w-64 shrink-0"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div
          className={`w-2 h-2 rounded-full ${
            status === 'To Do'
              ? 'bg-[#C5C5C8]'
              : status === 'In Progress'
              ? 'bg-[#1A1A1A]'
              : status === 'Pending Approval'
              ? 'bg-[#9B9B9F]'
              : 'bg-[#6B6B70]'
          }`}
        />
        <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">
          {label}
        </span>
        <span className="ml-auto text-xs font-medium text-[#9B9B9F] bg-[#F7F7F8] border border-[#E5E5E7] rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
          {issues.length}
        </span>
      </div>

      {/* Cards list */}
      <div
        className={`flex-1 space-y-2 overflow-y-auto rounded-xl p-2 transition-colors min-h-[120px] ${
          isDragTarget
            ? 'bg-[#F7F7F8] border-2 border-dashed border-[#C5C5C8]'
            : 'bg-[#F7F7F8] border border-transparent'
        }`}
      >
        {issues.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-[#C5C5C8]">
            Kéo thả công việc vào đây
          </div>
        ) : (
          issues.map((issue) => (
            <div key={issue.id} draggable onDragStart={() => {}}>
              <IssueCard issue={issue} onClick={() => onSelectIssue(issue.id)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
