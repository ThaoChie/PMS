import { describe, it, expect, vi } from 'vitest';
import type { WorkflowStatus } from '../types';

describe('Workflow Status Reordering Logic', () => {
  const initialStatuses: WorkflowStatus[] = [
    { id: '1', name: 'To Do', category: 'TODO', position: 0, isInitial: true },
    { id: '2', name: 'In Progress', category: 'IN_PROGRESS', position: 1, isInitial: false },
    { id: '3', name: 'Pending Approval', category: 'IN_PROGRESS', position: 2, isInitial: false },
    { id: '4', name: 'Done', category: 'DONE', position: 3, isInitial: false },
  ];

  it('thêm trạng thái mới ở cuối danh sách', () => {
    const newStatus: WorkflowStatus = {
      id: '5',
      name: 'Review',
      category: 'IN_PROGRESS',
      position: initialStatuses.length,
      isInitial: false,
    };
    const updated = [...initialStatuses, newStatus];
    expect(updated).toHaveLength(5);
    expect(updated[4].name).toBe('Review');
  });

  it('di chuyển trạng thái Review từ cuối sang trái (index 4 -> index 2)', () => {
    const list: WorkflowStatus[] = [
      ...initialStatuses,
      { id: '5', name: 'Review', category: 'IN_PROGRESS', position: 4, isInitial: false },
    ];

    // Move left once: from 4 to 3
    const step1 = [...list];
    const [moved1] = step1.splice(4, 1);
    step1.splice(3, 0, moved1);
    const reindexed1 = step1.map((s, idx) => ({ ...s, position: idx }));

    expect(reindexed1[3].name).toBe('Review');
    expect(reindexed1[3].position).toBe(3);
    expect(reindexed1[4].name).toBe('Done');
    expect(reindexed1[4].position).toBe(4);

    // Move left again: from 3 to 2
    const step2 = [...reindexed1];
    const [moved2] = step2.splice(3, 1);
    step2.splice(2, 0, moved2);
    const reindexed2 = step2.map((s, idx) => ({ ...s, position: idx }));

    expect(reindexed2.map((s) => s.name)).toEqual([
      'To Do',
      'In Progress',
      'Review',
      'Pending Approval',
      'Done',
    ]);
    expect(reindexed2.map((s) => s.position)).toEqual([0, 1, 2, 3, 4]);
  });

  it('khi lưu workflow, payload statuses luôn đảm bảo position khớp vị trí chỉ mục', () => {
    const reordered: WorkflowStatus[] = [
      { id: '1', name: 'To Do', category: 'TODO', position: 99, isInitial: true },
      { id: '5', name: 'Review', category: 'IN_PROGRESS', position: 4, isInitial: false },
      { id: '2', name: 'In Progress', category: 'IN_PROGRESS', position: 1, isInitial: false },
      { id: '4', name: 'Done', category: 'DONE', position: 3, isInitial: false },
    ];

    const payload = reordered.map((s, idx) => ({
      ...s,
      position: idx,
    }));

    expect(payload[0].name).toBe('To Do');
    expect(payload[0].position).toBe(0);
    expect(payload[1].name).toBe('Review');
    expect(payload[1].position).toBe(1);
    expect(payload[2].name).toBe('In Progress');
    expect(payload[2].position).toBe(2);
    expect(payload[3].name).toBe('Done');
    expect(payload[3].position).toBe(3);
  });
});
