import React, { useState } from 'react';
import type { ApprovalRequest } from '../types';
import { ApprovalStatusBadge, ApprovalApplyBadge } from './ApprovalBadge';
import { ApprovalTimeline } from './ApprovalTimeline';
import { useApprovalStore } from '../store/approvalStore';
import { toast } from '../../../store/toastStore';
import { X, Check, AlertOctagon, Ban, FileText, FolderGit2, User, Calendar } from 'lucide-react';

interface DrawerProps {
  request: ApprovalRequest | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ApprovalDetailDrawer: React.FC<DrawerProps> = ({ request, onClose, onSuccess }) => {
  const { approveRequest, rejectRequest, cancelRequest, isSubmitting } = useApprovalStore();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectError, setRejectError] = useState('');

  const [approveComment, setApproveComment] = useState('');
  const [showApproveComment, setShowApproveComment] = useState(false);

  if (!request) return null;

  const isPending = request.status === 'PENDING';
  const canDecide = request.canIDecide && isPending;

  const handleApprove = async () => {
    try {
      await approveRequest(request.id, approveComment ? { comment: approveComment } : undefined);
      toast.success('Phê duyệt yêu cầu thành công!');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || err?.response?.data?.message || 'Phê duyệt thất bại');
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối (bắt buộc)');
      return;
    }
    try {
      await rejectRequest(request.id, rejectComment.trim());
      toast.success('Đã từ chối yêu cầu phê duyệt');
      setRejectModalOpen(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || err?.response?.data?.message || 'Từ chối thất bại');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu phê duyệt này?')) return;
    try {
      await cancelRequest(request.id);
      toast.success('Đã hủy yêu cầu phê duyệt');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || err?.response?.data?.message || 'Hủy yêu cầu thất bại');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex justify-end animate-fade-in">
      <div data-testid="approval-detail-drawer" className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-[#E5E5E7] animate-slide-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E7] flex items-center justify-between bg-[#F7F7F8]">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-base text-[#1A1A1A]">Yêu cầu #{request.id}</span>
            <div data-testid="approval-detail-status">
              <ApprovalStatusBadge status={request.status} />
            </div>
            <div data-testid="approval-detail-apply-status">
              <ApprovalApplyBadge status={request.applyStatus} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Card */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E7] text-xs">
            <div>
              <span className="text-[#6B6B70] flex items-center gap-1.5 mb-1">
                <FolderGit2 className="w-3.5 h-3.5" /> Dự án
              </span>
              <p className="font-semibold text-[#1A1A1A]">
                {request.project.name} ({request.project.key})
              </p>
            </div>
            <div>
              <span className="text-[#6B6B70] flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5" /> Loại yêu cầu
              </span>
              <p className="font-semibold text-[#1A1A1A]">
                {request.type === 'PROJECT_CLOSE' ? 'Đóng dự án' : 'Đổi cấu hình Workflow'}
              </p>
            </div>
            <div>
              <span className="text-[#6B6B70] flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5" /> Người gửi
              </span>
              <p className="font-medium text-[#1A1A1A]">
                {request.requester.fullName} ({request.requester.email})
              </p>
            </div>
            <div>
              <span className="text-[#6B6B70] flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5" /> Thời gian tạo
              </span>
              <p className="font-medium text-[#1A1A1A]">
                {new Date(request.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Reason Section */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B6B70] mb-2">
              Lý do gửi yêu cầu
            </h4>
            <div className="p-3.5 bg-white rounded-xl border border-[#E5E5E7] text-sm text-[#1A1A1A] whitespace-pre-wrap">
              {request.reason}
            </div>
          </div>

          {/* Payload Section if Workflow change */}
          {request.payload && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B6B70] mb-2">
                Dữ liệu cấu hình Workflow (JSON)
              </h4>
              <pre className="p-3 bg-[#1E293B] text-emerald-400 rounded-xl text-xs overflow-x-auto max-h-48 font-mono">
                {typeof request.payload === 'string'
                  ? request.payload
                  : JSON.stringify(request.payload, null, 2)}
              </pre>
            </div>
          )}

          {/* Timeline Section */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B6B70] mb-3">
              Tiến trình phê duyệt các cấp
            </h4>
            <ApprovalTimeline steps={request.steps} currentLevel={request.currentLevel} />
          </div>

          {/* Decision Box if canDecide */}
          {canDecide && (
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Bạn có quyền ra quyết định ở cấp này
              </h4>
              <div>
                <input
                  type="text"
                  data-testid="input-approve-comment"
                  placeholder="Ghi chú nhận xét (tùy chọn)..."
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#E5E5E7] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  data-testid="btn-approve-request"
                  disabled={isSubmitting}
                  onClick={handleApprove}
                  className="flex-1 py-2 px-4 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Phê duyệt
                </button>
                <button
                  type="button"
                  data-testid="btn-reject-request"
                  disabled={isSubmitting}
                  onClick={() => setRejectModalOpen(true)}
                  className="flex-1 py-2 px-4 bg-[#E53E3E] hover:bg-[#C53030] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <AlertOctagon className="w-4 h-4" /> Từ chối
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E5E5E7] bg-[#F7F7F8] flex items-center justify-between">
          {isPending ? (
            <button
              type="button"
              data-testid="btn-cancel-request"
              disabled={isSubmitting}
              onClick={handleCancel}
              className="text-xs text-[#E53E3E] hover:text-[#C53030] font-medium flex items-center gap-1 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" /> Hủy yêu cầu này
            </button>
          ) : (
            <span className="text-xs text-[#9B9B9F]">Quy trình đã kết thúc</span>
          )}
          <button
            type="button"
            data-testid="btn-close-drawer"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-[#E5E5E7] hover:bg-gray-50 text-xs font-medium rounded-lg text-[#1A1A1A] transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div data-testid="reject-approval-modal" className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-[#1A1A1A]">Lý do từ chối yêu cầu</h3>
            <p className="text-xs text-[#6B6B70]">
              Vui lòng nhập lý do từ chối để người gửi nắm được thông tin cần điều chỉnh:
            </p>
            <textarea
              data-testid="textarea-reject-comment"
              rows={3}
              className="w-full text-xs p-3 border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="Nhập lý do từ chối (bắt buộc)..."
              value={rejectComment}
              onChange={(e) => {
                setRejectComment(e.target.value);
                setRejectError('');
              }}
            />
            {rejectError && <p data-testid="reject-error-message" className="text-[11px] text-[#E53E3E]">{rejectError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[#6B6B70] hover:text-[#1A1A1A]"
              >
                Hủy
              </button>
              <button
                type="button"
                data-testid="btn-confirm-reject"
                disabled={isSubmitting}
                onClick={handleReject}
                className="px-4 py-1.5 bg-[#E53E3E] hover:bg-[#C53030] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
