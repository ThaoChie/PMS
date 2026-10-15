import { formatDuration, parseDuration } from '../utils/duration';
import { can, canManageMembers, canManageWorkflow } from '../utils/permission';
import { filtersToSearchParams, searchParamsToFilters } from '../utils/searchParams';

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

describe('searchParams utility round-trip', () => {
  it('should convert filters to search params and back to filters', () => {
    const originalFilters = {
      type: ['Story', 'Bug'],
      priority: ['High'],
      keyword: 'login-fix',
      page: '1',
    };

    const params = filtersToSearchParams(originalFilters);
    expect(params.get('type')).toBe('Story,Bug');
    expect(params.get('priority')).toBe('High');
    expect(params.get('keyword')).toBe('login-fix');

    const restoredFilters = searchParamsToFilters(params);
    expect(restoredFilters.type).toEqual(['Story', 'Bug']);
    expect(restoredFilters.priority).toBe('High');
    expect(restoredFilters.keyword).toBe('login-fix');
    expect(restoredFilters.page).toBe('1');
  });
});
