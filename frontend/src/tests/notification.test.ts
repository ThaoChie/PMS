import { normalizeNotification } from '../store/notificationStore';
import { formatRelativeTime } from '../utils/date';

describe('normalizeNotification', () => {
  it('đọc được trạng thái đã đọc từ khóa "read" (backend cũ)', () => {
    expect(normalizeNotification({ id: 12, read: true }).isRead).toBe(true);
    expect(normalizeNotification({ id: 13, read: false }).isRead).toBe(false);
  });

  it('đọc được khóa "isRead" (backend mới, đúng API_DOCUMENTATION)', () => {
    expect(normalizeNotification({ id: 1, isRead: true }).isRead).toBe(true);
  });

  it('thiếu cả hai khóa thì coi là chưa đọc, id luôn là chuỗi', () => {
    const n = normalizeNotification({ id: 7 });
    expect(n.isRead).toBe(false);
    expect(n.id).toBe('7');
  });
});

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-11-14T10:00:00+07:00');

  it('nhãn thay đổi theo thời gian hiện tại truyền vào', () => {
    const created = '2026-11-14T09:59:30+07:00';
    expect(formatRelativeTime(created, now)).toBe('Vừa xong');
    expect(formatRelativeTime(created, now + 5 * 60_000)).toBe('5 phút trước');
    expect(formatRelativeTime(created, now + 3 * 3600_000)).toBe('3 giờ trước');
  });

  it('thời điểm kèm múi giờ UTC được tính đúng (không lệch 7 giờ)', () => {
    // 03:00 UTC = 10:00 giờ Việt Nam -> vừa tạo
    expect(formatRelativeTime('2026-11-14T03:00:00Z', now)).toBe('Vừa xong');
  });

  it('thời điểm tương lai (lệch đồng hồ) không hiện số âm', () => {
    expect(formatRelativeTime('2026-11-14T10:05:00+07:00', now)).toBe('Vừa xong');
  });
});
