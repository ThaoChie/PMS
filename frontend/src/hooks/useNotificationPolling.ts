import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/notificationStore';

export function useNotificationPolling(intervalMs: number = 45000) {
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();
    fetchNotifications();

    // Polling interval
    timerRef.current = setInterval(() => {
      fetchUnreadCount();
      fetchNotifications();
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMs, fetchUnreadCount, fetchNotifications]);
}
