import React, { useState } from 'react';
import { X, Send, Share2, Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { issueService } from '../../../services/issueService';
import { toast } from '../../../store/toastStore';

interface ShareIssueModalProps {
  issueKey: string;
  issueSummary: string;
  onClose: () => void;
  onShare?: (recipients: string[], note?: string) => Promise<any> | void;
}

export default function ShareIssueModal({
  issueKey,
  issueSummary,
  onClose,
  onShare,
}: ShareIssueModalProps) {
  const [emails, setEmails] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const recipientList = emails
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (recipientList.length === 0) {
      setErrorMessage('Vui lòng nhập ít nhất một địa chỉ email để chia sẻ.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const r of recipientList) {
      if (!emailRegex.test(r)) {
        setErrorMessage(`Địa chỉ email "${r}" không đúng định dạng hợp lệ.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (onShare) {
        await onShare(recipientList, note);
      } else {
        const res = await issueService.shareIssue(issueKey, recipientList, note);
        const warnings = (res?.data as any)?.warnings;
        if (warnings && warnings.length > 0) {
          toast.info(warnings.join('\n'));
        }
      }

      setSent(true);
      toast.success(`Đã gửi email chia sẻ công việc ${issueKey} thành công!`);
      setTimeout(() => {
        setSent(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể chia sẻ công việc. Vui lòng kiểm tra lại.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-backdrop px-4"
      onClick={!isSubmitting ? onClose : undefined}
    >
      <div
        className="bg-white border border-[#E5E5E7] rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#E53E3E]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Chia sẻ {issueKey}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[#9B9B9F] hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-3 bg-emerald-50/50">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-800">Chia sẻ thành công!</h4>
              <p className="text-xs text-emerald-600 mt-1 max-w-xs">
                Email thông báo kèm liên kết truy cập công việc <strong>{issueKey}</strong> đã được gửi tới người nhận.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-xs text-[#6B6B70] leading-relaxed">
              Gửi liên kết và tóm tắt của <strong>{issueSummary}</strong> tới đồng nghiệp hoặc đối tác qua email.
            </p>

            {errorMessage && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 whitespace-pre-line">{errorMessage}</div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
                Email người nhận <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="alice@gmail.com, bob@company.com"
                className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#E53E3E] transition-colors disabled:bg-gray-100"
                required
                disabled={isSubmitting}
                autoFocus
              />
              <p className="text-[11px] text-[#9B9B9F] mt-1">
                Có thể nhập nhiều email cách nhau bằng dấu phẩy (,) hoặc chấm phẩy (;).
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
                Ghi chú thêm (tùy chọn)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nội dung lời nhắn hoặc chỉ dẫn bổ sung..."
                rows={3}
                className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#E53E3E] transition-colors resize-none disabled:bg-gray-100"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-start gap-2 p-2.5 bg-[#F7F7F8] rounded-lg text-[11px] text-[#6B6B70]">
              <Info className="w-3.5 h-3.5 text-[#9B9B9F] shrink-0 mt-0.5" />
              <span>
                Người nhận cần đăng nhập hoặc đăng ký tài khoản trước khi truy cập công việc.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5E7]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8] transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Gửi
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
