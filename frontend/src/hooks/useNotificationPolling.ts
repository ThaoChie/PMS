import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/notificationStore';

/**
 * Tải thông báo định kỳ để gần thời gian thực:
 *  - mỗi `intervalMs` (mặc định 20 giây) khi tab đang mở,
 *  - ngay khi người dùng quay lại tab / cửa sổ (không phải chờ hết chu kỳ),
 *  - tạm dừng khi tab bị ẩn để không gọi API thừa.
 */
export function useNotificationPolling(intervalMs: number = 20000) {
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const refresh = () => {
      fetchNotifications();
      fetchUnreadCount();
    };
    const start = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(refresh, intervalMs);
    };
    const stop = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
        start();
      } else {
        stop();
      }
    };

    refresh();
    start();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', refresh);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', refresh);
    };
  }, [intervalMs, fetchUnreadCount, fetchNotifications]);
}
