import { describe, it, expect } from 'vitest';
import {
  findTransitionForTargetStatus,
  type TransitionOptionLike,
} from '../features/board/utils/boardTransition';

describe('boardTransition', () => {
  it('returns undefined when To Do has no transition to Done (blocks PM direct drag)', () => {
    const availableFromTodo: TransitionOptionLike[] = [
      { id: 10, name: 'Start Progress', toStatusName: 'In Progress' },
    ];

    expect(findTransitionForTargetStatus(availableFromTodo, 'Done')).toBeUndefined();
    expect(findTransitionForTargetStatus(availableFromTodo, 'Pending Approval')).toBeUndefined();
  });

  it('finds valid transition to Done when workflow explicitly defines it (including APPROVE)', () => {
    const availableFromPending: TransitionOptionLike[] = [
      { id: 20, name: 'Approve', toStatusName: 'Done' },
      { id: 21, name: 'Reject', toStatusName: 'In Progress' },
    ];

    const matched = findTransitionForTargetStatus(availableFromPending, 'done');
    expect(matched?.id).toBe(20);
  });

  it('does not falsely match transition name if toStatusName points to a different status', () => {
    const transitions: TransitionOptionLike[] = [
      { id: 30, name: 'Done', toStatusName: 'In Progress' },
    ];

    expect(findTransitionForTargetStatus(transitions, 'Done')).toBeUndefined();
    expect(findTransitionForTargetStatus(transitions, 'In Progress')?.id).toBe(30);
  });

  it('identifies transition with requiredFields', () => {
    const transitions: (TransitionOptionLike & { requiredFields?: string })[] = [
      { id: 40, name: 'Submit for Review', toStatusName: 'Pending Approval', requiredFields: 'Link bằng chứng' },
    ];

    const matched = findTransitionForTargetStatus(transitions, 'Pending Approval');
    expect(matched?.requiredFields).toBe('Link bằng chứng');
  });

  it('identifies transition without requiredFields for direct execution', () => {
    const transitions: (TransitionOptionLike & { requiredFields?: string })[] = [
      { id: 41, name: 'Start Work', toStatusName: 'In Progress' },
    ];

    const matched = findTransitionForTargetStatus(transitions, 'In Progress');
    expect((matched as any)?.requiredFields).toBeUndefined();
  });
});
