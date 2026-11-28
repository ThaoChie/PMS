import { describe, it, expect } from 'vitest';
import type { WorkflowTransition, IssueStatus } from '../types';

describe('Transition Matrix and Editor synchronization', () => {
  it('synchronizes isApprovalStep change when toggling approval in matrix', () => {
    let transitions: WorkflowTransition[] = [
      {
        id: 't-1',
        from: 'To Do' as IssueStatus,
        to: 'Done' as IssueStatus,
        name: 'Chuyển sang Done',
        isApprovalStep: true,
        type: 'APPROVE',
      },
    ];

    let selectedTransition: WorkflowTransition | null = transitions[0];

    // Helper that resolves currentSelectedTransition matching WorkflowSettings logic
    const getCurrentSelectedTransition = () => {
      if (!selectedTransition) return null;
      return (
        transitions.find(
          (t) =>
            (t.id && selectedTransition?.id && String(t.id) === String(selectedTransition.id)) ||
            (t.from &&
              t.to &&
              selectedTransition?.from &&
              selectedTransition?.to &&
              t.from.trim().toLowerCase() === selectedTransition.from.trim().toLowerCase() &&
              t.to.trim().toLowerCase() === selectedTransition.to.trim().toLowerCase())
        ) || null
      );
    };

    expect(getCurrentSelectedTransition()?.isApprovalStep).toBe(true);

    // Simulate toggle in Matrix (Duyệt PM -> Thường)
    const fromClean = 'to do';
    const toClean = 'done';
    transitions = transitions.map((t) => {
      if (t.from.toLowerCase() === fromClean && t.to.toLowerCase() === toClean) {
        const nextApproval = !t.isApprovalStep;
        return {
          ...t,
          isApprovalStep: nextApproval,
          type: nextApproval ? 'APPROVE' : 'NORMAL',
        };
      }
      return t;
    });

    // The current selected transition passed to TransitionEditor immediately reflects false
    const syncedTransition = getCurrentSelectedTransition();
    expect(syncedTransition?.isApprovalStep).toBe(false);
    expect(syncedTransition?.type).toBe('NORMAL');

    // Simulate saving from TransitionEditor with new required field without losing the matrix toggle
    const handleSaveTransition = (requiresField?: string, isApprovalStep?: boolean) => {
      const activeTrans = syncedTransition;
      if (!activeTrans) return;
      const cleanField = requiresField && requiresField.trim() ? requiresField.trim() : undefined;
      const approval = !!isApprovalStep;
      transitions = transitions.map((t) => {
        if (t.id === activeTrans.id) {
          return {
            ...t,
            requiresField: cleanField,
            isApprovalStep: approval,
            type: approval ? 'APPROVE' : 'NORMAL',
          };
        }
        return t;
      });
    };

    // Save with the synced isApprovalStep value (false)
    handleSaveTransition('Lý do hoàn thành', syncedTransition?.isApprovalStep);

    expect(transitions[0].requiresField).toBe('Lý do hoàn thành');
    expect(transitions[0].isApprovalStep).toBe(false); // Does NOT revert to true!
  });
});
