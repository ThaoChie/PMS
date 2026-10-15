import React, { useState } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';

interface ApprovalActionsProps {
  onApprove: (comment?: string) => void;
  onReject: (reason: string) => void;
  className?: string;
}

export default function ApprovalActions({
  onApprove,
  onReject,
  className = '',
}: ApprovalActionsProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  function handleConfirmReject() {
    if (!rejectReason.trim()) return;
    onReject(rejectReason);
    setShowRejectForm(false);
    setRejectReason('');
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onApprove()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition-colors"
        >
          <Check className="w-3.5 h-3.5" /> Approve
        </button>
        <button
          type="button"
          onClick={() => setShowRejectForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E53E3E] text-[#E53E3E] text-xs font-medium rounded-lg hover:bg-[#E53E3E] hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Reject
        </button>
      </div>

      {showRejectForm && (
        <div className="p-3 bg-[#FDECEC] border border-[#E53E3E]/20 rounded-lg fade-in">
          <p className="text-xs font-medium text-[#E53E3E] mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Lý do từ chối (bắt buộc)
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nêu rõ lý do từ chối và yêu cầu sửa đổi..."
            rows={2}
            className="w-full px-3 py-2 border border-[#E53E3E]/30 rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#E53E3E] resize-none bg-white transition-colors"
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button
              type="button"
              onClick={() => setShowRejectForm(false)}
              className="px-3 py-1.5 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-white transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!rejectReason.trim()}
              onClick={handleConfirmReject}
              className="px-3 py-1.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Từ chối & quay lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
