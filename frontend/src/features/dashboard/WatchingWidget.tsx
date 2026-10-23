import React from 'react';
import { Eye, ArrowRight } from 'lucide-react';
import type { Issue } from '../../types';

interface WatchingWidgetProps {
  issues: Issue[];
  onSelectIssue: (id: string) => void;
  onNavigate?: (screen: any) => void;
}

export const WatchingWidget: React.FC<WatchingWidgetProps> = ({
  issues,
  onSelectIssue,
  onNavigate,
}) => {
  return (
    <div className="border border-[#E5E5E7] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E5E5E7] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-[#6B6B70]" />
          <h2 className="text-xs font-semibold text-[#1A1A1A]">Issues I'm watching</h2>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('issues')}
            className="text-[10px] text-[#6B6B70] hover:text-[#E53E3E] flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      {issues.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#9B9B9F]">
          You are not watching any issues
        </div>
      ) : (
        <div className="divide-y divide-[#F0F0F1]">
          {issues.map(issue => (
            <button
              key={issue.id}
              className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-[#F7F7F8] transition-colors group"
              onClick={() => onSelectIssue(issue.key || issue.id)}
            >
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono text-[#9B9B9F] mb-0.5 block">{issue.key}</span>
                <p className="text-xs text-[#1A1A1A] group-hover:text-[#E53E3E] transition-colors truncate">
                  {issue.summary}
                </p>
              </div>
              <span className="text-[10px] shrink-0 text-[#6B6B70] bg-[#F7F7F8] px-1.5 py-0.5 rounded">
                {issue.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
