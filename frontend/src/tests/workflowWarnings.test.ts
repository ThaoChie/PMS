import { describe, it, expect } from 'vitest';
import type { IssueStatus, WorkflowStatus, WorkflowTransition } from '../types';
import { computeWorkflowWarnings } from '../features/workflow/utils/workflowWarnings';

const baseStatuses: WorkflowStatus[] = [
  { id: '1', name: 'To Do', category: 'TODO', position: 0, isInitial: true },
  { id: '2', name: 'In Progress', category: 'IN_PROGRESS', position: 1, isInitial: false },
  { id: '3', name: 'Done', category: 'DONE', position: 2, isInitial: false },
];

const baseTransitions: WorkflowTransition[] = [
  { id: 't1', from: 'To Do' as IssueStatus, to: 'In Progress' as IssueStatus, name: 'Start' },
  { id: 't2', from: 'In Progress' as IssueStatus, to: 'Done' as IssueStatus, name: 'Complete' },
];

describe('workflowWarnings', () => {
  it('returns no warnings for a fully connected workflow (initial needs no incoming, DONE needs no outgoing)', () => {
    expect(computeWorkflowWarnings(baseStatuses, baseTransitions)).toEqual([]);
  });

  it('Situation A: clears In Review warnings immediately as incoming and outgoing transitions are ticked', () => {
    const withReview: WorkflowStatus[] = [
      ...baseStatuses,
      { id: '4', name: 'In Review', category: 'IN_PROGRESS', position: 3, isInitial: false },
    ];

    expect(computeWorkflowWarnings(withReview, baseTransitions)).toEqual([
      "Trạng thái 'In Review' không có luồng chuyển vào (mồ côi)",
      "Trạng thái 'In Review' không có luồng chuyển tiếp (điểm nghẽn)",
    ]);

    const withIncoming: WorkflowTransition[] = [
      ...baseTransitions,
      { id: 't3', from: 'In Progress' as IssueStatus, to: 'In Review' as IssueStatus, name: 'Review' },
    ];
    expect(computeWorkflowWarnings(withReview, withIncoming)).toEqual([
      "Trạng thái 'In Review' không có luồng chuyển tiếp (điểm nghẽn)",
    ]);

    const withBoth: WorkflowTransition[] = [
      ...withIncoming,
      { id: 't4', from: 'In Review' as IssueStatus, to: 'Done' as IssueStatus, name: 'Done' },
    ];
    expect(computeWorkflowWarnings(withReview, withBoth)).toEqual([]);
  });

  it('Situation B: immediately reports warnings when unticking transitions isolates an existing status or adding a disconnected status', () => {
    const onlyTodoToDone: WorkflowTransition[] = [
      { id: 't-direct', from: 'To Do' as IssueStatus, to: 'Done' as IssueStatus, name: 'Direct' },
    ];
    const isolatedInProgress = computeWorkflowWarnings(baseStatuses, onlyTodoToDone);
    expect(isolatedInProgress).toEqual([
      "Trạng thái 'In Progress' không có luồng chuyển vào (mồ côi)",
      "Trạng thái 'In Progress' không có luồng chuyển tiếp (điểm nghẽn)",
    ]);

    const withWaitCheck: WorkflowStatus[] = [
      ...baseStatuses,
      { id: '5', name: 'Wait Check', category: 'IN_PROGRESS', position: 3, isInitial: false },
    ];
    expect(computeWorkflowWarnings(withWaitCheck, baseTransitions)).toEqual([
      "Trạng thái 'Wait Check' không có luồng chuyển vào (mồ côi)",
      "Trạng thái 'Wait Check' không có luồng chuyển tiếp (điểm nghẽn)",
    ]);
  });
});
