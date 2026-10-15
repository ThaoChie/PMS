import React, { useState, useEffect } from 'react';
import type { ProjectInvitation } from '../../../types';
import InvitationCard from '../components/InvitationCard';
import { invitationService } from '../../../services/invitationService';
import { useProjectStore } from '../../../store/projectStore';

export default function Invitations() {
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function loadInvitations() {
    setLoading(true);
    setError(null);
    try {
      const res = await invitationService.getMyInvitations();
      const list = (res?.data || []).map((inv: any) => ({
        id: String(inv.id),
        projectId: String(inv.projectId),
        projectName: inv.projectName,
        projectKey: inv.projectKey,
        email: inv.email,
        role: (inv.role?.toLowerCase() || 'member') as any,
        inviterName: inv.inviterName,
        status: inv.status,
        expiresAt: inv.expiresAt,
      }));
      setInvitations(list);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách lời mời');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvitations();
  }, []);

  async function handleAccept(id: string) {
    setError(null);
    try {
      await invitationService.acceptInvitation(id);
      setSuccessMsg('Đã chấp nhận lời mời tham gia dự án thành công!');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadInvitations();
      // Refresh projects in store so new project is visible
      useProjectStore.getState().fetchProjects();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể chấp nhận lời mời');
    }
  }

  async function handleDecline(id: string) {
    setError(null);
    try {
      await invitationService.declineInvitation(id);
      setSuccessMsg('Đã từ chối lời mời.');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadInvitations();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể từ chối lời mời');
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Project Invitations</h1>
          <p className="text-sm text-[#6B6B70] mt-0.5">
            Các lời mời tham gia dự án đang chờ bạn phản hồi
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium">
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-xs text-[#6B6B70]">
            Đang tải danh sách lời mời…
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[#E5E5E7] rounded-xl text-xs text-[#6B6B70]">
            Bạn không có lời mời tham gia dự án nào đang chờ.
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((inv) => (
              <InvitationCard
                key={inv.id}
                invitation={inv}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
