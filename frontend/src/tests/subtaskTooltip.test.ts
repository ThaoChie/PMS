import { describe, it, expect } from 'vitest';
import { getSubtaskToggleTooltip } from '../features/issues/components/IssueTable';

describe('getSubtaskToggleTooltip', () => {
  it('returns "Xem sub-task" when issue has subtasks and is collapsed', () => {
    expect(getSubtaskToggleTooltip(2, false)).toBe('Xem sub-task');
  });

  it('returns "Thu gọn sub-task" when issue has subtasks and is expanded', () => {
    expect(getSubtaskToggleTooltip(2, true)).toBe('Thu gọn sub-task');
  });

  it('returns "Xem sub-task (0)" when issue has no subtasks and is collapsed', () => {
    expect(getSubtaskToggleTooltip(0, false)).toBe('Xem sub-task (0)');
  });

  it('returns "Thu gọn" when issue has no subtasks and is expanded', () => {
    expect(getSubtaskToggleTooltip(0, true)).toBe('Thu gọn');
  });
});
