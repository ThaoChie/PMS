import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';

interface SubscribeModalProps {
  isOpen: boolean;
  filterName: string;
  initialFrequency?: 'daily' | 'weekly';
  onClose: () => void;
  onSubscribe: (frequency: 'daily' | 'weekly') => void;
}

export default function SubscribeModal({
  isOpen,
  filterName,
  initialFrequency = 'weekly',
  onClose,
  onSubscribe,
}: SubscribeModalProps) {
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>(initialFrequency);

  if (!isOpen) return null;

  function handleConfirm() {
    onSubscribe(frequency);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 modal-backdrop">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden border border-[#E5E5E7]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#E53E3E]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Đăng ký nhận email</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#9B9B9F] hover:text-[#1A1A1A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-[#6B6B70]">
            Nhận tổng hợp kết quả của bộ lọc <strong>{filterName}</strong> qua email định kỳ.
          </p>

          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">Tần suất gửi</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')}
              className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] bg-white"
            >
              <option value="daily">Hàng ngày (Daily digest)</option>
              <option value="weekly">Hàng tuần (Weekly digest - thứ 2)</option>
            </select>
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
              Đăng ký
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
