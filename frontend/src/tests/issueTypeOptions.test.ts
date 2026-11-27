import { describe, it, expect } from 'vitest';
import {
  ISSUE_TYPE_OPTIONS,
  STANDALONE_ISSUE_TYPE_OPTIONS,
} from '../constants/enums';

const BACKEND_ISSUE_TYPES = ['EPIC', 'TASK', 'BUG', 'STORY', 'SUB_TASK'];

describe('issueTypeOptions', () => {
  it('ISSUE_TYPE_OPTIONS only contains values matching backend IssueType enum including STORY', () => {
    for (const opt of ISSUE_TYPE_OPTIONS) {
      expect(BACKEND_ISSUE_TYPES).toContain(opt.value);
    }
    expect(ISSUE_TYPE_OPTIONS.some((o) => o.value === 'STORY')).toBe(true);
  });

  it('STANDALONE_ISSUE_TYPE_OPTIONS includes STORY and excludes SUB_TASK', () => {
    const values = STANDALONE_ISSUE_TYPE_OPTIONS.map((o) => o.value);
    expect(values).toEqual(['TASK', 'STORY', 'BUG', 'EPIC']);
    expect(values).toContain('STORY');
    expect(values).not.toContain('SUB_TASK');
  });
});
