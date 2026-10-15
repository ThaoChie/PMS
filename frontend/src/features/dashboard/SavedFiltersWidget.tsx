import React from 'react';
import { Bookmark, ArrowRight } from 'lucide-react';
import type { SavedFilter } from '../../types';

interface SavedFiltersWidgetProps {
  filters?: SavedFilter[];
  onNavigate?: (screen: any) => void;
  onSelectFilter?: (filterId: string) => void;
}

export const SavedFiltersWidget: React.FC<SavedFiltersWidgetProps> = ({
  filters = [],
  onNavigate,
  onSelectFilter,
}) => {
  return (
    <div className="border border-[#E5E5E7] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E5E5E7] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-[#6B6B70]" />
          <h2 className="text-xs font-semibold text-[#1A1A1A]">Bộ lọc đã lưu</h2>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('filters')}
            className="text-[10px] text-[#6B6B70] hover:text-[#E53E3E] flex items-center gap-1 transition-colors"
          >
            Quản lý <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      {filters.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#9B9B9F]">
          Chưa có bộ lọc đã lưu
        </div>
      ) : (
        <div className="divide-y divide-[#F0F0F1]">
          {filters.slice(0, 4).map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between px-5 py-2.5 hover:bg-[#F7F7F8] transition-colors cursor-pointer group"
              onClick={() => {
                if (onSelectFilter) {
                  onSelectFilter(f.id);
                } else if (onNavigate) {
                  onNavigate('filters');
                }
              }}
            >
              <div>
                <p className="text-xs text-[#1A1A1A] group-hover:text-[#E53E3E] transition-colors font-medium">
                  {f.name}
                </p>
                <p className="text-[10px] text-[#9B9B9F]">
                  {(f as any).isShared || f.sharedWith?.length > 0 ? 'Chia sẻ với dự án' : 'Riêng tư'}
                </p>
              </div>
              <span className="text-[10px] text-[#9B9B9F] bg-[#F7F7F8] border border-[#E5E5E7] px-1.5 py-0.5 rounded">
                {(f as any).count ?? 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
