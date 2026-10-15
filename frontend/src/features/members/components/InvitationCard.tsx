import React from 'react';
import { Mail, Check, X } from 'lucide-react';
import type { ProjectInvitation } from '../../../types';

interface InvitationCardProps {
  invitation: ProjectInvitation;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

const ROLE_NAMES: Record<string, string> = {
  pm: 'Quản lý dự án (PM)',
  developer: 'Lập trình viên (Developer)',
  qa: 'Kiểm thử viên (QA)',
  member: 'Thành viên',
  admin: 'Quản trị viên',
  viewer: 'Người xem',
};

export default function InvitationCard({
  invitation,
  onAccept,
  onDecline,
}: InvitationCardProps) {
  const roleKey = (invitation.role || '').toLowerCase();
  const displayRole = ROLE_NAMES[roleKey] || invitation.role;

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-[#E5E5E7] rounded-xl hover:border-[#C5C5C8] transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#F7F7F8] border border-[#E5E5E7] flex items-center justify-center text-[#6B6B70]">
          <Mail className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#1A1A1A]">
            {invitation.projectName ? (
              <>
                Dự án <span className="text-[#C5221F] font-bold">{invitation.projectName}</span> ·{' '}
              </>
            ) : null}
            Vai trò: <span className="text-[#1E293B] font-medium">{displayRole}</span>
          </p>
          <p className="text-[11px] text-[#6B6B70] mt-0.5">
            Người gửi: {invitation.inviter?.name || invitation.inviterName || 'Quản trị viên'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDecline(invitation.id)}
          className="flex items-center gap-1 px-3 py-1.5 border border-[#E5E5E7] text-xs font-medium text-[#6B6B70] hover:text-[#E53E3E] rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Từ chối
        </button>
        <button
          type="button"
          onClick={() => onAccept(invitation.id)}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] transition-colors"
        >
          <Check className="w-3.5 h-3.5" /> Chấp nhận
        </button>
      </div>
    </div>
  );
}
