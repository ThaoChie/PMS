import { describe, it, expect } from 'vitest';
import {
  validateInviteCandidate,
  resolveInviteErrorMessage,
  extractInvitationId,
} from '../utils/invitation';

describe('validateInviteCandidate', () => {
  const existing = [
    { email: 'thithanhxuanlai@gmail.com', status: 'Active' as const },
    { email: 'laithithanhxuan.06wq@gmail.com', status: 'Pending' as const },
  ];

  it('chặn địa chỉ email rỗng hoặc sai định dạng', () => {
    const res1 = validateInviteCandidate('   ', existing);
    expect(res1.valid).toBe(false);
    if (!res1.valid) expect(res1.reason).toBe('INVALID_EMAIL');

    const res2 = validateInviteCandidate('khongcoacom', existing);
    expect(res2.valid).toBe(false);
    if (!res2.valid) expect(res2.reason).toBe('INVALID_EMAIL');
  });

  it('chặn khi email đã là thành viên đang hoạt động (không phân biệt hoa/thường)', () => {
    const res = validateInviteCandidate('  ThiThanhXuanLai@Gmail.com ', existing);
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.reason).toBe('MEMBER_ALREADY_EXISTS');
      expect(res.message).toContain('đã là thành viên');
    }
  });

  it('chặn khi email đang có lời mời ở trạng thái Đang chờ (Pending)', () => {
    const res = validateInviteCandidate('LaiThiThanhXuan.06wq@gmail.com', existing);
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.reason).toBe('INVITATION_ALREADY_PENDING');
      expect(res.message).toContain('đang chờ phản hồi');
    }
  });

  it('cho phép khi email hợp lệ và không nằm trong danh sách Active hay Pending', () => {
    const res = validateInviteCandidate('  NewMember@Company.com ', existing);
    expect(res).toEqual({
      valid: true,
      normalizedEmail: 'newmember@company.com',
    });
  });
});

describe('resolveInviteErrorMessage', () => {
  it('ưu tiên thông báo chuẩn cho mã INVITATION_ALREADY_PENDING', () => {
    expect(
      resolveInviteErrorMessage({
        code: 'INVITATION_ALREADY_PENDING',
        message: 'Đã có lời mời đang chờ phản hồi cho email này.',
      }),
    ).toBe('Đã có lời mời đang chờ phản hồi cho email này.');
  });

  it('xử lý mã lỗi TOO_MANY_REQUESTS (429)', () => {
    expect(
      resolveInviteErrorMessage({
        response: { status: 429, data: { code: 'TOO_MANY_REQUESTS' } },
      }),
    ).toContain('quá nhanh');
  });

  it('xử lý mã lỗi MEMBER_ALREADY_EXISTS', () => {
    expect(resolveInviteErrorMessage({ code: 'MEMBER_ALREADY_EXISTS' })).toBe(
      'Người dùng này đã là thành viên của dự án.',
    );
  });
});

describe('extractInvitationId', () => {
  it('tách đúng ID số từ chuỗi inv-{id}', () => {
    expect(extractInvitationId('inv-120')).toBe('120');
    expect(extractInvitationId('120')).toBe('120');
  });
});
