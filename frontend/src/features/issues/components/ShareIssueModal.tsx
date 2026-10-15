import React, { useState } from 'react';
import { X, Send, Share2 } from 'lucide-react';

interface ShareIssueModalProps {
  issueKey: string;
  issueSummary: string;
  onClose: () => void;
  onShare?: (recipients: string[], note?: string) => void;
}

export default function ShareIssueModal({
  issueKey,
  issueSummary,
  onClose,
  onShare,
}: ShareIssueModalProps) {
  const [emails, setEmails] = useState('');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const recipientList = emails
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onShare?.(recipientList, note);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1200);
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 modal-backdrop px-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5E5E7] rounded-xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#E53E3E]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Chia sẻ {issueKey}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#9B9B9F] hover:text-[#1A1A1A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {sent ? (
          <div className="p-6 text-center text-xs text-emerald-700 bg-emerald-50">
            Đã chia sẻ thông tin Issue thành công!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-xs text-[#6B6B70] leading-relaxed">
              Gửi liên kết và tóm tắt của <strong>{issueSummary}</strong> tới đồng nghiệp qua email.
            </p>

            <div>
              <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
                Email người nhận (phân cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="alice@company.com, bob@company.com"
                className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
                Ghi chú thêm (tùy chọn)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nội dung lời nhắn..."
                rows={3}
                className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] resize-none"
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030]"
              >
                <Send className="w-3.5 h-3.5" /> Gửi
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
