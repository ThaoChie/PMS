import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Lock } from 'lucide-react';
import type { WorkflowTransition } from '../../../types';

interface TransitionEditorProps {
  transition: WorkflowTransition | null;
  readOnly?: boolean;
  onSave: (requiresField?: string, isApprovalStep?: boolean) => void;
  onCancel: () => void;
}

export default function TransitionEditor({
  transition,
  readOnly = false,
  onSave,
  onCancel,
}: TransitionEditorProps) {
  const [editRequiresField, setEditRequiresField] = useState('');
  const [editIsApproval, setEditIsApproval] = useState(false);

  useEffect(() => {
    if (transition) {
      setEditIsApproval(Boolean(transition.isApprovalStep));
    }
  }, [transition?.isApprovalStep]);

  useEffect(() => {
    if (transition) {
      setEditRequiresField(transition.requiresField ?? (transition as any).requiredFields ?? '');
    }
  }, [transition?.id, transition?.from, transition?.to, transition?.requiresField, (transition as any)?.requiredFields]);

  if (!transition) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-10 px-5 text-center">
        <div className="w-8 h-8 mb-3 text-[#E5E5E7]">
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 16h16M20 12l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-xs text-[#9B9B9F]">
          Nhấp vào mũi tên trong sơ đồ quy trình để cấu hình bước chuyển đó
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 flex-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 text-xs text-[#1A1A1A]">
          <span className="font-medium px-2 py-0.5 bg-[#F7F7F8] border border-[#E5E5E7] rounded">
            {transition.from}
          </span>
          <span className="text-[#9B9B9F]">→</span>
          <span className="font-medium px-2 py-0.5 bg-[#F7F7F8] border border-[#E5E5E7] rounded">
            {transition.to}
          </span>
        </div>
        {readOnly && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium flex items-center gap-1 border border-gray-200">
            <Lock className="w-2.5 h-2.5 text-gray-500" /> Chỉ xem
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Approval toggle */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && setEditIsApproval((v) => !v)}
            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
              readOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
            } ${
              editIsApproval ? 'bg-[#E53E3E] border-[#E53E3E]' : 'border-[#E5E5E7]'
            }`}
          >
            {editIsApproval && <Check className="w-2.5 h-2.5 text-white" />}
          </button>
          <div>
            <p className="text-xs font-medium text-[#1A1A1A]">Đánh dấu là bước cần phê duyệt</p>
            <p className="text-[10px] text-[#9B9B9F] mt-0.5">
              Chỉ Quản lý dự án (PM) và Admin mới có thể thực hiện bước chuyển này
            </p>
          </div>
        </div>

        {/* Required field */}
        <div>
          <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
            Trường dữ liệu bắt buộc trước khi chuyển
          </label>
          <input
            value={editRequiresField}
            disabled={readOnly}
            readOnly={readOnly}
            onChange={(e) => !readOnly && setEditRequiresField(e.target.value)}
            placeholder={readOnly ? 'Không có trường bắt buộc' : 'Ví dụ: Người thực hiện, Lý do từ chối'}
            className={`w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] placeholder:text-[#9B9B9F] focus:outline-none transition-colors ${
              readOnly ? 'bg-[#F2F2F3] text-[#6B6B70] cursor-not-allowed' : 'bg-white focus:border-[#1A1A1A]'
            }`}
          />
          <p className="text-[10px] text-[#9B9B9F] mt-1">
            {readOnly ? 'Quy trình ở chế độ chỉ xem' : 'Để trống nếu không yêu cầu trường bắt buộc cụ thể'}
          </p>
        </div>

        {editIsApproval && (
          <div className="flex items-start gap-2 bg-[#FDECEC] rounded-lg p-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#E53E3E] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#E53E3E]">
              Bước chuyển này cần sự phê duyệt của PM hoặc Admin. Thành viên dự án không thể trực tiếp hoàn tất.
            </p>
          </div>
        )}
      </div>

      {readOnly ? (
        <div className="mt-5 space-y-2">
          <div className="text-[11px] text-[#8E8E93] italic flex items-center justify-center gap-1 py-1">
            <Lock className="w-3 h-3 text-[#8E8E93]" /> Chế độ chỉ xem - không thể chỉnh sửa bước chuyển
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 border border-[#E5E5E7] text-xs font-medium text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8] transition-colors"
          >
            Đóng
          </button>
        </div>
      ) : (
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={() => onSave(editRequiresField.trim(), editIsApproval)}
            className="flex-1 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] transition-colors"
          >
            Lưu
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8] transition-colors"
          >
            Hủy
          </button>
        </div>
      )}
    </div>
  );
}
