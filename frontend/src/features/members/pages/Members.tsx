import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, AlertCircle, ShieldAlert, Check, Loader2, Save, Mail, X } from 'lucide-react';
import type { Role, User, ProjectPermissions } from '../../../types';
import MemberTable from '../components/MemberTable';
import InviteMemberPanel from '../components/InviteMemberPanel';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { useProjectStore } from '../../../store/projectStore';
import { memberService } from '../../../services/memberService';
import { invitationService } from '../../../services/invitationService';
import { projectService } from '../../../services/projectService';
import { mailTestService, type MailTestResult } from '../../../services/mailTestService';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [testingMail, setTestingMail] = useState(false);
  const [mailTestResult, setMailTestResult] = useState<MailTestResult | null>(null);
  const [showMailTestModal, setShowMailTestModal] = useState(false);

  async function handleTestMail() {
    setTestingMail(true);
    setShowMailTestModal(true);
    setMailTestResult(null);
    try {
      const res = await mailTestService.testMail();
      setMailTestResult(res);
    } catch (err: any) {
      setMailTestResult({
        success: false,
        errorMessage: err?.message || 'Không thể gửi yêu cầu kiểm tra email',
        diagnosticHint: 'Hãy kiểm tra xem backend Render có đang chạy không.',
      });
    } finally {
      setTestingMail(false);
    }
  }

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

  const hasChanges = Boolean(
    currentProject && (
      permissions.allowMemberDeleteIssue !== (currentProject.allowMemberDeleteIssue ?? false) ||
      permissions.allowMemberDeleteSubtask !== (currentProject.allowMemberDeleteSubtask ?? false) ||
      permissions.allowMemberConvertSubtask !== (currentProject.allowMemberConvertSubtask ?? true) ||
      permissions.allowMemberManageCustomFields !== (currentProject.allowMemberManageCustomFields ?? false)
    )
  );

  function handleTogglePermission(key: keyof ProjectPermissions, val: boolean) {
    if (!canManage) return;
    setPermissions((prev) => ({ ...prev, [key]: val }));
  }

  function handleCancelPermissions() {
    if (currentProject) {
      setPermissions({
        allowMemberDeleteIssue: currentProject.allowMemberDeleteIssue ?? false,
        allowMemberDeleteSubtask: currentProject.allowMemberDeleteSubtask ?? false,
        allowMemberConvertSubtask: currentProject.allowMemberConvertSubtask ?? true,
        allowMemberManageCustomFields: currentProject.allowMemberManageCustomFields ?? false,
      });
    }
    setShowConfirmModal(false);
  }

  async function handleConfirmSave() {
    if (!currentProject || !canManage) return;
    setSavingPermission(true);
    setError(null);
    try {
      const res = await projectService.updateProjectPermissions(currentProject.id, permissions);
      if (res?.data) {
        updateProject(currentProject.id, permissions);
      }
      setShowConfirmModal(false);
      setToastMessage('Lưu quyền thành công');
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể cập nhật quyền hạn dự án');
      handleCancelPermissions();
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
      setToastMessage(`Đã gửi lời mời tham gia dự án tới email ${email.trim()}`);
      setTimeout(() => setToastMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'MEMBER_ALREADY_EXISTS') {
        setError('Người dùng đã là thành viên của dự án.');
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
        setRemoveTarget(null);
        setConfirmText('');
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestMail}
                disabled={testingMail}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E5E5E7] text-[#1A1A1A] hover:bg-[#F7F7F8] text-xs font-medium rounded-lg transition-colors"
                title="Kiểm tra hệ thống gửi email trên production"
              >
                {testingMail ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E53E3E]" /> : <Mail className="w-3.5 h-3.5 text-[#6B6B70]" />}
                Kiểm tra Email
              </button>
              <button
                type="button"
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Mời thành viên
              </button>
            </div>
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
            {canManage && (
              <div className="flex items-center gap-2 shrink-0">
                {hasChanges && (
                  <button
                    type="button"
                    onClick={handleCancelPermissions}
                    disabled={savingPermission}
                    className="px-3 py-1.5 text-xs text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#F0F0F1] rounded-lg transition-colors font-medium"
                  >
                    Hủy
                  </button>
                )}
                <button
                  type="button"
                  disabled={!hasChanges || savingPermission}
                  onClick={() => setShowConfirmModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1A1A1A] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  {savingPermission ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu…</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu</span>
                    </>
                  )}
                </button>
              </div>
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

      {/* Permission Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Xác nhận cập nhật quyền dự án"
        message="Bạn có chắc chắn muốn lưu các thay đổi về quyền thao tác dự án? Các thiết lập này sẽ có hiệu lực ngay lập tức đối với tất cả thành viên trong dự án."
        confirmLabel="Xác nhận"
        cancelLabel="Hủy"
        isDanger={false}
        onConfirm={handleConfirmSave}
        onCancel={handleCancelPermissions}
      />

      {/* Mail Test Diagnostics Modal */}
      {showMailTestModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 modal-backdrop"
          onClick={() => setShowMailTestModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E5E7] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-[#E53E3E] flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1A1A1A]">Kiểm tra hệ thống gửi Email</h3>
                  <p className="text-[11px] text-[#6B6B70]">Chẩn đoán kết nối gửi email trên môi trường Production</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMailTestModal(false)}
                className="text-[#6B6B70] hover:text-[#1A1A1A] p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {testingMail ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="w-8 h-8 text-[#E53E3E] animate-spin" />
                <p className="text-xs font-medium text-[#1A1A1A]">Đang thử nghiệm gửi email qua máy chủ...</p>
                <p className="text-[11px] text-[#6B6B70] max-w-xs">
                  Hệ thống đang thử các kênh: Brevo HTTPS API (cổng 443) và SMTP (587/465).
                </p>
              </div>
            ) : mailTestResult ? (
              <div className="space-y-4">
                {mailTestResult.success ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{mailTestResult.message || 'Gửi email thành công!'}</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Một email thử nghiệm đã được gửi đến: <b>{mailTestResult.testedRecipient}</b>. Hãy kiểm tra hộp thư đến (hoặc thư mục Spam).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Gửi email thất bại</p>
                        <p className="text-[11px] text-red-700 font-mono mt-1 break-all">
                          {mailTestResult.errorMessage || 'Lỗi không xác định'}
                        </p>
                      </div>
                    </div>
                    {mailTestResult.diagnosticHint && (
                      <div className="pt-2 border-t border-red-200/60 text-[11px] text-red-900 bg-white/50 p-2 rounded">
                        <b>Hướng dẫn khắc phục:</b> {mailTestResult.diagnosticHint}
                      </div>
                    )}
                  </div>
                )}

                {mailTestResult.config && (
                  <div className="p-3 bg-[#F7F7F8] border border-[#E5E5E7] rounded-lg text-xs space-y-1.5 font-mono text-[11px]">
                    <div className="font-sans font-semibold text-[#1A1A1A] pb-1 border-b border-[#E5E5E7]">
                      Thông số nạp trên máy chủ:
                    </div>
                    <div>Host: {mailTestResult.config.host || 'smtp.gmail.com'}</div>
                    <div>Port: {mailTestResult.config.port || 587}</div>
                    <div>Username: {mailTestResult.config.username || '(chưa nạp)'}</div>
                    <div>Brevo API Key: {mailTestResult.config.hasBrevoApiKey ? '✅ Đã cấu hình (HTTPS 443)' : '❌ Chưa cấu hình'}</div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleTestMail}
                    className="px-3.5 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] transition-colors"
                  >
                    Thử gửi lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMailTestModal(false)}
                    className="px-3.5 py-2 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8] transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#1A1A1A] text-white text-xs font-medium rounded-xl shadow-2xl border border-white/10 toast-enter">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
