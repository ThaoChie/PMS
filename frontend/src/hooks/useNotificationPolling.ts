import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { notificationService } from '../services/notificationService';

export function useNotificationPolling(intervalMs: number = 45000) {
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const res = await notificationService.getNotifications();
        if (res?.data?.content) {
          setNotifications(res.data.content);
        }
      } catch (err) {
        // Fallback or ignore in offline mock mode
      }
    }

    timerRef.current = setInterval(fetchLatest, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMs, setNotifications]);
}
