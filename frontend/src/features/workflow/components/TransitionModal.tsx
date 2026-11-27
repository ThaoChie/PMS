import React, { useState } from 'react';
import { X, ArrowRight, AlertCircle } from 'lucide-react';
import type { WorkflowTransition } from '../../../types';

interface TransitionModalProps {
  isOpen: boolean;
  transition: WorkflowTransition | any;
  canSendFeedbackEmail?: boolean;
  onClose: () => void;
  onExecute: (fields?: Record<string, any>, comment?: string, sendEmail?: boolean) => void;
}

export function canShowApprovalFeedbackEmail(
  transition: any,
  canSendFeedbackEmail?: boolean,
): boolean {
  if (!canSendFeedbackEmail || !transition) return false;
  const transType = String(transition.type || '').toUpperCase();
  return transType === 'APPROVE' || transType === 'REJECT';
}

const RESOLUTION_OPTIONS = [
  { value: 'Fixed', label: 'Đã sửa xong (Fixed)' },
  { value: 'Done', label: 'Hoàn thành (Done)' },
  { value: 'Duplicate', label: 'Lỗi trùng lặp (Duplicate)' },
  { value: 'Cannot Reproduce', label: 'Không thể tái hiện (Cannot Reproduce)' },
  { value: 'Not a Bug', label: 'Không phải lỗi (Not a Bug)' },
  { value: 'Won\'t Fix', label: 'Từ chối xử lý (Won\'t Fix)' },
  { value: 'custom', label: 'Khác (Nhập tùy chọn...)' },
];

export default function TransitionModal({
  isOpen,
  transition,
  canSendFeedbackEmail = false,
  onClose,
  onExecute,
}: TransitionModalProps) {
  const [comment, setComment] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [resolutionSelect, setResolutionSelect] = useState('Fixed');
  const [customResolution, setCustomResolution] = useState('');
  const [otherFieldValues, setOtherFieldValues] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !transition) return null;

  const rawReqFields = (transition.requiredFields || transition.requiresField || '').trim();
  const reqFieldsList = rawReqFields
    ? rawReqFields.split(',').map((f: string) => f.trim()).filter(Boolean)
    : [];

  const fromName = transition.from || 'Hiện tại';
  const toName = transition.to || transition.toStatusName || 'Mới';
  const showSendEmailOption = canShowApprovalFeedbackEmail(transition, canSendFeedbackEmail);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const fields: Record<string, any> = {};

    for (const f of reqFieldsList) {
      if (f.toLowerCase() === 'resolution') {
        const val = resolutionSelect === 'custom' ? customResolution.trim() : resolutionSelect;
        if (!val) {
          setErrorMsg('Vui lòng nhập hoặc chọn kết quả xử lý (Resolution)!');
          return;
        }
        fields['resolution'] = val;
      } else {
        const val = (otherFieldValues[f] || '').trim();
        if (!val) {
          setErrorMsg(`Vui lòng nhập "${f}"!`);
          return;
        }
        fields[f] = val;
      }
    }

    onExecute(
      Object.keys(fields).length > 0 ? fields : undefined,
      comment.trim() || undefined,
      showSendEmailOption ? sendEmail : false,
    );
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 modal-backdrop">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-[#E5E5E7] animate-in fade-in-50 zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E7]">
          <div>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Xác nhận chuyển trạng thái</h3>
            <div className="flex items-center gap-1.5 text-xs text-[#6B6B70] mt-1">
              <span className="font-medium text-[#1A1A1A]">{fromName}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#9B9B9F]" />
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {toName}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#F7F7F8] text-[#9B9B9F] hover:text-[#1A1A1A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-5 mt-4 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {reqFieldsList.map((fieldName: string) => {
            const isResolution = fieldName.toLowerCase() === 'resolution';

            if (isResolution) {
              return (
                <div key={fieldName} className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#1A1A1A]">
                    Kết quả xử lý (Resolution) <span className="text-[#E53E3E]">*</span>
                  </label>
                  <p className="text-[11px] text-[#6B6B70]">
                    Vui lòng chọn kết quả giải quyết cho công việc này:
                  </p>
                  <select
                    value={resolutionSelect}
                    onChange={(e) => setResolutionSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] transition-colors"
                    required
                  >
                    {RESOLUTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {resolutionSelect === 'custom' && (
                    <input
                      type="text"
                      autoFocus
                      value={customResolution}
                      onChange={(e) => setCustomResolution(e.target.value)}
                      placeholder="Nhập kết quả xử lý khác..."
                      className="w-full mt-1.5 px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                      required
                    />
                  )}
                </div>
              );
            }

            return (
              <div key={fieldName} className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1A1A1A]">
                  {fieldName} <span className="text-[#E53E3E]">*</span>
                </label>
                <input
                  type="text"
                  value={otherFieldValues[fieldName] || ''}
                  onChange={(e) =>
                    setOtherFieldValues((prev) => ({ ...prev, [fieldName]: e.target.value }))
                  }
                  placeholder={`Nhập ${fieldName}...`}
                  className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                  required
                />
              </div>
            );
          })}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1A1A1A]">
              Ghi chú chuyển đổi trạng thái <span className="text-[11px] font-normal text-[#9B9B9F]">(tùy chọn)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nhập ghi chú chuyển đổi trạng thái công việc..."
              rows={3}
              className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] resize-none transition-colors"
            />
          </div>

          {showSendEmailOption && (
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id="sendEmailToAssignee"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 text-[#1A1A1A] border-[#E5E5E7] rounded focus:ring-0 cursor-pointer"
              />
              <label
                htmlFor="sendEmailToAssignee"
                className="text-xs text-[#1A1A1A] font-medium cursor-pointer select-none"
              >
                Gửi email thông báo cho người thực hiện task này
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F0F0F1]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E5E7] text-xs font-medium text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
            >
              Xác nhận chuyển
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
