import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';
import DurationInput from '../../../components/common/DurationInput';
import { MESSAGES } from '../../../constants/messages';
import { parseDuration } from '../../../utils/duration';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface LogWorkModalProps {
  isOpen: boolean;
  issueKey: string;
  onClose: () => void;
  onLogWork: (timeSpent: string, date: string, comment?: string) => void;
}

export default function LogWorkModal({
  isOpen,
  issueKey,
  onClose,
  onLogWork,
}: LogWorkModalProps) {
  const [timeSpent, setTimeSpent] = useState('');
  const [date, setDate] = useState(todayIso());
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!timeSpent.trim()) {
      setError(MESSAGES.WORKLOG.TIME_REQUIRED);
      return;
    }
    // WORKLOG_002: thời gian phải là số dương hợp lệ
    if (parseDuration(timeSpent) <= 0) {
      setError(MESSAGES.WORKLOG.TIME_INVALID);
      return;
    }
    // WORKLOG_001: ngày làm việc không được lớn hơn hôm nay
    if (!date || date > todayIso()) {
      setError(MESSAGES.WORKLOG.DATE_IN_FUTURE);
      return;
    }

    onLogWork(timeSpent, date, comment || undefined);
    setTimeSpent('');
    setComment('');
    setDate(todayIso());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 modal-backdrop">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-[#E5E5E7]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E53E3E]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">
              {MESSAGES.WORKLOG.LOG_BUTTON} — {issueKey}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#9B9B9F] hover:text-[#1A1A1A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
              Thời gian đã dành <span className="text-[#E53E3E]">*</span>
            </label>
            <DurationInput
              value={timeSpent}
              onChange={(val) => setTimeSpent(val)}
              placeholder="VD: 3h, 2h 30m, 45m"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
              Ngày làm việc <span className="text-[#E53E3E]">*</span>
            </label>
            <input
              type="date"
              value={date}
              max={todayIso()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
              Mô tả công việc (tùy chọn)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nội dung công việc đã thực hiện..."
              rows={3}
              className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-[#E53E3E] bg-[#FDECEC] border border-[#FBD5D5] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

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
              disabled={!timeSpent.trim()}
              className="px-4 py-1.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-40"
            >
              Lưu công việc
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
