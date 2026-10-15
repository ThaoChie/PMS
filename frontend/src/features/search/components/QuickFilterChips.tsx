import React from 'react';

export interface QuickFilterOption {
  id: string;
  label: string;
}

interface QuickFilterChipsProps {
  options: QuickFilterOption[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
}

export default function QuickFilterChips({
  options,
  activeId,
  onSelect,
  className = '',
}: QuickFilterChipsProps) {
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {options.map((opt) => {
        const isActive = activeId === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(isActive ? null : opt.id)}
            className={`px-2.5 py-1 rounded-full text-xs transition-colors border ${
              isActive
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'border-[#E5E5E7] text-[#6B6B70] hover:text-[#1A1A1A] hover:border-[#C5C5C8] bg-white'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
