import React, { useState } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import type { StatusCategory, WorkflowStatus } from '../../../types';

interface StatusEditorProps {
  statuses: WorkflowStatus[];
  onAddStatus?: (name: string, category: StatusCategory) => void;
  onRemoveStatus?: (name: string) => void;
}

export default function StatusEditor({
  statuses,
  onAddStatus,
  onRemoveStatus,
}: StatusEditorProps) {
  const [newStatus, setNewStatus] = useState('');
  const [newCategory, setNewCategory] = useState<StatusCategory>('IN_PROGRESS');
  const [isAdding, setIsAdding] = useState(false);

  function handleAdd() {
    if (!newStatus.trim()) return;
    onAddStatus?.(newStatus.trim(), newCategory);
    setNewStatus('');
    setNewCategory('IN_PROGRESS');
    setIsAdding(false);
  }

  const getCategoryBadgeClass = (category?: StatusCategory) => {
    switch (category) {
      case 'TODO':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'DONE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <div
            key={status.id || status.name}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#F7F7F8] border border-[#E5E5E7] rounded-lg text-xs font-medium text-[#1A1A1A]"
          >
            <span>{status.name}</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-semibold ${getCategoryBadgeClass(
                status.category
              )}`}
            >
              {status.category || 'IN_PROGRESS'}
            </span>
            {onRemoveStatus && status.name !== 'To Do' && status.name !== 'Done' && !status.isInitial && (
              <button
                type="button"
                onClick={() => onRemoveStatus(status.name)}
                className="text-[#9B9B9F] hover:text-[#E53E3E] transition-colors ml-0.5"
                title={`Xóa trạng thái ${status.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {isAdding ? (
        <div className="p-3 bg-[#F9FAFB] border border-[#E5E5E7] rounded-xl flex flex-wrap items-center gap-2.5">
          <input
            id="new-status-name"
            type="text"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            placeholder="Tên trạng thái mới..."
            className="px-3 py-1.5 border border-[#E5E5E7] rounded-lg text-xs focus:outline-none focus:border-[#1A1A1A] bg-white flex-1 min-w-[160px]"
          />
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#6B6B70]" />
            <select
              id="new-status-category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as StatusCategory)}
              className="px-2.5 py-1.5 border border-[#E5E5E7] rounded-lg text-xs font-medium bg-white focus:outline-none focus:border-[#1A1A1A]"
            >
              <option value="TODO">TODO (Khởi tạo / Cần làm)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (Đang thực hiện)</option>
              <option value="DONE">DONE (Hoàn thành)</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              id="btn-confirm-add-status"
              type="button"
              onClick={handleAdd}
              disabled={!newStatus.trim()}
              className="px-3.5 py-1.5 bg-[#1A1A1A] text-white text-xs font-semibold rounded-lg hover:bg-black disabled:opacity-40 transition-colors"
            >
              Thêm
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-[#F2F2F3] transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <button
          id="btn-show-add-status"
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-[#6B6B70] hover:text-[#1A1A1A] transition-colors border border-dashed border-[#E5E5E7] rounded-lg px-3 py-2 w-full justify-center hover:border-[#1A1A1A] hover:bg-[#FAFAFA]"
        >
          <Plus className="w-3.5 h-3.5" /> Thêm trạng thái mới
        </button>
      )}
    </div>
  );
}
