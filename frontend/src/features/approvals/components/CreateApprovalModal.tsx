import React, { useState } from 'react';
import type { ApprovalRequestType, CreateApprovalRequestPayload } from '../types';
import { useApprovalStore } from '../store/approvalStore';
import { toast } from '../../../store/toastStore';
import { X, Send, AlertCircle, FileText } from 'lucide-react';
import type { Project } from '../../../types';

interface ModalProps {
  projects: Project[];
  defaultProjectId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateApprovalModal: React.FC<ModalProps> = ({
  projects,
  defaultProjectId,
  onClose,
  onSuccess,
}) => {
  const { createRequest, isSubmitting } = useApprovalStore();

  const [projectId, setProjectId] = useState<number>(defaultProjectId || (projects[0]?.id as unknown as number) || 1);
  const [type, setType] = useState<ApprovalRequestType>('PROJECT_CLOSE');
  const [reason, setReason] = useState('');
  const [payloadText, setPayloadText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!reason.trim()) {
      setErrorMessage('Lý do yêu cầu phê duyệt không được để trống');
      return;
    }

    let parsedPayload: any = null;
    if (type === 'WORKFLOW_CONFIG_CHANGE') {
      if (!payloadText.trim()) {
        setErrorMessage('Vui lòng nhập payload JSON cấu hình workflow');
        return;
      }
      try {
        parsedPayload = JSON.parse(payloadText.trim());
      } catch {
        setErrorMessage('Payload cấu hình workflow phải là JSON hợp lệ');
        return;
      }
    }

    try {
      const payload: CreateApprovalRequestPayload = {
        projectId,
        type,
        reason: reason.trim(),
        payload: parsedPayload,
      };

      await createRequest(projectId, payload);
      toast.success('Đã gửi yêu cầu phê duyệt thành công!');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || err?.response?.data?.message || 'Không thể tạo yêu cầu duyệt: có lỗi xảy ra');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div data-testid="create-approval-modal" className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-[#E5E5E7] animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E7] flex items-center justify-between bg-[#F7F7F8]">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1A1A1A]" />
            <h3 className="font-bold text-base text-[#1A1A1A]">Gửi yêu cầu phê duyệt</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div data-testid="create-approval-error" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Project selector */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Dự án áp dụng</label>
            <select
              data-testid="select-approval-project"
              value={projectId}
              onChange={(e) => setProjectId(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 border border-[#E5E5E7] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Loại yêu cầu</label>
            <select
              data-testid="select-approval-type"
              value={type}
              onChange={(e) => setType(e.target.value as ApprovalRequestType)}
              className="w-full text-xs px-3 py-2 border border-[#E5E5E7] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="PROJECT_CLOSE">Đóng dự án (PROJECT_CLOSE)</option>
              <option value="WORKFLOW_CONFIG_CHANGE">Đổi cấu hình Workflow (WORKFLOW_CONFIG_CHANGE)</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
              Lý do gửi yêu cầu <span className="text-[#E53E3E]">*</span>
            </label>
            <textarea
              data-testid="textarea-approval-reason"
              rows={4}
              required
              maxLength={1000}
              placeholder="Nhập lý do chi tiết cho yêu cầu phê duyệt này (1-1000 ký tự)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs p-3 border border-[#E5E5E7] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black"
            />
            <div className="flex justify-end text-[10px] text-[#9B9B9F] mt-0.5">
              {reason.length}/1000 ký tự
            </div>
          </div>

          {/* Payload if Workflow */}
          {type === 'WORKFLOW_CONFIG_CHANGE' && (
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                Cấu hình Workflow mới (JSON) <span className="text-[#E53E3E]">*</span>
              </label>
              <textarea
                data-testid="textarea-approval-payload"
                rows={5}
                required
                placeholder='{"statuses": [...], "transitions": [...]}'
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                className="w-full text-xs font-mono p-3 border border-[#E5E5E7] rounded-lg bg-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-black"
              />
              <p className="text-[11px] text-[#6B6B70] mt-1">
                Dán cấu hình workflow hợp lệ đã được kiểm tra tính nhất quán.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#6B6B70] hover:text-[#1A1A1A] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              data-testid="btn-submit-approval"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#1A1A1A] hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu duyệt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
