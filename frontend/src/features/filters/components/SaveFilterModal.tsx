import React, { useState } from 'react';
import { X, Bookmark, Mail } from 'lucide-react';

export interface SaveFilterData {
  name: string;
  emailSubscription?: boolean;
  frequency?: 'daily' | 'weekly';
}

interface SaveFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveFilterData | string) => Promise<void> | void;
}

export default function SaveFilterModal({ isOpen, onClose, onSave }: SaveFilterModalProps) {
  const [name, setName] = useState('');
  const [subscribeEmail, setSubscribeEmail] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        emailSubscription: subscribeEmail,
        frequency: subscribeEmail ? frequency : undefined,
      });
      setName('');
      setSubscribeEmail(false);
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
              autoFocus
            />
          </div>

          <div className="pt-2 border-t border-[#F0F0F1]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.checked)}
                className="rounded border-[#E5E5E7] text-[#E53E3E] focus:ring-[#E53E3E]"
              />
              <span className="text-xs text-[#1A1A1A] flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-[#6B6B70]" /> Đăng ký nhận email thông báo
              </span>
            </label>

            {subscribeEmail && (
              <div className="mt-2.5 ml-6 pl-2 border-l-2 border-[#E5E5E7] space-y-1.5">
                <label className="block text-[10px] font-medium text-[#6B6B70] uppercase">
                  Tần suất gửi email
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-[#1A1A1A] cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="daily"
                      checked={frequency === 'daily'}
                      onChange={() => setFrequency('daily')}
                      className="text-[#E53E3E] focus:ring-[#E53E3E]"
                    />
                    <span>Hàng ngày</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-[#1A1A1A] cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="weekly"
                      checked={frequency === 'weekly'}
                      onChange={() => setFrequency('weekly')}
                      className="text-[#E53E3E] focus:ring-[#E53E3E]"
                    />
                    <span>Hàng tuần</span>
                  </label>
                </div>
              </div>
            )}
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
              className="px-4 py-1.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-40"
            >
              {saving ? 'Đang lưu...' : 'Lưu bộ lọc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
