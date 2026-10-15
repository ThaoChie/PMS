import React from 'react';
import { Bookmark, Bug, CheckSquare, Zap, GitCommit } from 'lucide-react';
import type { IssueType } from '../../types';

interface IssueTypeIconProps {
  type: IssueType;
  className?: string;
}

export default function IssueTypeIcon({ type, className = 'w-3.5 h-3.5' }: IssueTypeIconProps) {
  switch (type) {
    case 'Bug':
      return <Bug className={`${className} text-[#E53E3E] shrink-0`} />;
    case 'Story':
      return <Bookmark className={`${className} text-emerald-600 shrink-0`} />;
    case 'Task':
      return <CheckSquare className={`${className} text-blue-600 shrink-0`} />;
    case 'Epic':
      return <Zap className={`${className} text-purple-600 shrink-0`} />;
    case 'Sub-task':
      return <GitCommit className={`${className} text-teal-600 shrink-0`} />;
    default:
      return <CheckSquare className={`${className} text-gray-500 shrink-0`} />;
  }
}
