import React, { useState, useEffect, useCallback } from 'react';
import {
  Check,
  Mail,
  ArrowRight,
  CheckCircle2,
  Ban,
  Info,
  X,
} from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { invitationService } from '../../services/invitationService';
import type { Notification, NotificationType, Screen, ProjectInvitation } from '../../types';
import { NotificationItem } from './NotificationItem';
import InvitationFeedbackBanner from '../../components/common/InvitationFeedbackBanner';
import { useNow } from '../../hooks/useNow';
import {
  resolveNotificationInviteStatus,
  buildDeepLinkInviteBanner,
  normalizeInvitationStatus,
  buildInvitationActionFeedback,
  type InviteCardState,
  type DeepLinkInviteBanner,
  type InvitationActionFeedback,
} from '../../utils/invitationStatus';
import {
  resolveNotificationTarget,
  executeNotificationNavigation,
} from '../../utils/notificationNavigation';

const TYPE_LABELS: Record<NotificationType, string> = {
  mention: 'Nhắc đến',
  assignment: 'Phân công',
  workflow: 'Quy trình',
  approval: 'Phê duyệt',
  invite: 'Lời mời',
};

const FILTERS = ['all', 'mention', 'assignment', 'approval', 'workflow', 'invite'] as const;

interface NotificationCenterProps {
  onNavigate?: (screen: Screen) => void;
}

async function resolveDeepLinkBannerForId(
  invitationId: string,
  invitationsMap: Record<string, ProjectInvitation>,
  currentUserEmail?: string,
): Promise<DeepLinkInviteBanner | null> {
  const matched = invitationsMap[String(invitationId)];
  if (matched) {
    return buildDeepLinkInviteBanner({ invitation: matched, currentUserEmail });
  }
  if (!/^\d+$/.test(invitationId)) {
    return null;
  }
  try {
    const singleRes = await invitationService.getInvitationById(invitationId);
    return buildDeepLinkInviteBanner({
      invitation: singleRes?.data ?? null,
      currentUserEmail,
    });
  } catch (err: any) {
    return buildDeepLinkInviteBanner({
      errorCode: err?.code || err?.response?.data?.code,
      httpStatus: err?.response?.status,
      currentUserEmail,
    });
  }
}

