import React from 'react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-[#E5E5E7] ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#F7F7F8] flex items-center justify-center text-[#6B6B70] mb-3">
        {icon || <FolderOpen className="w-6 h-6 text-[#9B9B9F]" />}
      </div>
      <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
      {description && <p className="text-xs text-[#6B6B70] mt-1 max-w-sm">{description}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-3.5 py-1.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
