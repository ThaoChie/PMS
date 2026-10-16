import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { Issue } from '../../types';

interface AssignedIssuesWidgetProps {
  issues: Issue[];
  onSelectIssue: (id: string) => void;
  onNavigate?: (screen: any) => void;
}

export const AssignedIssuesWidget: React.FC<AssignedIssuesWidgetProps> = ({
  issues,
  onSelectIssue,
  onNavigate,
}) => {
  return (
    <div className="border border-[#E5E5E7] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E5E5E7] flex items-center justify-between">
        <h2 className="text-xs font-semibold text-[#1A1A1A]">Công việc của tôi</h2>
        {onNavigate && (
          <button
            onClick={() => onNavigate('issues')}
            className="text-[10px] text-[#6B6B70] hover:text-[#E53E3E] flex items-center gap-1 transition-colors"
          >
            Xem tất cả <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      {issues.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-xs text-[#9B9B9F]">Không có công việc nào đang mở được phân công cho bạn</p>
        </div>
      ) : (
        <div className="divide-y divide-[#F0F0F1]">
          {issues.map(issue => (
            <button
              key={issue.id}
              className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-[#F7F7F8] transition-colors group"
              onClick={() => onSelectIssue(issue.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-mono text-[#9B9B9F]">{issue.key}</span>
                  {issue.type === 'Bug' && (
                    <span className="text-[10px] text-[#E53E3E] bg-[#FDECEC] px-1 rounded">
                      Bug
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#1A1A1A] group-hover:text-[#E53E3E] transition-colors truncate">
                  {issue.summary}
                </p>
              </div>
              <span
                className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded mt-0.5 ${
                  issue.priority === 'Critical'
                    ? 'text-[#E53E3E] bg-[#FDECEC]'
                    : issue.priority === 'High'
                    ? 'text-[#1A1A1A] bg-[#F7F7F8]'
                    : 'text-[#9B9B9F] bg-[#F7F7F8]'
                }`}
              >
                {issue.priority}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
