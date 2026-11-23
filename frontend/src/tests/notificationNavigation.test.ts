import { describe, it, expect } from 'vitest';
import { resolveNotificationTarget } from '../utils/notificationNavigation';
import type { Notification } from '../types';

function makeNotif(overrides: Partial<Notification>): Notification {
  return {
    id: '1',
    type: 'invite',
    title: 'Thông báo',
    description: 'Chi tiết thông báo',
    isRead: false,
    createdAt: '2026-11-23T09:30:00+07:00',
    ...overrides,
  };
}

describe('resolveNotificationTarget', () => {
  it('điều hướng INVITE_RECEIVED tới /invitations khi bấm từ chuông Topbar và giữ nguyên tại chỗ ở NotificationCenter', () => {
    const inviteReceived = makeNotif({
      type: 'invite',
      rawType: 'INVITE_RECEIVED',
      title: 'Lời mời tham gia dự án: demo1',
      link: '/notifications?tab=invite&invitation=135',
      sourceId: '135',
    });

    expect(resolveNotificationTarget(inviteReceived, 'bell')).toEqual({
      kind: 'screen',
      screen: 'invitations',
    });

    expect(resolveNotificationTarget(inviteReceived, 'center')).toEqual({
      kind: 'none',
    });
  });

  it('điều hướng INVITE_RESPONDED mới (link /projects/:id/members) tới trang Thành viên & Vai trò của đúng dự án', () => {
    const pmNotif = makeNotif({
      type: 'invite',
      rawType: 'INVITE_RESPONDED',
      title: 'Nguyễn Lại đã từ chối lời mời',
      description: 'Nguyễn Lại đã từ chối tham gia dự án demo1',
      link: '/projects/120/members',
      sourceId: '120',
    });

    expect(resolveNotificationTarget(pmNotif, 'bell')).toEqual({
      kind: 'screen',
      screen: 'members-roles',
      projectIdOrKey: '120',
    });

    expect(resolveNotificationTarget(pmNotif, 'center')).toEqual({
      kind: 'screen',
      screen: 'members-roles',
      projectIdOrKey: '120',
    });
  });

  it('tương thích ngược với bản ghi INVITE_RESPONDED cũ (thiếu rawType hoặc link /projects/:id/settings/members)', () => {
    const legacyPmNotif = makeNotif({
      type: 'invite',
      title: 'Nguyễn Lại đã từ chối lời mời',
      link: '/projects/120/settings/members',
      sourceId: '120',
    });

    expect(resolveNotificationTarget(legacyPmNotif, 'bell')).toEqual({
      kind: 'screen',
      screen: 'members-roles',
      projectIdOrKey: '120',
    });

    const titleOnlyPmNotif = makeNotif({
      type: 'invite',
      title: 'Xuân Lại đã chấp nhận lời mời',
      sourceId: '99',
    });

    expect(resolveNotificationTarget(titleOnlyPmNotif, 'bell')).toEqual({
      kind: 'screen',
      screen: 'members-roles',
      projectIdOrKey: '99',
    });
  });

  it('điều hướng thông báo công việc (mention / assignment / workflow) tới đúng chi tiết issue kèm projectKey', () => {
    const issueNotif = makeNotif({
      type: 'mention',
      rawType: 'MENTION',
      title: 'Bạn được nhắc đến trong DEMO-15',
      link: '/projects/DEMO/issues/DEMO-15',
      sourceId: 'DEMO-15',
    });

    expect(resolveNotificationTarget(issueNotif, 'bell')).toEqual({
      kind: 'issue',
      issueKey: 'DEMO-15',
      projectIdOrKey: 'DEMO',
    });

    expect(resolveNotificationTarget(issueNotif, 'center')).toEqual({
      kind: 'issue',
      issueKey: 'DEMO-15',
      projectIdOrKey: 'DEMO',
    });
  });

  it('điều hướng thông báo phê duyệt tới trang Phê duyệt (approvals) kèm mã dự án và không bắt nhầm issue có chữ "yêu cầu"', () => {
    const approvalNotif = makeNotif({
      type: 'approval',
      rawType: 'APPROVAL_REQUESTED',
      title: 'Yêu cầu phê duyệt mới',
      link: '/projects/120/approval-requests/8',
    });

    expect(resolveNotificationTarget(approvalNotif, 'bell')).toEqual({
      kind: 'screen',
      screen: 'approvals',
      projectIdOrKey: '120',
    });

    const issueWithRequestWord = makeNotif({
      type: 'assignment',
      rawType: 'ASSIGNED',
      title: 'Bạn được giao công việc: Yêu cầu báo giá khách hàng',
      link: '/projects/DEMO/issues/DEMO-22',
      sourceId: 'DEMO-22',
    });

    expect(resolveNotificationTarget(issueWithRequestWord, 'bell')).toEqual({
      kind: 'issue',
      issueKey: 'DEMO-22',
      projectIdOrKey: 'DEMO',
    });
  });
});
