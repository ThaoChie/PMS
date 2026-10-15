import React from 'react';
import type { Role, User, MemberStatus } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';

const ROLE_OPTIONS: Role[] = ['pm', 'developer', 'qa', 'member'];
const ROLE_LABELS: Record<Role, string> = {
  pm: 'Project Manager',
  developer: 'Developer',
  qa: 'QA Engineer',
  member: 'Member',
  admin: 'Admin',
  viewer: 'Viewer',
};
const STATUS_BADGE: Record<MemberStatus, string> = {
  Active: 'text-[#1A1A1A] bg-[#F7F7F8] border-[#E5E5E7]',
  Pending: 'text-[#9B9B9F] bg-[#F7F7F8] border-[#E5E5E7]',
};

interface MemberTableProps {
  members: User[];
  canManage: boolean;
  onChangeRole: (id: string, newRole: Role) => void;
  onRemoveMember: (member: User) => void;
}

export default function MemberTable({
  members,
  canManage,
  onChangeRole,
  onRemoveMember,
}: MemberTableProps) {
  return (
    <div className="border border-[#E5E5E7] rounded-xl overflow-hidden bg-white">
      <table className="w-full">
        <thead className="bg-[#F7F7F8] border-b border-[#E5E5E7]">
          <tr>
            <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
              Member
            </th>
            <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
              Email
            </th>
            <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
              Role
            </th>
            <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
              Status
            </th>
            {canManage && <th className="px-5 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0F0F1]">
          {members.map((member) => (
            <tr key={member.id} className="hover:bg-[#FAFAFA] transition-colors">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <UserAvatar initials={member.initials} size="sm" />
                  <span className="text-sm font-medium text-[#1A1A1A]">{member.name}</span>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <span className="text-xs text-[#6B6B70]">{member.email}</span>
              </td>
              <td className="px-5 py-3.5">
                {canManage && member.status === 'Active' ? (
                  <select
                    value={member.role}
                    onChange={(e) => onChangeRole(member.id, e.target.value as Role)}
                    className="text-xs text-[#1A1A1A] border border-[#E5E5E7] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#1A1A1A] bg-white appearance-none transition-colors"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-[#6B6B70] capitalize">
                    {ROLE_LABELS[member.role]}
                  </span>
                )}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      STATUS_BADGE[member.status]
                    }`}
                  >
                    {member.status}
                  </span>
                </div>
              </td>
              {canManage && (
                <td className="px-5 py-3.5 text-right">
                  {member.status === 'Active' && (
                    <button
                      type="button"
                      onClick={() => onRemoveMember(member)}
                      className="text-xs text-[#9B9B9F] hover:text-[#E53E3E] transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
