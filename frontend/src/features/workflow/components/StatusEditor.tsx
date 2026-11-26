import React, { useState } from 'react';
import { Plus, X, Tag, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import type { StatusCategory, WorkflowStatus } from '../../../types';

interface StatusEditorProps {
  statuses: WorkflowStatus[];
  onAddStatus?: (name: string, category: StatusCategory) => void;
  onRemoveStatus?: (name: string) => void;
  onMoveStatus?: (index: number, direction: 'left' | 'right') => void;
  onReorderStatuses?: (newStatuses: WorkflowStatus[]) => void;
}

export default function StatusEditor({
  statuses,
  onAddStatus,
  onRemoveStatus,
  onMoveStatus,
  onReorderStatuses,
}: StatusEditorProps) {
  const [newStatus, setNewStatus] = useState('');
  const [newCategory, setNewCategory] = useState<StatusCategory>('IN_PROGRESS');
  const [isAdding, setIsAdding] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIdx(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIndex) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const copy = [...statuses];
    const [moved] = copy.splice(draggedIdx, 1);
    copy.splice(targetIndex, 0, moved);
    onReorderStatuses?.(copy);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] text-[#6B6B70]">
        <span>Thứ tự các bước quy trình (từ trái qua phải):</span>
        <span className="text-[10px] text-[#9B9B9F]">Dùng ◀ ▶ hoặc kéo thả thẻ để đổi thứ tự</span>
      </div>

      <div className="flex flex-wrap gap-2.5 items-center">
        {statuses.map((status, idx) => (
          <div
            key={status.id || status.name}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, idx)}
            className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F7F7F8] border rounded-lg text-xs font-medium text-[#1A1A1A] transition-all select-none ${
              dragOverIdx === idx
                ? 'border-black bg-gray-100 scale-105 shadow-sm'
                : 'border-[#E5E5E7] hover:border-[#C5C5C8]'
            } ${draggedIdx === idx ? 'opacity-40' : 'opacity-100'}`}
          >
            {/* Drag handle & Order Number */}
            <div className="flex items-center gap-1 text-[#9B9B9F] cursor-grab active:cursor-grabbing">
              <GripVertical className="w-3 h-3 text-[#A0A0A5] opacity-60 group-hover:opacity-100" />
              <span className="w-4 h-4 rounded-full bg-[#E5E5E7] text-[#1A1A1A] text-[9px] font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
            </div>

            {/* Move Left Button */}
            {onMoveStatus && (
              <button
                type="button"
                id={`btn-move-left-${idx}`}
                disabled={idx === 0}
                onClick={() => onMoveStatus(idx, 'left')}
                className="p-0.5 text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#E5E5E7] rounded disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                title="Di chuyển sang trái (lên trước)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Status Name */}
            <span className="font-semibold text-[#1A1A1A] px-0.5">{status.name}</span>

            {/* Category Tag */}
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-semibold ${getCategoryBadgeClass(
                status.category
              )}`}
            >
              {status.category || 'IN_PROGRESS'}
            </span>

            {/* Move Right Button */}
            {onMoveStatus && (
              <button
                type="button"
                id={`btn-move-right-${idx}`}
                disabled={idx === statuses.length - 1}
                onClick={() => onMoveStatus(idx, 'right')}
                className="p-0.5 text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#E5E5E7] rounded disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                title="Di chuyển sang phải (xuống sau)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Remove button */}
            {onRemoveStatus && !status.isInitial && !(status.category === 'DONE' && statuses.filter(s => s.category === 'DONE').length <= 1) && (
              <button
                type="button"
                onClick={() => onRemoveStatus(status.name)}
                className="text-[#9B9B9F] hover:text-[#E53E3E] transition-colors ml-1 p-0.5 rounded hover:bg-red-50"
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
