import { create } from 'zustand';
import type { Notification } from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: (group?: string, unread?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

/**
 * Chuẩn hóa 1 thông báo từ API.
 * Backend cũ gửi trạng thái đã đọc dưới khóa "read" (Jackson đổi tên getter isRead()),
 * khiến `n.isRead` luôn undefined -> mọi thông báo bị coi là chưa đọc mãi.
 * Chấp nhận cả "isRead" lẫn "read" để chạy đúng với mọi phiên bản backend.
 */
export function normalizeNotification(raw: any): Notification {
  return {
    ...raw,
    id: String(raw?.id ?? ''),
    isRead: Boolean(raw?.isRead ?? raw?.read ?? false),
    createdAt: raw?.createdAt ?? '',
  };
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (group?: string, unread?: boolean) => {
    set({ isLoading: true });
    try {
      const res = await notificationService.getNotifications({ group, unread, page: 1, size: 50 });
      const items = res?.data?.content || (res?.data as any) || [];
      const list = (Array.isArray(items) ? items : []).map(normalizeNotification);
      set({
        notifications: list,
        // Đếm từ danh sách chỉ đúng khi không lọc; khi lọc theo nhóm thì giữ số đếm của máy chủ
        ...(group || unread ? {} : { unreadCount: list.filter((n) => !n.isRead).length }),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationService.getUnreadCount();
      const count = res?.data?.count ?? 0;
      set({ unreadCount: count });
    } catch {
      // silent catch for polling
    }
  },

  markAsRead: async (id: string) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      );
      return {
        notifications: updated,
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
    try {
      await notificationService.markAsRead(id);
    } catch {
      // ignore
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await notificationService.markAllAsRead();
    } catch {
      // ignore
    }
  },

  addNotification: (notification: Notification) =>
    set((state) => {
      const updated = [notification, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
      };
    }),
}));
