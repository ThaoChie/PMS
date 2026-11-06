import React from 'react';
import type { ApprovalRequestStatus, ApprovalStepStatus, ApprovalApplyStatus } from '../types';

interface StatusBadgeProps {
  status: ApprovalRequestStatus | ApprovalStepStatus;
}

export const ApprovalStatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Đang chờ duyệt
        </span>
      );
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          ✓ Đã duyệt
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          ✕ Bị từ chối
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
          Đã hủy
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          Hết hạn
        </span>
      );
    case 'WAITING':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-500 border border-gray-200">
          Chờ cấp trước
        </span>
      );
    case 'SKIPPED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-50 text-zinc-400 border border-zinc-200">
          Bỏ qua
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          {status}
        </span>
      );
  }
};

interface ApplyBadgeProps {
  status: ApprovalApplyStatus;
}

export const ApprovalApplyBadge: React.FC<ApplyBadgeProps> = ({ status }) => {
  switch (status) {
    case 'APPLIED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          ★ Đã áp dụng
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          ⚠ Áp dụng lỗi
        </span>
      );
    case 'NOT_APPLIED':
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
          Chưa áp dụng
        </span>
      );
  }
};
