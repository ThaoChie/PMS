import type { User } from '../types';

export type InviteValidationResult =
  | { valid: true; normalizedEmail: string }
  | {
      valid: false;
      reason: 'INVALID_EMAIL' | 'MEMBER_ALREADY_EXISTS' | 'INVITATION_ALREADY_PENDING';
      message: string;
    };

/**
 * Kiểm tra sớm trên client trước khi gửi API mời thành viên:
 * - Chuẩn hóa email (trim + lowercase)
 * - Chặn nếu email đã là thành viên đang hoạt động (Active)
 * - Chặn nếu email đang có lời mời chờ phản hồi (Pending)
 */
export function validateInviteCandidate(
  rawEmail: string,
  existingMembers: Pick<User, 'email' | 'status'>[],
): InviteValidationResult {
  const normalizedEmail = (rawEmail || '').trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
    return {
      valid: false,
      reason: 'INVALID_EMAIL',
      message: 'Địa chỉ email không đúng định dạng.',
    };
  }

  for (const member of existingMembers) {
    const memberEmail = (member.email || '').trim().toLowerCase();
    if (memberEmail !== normalizedEmail) continue;

    if (member.status === 'Active') {
      return {
        valid: false,
        reason: 'MEMBER_ALREADY_EXISTS',
        message: 'Người dùng này đã là thành viên của dự án.',
      };
    }

    if (member.status === 'Pending') {
      return {
        valid: false,
        reason: 'INVITATION_ALREADY_PENDING',
        message:
          'Đã có lời mời đang chờ phản hồi cho email này. Chỉ có thể mời lại sau khi lời mời bị từ chối, đã thu hồi hoặc hết hạn.',
      };
    }
  }

  return { valid: true, normalizedEmail };
}

/**
 * Phân giải thông báo lỗi tiếng Việt rõ ràng từ phản hồi lỗi của API mời thành viên.
 */
export function resolveInviteErrorMessage(err: any): string {
  const code: string | undefined = err?.code || err?.response?.data?.code;
  const status: number | undefined = err?.response?.status;
  const serverMessage: string | undefined = err?.response?.data?.message || err?.message;

  if (code === 'MEMBER_ALREADY_EXISTS') {
    return 'Người dùng này đã là thành viên của dự án.';
  }
  if (code === 'INVITATION_ALREADY_PENDING') {
    return (
      serverMessage ||
      'Đã có lời mời đang chờ phản hồi cho email này. Chỉ có thể mời lại sau khi lời mời bị từ chối, đã thu hồi hoặc hết hạn.'
    );
  }
  if (code === 'TOO_MANY_REQUESTS' || status === 429) {
    return (
      serverMessage ||
      'Bạn đang gửi lời mời quá nhanh. Vui lòng đợi ít phút trước khi tiếp tục.'
    );
  }

  return serverMessage || 'Không thể gửi lời mời.';
}

/**
 * Tách ID thực của lời mời từ ID dòng tạm `inv-{id}` trên bảng thành viên.
 */
export function extractInvitationId(rowId: string): string {
  return String(rowId || '').replace(/^inv-/, '');
}
