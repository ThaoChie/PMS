import React, { useState } from 'react';
import { issues } from '../../../data/mockData';
import type { IssueStatus, Role } from '../../../types';
import KanbanColumn from '../components/KanbanColumn';

const COLUMNS: { status: IssueStatus; label: string }[] = [
  { status: 'To Do', label: 'Cần làm' },
  { status: 'In Progress', label: 'Đang thực hiện' },
  { status: 'Pending Approval', label: 'Chờ phê duyệt' },
  { status: 'Done', label: 'Đã hoàn thành' },
];

interface BoardProps {
  role: Role;
  onSelectIssue: (id: string) => void;
}

export default function Board({ role, onSelectIssue }: BoardProps) {
  const projectIssues = issues.filter((i) => i.projectId === 'p1');
  const [dragOver, setDragOver] = useState<IssueStatus | null>(null);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Board header */}
      <div className="px-6 py-4 border-b border-[#E5E5E7] flex items-center gap-3 shrink-0">
        <h2 className="text-sm font-semibold text-[#1A1A1A]">Bảng công việc</h2>
        <span className="text-xs text-[#6B6B70]">Dự án hiện tại</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[#6B6B70]">{projectIssues.length} công việc</span>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map((col) => {
            const colIssues = projectIssues.filter((i) => i.status === col.status);
            const isDragTarget = dragOver === col.status;

            return (
              <KanbanColumn
                key={col.status}
                status={col.status}
                label={col.label}
                issues={colIssues}
                isDragTarget={isDragTarget}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(col.status);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => setDragOver(null)}
                onSelectIssue={onSelectIssue}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
