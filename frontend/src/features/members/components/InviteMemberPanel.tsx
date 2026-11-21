import React, { useState } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import type { Role } from '../../../types';

const ROLE_OPTIONS: Role[] = ['pm', 'developer', 'qa', 'member'];
const ROLE_LABELS: Record<Role, string> = {
  pm: 'Quản lý dự án (PM)',
  developer: 'Lập trình viên (Developer)',
  qa: 'Kiểm thử viên (QA)',
  member: 'Thành viên',
  admin: 'Quản trị viên',
  viewer: 'Người xem',
};

interface InviteMemberPanelProps {
  onClose: () => void;
  onInvite: (email: string, role: Role) => Promise<boolean> | boolean;
  submitting?: boolean;
}

export default function InviteMemberPanel({
  onClose,
  onInvite,
  submitting = false,
}: InviteMemberPanelProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('member');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !inviteEmail.trim()) return;
    const ok = await onInvite(inviteEmail.trim(), inviteRole);
    if (ok) {
      setInviteEmail('');
    }
  }

  return (
    <div className="border border-[#E5E5E7] rounded-xl p-5 mb-6 bg-[#F7F7F8]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Mời thành viên vào dự án</h3>
        <button
          type="button"
          aria-label="Đóng khung mời thành viên"
          onClick={onClose}
          disabled={submitting}
          className="text-[#9B9B9F] hover:text-[#1A1A1A] disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label
            htmlFor="invite-member-email"
            className="block text-xs font-medium text-[#1A1A1A] mb-1.5"
          >
            Địa chỉ email <span className="text-[#E53E3E] font-bold">*</span>
          </label>
          <input
            id="invite-member-email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="dongnghiep@company.com"
            disabled={submitting}
            className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] placeholder:text-[#9B9B9F] focus:outline-none focus:border-[#1A1A1A] bg-white disabled:opacity-60 transition-colors"
            required
          />
        </div>
        <div>
          <label
            htmlFor="invite-member-role"
            className="block text-xs font-medium text-[#1A1A1A] mb-1.5"
          >
            Vai trò trong dự án <span className="text-[#E53E3E] font-bold">*</span>
          </label>
          <select
            id="invite-member-role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Role)}
            disabled={submitting}
            className="px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] bg-white appearance-none disabled:opacity-60 transition-colors"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting || !inviteEmail.trim()}
          className="px-4 py-2.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang gửi…
            </>
          ) : (
            <>
              <Mail className="w-3.5 h-3.5" /> Gửi lời mời
            </>
          )}
        </button>
      </form>
    </div>
  );
}
