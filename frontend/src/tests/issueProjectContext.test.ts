import { describe, it, expect } from 'vitest';
import { buildIssueDetailPath, resolveIssueProject } from '../constants/routes';

describe('issueProjectContext', () => {
  it('buildIssueDetailPath scopes the URL under the active project when projectIdOrKey is present', () => {
    expect(buildIssueDetailPath('TTT-3', '5')).toBe('/projects/5/issues/TTT-3');
    expect(buildIssueDetailPath('TTT-3', 5)).toBe('/projects/5/issues/TTT-3');
    expect(buildIssueDetailPath('TTT-3', '')).toBe('/issues/TTT-3');
    expect(buildIssueDetailPath('TTT-3', null)).toBe('/issues/TTT-3');
  });

  it('resolveIssueProject resolves the true project instead of defaulting to projects[0]', () => {
    const projects = [
      { id: '1', name: 'thiết kế hệ thống', key: 'TKHT' },
      { id: '5', name: 'ttt', key: 'TTT' },
    ];

    const matchedById = resolveIssueProject(
      { projectId: '5', projectKey: 'TTT', projectName: 'ttt' },
      projects,
    );
    expect(matchedById?.id).toBe('5');
    expect(matchedById?.name).toBe('ttt');

    const matchedByKey = resolveIssueProject(
      { projectId: undefined, projectKey: 'ttt' },
      projects,
    );
    expect(matchedByKey?.id).toBe('5');
    expect(matchedByKey?.name).toBe('ttt');
  });
});
