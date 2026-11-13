import type { AxiosError } from 'axios';
import { toRejectPayload } from '../api/axiosClient';
import { can } from '../utils/permission';

function fakeAxiosError(status: number, data: unknown): AxiosError {
  return { isAxiosError: true, message: 'Request failed', response: { status, data } } as unknown as AxiosError;
}

describe('axiosClient toRejectPayload', () => {
  it('giữ body cũ (err.message) và đọc được err.response.data.message', () => {
    const err: any = toRejectPayload(
      fakeAxiosError(403, { success: false, message: 'Chỉ người được giao việc mới có quyền ghi nhận thời gian' }),
    );
    expect(err.success).toBe(false);
    expect(err.message).toBe('Chỉ người được giao việc mới có quyền ghi nhận thời gian');
    expect(err.response.status).toBe(403);
    expect(err.response.data.message).toBe('Chỉ người được giao việc mới có quyền ghi nhận thời gian');
    // không làm bẩn dữ liệu khi log / JSON.stringify
    expect(Object.keys(err)).not.toContain('response');
  });

  it('lỗi mạng (không có response) trả về nguyên AxiosError', () => {
    const e = { isAxiosError: true, message: 'Network Error' } as unknown as AxiosError;
    expect(toRejectPayload(e)).toBe(e);
  });
});

describe('quyền ghi nhận thời gian (UC008 / BR-COL-04)', () => {
  it('chỉ Assignee được log work, PM không phải assignee thì không', () => {
    const user: any = { id: '3', role: 'member' };
    expect(can(user, 'member', 'issue:logwork', { isAssignee: true })).toBe(true);
    expect(can(user, 'member', 'issue:logwork', { isAssignee: false })).toBe(false);
    expect(can({ ...user, role: 'pm' }, 'pm', 'issue:logwork', { isAssignee: false })).toBe(false);
    expect(can({ ...user, role: 'pm' }, 'pm', 'issue:logwork', { isAssignee: true })).toBe(true);
  });
});
