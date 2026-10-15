import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import type { WorkflowTransition } from '../../../types';

interface TransitionModalProps {
  isOpen: boolean;
  transition: WorkflowTransition;
  onClose: () => void;
  onExecute: (fields?: Record<string, any>, comment?: string) => void;
}

export default function TransitionModal({
  isOpen,
  transition,
  onClose,
  onExecute,
}: TransitionModalProps) {
  const [comment, setComment] = useState('');
  const [fieldValue, setFieldValue] = useState('');

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fields = transition.requiresField ? { [transition.requiresField]: fieldValue } : undefined;
    onExecute(fields, comment);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 modal-backdrop">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-[#E5E5E7]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1A1A1A]">
            <span>{transition.from}</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#9B9B9F]" />
            <span>{transition.to}</span>
          </div>
          <button type="button" onClick={onClose} className="text-[#9B9B9F] hover:text-[#1A1A1A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {transition.requiresField && (
            <div>
              <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
                {transition.requiresField} <span className="text-[#E53E3E]">*</span>
              </label>
              <input
                type="text"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                placeholder={`Nhập ${transition.requiresField}...`}
                className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
              Ghi chú chuyển trạng thái (tùy chọn)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nhập ghi chú hoặc lý do chuyển trạng thái..."
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
              className="px-4 py-1.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030]"
            >
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
