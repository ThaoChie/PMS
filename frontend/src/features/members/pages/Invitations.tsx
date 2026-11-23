import React, { useState, useEffect, useCallback } from 'react';
import type { ProjectInvitation, Screen } from '../../../types';
import InvitationCard from '../components/InvitationCard';
import InvitationFeedbackBanner from '../../../components/common/InvitationFeedbackBanner';
import { invitationService } from '../../../services/invitationService';
import { useProjectStore } from '../../../store/projectStore';
import {
  buildInvitationActionFeedback,
  type InvitationActionFeedback,
} from '../../../utils/invitationStatus';

interface InvitationsProps {
  onNavigate?: (screen: Screen) => void;
}

function mapRawInvitation(inv: any): ProjectInvitation {
  return {
    id: String(inv.id),
    projectId: inv.projectId != null ? String(inv.projectId) : undefined,
    projectName: inv.projectName,
    projectKey: inv.projectKey,
    email: inv.email,
    role: (inv.role?.toLowerCase() || 'member') as ProjectInvitation['role'],
    inviterName: inv.inviterName,
    status: inv.status,
    expiresAt: inv.expiresAt,
  };
}

async function activateJoinedProject(projectId?: string, projectName?: string) {
  const updatedProjects = await useProjectStore.getState().fetchProjects();
  const target =
    updatedProjects.find(
      (p) =>
        (projectId && String(p.id) === String(projectId)) ||
        (projectName && p.name === projectName),
    ) || updatedProjects[0];

  if (target) {
    useProjectStore.getState().setCurrentProject(target);
  }
}

export default function Invitations({ onNavigate }: InvitationsProps = {}) {
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingState, setProcessingState] = useState<{
    id: string;
    action: 'accept' | 'decline';
  } | null>(null);
  const [feedback, setFeedback] = useState<InvitationActionFeedback | null>(null);

  const loadInvitations = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const res = await invitationService.getMyInvitations();
      const list = Array.isArray(res?.data) ? res.data.map(mapRawInvitation) : [];
      setInvitations(list);
    } catch (err: any) {
      if (!options?.silent) {
        setFeedback(
          buildInvitationActionFeedback({
            action: 'error',
            errorMessage:
              err?.response?.data?.message || err?.message || 'Không thể tải danh sách lời mời',
          }),
        );
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  async function handleAccept(id: string) {
    if (processingState) return;
    const acceptedInv = invitations.find((inv) => inv.id === id);
    setProcessingState({ id, action: 'accept' });
    setFeedback(null);
    try {
      await invitationService.acceptInvitation(id);
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
      await activateJoinedProject(acceptedInv?.projectId, acceptedInv?.projectName);
      setFeedback(
        buildInvitationActionFeedback({
          action: 'accepted',
          projectId: acceptedInv?.projectId,
          projectName: acceptedInv?.projectName,
        }),
      );
      await loadInvitations({ silent: true });
    } catch (err: any) {
      setFeedback(
        buildInvitationActionFeedback({
          action: 'error',
          errorMessage:
            err?.response?.data?.message || err?.message || 'Không thể chấp nhận lời mời',
        }),
      );
      await loadInvitations({ silent: true });
    } finally {
      setProcessingState(null);
    }
  }

  async function handleDecline(id: string) {
    if (processingState) return;
    const declinedInv = invitations.find((inv) => inv.id === id);
    setProcessingState({ id, action: 'decline' });
    setFeedback(null);
    try {
      await invitationService.declineInvitation(id);
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
      setFeedback(
        buildInvitationActionFeedback({
          action: 'declined',
          projectName: declinedInv?.projectName,
        }),
      );
      await loadInvitations({ silent: true });
    } catch (err: any) {
      setFeedback(
        buildInvitationActionFeedback({
          action: 'error',
          errorMessage: err?.response?.data?.message || err?.message || 'Không thể từ chối lời mời',
        }),
      );
      await loadInvitations({ silent: true });
    } finally {
      setProcessingState(null);
    }
  }

  async function handleOpenJoinedBoard() {
    if (!onNavigate) return;
    if (feedback?.projectId || feedback?.projectName) {
      await activateJoinedProject(feedback.projectId, feedback.projectName);
    }
    onNavigate('board');
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Lời mời tham gia dự án</h1>
          <p className="text-sm text-[#6B6B70] mt-0.5">
            Các lời mời tham gia dự án đang chờ bạn phản hồi
          </p>
        </div>

        {feedback && (
          <InvitationFeedbackBanner
            feedback={feedback}
            actionLabel="Vào bảng công việc ngay →"
            onOpenProject={onNavigate ? handleOpenJoinedBoard : undefined}
            onDismiss={() => setFeedback(null)}
          />
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
                processingAction={processingState?.id === inv.id ? processingState.action : null}
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
