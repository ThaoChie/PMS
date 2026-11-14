import { collectMentionIds, mapMemberToUser } from '../utils/member';

// Đúng dạng MemberResponse của GET /projects/{id}/members
const apiMembers = [
  { id: 11, userId: 3, email: 'dev@epms.com', fullName: 'Ngan', role: 'MEMBER' },
  { id: 12, userId: 4, email: 'qa@epms.com', fullName: 'Ngan Hoang', role: 'MEMBER' },
  { id: 13, userId: 2, email: 'pm@epms.com', fullName: 'Alex Chen', role: 'PM' },
];

describe('mapMemberToUser', () => {
  it('lấy mã NGƯỜI DÙNG (userId), không lấy mã thành viên dự án (id)', () => {
    const users = apiMembers.map(mapMemberToUser);
    expect(users.map((u) => u.id)).toEqual(['3', '4', '2']);
    expect(users[1].name).toBe('Ngan Hoang');
    expect(users[1].email).toBe('qa@epms.com');
  });

  it('vẫn đúng khi API trả kiểu lồng { user: {...} } hoặc chỉ có id', () => {
    expect(mapMemberToUser({ id: 99, user: { id: 7, fullName: 'X', email: 'x@a.b' } }).id).toBe('7');
    expect(mapMemberToUser({ id: 5, fullName: 'Y', email: 'y@a.b' }).id).toBe('5');
  });
});

describe('collectMentionIds', () => {
  const members = apiMembers.map(mapMemberToUser);

  it('nhận người chọn từ gợi ý', () => {
    expect(collectMentionIds('@Alex Chen xem giúp', members, ['2'])).toEqual(['2']);
  });

  it('nhận người gõ tay @Tên mà không chọn từ gợi ý', () => {
    expect(collectMentionIds('nhờ @Alex Chen review', members, [])).toEqual(['2']);
  });

  it('"@Ngan Hoang" không bị nhận nhầm thành "@Ngan"', () => {
    expect(collectMentionIds('@Ngan Hoang ơi', members).sort()).toEqual(['4']);
    expect(collectMentionIds('@Ngan và @Ngan Hoang', members).sort()).toEqual(['3', '4']);
  });

  it('bỏ mã không phải thành viên dự án', () => {
    expect(collectMentionIds('hi', members, ['999', '13'])).toEqual([]);
  });
});
