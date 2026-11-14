export function formatDate(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * "Vừa xong", "5 phút trước", "3 giờ trước", "2 ngày trước", quá 30 ngày thì hiện ngày.
 * `now` cho phép truyền thời điểm hiện tại (để test, hoặc lấy từ hook useNow để nhãn tự chạy).
 * Thời điểm trong tương lai (lệch đồng hồ máy) được coi là "Vừa xong", không hiện số âm.
 */
export function formatRelativeTime(isoString: string, now: number = Date.now()): string {
  if (!isoString) return '';
  const timestamp = new Date(isoString).getTime();
  if (isNaN(timestamp)) return '';

  const diffSec = (now - timestamp) / 1000;
  if (diffSec < 60) return 'Vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400)} ngày trước`;
  return formatDate(isoString);
}
