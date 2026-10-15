import React from 'react';
import type { IssueStatus } from '../../types';

interface StatusBadgeProps {
  status: IssueStatus | string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  let badgeStyles = 'bg-[#F2F2F3] text-[#6B6B70] border-[#E5E5E7]';

  switch (status) {
    case 'To Do':
      badgeStyles = 'bg-[#F2F2F3] text-[#6B6B70] border-[#E5E5E7]';
      break;
    case 'In Progress':
      badgeStyles = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'Pending Approval':
      badgeStyles = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'Done':
      badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
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
