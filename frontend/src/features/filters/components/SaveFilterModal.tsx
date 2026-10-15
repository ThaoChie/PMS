import React, { useState } from 'react';
import { X, Bookmark } from 'lucide-react';

interface SaveFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export default function SaveFilterModal({ isOpen, onClose, onSave }: SaveFilterModalProps) {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
    setName('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 modal-backdrop">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden border border-[#E5E5E7]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#E53E3E]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Lưu bộ lọc hiện tại</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#9B9B9F] hover:text-[#1A1A1A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">Tên bộ lọc</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Bugs ưu tiên cao trong Sprint"
              className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-1.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-40"
            >
              Lưu bộ lọc
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
