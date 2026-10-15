import React from 'react';
import { AtSign, User, CheckCircle2, AlertCircle, FolderKanban } from 'lucide-react';
import type { NotificationItem as NotificationModel, NotificationType } from '../../types';

export function NotifIcon({ type }: { type: NotificationType }) {
  const cls = 'w-3.5 h-3.5 text-[#6B6B70]';
  if (type === 'mention') return <AtSign className={cls} />;
  if (type === 'assignment') return <User className={cls} />;
  if (type === 'approval') return <CheckCircle2 className={cls} />;
  if (type === 'invite') return <FolderKanban className={cls} />;
  return <AlertCircle className={cls} />;
}

export function formatRelTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

interface NotificationItemProps {
  notification: NotificationModel;
  onRead?: (id: string) => void;
  onAcceptInvite?: (id: string) => void;
  onDeclineInvite?: (id: string) => void;
  compact?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification: n,
  onRead,
  onAcceptInvite,
  onDeclineInvite,
  compact = false,
}) => {
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
            {formatRelTime(n.createdAt)}
          </span>
        </div>
        <p className={`text-xs text-[#6B6B70] mt-0.5 line-clamp-2 ${compact ? 'text-[11px]' : ''}`}>
          {n.description}
        </p>

        {n.type === 'invite' && !n.isRead && (
          <div className="flex gap-2 mt-2.5">
            <button
              className="px-3 py-1 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] transition-colors"
              onClick={e => {
                e.stopPropagation();
                onAcceptInvite ? onAcceptInvite(n.id) : onRead?.(n.id);
              }}
            >
              Chấp nhận
            </button>
            <button
              className="px-3 py-1 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8] transition-colors"
              onClick={e => {
                e.stopPropagation();
                onDeclineInvite ? onDeclineInvite(n.id) : onRead?.(n.id);
              }}
            >
              Từ chối
            </button>
          </div>
        )}
      </div>
      {!n.isRead && <div className="w-2 h-2 bg-[#6B6B70] rounded-full shrink-0 mt-2" />}
    </div>
  );
};
