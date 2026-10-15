import React from 'react';
import { GripVertical, MoreHorizontal } from 'lucide-react';
import type { Issue } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';

const PRIORITY_COLORS: Record<string, string> = {
  Critical: 'text-[#E53E3E] bg-[#FDECEC] border-[#E53E3E]/20',
  High: 'text-[#1A1A1A] bg-[#F7F7F8] border-[#E5E5E7]',
  Medium: 'text-[#6B6B70] bg-[#F7F7F8] border-[#E5E5E7]',
  Low: 'text-[#9B9B9F] bg-[#F7F7F8] border-[#E5E5E7]',
};

interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
}

export default function IssueCard({ issue, onClick }: IssueCardProps) {
  const isBug = issue.type === 'Bug';

  return (
    <div
      className={`bg-white border border-[#E5E5E7] rounded-lg p-3 cursor-pointer hover:border-[#C5C5C8] hover:shadow-sm transition-all group relative ${
        isBug ? 'border-l-2 border-l-[#E53E3E]' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[10px] font-mono text-[#9B9B9F] font-medium">{issue.key}</span>
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9B9B9F] hover:text-[#6B6B70]"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs font-medium text-[#1A1A1A] leading-relaxed mb-3 line-clamp-2">
        {issue.summary}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
              PRIORITY_COLORS[issue.priority]
            }`}
          >
            {issue.priority}
          </span>
          {isBug && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border text-[#E53E3E] bg-[#FDECEC] border-[#E53E3E]/20">
              Bug
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <GripVertical className="w-3 h-3 text-[#D1D1D3] opacity-0 group-hover:opacity-100 transition-opacity" />
          {issue.assignee && <UserAvatar initials={issue.assignee.initials} size="xs" />}
        </div>
      </div>
    </div>
  );
}
