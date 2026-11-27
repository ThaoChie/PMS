import React from 'react';
import { Bookmark, Bug, CheckSquare, Zap, GitCommit } from 'lucide-react';
import type { IssueType } from '../../types';

interface IssueTypeIconProps {
  type: IssueType;
  className?: string;
}

export default function IssueTypeIcon({ type, className = 'w-3.5 h-3.5' }: IssueTypeIconProps) {
  switch (type?.toUpperCase()) {
    case 'BUG':
      return <Bug className={`${className} text-[#E53E3E] shrink-0`} />;
    case 'STORY':
      return <Bookmark className={`${className} text-emerald-600 shrink-0`} />;
    case 'TASK':
      return <CheckSquare className={`${className} text-blue-600 shrink-0`} />;
    case 'EPIC':
      return <Zap className={`${className} text-purple-600 shrink-0`} />;
    case 'SUB-TASK':
    case 'SUB_TASK':
      return <GitCommit className={`${className} text-teal-600 shrink-0`} />;
    default:
      return <CheckSquare className={`${className} text-gray-500 shrink-0`} />;
  }
}
