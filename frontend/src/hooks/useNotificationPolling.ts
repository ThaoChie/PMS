import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';

/**
 * Tải thông báo định kỳ để gần thời gian thực:
 *  - chỉ chạy khi người dùng ĐÃ ĐĂNG NHẬP (`isAuthenticated === true` và có token),
 *  - mỗi `intervalMs` (mặc định 20 giây) khi tab đang mở,
 *  - ngay khi người dùng quay lại tab / cửa sổ (không phải chờ hết chu kỳ),
 *  - tạm dừng khi tab bị ẩn để không gọi API thừa,
 *  - dừng và dọn dẹp sạch sẽ ngay khi đăng xuất để tránh gửi request rác làm nghẽn máy chủ.
 */
export function useNotificationPolling(intervalMs: number = 20000) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Không bao giờ chạy polling khi chưa đăng nhập để tránh spam request làm nghẽn server Render
    if (!isAuthenticated || !accessToken) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const refresh = () => {
      const auth = useAuthStore.getState();
      if (!auth.isAuthenticated || !auth.accessToken) return;
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
  }, [isAuthenticated, accessToken, intervalMs, fetchUnreadCount, fetchNotifications]);
}
