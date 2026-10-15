import { formatDuration, parseDuration } from '../../utils/duration';
import { can, canManageMembers, canManageWorkflow } from '../../utils/permission';

describe('duration utility', () => {
  it('should parse duration string correctly', () => {
    expect(parseDuration('2h 30m')).toBe(150);
    expect(parseDuration('1d')).toBe(480);
    expect(parseDuration('45m')).toBe(45);
  });

  it('should format minutes to duration string correctly', () => {
    expect(formatDuration(150)).toBe('2h 30m');
    expect(formatDuration(480)).toBe('1d');
    expect(formatDuration(45)).toBe('45m');
  });
});

describe('permission utility', () => {
  it('admin can manage members and workflow', () => {
    expect(canManageMembers('admin')).toBe(true);
    expect(canManageWorkflow('admin')).toBe(true);
  });

  it('pm can manage members and workflow', () => {
    expect(canManageMembers('pm')).toBe(true);
    expect(canManageWorkflow('pm')).toBe(true);
  });

  it('member cannot manage members or workflow', () => {
    expect(canManageMembers('member')).toBe(false);
    expect(canManageWorkflow('member')).toBe(false);
  });
});
