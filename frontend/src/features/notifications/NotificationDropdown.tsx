import React from 'react';
import { Check, Bell, ArrowRight } from 'lucide-react';
import type { NotificationItem as NotificationModel } from '../../types';
import { NotificationItem } from './NotificationItem';

interface NotificationDropdownProps {
  notifications: NotificationModel[];
  onRead: (id: string) => void;
  onReadAll: () => void;
  onViewAll?: () => void;
  onClose?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onRead,
  onReadAll,
  onViewAll,
  onClose,
}) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const recent = notifications.slice(0, 5);

  return (
    <div className="w-80 sm:w-96 bg-white border border-[#E5E5E7] rounded-xl shadow-lg overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-[#E5E5E7] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#1A1A1A]">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-[#E53E3E] text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onReadAll}
            className="flex items-center gap-1 text-[11px] text-[#6B6B70] hover:text-[#1A1A1A] transition-colors"
          >
            <Check className="w-3 h-3" /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-[#F0F0F1]">
        {recent.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#9B9B9F]">
            No notifications
          </div>
        ) : (
          recent.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={(id) => {
                onRead(id);
                onClose?.();
              }}
              compact
            />
          ))
        )}
      </div>

      {onViewAll && (
        <div className="px-4 py-2.5 bg-[#F7F7F8] border-t border-[#E5E5E7] text-center">
          <button
            onClick={() => {
              onViewAll();
              onClose?.();
            }}
            className="text-xs text-[#6B6B70] hover:text-[#1A1A1A] font-medium flex items-center justify-center gap-1 transition-colors w-full"
          >
            View all notifications <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
