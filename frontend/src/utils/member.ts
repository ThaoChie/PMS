import type { User } from '../types';
import { mapUserResponseToUser } from '../store/authStore';

/**
 * Chuyển 1 phần tử của GET /projects/{id}/members thành User.
 *
 * API trả về MemberResponse { id, userId, email, fullName, ... } trong đó
 *   - `id`     = mã THÀNH VIÊN trong dự án (project_members.id)
 *   - `userId` = mã NGƯỜI DÙNG (users.id)
 * Mọi chỗ gửi lên backend (tag tên, chia sẻ bộ lọc, giao việc...) phải dùng mã NGƯỜI DÙNG.
 * Trước đây dùng nhầm `id` -> backend không khớp ai -> không gửi thông báo / email,
 * hoặc tệ hơn là khớp nhầm sang người khác.
 */
export function mapMemberToUser(raw: any): User {
  if (!raw) return raw;
  const source = raw.user ?? raw;
  const userId = raw.user?.id ?? raw.userId ?? raw.id;
  return { ...mapUserResponseToUser(source), id: String(userId) };
}

/**
 * Danh sách mã người dùng được nhắc trong nội dung bình luận:
 *   - người đã chọn từ danh sách gợi ý (`picked`), và
 *   - người được gõ tay dạng "@Tên Đầy Đủ" (không chọn từ gợi ý).
 * Chỉ giữ người là thành viên dự án (BR-COL-02). Ưu tiên tên dài trước để
 * "@Ngan Hoang" không bị nhận nhầm thành "@Ngan".
 */
export function collectMentionIds(content: string, members: User[], picked: string[] = []): string[] {
  const memberIds = new Set(members.map((m) => String(m.id)));
  const result = new Set(picked.map(String).filter((id) => memberIds.has(id)));
  let text = content;
  const byLongestName = [...members]
    .filter((m) => m.name && m.name.trim())
    .sort((a, b) => b.name.length - a.name.length);
  for (const m of byLongestName) {
    const token = `@${m.name}`;
    if (text.includes(token)) {
      result.add(String(m.id));
      text = text.split(token).join(' ');
    }
  }
  return Array.from(result);
}
