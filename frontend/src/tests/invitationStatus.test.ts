import { describe, it, expect } from 'vitest';
import {
  resolveNotificationInviteStatus,
  buildDeepLinkInviteBanner,
  isInviteeNotification,
  normalizeInvitationStatus,
} from '../utils/invitationStatus';
import type { Notification, ProjectInvitation } from '../types';

const NOW = Date.parse('2026-11-21T23:00:00+07:00');

describe('isInviteeNotification', () => {
  it('loại trừ thông báo phản hồi gửi về cho PM (INVITE_RESPONDED)', () => {
    expect(
      isInviteeNotification({
        type: 'invite',
        rawType: 'INVITE_RESPONDED',
        title: 'Xuân Lại Thị Thanh đã chấp nhận lời mời',
      }),
    ).toBe(false);

    expect(
      isInviteeNotification({
        type: 'invite',
        link: '/projects/120/settings/members',
        title: 'Thành viên đã từ chối lời mời',
      }),
    ).toBe(false);
  });

  it('nhận diện đúng thông báo lời mời gửi tới người nhận (INVITE_RECEIVED)', () => {
    expect(
      isInviteeNotification({
        type: 'invite',
        rawType: 'INVITE_RECEIVED',
        link: '/notifications?tab=invite',
        title: 'Lời mời tham gia dự án: demo1',
      }),
    ).toBe(true);
  });
});

describe('resolveNotificationInviteStatus', () => {
  const invitationsById: Record<string, ProjectInvitation> = {
    '131': {
      id: '131',
      projectId: '120',
      projectName: 'demo1',
      email: '23110309@st.vju.ac.vn',
      role: 'member',
      status: 'CANCELLED',
    },
    '132': {
      id: '132',
      projectId: '120',
      projectName: 'demo1',
      email: '23110309@st.vju.ac.vn',
      role: 'member',
      status: 'PENDING',
      expiresAt: '2026-11-28T23:00:00+07:00',
    },
    '133': {
      id: '133',
      projectId: '125',
      projectName: 'demo2',
      email: '23110309@st.vju.ac.vn',
      role: 'qa',
      status: 'PENDING',
      expiresAt: '2026-11-20T00:00:00+07:00', // đã quá hạn
    },
    '134': {
      id: '134',
      projectId: '130',
      projectName: 'demo3',
      email: '23110309@st.vju.ac.vn',
      role: 'developer',
      status: 'ACCEPTED',
    },
  };

  function makeNotif(id: string, sourceId: string, rawType = 'INVITE_RECEIVED'): Notification {
    return {
      id,
      type: 'invite',
      rawType,
      title: 'Lời mời tham gia dự án: demo1',
      description: 'Bạn được mời tham gia dự án demo1 với vai trò MEMBER',
      isRead: false,
      createdAt: '2026-11-21T22:55:00+07:00',
      sourceId,
    };
  }

  it('phân biệt độc lập lời mời cũ đã thu hồi (#131) và lời mời mới đang chờ (#132) trong cùng dự án', () => {
    expect(resolveNotificationInviteStatus(makeNotif('n1', '131'), invitationsById, undefined, undefined, NOW)).toBe(
      'CANCELLED',
    );
    expect(resolveNotificationInviteStatus(makeNotif('n2', '132'), invitationsById, undefined, undefined, NOW)).toBe(
      'PENDING',
    );
  });

  it('tự chuyển lời mời PENDING đã quá hạn sang EXPIRED và giữ nguyên trạng thái ACCEPTED khi F5', () => {
    expect(resolveNotificationInviteStatus(makeNotif('n3', '133'), invitationsById, undefined, undefined, NOW)).toBe(
      'EXPIRED',
    );
    expect(resolveNotificationInviteStatus(makeNotif('n4', '134'), invitationsById, undefined, undefined, NOW)).toBe(
      'ACCEPTED',
    );
  });

  it('trả về NONE cho thông báo INVITE_RESPONDED của PM', () => {
    expect(
      resolveNotificationInviteStatus(
        makeNotif('n5', '120', 'INVITE_RESPONDED'),
        invitationsById,
        undefined,
        undefined,
        NOW,
      ),
    ).toBe('NONE');
  });
});

describe('buildDeepLinkInviteBanner', () => {
  it('hiển thị cảnh báo rõ ràng khi lời mời trong link email đã bị PM thu hồi (CANCELLED)', () => {
    const banner = buildDeepLinkInviteBanner({
      invitation: {
        id: '132',
        projectName: 'demo1',
        inviterName: 'Thị Thanh Xuân Lại',
        email: '23110309@st.vju.ac.vn',
        role: 'member',
        status: 'CANCELLED',
      },
      nowMs: NOW,
    });

    expect(banner).not.toBeNull();
    expect(banner?.tone).toBe('warning');
    expect(banner?.title).toContain('demo1');
    expect(banner?.title).toContain('thu hồi');
    expect(banner?.description).toContain('Thị Thanh Xuân Lại');
  });

  it('hiển thị cảnh báo khi trình duyệt đang đăng nhập tài khoản khác với email được mời (403)', () => {
    const banner = buildDeepLinkInviteBanner({
      errorCode: 'FORBIDDEN',
      httpStatus: 403,
      currentUserEmail: 'other@gmail.com',
      nowMs: NOW,
    });

    expect(banner?.tone).toBe('warning');
    expect(banner?.description).toContain('other@gmail.com');
  });

  it('trả về null khi lời mời vẫn đang PENDING (nhường cho khung hành động Chấp nhận / Từ chối)', () => {
    const banner = buildDeepLinkInviteBanner({
      invitation: {
        id: '132',
        projectName: 'demo1',
        email: '23110309@st.vju.ac.vn',
        role: 'member',
        status: 'PENDING',
        expiresAt: '2026-11-28T00:00:00+07:00',
      },
      nowMs: NOW,
    });

    expect(banner).toBeNull();
  });
});

describe('normalizeInvitationStatus timezone safety', () => {
  it('không đánh dấu EXPIRED sớm cho chuỗi LocalDateTime không có hậu tố múi giờ (server UTC vs client GMT+7)', () => {
    // NOW = 2026-11-21T23:00:00+07:00 (= 16:00:00Z). Server UTC hết hạn lúc 20:00:00 UTC (vẫn còn 4 tiếng).
    expect(
      normalizeInvitationStatus(
        { status: 'PENDING', expiresAt: '2026-11-21T20:00:00' },
        NOW,
      ),
    ).toBe('PENDING');

    // Khi có hậu tố Z tường minh và thực sự đã qua thời điểm NOW -> chuyển sang EXPIRED
    expect(
      normalizeInvitationStatus(
        { status: 'PENDING', expiresAt: '2026-11-21T15:00:00Z' },
        NOW,
      ),
    ).toBe('EXPIRED');
  });
});
