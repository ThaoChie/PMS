import { useEffect, useState } from 'react';

/**
 * Trả về thời điểm hiện tại (ms) và tự cập nhật sau mỗi `intervalMs`.
 * Dùng cho nhãn thời gian tương đối ("Vừa xong", "5 phút trước"...): nhãn chỉ được tính lại
 * khi component vẽ lại, nên cần một "nhịp đồng hồ" để nó tự chạy mà không phải tải lại trang.
 */
export function useNow(intervalMs: number = 30000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