export default function NotificationCenter({ onNavigate }: NotificationCenterProps) {
  const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead } =
    useNotificationStore();
  const currentUser = useAuthStore((s) => s.user);
  // Vẽ lại mỗi 30 giây để nhãn "x phút trước" tự cập nhật mà không cần tải lại
  const now = useNow(30000);

  const [activeFilter, setActiveFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'invite' || params.get('invitation')) {
        return 'invite';
      }
    }
    return 'all';
  });
  const [targetInvitationId, setTargetInvitationId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('invitation');
    }
    return null;
  });

  const [pendingInvitations, setPendingInvitations] = useState<ProjectInvitation[]>([]);
  const [invitationsById, setInvitationsById] = useState<Record<string, ProjectInvitation>>({});
  const [deepLinkBanner, setDeepLinkBanner] = useState<DeepLinkInviteBanner | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [acceptedInviteNotifIds, setAcceptedInviteNotifIds] = useState<Set<string>>(new Set());
  const [declinedInviteNotifIds, setDeclinedInviteNotifIds] = useState<Set<string>>(new Set());
  const [statusFeedback, setStatusFeedback] = useState<InvitationActionFeedback | null>(null);

  const activateAndOpenProject = useCallback(
    async (projectId?: string, projectName?: string) => {
      if (!onNavigate) return;
      if (projectId || projectName) {
        const updatedProjects = await useProjectStore.getState().fetchProjects();
        const target = updatedProjects.find(
          (p) =>
            (projectId && String(p.id) === String(projectId)) ||
            (projectName && p.name === projectName),
        );
        if (target) {
          useProjectStore.getState().setCurrentProject(target);
        }
      }
      onNavigate('board');
    },
    [onNavigate],
  );

  const loadInvitationsData = useCallback(async () => {
    try {
      const res = await invitationService.getMyInvitations(true);
      const rawList = Array.isArray(res?.data) ? res.data : [];
      const map: Record<string, ProjectInvitation> = {};
      const pending: ProjectInvitation[] = [];

      for (const inv of rawList) {
        const key = String(inv.id);
        map[key] = inv;
        if (normalizeInvitationStatus(inv) === 'PENDING') {
          pending.push(inv);
        }
      }

      setInvitationsById(map);
      setPendingInvitations(pending);

      if (targetInvitationId) {
        const banner = await resolveDeepLinkBannerForId(
          targetInvitationId,
          map,
          currentUser?.email,
        );
        setDeepLinkBanner(banner);
      }
    } catch {
      // ignore background fetch errors
    }
  }, [targetInvitationId, currentUser?.email]);

  useEffect(() => {
    fetchNotifications(activeFilter === 'all' ? undefined : activeFilter);
    loadInvitationsData();
  }, [activeFilter, fetchNotifications, loadInvitationsData]);

  const handleAcceptInvite = async (
    invitationId: string,
    notifId: string,
    fallbackProjectName?: string,
  ) => {
    if (actionLoadingId) return;
    setActionLoadingId(notifId);
    setStatusFeedback(null);
    try {
      const targetInv = invitationsById[String(invitationId)];
      const projName = fallbackProjectName || targetInv?.projectName;
      await invitationService.acceptInvitation(invitationId);
      await markAsRead(notifId);
      setAcceptedInviteNotifIds((prev) => new Set(prev).add(notifId));

      const updatedProjects = await useProjectStore.getState().fetchProjects();
      const joinedProj =
        updatedProjects.find(
          (p) =>
            (targetInv?.projectId && String(p.id) === String(targetInv.projectId)) ||
            (projName && p.name === projName),
        ) || updatedProjects[0];

      if (joinedProj) {
        useProjectStore.getState().setCurrentProject(joinedProj);
      }

      await loadInvitationsData();
      setStatusFeedback(
        buildInvitationActionFeedback({
          action: 'accepted',
          projectId: targetInv?.projectId,
          projectName: projName,
        }),
      );
    } catch (err: any) {
      await loadInvitationsData();
      setStatusFeedback(
        buildInvitationActionFeedback({
          action: 'error',
          errorMessage:
            err?.response?.data?.message ||
            err?.message ||
            'Không thể chấp nhận lời mời. Vui lòng thử lại.',
        }),
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineInvite = async (invitationId: string, notifId: string) => {
    if (actionLoadingId) return;
    setActionLoadingId(notifId);
    setStatusFeedback(null);
    const targetInv = invitationsById[String(invitationId)];
    try {
      await invitationService.declineInvitation(invitationId);
      await markAsRead(notifId);
      setDeclinedInviteNotifIds((prev) => new Set(prev).add(notifId));
      await loadInvitationsData();
      setStatusFeedback(
        buildInvitationActionFeedback({
          action: 'declined',
          projectName: targetInv?.projectName,
        }),
      );
    } catch (err: any) {
      await loadInvitationsData();
      setStatusFeedback(
        buildInvitationActionFeedback({
          action: 'error',
          errorMessage:
            err?.response?.data?.message || err?.message || 'Không thể từ chối lời mời.',
        }),
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleNotificationCardClick = useCallback(
    (n: Notification, cardInviteState: InviteCardState) => {
      markAsRead(n.id);
      if (cardInviteState === 'NONE') {
        const target = resolveNotificationTarget(n, 'center');
        void executeNotificationNavigation(target, onNavigate);
      }
    },
    [markAsRead, onNavigate],
  );

  const filtered =
    activeFilter === 'all'
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">Trung tâm thông báo</h1>
            {unreadCount > 0 ? (
              <p className="text-xs sm:text-sm text-[#6B6B70] mt-0.5">{unreadCount} thông báo chưa đọc</p>
            ) : (
              <p className="text-xs sm:text-sm text-[#9B9B9F] mt-0.5">Bạn đã xem hết các thông báo</p>
            )}
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 text-xs sm:text-sm text-[#6B6B70] hover:text-[#1A1A1A] border border-[#E5E5E7] rounded-lg px-3.5 py-2.5 min-h-[44px] hover:bg-[#F7F7F8] transition-colors"
              >
                <Check className="w-4 h-4" /> Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>
        </div>

        {/* Feedback message banner */}
        {statusFeedback && (
          <InvitationFeedbackBanner
            feedback={statusFeedback}
            actionLabel="Vào dự án ngay →"
            className="mb-6 p-4"
            onOpenProject={
              onNavigate
                ? () => activateAndOpenProject(statusFeedback.projectId, statusFeedback.projectName)
                : undefined
            }
            onDismiss={() => setStatusFeedback(null)}
          />
        )}

        {/* Deep-link invitation contextual banner (?tab=invite&invitation={id}) */}
        {deepLinkBanner && !statusFeedback && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs flex items-start justify-between gap-3 ${
              deepLinkBanner.tone === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : deepLinkBanner.tone === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-[#F7F7F8] border-[#E5E5E7] text-[#1A1A1A]'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {deepLinkBanner.tone === 'warning' ? (
                <Ban className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              ) : deepLinkBanner.tone === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-[#6B6B70] shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{deepLinkBanner.title}</p>
                <p
                  className={`text-[11px] mt-0.5 leading-relaxed ${
                    deepLinkBanner.tone === 'warning'
                      ? 'text-amber-800'
                      : deepLinkBanner.tone === 'success'
                      ? 'text-emerald-800'
                      : 'text-[#6B6B70]'
                  }`}
                >
                  {deepLinkBanner.description}
                </p>
                {deepLinkBanner.tone === 'success' && onNavigate && (
                  <button
                    type="button"
                    onClick={() =>
                      activateAndOpenProject(deepLinkBanner.projectId, deepLinkBanner.projectName)
                    }
                    className="mt-2 px-3 py-1 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 font-medium inline-flex items-center gap-1"
                  >
                    Vào dự án ngay →
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              aria-label="Đóng thông báo trạng thái lời mời"
              onClick={() => {
                setDeepLinkBanner(null);
                setTargetInvitationId(null);
              }}
              className="text-[#6B6B70] hover:text-[#1A1A1A] p-1 rounded-md shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Pending invitations callout banner */}
        {pendingInvitations.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-xs space-y-3">
            <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5 sm:mt-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-900">
                    Bạn có {pendingInvitations.length} lời mời tham gia dự án đang chờ phản hồi
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Hãy chấp nhận để bắt đầu làm việc cùng nhóm
                  </p>
                </div>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('invitations')}
                  className="text-xs text-amber-800 hover:text-amber-950 font-medium underline inline-flex items-center gap-1"
                >
                  Mở trang Lời mời <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-2 pt-1 border-t border-amber-200/60">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white/80 rounded-lg border border-amber-200"
                >
                  <div>
                    <span className="text-xs font-semibold text-[#1A1A1A]">
                      {inv.projectName || 'Dự án'}
                    </span>
                    <span className="text-[11px] text-[#6B6B70] ml-2">
                      Vai trò: <strong className="text-amber-800">{inv.role || 'MEMBER'}</strong>
                    </span>
                    {inv.inviterName && (
                      <span className="text-[10px] text-[#9B9B9F] ml-2">
                        (từ {inv.inviterName})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={actionLoadingId === String(inv.id)}
                      onClick={() =>
                        handleAcceptInvite(String(inv.id), `inv-${inv.id}`, inv.projectName)
                      }
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Chấp nhận lời mời
                    </button>
                    <button
                      type="button"
                      disabled={actionLoadingId === String(inv.id)}
                      onClick={() => handleDeclineInvite(String(inv.id), `inv-${inv.id}`)}
                      className="px-2.5 py-1 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 mb-5 overflow-x-auto no-scrollbar whitespace-nowrap pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-medium transition-colors shrink-0 ${
                activeFilter === f
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#6B6B70] hover:bg-[#F7F7F8] hover:text-[#1A1A1A]'
              }`}
            >
              {f === 'all' ? 'Tất cả' : TYPE_LABELS[f as NotificationType]}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="border border-[#E5E5E7] rounded-xl overflow-hidden bg-white shadow-sm">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 mx-auto mb-3 text-[#E5E5E7]">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path
                    d="M24 6C15.163 6 8 13.163 8 22c0 5.052 2.356 9.551 6.04 12.484L12 42l7.516-2.04A15.915 15.915 0 0024 41c8.837 0 16-7.163 16-16S32.837 6 24 6z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-sm text-[#6B6B70]">Không có thông báo nào</p>
            </div>
          ) : (
            filtered.map((n, i) => {
              const cardInviteState = resolveNotificationInviteStatus(
                n,
                invitationsById,
                acceptedInviteNotifIds,
                declinedInviteNotifIds,
                now,
              );
              const rawSourceId = String(n.sourceId || (n as any).data || n.id);
              const matchedInv = invitationsById[rawSourceId];

              return (
                <div
                  key={n.id}
                  className={i !== filtered.length - 1 ? 'border-b border-[#E5E5E7]' : ''}
                >
                  <NotificationItem
                    notification={n}
                    onRead={() => handleNotificationCardClick(n, cardInviteState)}
                    inviteStatus={cardInviteState}
                    onAcceptInvite={
                      cardInviteState === 'PENDING'
                        ? () => handleAcceptInvite(rawSourceId, n.id, matchedInv?.projectName)
                        : undefined
                    }
                    onDeclineInvite={
                      cardInviteState === 'PENDING'
                        ? () => handleDeclineInvite(rawSourceId, n.id)
                        : undefined
                    }
                    onNavigateInvitations={onNavigate ? () => onNavigate('invitations') : undefined}
                    onOpenProject={
                      onNavigate
                        ? () => activateAndOpenProject(matchedInv?.projectId, matchedInv?.projectName)
                        : undefined
                    }
                    isActionLoading={actionLoadingId === n.id}
                    now={now}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
