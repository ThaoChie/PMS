import React, { useState } from 'react';
import { X, Share2 } from 'lucide-react';
import type { User } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';

interface ShareFilterModalProps {
  isOpen: boolean;
  filterName: string;
  users: User[];
  onClose: () => void;
  onShare: (userIds: string[]) => void;
}

export default function ShareFilterModal({
  isOpen,
  filterName,
  users,
  onClose,
  onShare,
}: ShareFilterModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  if (!isOpen) return null;

  function toggleUser(id: string) {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id],
    );
  }

  function handleConfirm() {
    onShare(selectedUsers);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 modal-backdrop">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-[#E5E5E7]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#E53E3E]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Chia sẻ bộ lọc: {filterName}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#9B9B9F] hover:text-[#1A1A1A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-[#6B6B70]">
            Chọn các thành viên bạn muốn chia sẻ bộ lọc này:
          </p>
          <div className="max-h-56 overflow-y-auto space-y-1 border border-[#E5E5E7] rounded-lg p-2">
            {users.map((u) => {
              const isSelected = selectedUsers.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#FDECEC]' : 'hover:bg-[#F7F7F8]'
                  }`}
                >
                  <UserAvatar initials={u.initials} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1A1A1A] truncate">{u.name}</p>
                    <p className="text-[10px] text-[#6B6B70] truncate">{u.email}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="rounded text-[#E53E3E]"
                  />
                </div>
              );
            })}
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
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030]"
            >
              Chia sẻ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
