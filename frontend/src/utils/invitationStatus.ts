import type { Notification, ProjectInvitation } from '../types';

export type InviteCardState =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NONE';

export interface DeepLinkInviteBanner {
  tone: 'warning' | 'neutral' | 'success';
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
}

export interface InvitationActionFeedback {
  tone: 'accepted' | 'declined' | 'error';
  message: string;
  canNavigateToProject: boolean;
  projectId?: string;
  projectName?: string;
}

/**
 * Kiểm tra xem thông báo có phải là lời mời gửi TỚI người dùng hiện tại (`INVITE_RECEIVED`) hay không.
 * Loại trừ các thông báo phản hồi gửi về cho PM (`INVITE_RESPONDED`).
 */
export function isInviteeNotification(
  n: Pick<Notification, 'type' | 'rawType' | 'link' | 'title'>,
): boolean {
  if (n.type !== 'invite') return false;
  if (n.rawType === 'INVITE_RESPONDED') return false;
  if (n.link && n.link.includes('/members')) return false;
  const title = (n.title || '').toLowerCase();
  if (title.includes('đã chấp nhận lời mời') || title.includes('đã từ chối lời mời')) {
    return false;
  }
  return true;
}

const HAS_EXPLICIT_TZ_REGEX = /(?:Z|[+-]\d{2}:\d{2})$/i;

/**
 * Chuẩn hóa trạng thái lời mời phía client.
 * Chỉ tự quy đổi `PENDING -> EXPIRED` ở client khi chuỗi `expiresAt` có hậu tố múi giờ tường minh (`Z` / `+07:00`),
 * tránh lệch 7 tiếng giữa `LocalDateTime` (UTC trên server) và giờ trình duyệt GMT+7.
 */
export function normalizeInvitationStatus(
  inv: Pick<ProjectInvitation, 'status' | 'expiresAt'>,
  nowMs: number = Date.now(),
): Exclude<InviteCardState, 'NONE'> {
  if (inv.status === 'PENDING' && inv.expiresAt && HAS_EXPLICIT_TZ_REGEX.test(inv.expiresAt.trim())) {
    const exp = Date.parse(inv.expiresAt);
    if (!Number.isNaN(exp) && exp < nowMs) {
      return 'EXPIRED';
    }
  }
  return inv.status;
}

/**
 * Phân giải trạng thái hiển thị của 1 thẻ thông báo lời mời dựa trên ID lời mời chính xác (`sourceId`).
 */
export function resolveNotificationInviteStatus(
  n: Notification,
  invitationsById: Record<string, ProjectInvitation>,
  localAcceptedIds?: ReadonlySet<string>,
  localDeclinedIds?: ReadonlySet<string>,
  nowMs: number = Date.now(),
): InviteCardState {
  if (!isInviteeNotification(n)) return 'NONE';
  if (localAcceptedIds?.has(n.id)) return 'ACCEPTED';
  if (localDeclinedIds?.has(n.id)) return 'DECLINED';

  const rawId = String(n.sourceId || (n as any).data || '').trim();
  if (!rawId) return 'NONE';

  const inv = invitationsById[rawId];
  if (!inv) return 'NONE';

  return normalizeInvitationStatus(inv, nowMs);
}

