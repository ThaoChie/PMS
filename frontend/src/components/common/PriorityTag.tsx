import React from 'react';
import { ArrowUp, ArrowDown, AlertOctagon, Minus } from 'lucide-react';
import type { Priority } from '../../types';

interface PriorityTagProps {
  priority: Priority;
  showIcon?: boolean;
  className?: string;
}

export default function PriorityTag({
  priority,
  showIcon = true,
  className = '',
}: PriorityTagProps) {
  let icon = <Minus className="w-3 h-3 text-gray-500" />;
  let colorClass = 'text-gray-600 bg-gray-50 border-gray-200';

  switch (String(priority || '').toUpperCase()) {
    case 'CRITICAL':
    case 'HIGHEST':
      icon = <AlertOctagon className="w-3 h-3 text-[#E53E3E]" />;
      colorClass = 'text-[#E53E3E] bg-[#FDECEC] border-[#FBD5D5]';
      break;
    case 'HIGH':
      icon = <ArrowUp className="w-3 h-3 text-orange-600" />;
      colorClass = 'text-orange-600 bg-orange-50 border-orange-200';
      break;
    case 'MEDIUM':
      icon = <Minus className="w-3 h-3 text-amber-600" />;
      colorClass = 'text-amber-600 bg-amber-50 border-amber-200';
      break;
    case 'LOW':
      icon = <ArrowDown className="w-3 h-3 text-blue-600" />;
      colorClass = 'text-blue-600 bg-blue-50 border-blue-200';
      break;
    case 'LOWEST':
      icon = <ArrowDown className="w-3 h-3 text-slate-500" />;
      colorClass = 'text-slate-600 bg-slate-50 border-slate-200';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${colorClass} ${className}`}
    >
      {showIcon && icon}
      {priority}
    </span>
  );
}
