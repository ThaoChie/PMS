import React from 'react';
import { Link as LinkIcon } from 'lucide-react';
import type { LinkedIssue } from '../../../types';

interface LinkedIssuesSectionProps {
  linkedIssues: LinkedIssue[];
  onSelectIssue?: (key: string) => void;
}

export default function LinkedIssuesSection({
  linkedIssues,
  onSelectIssue,
}: LinkedIssuesSectionProps) {
  if (!linkedIssues || linkedIssues.length === 0) return null;

  return (
    <div className="mb-5">
      <h4 className="text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider mb-2">
        Linked issues
      </h4>
      <div className="border border-[#E5E5E7] rounded-lg overflow-hidden divide-y divide-[#F0F0F1] bg-white">
        {linkedIssues.map((li) => (
          <div
            key={li.id}
            onClick={() => onSelectIssue?.(li.key)}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F7F7F8] cursor-pointer transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5 text-[#9B9B9F] shrink-0" />
            <span className="text-[10px] text-[#9B9B9F] shrink-0">{li.relation}</span>
            <span className="text-[11px] font-mono text-[#9B9B9F]">{li.key}</span>
            <span className="text-xs text-[#1A1A1A] truncate flex-1">{li.summary}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
