import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { InvitationActionFeedback } from '../../utils/invitationStatus';

interface InvitationFeedbackBannerProps {
  feedback: InvitationActionFeedback;
  actionLabel?: string;
  onOpenProject?: () => void;
  onDismiss: () => void;
  className?: string;
}

const TONE_STYLES: Record<InvitationActionFeedback['tone'], string> = {
  accepted: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  declined: 'bg-[#F7F7F8] border-[#E5E5E7] text-[#1A1A1A]',
};

export default function InvitationFeedbackBanner({
  feedback,
  actionLabel = 'Vào bảng công việc ngay →',
  onOpenProject,
  onDismiss,
  className = 'mb-4 p-3.5',
}: InvitationFeedbackBannerProps) {
  return (
    <div
      role={feedback.tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`${className} border rounded-xl text-xs font-medium flex items-center justify-between gap-3 ${TONE_STYLES[feedback.tone]}`}
    >
      <div className="flex items-center gap-2">
        {feedback.tone === 'accepted' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        ) : feedback.tone === 'error' ? (
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
        ) : (
          <Info className="w-4 h-4 text-[#6B6B70] shrink-0" />
        )}
        <span>{feedback.message}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {feedback.canNavigateToProject && onOpenProject && (
          <button
            type="button"
            onClick={onOpenProject}
            className="px-3 py-1 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors font-medium"
          >
            {actionLabel}
          </button>
        )}
        <button
          type="button"
          aria-label="Đóng thông báo"
          onClick={onDismiss}
          className="p-1 rounded-md text-[#6B6B70] hover:text-[#1A1A1A] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
