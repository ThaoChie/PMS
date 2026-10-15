import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  isDanger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 modal-backdrop">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden fade-in border border-[#E5E5E7]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-2">
            {isDanger && <AlertTriangle className="w-4 h-4 text-[#E53E3E]" />}
            <h3 className="font-semibold text-sm text-[#1A1A1A]">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="w-6 h-6 rounded flex items-center justify-center text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#F7F7F8]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs text-[#6B6B70] leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-[#F7F7F8] border-t border-[#E5E5E7]">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 border border-[#E5E5E7] bg-white rounded-lg text-xs font-medium text-[#1A1A1A] hover:bg-[#F2F2F3] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium text-white transition-colors ${
              isDanger ? 'bg-[#E53E3E] hover:bg-[#C53030]' : 'bg-[#1A1A1A] hover:bg-black'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
