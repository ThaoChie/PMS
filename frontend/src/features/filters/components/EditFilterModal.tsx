import React, { useState, useEffect } from 'react';
import { X, Edit3 } from 'lucide-react';
import type { SavedFilter } from '../../../types';

interface EditFilterModalProps {
  isOpen: boolean;
  filter: SavedFilter | null;
  onClose: () => void;
  onSave: (id: string, name: string) => Promise<void> | void;
}

export default function EditFilterModal({
  isOpen,
  filter,
  onClose,
  onSave,
}: EditFilterModalProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (filter) {
      setName(filter.name || '');
    }
  }, [filter, isOpen]);

  if (!isOpen || !filter) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(filter!.id, name.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 modal-backdrop">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden border border-[#E5E5E7]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[#1A1A1A]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Đổi tên bộ lọc</h3>
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
              placeholder="VD: Bugs ưu tiên cao"
              className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3.5 py-1.5 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8] disabled:opacity-40"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="px-4 py-1.5 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-black disabled:opacity-40"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
