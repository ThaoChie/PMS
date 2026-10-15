import React, { useState, useEffect } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import type { NotificationType } from '../../types';
import { NotificationItem } from './NotificationItem';

const TYPE_LABELS: Record<NotificationType, string> = {
  mention: 'Nhắc đến',
  assignment: 'Phân công',
  workflow: 'Quy trình',
  approval: 'Phê duyệt',
  invite: 'Lời mời',
};

const FILTERS = ['all', 'mention', 'assignment', 'approval', 'workflow', 'invite'] as const;

export default function NotificationCenter() {
  const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    fetchNotifications(activeFilter === 'all' ? undefined : activeFilter);
  }, [activeFilter, fetchNotifications]);

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
              onClick={() => fetchNotifications(activeFilter === 'all' ? undefined : activeFilter)}
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
            filtered.map((n, i) => (
              <div
                key={n.id}
                className={i !== filtered.length - 1 ? 'border-b border-[#E5E5E7]' : ''}
              >
                <NotificationItem notification={n} onRead={markAsRead} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
