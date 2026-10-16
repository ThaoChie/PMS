import React, { useState, useEffect } from 'react';
import { Check, RefreshCw, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { useProjectStore } from '../../store/projectStore';
import { invitationService } from '../../services/invitationService';
import type { NotificationType, Screen, ProjectInvitation } from '../../types';
import { NotificationItem } from './NotificationItem';

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

export default function NotificationCenter({ onNavigate }: NotificationCenterProps) {
  const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [pendingInvitations, setPendingInvitations] = useState<ProjectInvitation[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [acceptedInviteNotifIds, setAcceptedInviteNotifIds] = useState<Set<string>>(new Set());
  const [declinedInviteNotifIds, setDeclinedInviteNotifIds] = useState<Set<string>>(new Set());
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadPendingInvitations = async () => {
    try {
      const res = await invitationService.getMyInvitations();
      const list = res?.data || [];
      setPendingInvitations(Array.isArray(list) ? list : []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications(activeFilter === 'all' ? undefined : activeFilter);
    loadPendingInvitations();
  }, [activeFilter, fetchNotifications]);

  const handleAcceptInvite = async (invitationId: string, notifId: string, fallbackProjectName?: string) => {
    setActionLoadingId(notifId);
    setStatusFeedback(null);
    try {
      await invitationService.acceptInvitation(invitationId);
      await markAsRead(notifId);
      setAcceptedInviteNotifIds((prev) => new Set(prev).add(notifId));

      // Fetch projects so the newly joined project becomes active immediately
      const updatedProjects = await useProjectStore.getState().fetchProjects();
      const joinedProj = updatedProjects.find(
        (p) => String(p.id) === String(invitationId) || (fallbackProjectName && p.name === fallbackProjectName),
      ) || updatedProjects[0];

      if (joinedProj) {
        useProjectStore.getState().setCurrentProject(joinedProj);
      }

      await loadPendingInvitations();
      setStatusFeedback({
        type: 'success',
        message: `Đã chấp nhận lời mời tham gia dự án "${fallbackProjectName || 'mới'}" thành công! Dự án đã được kích hoạt.`,
      });
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Không thể chấp nhận lời mời. Vui lòng thử lại.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineInvite = async (invitationId: string, notifId: string) => {
    setActionLoadingId(notifId);
    setStatusFeedback(null);
    try {
      await invitationService.declineInvitation(invitationId);
      await markAsRead(notifId);
      setDeclinedInviteNotifIds((prev) => new Set(prev).add(notifId));
      await loadPendingInvitations();
      setStatusFeedback({
        type: 'success',
        message: 'Đã từ chối lời mời tham gia dự án.',
      });
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Không thể từ chối lời mời.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = activeFilter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === activeFilter);

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Trung tâm thông báo</h1>
            {unreadCount > 0 ? (
              <p className="text-xs text-[#6B6B70] mt-0.5">{unreadCount} thông báo chưa đọc</p>
            ) : (
              <p className="text-xs text-[#9B9B9F] mt-0.5">Bạn đã xem hết các thông báo</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                fetchNotifications(activeFilter === 'all' ? undefined : activeFilter);
                loadPendingInvitations();
              }}
              className="p-1.5 border border-[#E5E5E7] text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8]"
              title="Làm mới"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 text-xs text-[#6B6B70] hover:text-[#1A1A1A] border border-[#E5E5E7] rounded-lg px-3 py-1.5 hover:bg-[#F7F7F8] transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>
        </div>

        {/* Feedback message banner */}
        {statusFeedback && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 ${
              statusFeedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{statusFeedback.message}</span>
            </div>
            {statusFeedback.type === 'success' && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('board')}
                className="px-3 py-1 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 shrink-0 font-medium"
              >
                Vào dự án ngay →
              </button>
            )}
          </div>
        )}

        {/* Pending invitations callout banner */}
        {pendingInvitations.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5 sm:mt-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-900">
                  Bạn có {pendingInvitations.length} lời mời tham gia dự án đang chờ phản hồi
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Dự án:{' '}
                  <span className="font-medium">
                    {pendingInvitations.map((inv) => inv.projectName || 'Dự án').join(', ')}
                  </span>
                </p>
              </div>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('invitations')}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-black transition-colors shrink-0 self-end sm:self-center"
              >
                Xem chi tiết lời mời <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
              const matchingPending = pendingInvitations.find(
                (inv) =>
                  String(inv.id) === String(n.sourceId || (n as any).data) ||
                  (inv.projectName && n.title?.includes(inv.projectName)),
              );
              const isAccepted = acceptedInviteNotifIds.has(n.id);
              const isDeclined = declinedInviteNotifIds.has(n.id);
              const isPending = matchingPending !== undefined;
              const resolvedInvitationId = matchingPending
                ? String(matchingPending.id)
                : n.sourceId || (n as any).data || n.id;
              const targetProjectName = matchingPending?.projectName;

              return (
                <div
                  key={n.id}
                  className={i !== filtered.length - 1 ? 'border-b border-[#E5E5E7]' : ''}
                >
                  <NotificationItem
                    notification={n}
                    onRead={markAsRead}
                    onAcceptInvite={
                      n.type === 'invite'
                        ? () => handleAcceptInvite(resolvedInvitationId, n.id, targetProjectName)
                        : undefined
                    }
                    onDeclineInvite={
                      n.type === 'invite'
                        ? () => handleDeclineInvite(resolvedInvitationId, n.id)
                        : undefined
                    }
                    onNavigateInvitations={onNavigate ? () => onNavigate('invitations') : undefined}
                    onOpenProject={onNavigate ? () => onNavigate('board') : undefined}
                    isInvitePending={isPending}
                    isInviteAccepted={isAccepted}
                    isInviteDeclined={isDeclined}
                    isActionLoading={actionLoadingId === n.id}
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
