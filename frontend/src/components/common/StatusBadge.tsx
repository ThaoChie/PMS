import React from 'react';
import type { IssueStatus } from '../../types';

interface StatusBadgeProps {
  status: IssueStatus | string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  let badgeStyles = 'bg-blue-50 text-blue-700 border-blue-200';

  switch (status) {
    case 'To Do':
    case 'TODO':
      badgeStyles = 'bg-gray-100 text-gray-700 border-gray-300';
      break;
    case 'Done':
    case 'DONE':
      badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'In Progress':
    case 'IN_PROGRESS':
    case 'Pending Approval':
    default:
      badgeStyles = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${badgeStyles} ${className}`}
    >
      {status}
    </span>
  );
}
