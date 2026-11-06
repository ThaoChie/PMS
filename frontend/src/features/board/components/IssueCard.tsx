import React from 'react';
import { GripVertical, CheckSquare, Tag, Bookmark } from 'lucide-react';
import type { Issue } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';

const PRIORITY_COLORS: Record<string, string> = {
  Critical: 'text-[#E53E3E] bg-[#FDECEC] border-[#E53E3E]/20',
  High: 'text-[#D97706] bg-[#FEF3C7] border-[#F59E0B]/30',
  Medium: 'text-[#2563EB] bg-[#EFF6FF] border-[#3B82F6]/30',
  Low: 'text-[#6B6B70] bg-[#F7F7F8] border-[#E5E5E7]',
  Lowest: 'text-[#9B9B9F] bg-[#F7F7F8] border-[#E5E5E7]',
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  Bug: { label: 'Bug', color: 'text-[#E53E3E] bg-[#FDECEC] border-[#E53E3E]/30' },
  BUG: { label: 'Bug', color: 'text-[#E53E3E] bg-[#FDECEC] border-[#E53E3E]/30' },
  Story: { label: 'Story', color: 'text-[#059669] bg-[#ECFDF5] border-[#10B981]/30' },
  STORY: { label: 'Story', color: 'text-[#059669] bg-[#ECFDF5] border-[#10B981]/30' },
  Task: { label: 'Task', color: 'text-[#2563EB] bg-[#EFF6FF] border-[#3B82F6]/30' },
  TASK: { label: 'Task', color: 'text-[#2563EB] bg-[#EFF6FF] border-[#3B82F6]/30' },
  Epic: { label: 'Epic', color: 'text-[#7C3AED] bg-[#F5F3FF] border-[#8B5CF6]/30' },
  EPIC: { label: 'Epic', color: 'text-[#7C3AED] bg-[#F5F3FF] border-[#8B5CF6]/30' },
  'Sub-task': { label: 'Sub-task', color: 'text-[#6B7280] bg-[#F3F4F6] border-[#D1D5DB]' },
  SUB_TASK: { label: 'Sub-task', color: 'text-[#6B7280] bg-[#F3F4F6] border-[#D1D5DB]' },
};

interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
}

export default function IssueCard({ issue, onClick }: IssueCardProps) {
  const typeCfg = TYPE_CONFIG[issue.type] || { label: issue.type || 'Task', color: 'text-[#6B6B70] bg-[#F7F7F8] border-[#E5E5E7]' };
  const isBug = issue.type?.toUpperCase() === 'BUG' || issue.type === 'Bug';

  // Subtask progress calculation
  const subtasks = issue.subtasks || [];
  const completedSubtasks = subtasks.filter(
    (st: any) =>
      st.status === 'Done' ||
      st.status === 'DONE' ||
      (typeof st.status === 'object' && st.status?.name?.toUpperCase() === 'DONE')
  ).length;

  return (
    <div
      className={`bg-white border border-[#E5E5E7] rounded-lg p-3 cursor-pointer hover:border-[#A1A1A5] hover:shadow-sm transition-all group relative ${
        isBug ? 'border-l-3 border-l-[#E53E3E]' : ''
      }`}
      onClick={onClick}
    >
      {/* Top row: Type badge & Key */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider ${typeCfg.color}`}>
            {typeCfg.label}
          </span>
          <span className="text-[11px] font-mono text-[#6B6B70] font-medium truncate">
            {issue.key}
          </span>
        </div>
        <GripVertical className="w-3.5 h-3.5 text-[#D1D1D3] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>

      {/* Summary */}
      <p className="text-xs font-medium text-[#1A1A1A] leading-relaxed mb-2.5 line-clamp-2">
        {issue.summary}
      </p>

      {/* Labels row */}
      {issue.labels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {issue.labels.slice(0, 3).map((lbl) => (
            <span
              key={lbl}
              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-[#F4F4F5] text-[#52525B] border border-[#E4E4E7]"
            >
              <Tag className="w-2.5 h-2.5 text-[#71717A]" />
              {lbl}
            </span>
          ))}
          {issue.labels.length > 3 && (
            <span className="text-[9px] text-[#A1A1AA] self-center">
              +{issue.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Bottom row: Priority, Subtask progress, Assignee */}
      <div className="flex items-center justify-between pt-2 border-t border-[#F4F4F5] gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${
              PRIORITY_COLORS[issue.priority] || 'text-[#6B6B70] bg-[#F7F7F8] border-[#E5E5E7]'
            }`}
          >
            {issue.priority}
          </span>

          {/* Subtask progress count badge [✓ 2/5] */}
          {subtasks.length > 0 && (
            <span
              className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border font-medium ${
                completedSubtasks === subtasks.length
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
              title={`${completedSubtasks}/${subtasks.length} công việc con hoàn thành`}
            >
              <CheckSquare className="w-2.5 h-2.5" />
              {completedSubtasks}/{subtasks.length}
            </span>
          )}
        </div>

        <div className="shrink-0">
          {issue.assignee ? (
            <UserAvatar initials={issue.assignee.initials} size="xs" />
          ) : (
            <span className="text-[10px] text-[#A1A1AA] italic">Chưa giao</span>
          )}
        </div>
      </div>
    </div>
  );
}
