import React from 'react';
import { AtSign, User, CheckCircle2, AlertCircle, FolderKanban, Ban, Clock, XCircle } from 'lucide-react';
import type { NotificationItem as NotificationModel, NotificationType } from '../../types';
import { formatRelativeTime } from '../../utils/date';
import type { InviteCardState } from '../../utils/invitationStatus';

export function NotifIcon({ type }: { type: NotificationType }) {
  const cls = 'w-3.5 h-3.5 text-[#6B6B70]';
  if (type === 'mention') return <AtSign className={cls} />;
  if (type === 'assignment') return <User className={cls} />;
  if (type === 'approval') return <CheckCircle2 className={cls} />;
  if (type === 'invite') return <FolderKanban className={cls} />;
  return <AlertCircle className={cls} />;
}

/** Giữ tên cũ cho nơi khác đang import; dùng chung hàm chuẩn trong utils/date. */
export function formatRelTime(iso: string, now?: number) {
  return formatRelativeTime(iso, now);
}

interface NotificationItemProps {
  notification: NotificationModel;
  onRead?: (id: string) => void;
  onAcceptInvite?: (invitationId: string, notifId: string) => void;
  onDeclineInvite?: (invitationId: string, notifId: string) => void;
  onNavigateInvitations?: () => void;
  onOpenProject?: () => void;
  inviteStatus?: InviteCardState;
  isInvitePending?: boolean;
  isInviteAccepted?: boolean;
  isInviteDeclined?: boolean;
  isActionLoading?: boolean;
  compact?: boolean;
  now?: number;
}

function resolveEffectiveInviteState(props: {
  inviteStatus?: InviteCardState;
  isInviteAccepted?: boolean;
  isInviteDeclined?: boolean;
  isInvitePending?: boolean;
  hasAcceptHandler: boolean;
}): InviteCardState {
  if (props.inviteStatus) return props.inviteStatus;
  if (props.isInviteAccepted) return 'ACCEPTED';
  if (props.isInviteDeclined) return 'DECLINED';
  if (props.isInvitePending === true && props.hasAcceptHandler) return 'PENDING';
  return 'NONE';
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification: n,
  onRead,
  onAcceptInvite,
  onDeclineInvite,
  onNavigateInvitations,
  onOpenProject,
  inviteStatus,
  isInvitePending,
  isInviteAccepted = false,
  isInviteDeclined = false,
  isActionLoading = false,
  compact = false,
  now,
}) => {
  const invitationId = n.sourceId || (n as any).data || n.id;
  const effectiveState = resolveEffectiveInviteState({
    inviteStatus,
    isInviteAccepted,
    isInviteDeclined,
    isInvitePending,
    hasAcceptHandler: Boolean(onAcceptInvite),
  });

  return (
    <div
      className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-[#F7F7F8] transition-colors ${
        !n.isRead ? 'bg-[#FAFAFA]' : 'bg-white'
      } ${compact ? 'px-3 py-2.5 gap-2.5' : ''}`}
      onClick={() => onRead?.(n.id)}
    >
      <div className="w-8 h-8 rounded-full bg-[#F7F7F8] border border-[#E5E5E7] flex items-center justify-center shrink-0 mt-0.5">
        <NotifIcon type={n.type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p className={`text-sm flex-1 ${!n.isRead ? 'font-medium text-[#1A1A1A]' : 'text-[#1A1A1A]'} ${compact ? 'text-xs' : ''}`}>
            {n.title}
          </p>
          <span className="text-[10px] text-[#9B9B9F] shrink-0 mt-0.5">
            {formatRelTime(n.createdAt, now)}
          </span>
        </div>
        <p className={`text-xs text-[#6B6B70] mt-0.5 line-clamp-2 ${compact ? 'text-[11px]' : ''}`}>
          {n.description}
        </p>

        {n.type === 'invite' && effectiveState !== 'NONE' && (
          <div className="mt-2.5">
            {effectiveState === 'ACCEPTED' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã tham gia dự án
                </span>
                {onOpenProject && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProject();
                    }}
                    className="px-3 py-1 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-black transition-colors"
                  >
                    Vào dự án →
                  </button>
                )}
              </div>
            )}

            {effectiveState === 'DECLINED' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg border border-gray-200">
                <XCircle className="w-3.5 h-3.5" /> Đã từ chối lời mời
              </span>
            )}

            {effectiveState === 'CANCELLED' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-medium rounded-lg border border-amber-200">
                <Ban className="w-3.5 h-3.5" /> Lời mời đã được quản lý dự án thu hồi
              </span>
            )}

            {effectiveState === 'EXPIRED' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg border border-gray-200">
                <Clock className="w-3.5 h-3.5" /> Lời mời đã hết hạn
              </span>
            )}

            {effectiveState === 'PENDING' && onAcceptInvite && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isActionLoading}
                  className="px-3 py-1 bg-[#16A34A] text-white text-xs font-medium rounded-lg hover:bg-[#15803D] disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcceptInvite(invitationId, n.id);
                  }}
                >
                  {isActionLoading ? 'Đang xử lý…' : 'Chấp nhận'}
                </button>
                {onDeclineInvite && (
                  <button
                    type="button"
                    disabled={isActionLoading}
                    className="px-3 py-1 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8] disabled:opacity-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeclineInvite(invitationId, n.id);
                    }}
                  >
                    Từ chối
                  </button>
                )}
                {onNavigateInvitations && (
                  <button
                    type="button"
                    className="px-2 py-1 text-xs text-[#2563EB] hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateInvitations();
                    }}
                  >
                    Chi tiết lời mời →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {!n.isRead && <div className="w-2 h-2 bg-[#6B6B70] rounded-full shrink-0 mt-2" />}
    </div>
  );
};
