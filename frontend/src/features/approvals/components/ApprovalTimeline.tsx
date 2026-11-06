import React from 'react';
import type { ApprovalStep } from '../types';
import { ApprovalStatusBadge } from './ApprovalBadge';
import { UserCheck, ShieldCheck, Clock, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

interface TimelineProps {
  steps: ApprovalStep[];
  currentLevel?: number | null;
}

export const ApprovalTimeline: React.FC<TimelineProps> = ({ steps, currentLevel }) => {
  return (
    <div className="relative border-l-2 border-[#E5E5E7] ml-4 my-2 space-y-6">
      {steps.map((step) => {
        const isCurrent = currentLevel === step.level;
        const isLevel1 = step.level === 1;
        const isApproved = step.status === 'APPROVED';
        const isRejected = step.status === 'REJECTED';
        const isSkipped = step.status === 'SKIPPED';
        const isPending = step.status === 'PENDING';

        return (
          <div key={step.level} className="relative pl-6">
            {/* Step Icon Node */}
            <div
              className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                isApproved
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                  : isRejected
                  ? 'bg-rose-50 border-rose-500 text-rose-600'
                  : isSkipped
                  ? 'bg-zinc-100 border-zinc-300 text-zinc-400'
                  : isCurrent || isPending
                  ? 'bg-amber-50 border-amber-500 text-amber-600 ring-4 ring-amber-50'
                  : 'bg-white border-[#E5E5E7] text-[#9B9B9F]'
              }`}
            >
              {isApproved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isRejected ? (
                <XCircle className="w-4 h-4" />
              ) : isSkipped ? (
                <MinusCircle className="w-4 h-4" />
              ) : isCurrent || isPending ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : isLevel1 ? (
                <UserCheck className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>

            {/* Step Content Card */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-amber-50/30 border-amber-200 shadow-xs'
                  : 'bg-white border-[#E5E5E7]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                    {isLevel1 ? 'Cấp 1: Peer PM' : 'Cấp 2: Quản trị viên (Admin)'}
                  </span>
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white uppercase">
                      Đang chờ
                    </span>
                  )}
                </div>
                <ApprovalStatusBadge status={step.status} />
              </div>

              {step.decidedBy && (
                <div className="text-xs text-[#6B6B70] mt-1 flex items-center gap-1.5">
                  <span className="font-medium text-[#1A1A1A]">{step.decidedBy.fullName}</span>
                  <span className="text-[#9B9B9F]">({step.decidedBy.email})</span>
                  {step.decidedAt && (
                    <span className="text-[#9B9B9F]">• {new Date(step.decidedAt).toLocaleString('vi-VN')}</span>
                  )}
                </div>
              )}

              {step.comment && (
                <div className="mt-2 text-xs bg-[#F7F7F8] p-2.5 rounded-lg border border-[#E5E5E7] text-[#1A1A1A]">
                  <span className="font-medium text-[#6B6B70]">Ghi chú:</span> {step.comment}
                </div>
              )}

              {step.status === 'SKIPPED' && (
                <p className="text-[11px] text-[#9B9B9F] italic mt-1">
                  (Cấp này được tự động bỏ qua do không áp dụng hoặc người tạo là PM duy nhất)
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
