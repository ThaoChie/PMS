import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, AlertCircle, ShieldAlert, Check, Loader2 } from 'lucide-react';
import type { Role, User, ProjectPermissions } from '../../../types';
import MemberTable from '../components/MemberTable';
import InviteMemberPanel from '../components/InviteMemberPanel';
import { useProjectStore } from '../../../store/projectStore';
import { memberService } from '../../../services/memberService';
import { invitationService } from '../../../services/invitationService';
import { projectService } from '../../../services/projectService';

interface MembersProps {
  role: Role;
}

export default function Members({ role }: MembersProps) {
  const { currentProject, updateProject } = useProjectStore();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const [permissions, setPermissions] = useState<ProjectPermissions>({
    allowMemberDeleteIssue: currentProject?.allowMemberDeleteIssue ?? false,
    allowMemberDeleteSubtask: currentProject?.allowMemberDeleteSubtask ?? false,
    allowMemberConvertSubtask: currentProject?.allowMemberConvertSubtask ?? true,
    allowMemberManageCustomFields: currentProject?.allowMemberManageCustomFields ?? false,
  });
  const [savingPermission, setSavingPermission] = useState(false);
  const [savedPermission, setSavedPermission] = useState(false);

  useEffect(() => {
    if (currentProject) {
      setPermissions({
        allowMemberDeleteIssue: currentProject.allowMemberDeleteIssue ?? false,
        allowMemberDeleteSubtask: currentProject.allowMemberDeleteSubtask ?? false,
        allowMemberConvertSubtask: currentProject.allowMemberConvertSubtask ?? true,
        allowMemberManageCustomFields: currentProject.allowMemberManageCustomFields ?? false,
      });
    }
  }, [currentProject?.id]);

  const canManage = role === 'pm' || role === 'admin';

  async function handleTogglePermission(key: keyof ProjectPermissions, val: boolean) {
    if (!currentProject || !canManage) return;
    const nextPermissions: ProjectPermissions = { ...permissions, [key]: val };
    setPermissions(nextPermissions);
    setSavingPermission(true);
    try {
      const res = await projectService.updateProjectPermissions(currentProject.id, nextPermissions);
      if (res?.data) {
        updateProject(currentProject.id, nextPermissions);
      }
      setSavedPermission(true);
      setTimeout(() => setSavedPermission(false), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể cập nhật quyền hạn dự án');
      setPermissions(permissions);
    } finally {
      setSavingPermission(false);
    }
  }

  async function loadData() {
    if (!currentProject) return;
    setLoading(true);
    setError(null);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        memberService.getMembers(currentProject.id),
        invitationService.getInvitations(currentProject.id).catch(() => ({ data: [] })),
      ]);

      const activeUsers: User[] = (membersRes?.data || []).map((m: any) => {
        const name = m.fullName || m.email || 'Thành viên';
        return {
          id: String(m.userId),
          name,
          email: m.email,
          initials: name.slice(0, 2).toUpperCase(),
          role: (m.role?.toLowerCase() || 'member') as Role,
          status: 'Active' as const,
        };
      });

      const pendingUsers: User[] = (invitesRes?.data || [])
        .filter((inv: any) => inv.status === 'PENDING')
        .map((inv: any) => ({
          id: `inv-${inv.id}`,
          name: inv.email.split('@')[0],
          email: inv.email,
          initials: inv.email.slice(0, 2).toUpperCase(),
          role: (inv.role?.toLowerCase() || 'member') as Role,
          status: 'Pending' as const,
        }));

      setMembers([...activeUsers, ...pendingUsers]);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách thành viên');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentProject?.id]);

  async function handleInvite(email: string, inviteRole: Role) {
    if (!currentProject) return;
    setError(null);
    try {
      await invitationService.inviteMember(currentProject.id, email.trim(), inviteRole);
      setShowInvite(false);
      await loadData();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'USER_NOT_FOUND' || err?.response?.status === 422) {
        setError('Không tìm thấy người dùng với email này trong hệ thống.');
      } else if (code === 'MEMBER_ALREADY_EXISTS') {
        setError('Người dùng đã là thành viên của dự án.');
      } else if (code === 'PENDING_INVITATION_EXISTS') {
        setError('Đã có lời mời đang chờ xử lý gửi tới email này.');
      } else {
        setError(err?.response?.data?.message || err?.message || 'Không thể gửi lời mời.');
      }
    }
  }

  async function handleRemove() {
    if (!removeTarget || !currentProject) return;
    setError(null);
    try {
      await memberService.removeMember(currentProject.id, removeTarget.id);
      setRemoveTarget(null);
      setConfirmText('');
      await loadData();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'LAST_PM_REMOVAL' || err?.response?.status === 409) {
        setError('Không thể xoá Project Manager duy nhất trong dự án.');
      } else {
        setError(err?.response?.data?.message || err?.message || 'Không thể xoá thành viên.');
      }
    }
  }

  async function changeRole(userId: string, newRole: Role) {
    if (!currentProject) return;
    setError(null);
    try {
      await memberService.updateMemberRole(currentProject.id, userId, newRole);
      await loadData();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'LAST_PM_REMOVAL' || err?.response?.status === 409) {
        setError('Không thể hạ vai trò của Project Manager duy nhất trong dự án.');
      } else {
        setError(err?.response?.data?.message || err?.message || 'Không thể thay đổi vai trò.');
      }
    }
  }

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-sm text-[#6B6B70]">
        Chưa có dự án nào được chọn. Vui lòng chọn hoặc tạo dự án mới từ danh sách dự án.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Thành viên & Vai trò</h1>
            <p className="text-sm text-[#6B6B70] mt-0.5">
              {members.filter((m) => m.status === 'Active').length} thành viên đang hoạt động ·{' '}
              {members.filter((m) => m.status === 'Pending').length} lời mời đang chờ
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Mời thành viên
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Invite panel */}
        {showInvite && canManage && (
          <InviteMemberPanel
            onClose={() => setShowInvite(false)}
            onInvite={handleInvite}
          />
        )}

        {/* Members table */}
        {loading ? (
          <div className="p-8 text-center text-xs text-[#6B6B70]">
            Đang tải danh sách thành viên…
          </div>
        ) : (
          <MemberTable
            members={members}
            canManage={canManage}
            onChangeRole={changeRole}
            onRemoveMember={(m) => setRemoveTarget(m)}
          />
        )}

        {/* High-Impact Project Permissions (Phân quyền tác động lớn - GitHub style) */}
        <div className="mt-12 pt-8 border-t border-[#E5E5E7]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#1A1A1A]" />
                Quyền thao tác dự án (Project Permissions)
              </h2>
              <p className="text-xs text-[#6B6B70] mt-1">
                Cấu hình các quyền hạn có mức độ ảnh hưởng lớn đến dữ liệu dự án. Quản lý dự án (PM/Admin) luôn có toàn quyền thực hiện.
              </p>
            </div>
            {savedPermission && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                <Check className="w-3.5 h-3.5" /> Đã lưu quyền
              </span>
            )}
            {savingPermission && (
              <span className="flex items-center gap-1.5 text-xs text-[#6B6B70]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu…
              </span>
            )}
          </div>

          <div className="border border-[#E5E5E7] rounded-xl overflow-hidden bg-white divide-y divide-[#E5E5E7] shadow-sm">
            {/* Item 1: Allow delete issues */}
            <div className="p-4 flex items-start gap-3 hover:bg-[#F9FAFB] transition-colors">
              <input
                type="checkbox"
                id="perm-delete-issue"
                disabled={!canManage || savingPermission}
                checked={Boolean(permissions.allowMemberDeleteIssue)}
                onChange={(e) => handleTogglePermission('allowMemberDeleteIssue', e.target.checked)}
                className="mt-0.5 rounded border-[#C5C5C8] text-[#1A1A1A] focus:ring-0 disabled:opacity-50 cursor-pointer"
              />
              <div className="flex-1">
                <label
                  htmlFor="perm-delete-issue"
                  className={`text-xs font-semibold text-[#1A1A1A] block ${
                    canManage ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                >
                  Cho phép thành viên xóa công việc (Allow members to delete issues)
                </label>
                <p className="text-[11px] text-[#6B6B70] mt-0.5 leading-relaxed">
                  Khi bật, người tạo (Reporter) hoặc người thực hiện (Assignee) có thể xóa công việc vĩnh viễn khỏi dự án. Khi tắt, chỉ Quản lý dự án (PM/Admin) mới có quyền xóa.
                </p>
              </div>
            </div>

            {/* Item 2: Allow delete subtasks */}
            <div className="p-4 flex items-start gap-3 hover:bg-[#F9FAFB] transition-colors">
              <input
                type="checkbox"
                id="perm-delete-subtask"
                disabled={!canManage || savingPermission}
                checked={Boolean(permissions.allowMemberDeleteSubtask)}
                onChange={(e) => handleTogglePermission('allowMemberDeleteSubtask', e.target.checked)}
                className="mt-0.5 rounded border-[#C5C5C8] text-[#1A1A1A] focus:ring-0 disabled:opacity-50 cursor-pointer"
              />
              <div className="flex-1">
                <label
                  htmlFor="perm-delete-subtask"
                  className={`text-xs font-semibold text-[#1A1A1A] block ${
                    canManage ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                >
                  Cho phép thành viên xóa công việc con (Allow members to delete subtasks)
                </label>
                <p className="text-[11px] text-[#6B6B70] mt-0.5 leading-relaxed">
                  Khi bật, thành viên có thể xóa các công việc con (subtask) khỏi công việc cha. Khi tắt, chỉ Quản lý dự án (PM/Admin) mới có thể xóa subtask.
                </p>
              </div>
            </div>

            {/* Item 3: Allow convert to subtask */}
            <div className="p-4 flex items-start gap-3 hover:bg-[#F9FAFB] transition-colors">
              <input
                type="checkbox"
                id="perm-convert-subtask"
                disabled={!canManage || savingPermission}
                checked={Boolean(permissions.allowMemberConvertSubtask)}
                onChange={(e) => handleTogglePermission('allowMemberConvertSubtask', e.target.checked)}
                className="mt-0.5 rounded border-[#C5C5C8] text-[#1A1A1A] focus:ring-0 disabled:opacity-50 cursor-pointer"
              />
              <div className="flex-1">
                <label
                  htmlFor="perm-convert-subtask"
                  className={`text-xs font-semibold text-[#1A1A1A] block ${
                    canManage ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                >
                  Cho phép thành viên chuyển đổi công việc thành subtask (Allow convert to subtask)
                </label>
                <p className="text-[11px] text-[#6B6B70] mt-0.5 leading-relaxed">
                  Cho phép thành viên thay đổi loại công việc và chuyển thành subtask lồng dưới một công việc khác.
                </p>
              </div>
            </div>

            {/* Item 4: Allow manage custom fields */}
            <div className="p-4 flex items-start gap-3 hover:bg-[#F9FAFB] transition-colors">
              <input
                type="checkbox"
                id="perm-manage-cf"
                disabled={!canManage || savingPermission}
                checked={Boolean(permissions.allowMemberManageCustomFields)}
                onChange={(e) => handleTogglePermission('allowMemberManageCustomFields', e.target.checked)}
                className="mt-0.5 rounded border-[#C5C5C8] text-[#1A1A1A] focus:ring-0 disabled:opacity-50 cursor-pointer"
              />
              <div className="flex-1">
                <label
                  htmlFor="perm-manage-cf"
                  className={`text-xs font-semibold text-[#1A1A1A] block ${
                    canManage ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                >
                  Cho phép thành viên tạo & quản lý trường tùy chỉnh (Allow manage custom fields)
                </label>
                <p className="text-[11px] text-[#6B6B70] mt-0.5 leading-relaxed">
                  Cho phép thành viên dự án tạo mới, chỉnh sửa và xóa các trường thông tin tùy chỉnh trong dự án.
                </p>
              </div>
            </div>
          </div>

          {!canManage && (
            <p className="text-[11px] text-[#9B9B9F] mt-2.5 italic">
              * Bạn đang truy cập với vai trò thành viên thông thường. Chỉ Quản lý dự án (PM/Admin) mới có quyền thay đổi các cài đặt này.
            </p>
          )}
        </div>
      </div>

      {/* Remove confirm dialog */}
      {removeTarget && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 modal-backdrop"
          onClick={() => {
            setRemoveTarget(null);
            setConfirmText('');
          }}
        >
          <div
            className="bg-white border border-[#E5E5E7] rounded-xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#FDECEC] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-[#E53E3E]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Xóa thành viên khỏi dự án</h3>
                <p className="text-xs text-[#6B6B70] mt-0.5">
                  Thao tác này sẽ hủy quyền truy cập của{' '}
                  <strong className="text-[#1A1A1A]">{removeTarget.name}</strong> vào dự án ngay
                  lập tức.
                </p>
              </div>
            </div>
            <p className="text-xs text-[#6B6B70] mb-3">Nhập lại chính xác tên thành viên để xác nhận:</p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={removeTarget.name}
              className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#E53E3E] transition-colors mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setRemoveTarget(null);
                  setConfirmText('');
                }}
                className="px-4 py-2 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8] transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={confirmText !== removeTarget.name}
                onClick={handleRemove}
                className="px-4 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