function buildBannerFromResolvedInvitation(
  invitation: ProjectInvitation,
  nowMs: number,
): DeepLinkInviteBanner | null {
  const status = normalizeInvitationStatus(invitation, nowMs);
  if (status === 'PENDING') return null;

  const projectLabel = invitation.projectName ? `"${invitation.projectName}"` : 'này';
  const inviterLabel = invitation.inviterName ? ` (${invitation.inviterName})` : '';

  switch (status) {
    case 'CANCELLED':
      return {
        tone: 'warning',
        title: `Lời mời tham gia dự án ${projectLabel} đã được thu hồi`,
        description: `Quản lý dự án${inviterLabel} đã thu hồi lời mời này nên liên kết trong email không còn hiệu lực.`,
        projectName: invitation.projectName,
      };
    case 'EXPIRED':
      return {
        tone: 'neutral',
        title: `Lời mời tham gia dự án ${projectLabel} đã hết hạn`,
        description:
          'Thời hạn hiệu lực của lời mời đã kết thúc. Vui lòng liên hệ Quản lý dự án nếu bạn cần cấp lại lời mời mới.',
        projectName: invitation.projectName,
      };
    case 'DECLINED':
      return {
        tone: 'neutral',
        title: `Bạn đã từ chối lời mời tham gia dự án ${projectLabel}`,
        description: 'Phản hồi từ chối của bạn đã được hệ thống ghi nhận trước đó.',
        projectName: invitation.projectName,
      };
    case 'ACCEPTED':
      return {
        tone: 'success',
        title: `Bạn đã tham gia dự án ${projectLabel}`,
        description: 'Lời mời này đã được bạn chấp nhận trước đó.',
        projectId: invitation.projectId,
        projectName: invitation.projectName,
      };
    default:
      return null;
  }
}

/**
 * Dựng dữ liệu hiển thị cho Banner ngữ cảnh khi người dùng mở link `?tab=invite&invitation={id}`.
 * Trả về `null` nếu lời mời đang `PENDING` (vì đã có khung vàng hành động Chấp nhận / Từ chối).
 */
export function buildDeepLinkInviteBanner(params: {
  invitation?: ProjectInvitation | null;
  errorCode?: string;
  httpStatus?: number;
  currentUserEmail?: string;
  nowMs?: number;
}): DeepLinkInviteBanner | null {
  const { invitation, errorCode, httpStatus, currentUserEmail, nowMs = Date.now() } = params;

  if (errorCode === 'FORBIDDEN' || httpStatus === 403) {
    const accountHint = currentUserEmail ? ` (đang đăng nhập: ${currentUserEmail})` : '';
    return {
      tone: 'warning',
      title: 'Tài khoản hiện tại không khớp với email nhận lời mời',
      description: `Liên kết lời mời này được gửi cho một địa chỉ email khác${accountHint}. Vui lòng đăng xuất và đăng nhập đúng email nhận được lời mời.`,
    };
  }

  if (errorCode === 'RESOURCE_NOT_FOUND' || httpStatus === 404) {
    return {
      tone: 'neutral',
      title: 'Không tìm thấy lời mời tham gia dự án',
      description: 'Liên kết lời mời không tồn tại hoặc không còn hiệu lực.',
    };
  }

  if (!invitation) return null;
  return buildBannerFromResolvedInvitation(invitation, nowMs);
}

/**
 * Dựng dữ liệu phản hồi sau khi người nhận bấm Chấp nhận / Từ chối lời mời.
 * Chỉ duy nhất hành động `accepted` mới bật `canNavigateToProject = true`.
 */
export function buildInvitationActionFeedback(params: {
  action: 'accepted' | 'declined' | 'error';
  projectName?: string;
  projectId?: string;
  errorMessage?: string;
}): InvitationActionFeedback {
  const { action, projectName, projectId, errorMessage } = params;

  if (action === 'accepted') {
    return {
      tone: 'accepted',
      message: `Đã chấp nhận lời mời tham gia dự án "${projectName || 'mới'}" thành công!`,
      canNavigateToProject: true,
      projectId,
      projectName,
    };
  }

  if (action === 'declined') {
    const suffix = projectName ? ` "${projectName}"` : '';
    return {
      tone: 'declined',
      message: `Đã từ chối lời mời tham gia dự án${suffix}.`,
      canNavigateToProject: false,
      projectName,
    };
  }

  return {
    tone: 'error',
    message: errorMessage || 'Không thể xử lý lời mời. Vui lòng thử lại.',
    canNavigateToProject: false,
  };
}
