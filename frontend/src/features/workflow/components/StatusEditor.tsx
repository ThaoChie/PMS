import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { IssueStatus } from '../../../types';

interface StatusEditorProps {
  statuses: IssueStatus[];
  onAddStatus?: (name: string) => void;
  onRemoveStatus?: (name: string) => void;
}

export default function StatusEditor({
  statuses,
  onAddStatus,
  onRemoveStatus,
}: StatusEditorProps) {
  const [newStatus, setNewStatus] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  function handleAdd() {
    if (!newStatus.trim()) return;
    onAddStatus?.(newStatus.trim());
    setNewStatus('');
    setIsAdding(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <div
            key={status}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F7F8] border border-[#E5E5E7] rounded-lg text-xs font-medium text-[#1A1A1A]"
          >
            <span>{status}</span>
            {onRemoveStatus && status !== 'To Do' && status !== 'Done' && (
              <button
                type="button"
                onClick={() => onRemoveStatus(status)}
                className="text-[#9B9B9F] hover:text-[#E53E3E]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {isAdding ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            placeholder="Tên trạng thái mới..."
            className="px-3 py-1.5 border border-[#E5E5E7] rounded-lg text-xs focus:outline-none focus:border-[#1A1A1A]"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="px-3 py-1.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030]"
          >
            Thêm
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="px-3 py-1.5 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg"
          >
            Hủy
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 text-xs text-[#6B6B70] hover:text-[#1A1A1A] transition-colors border border-dashed border-[#E5E5E7] rounded-lg px-3 py-2 w-full justify-center hover:border-[#C5C5C8]"
        >
          <Plus className="w-3.5 h-3.5" /> Thêm trạng thái mới
        </button>
      )}
    </div>
  );
}
