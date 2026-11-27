import { describe, it, expect, vi } from 'vitest';
import {
  buildInlineUpdatePayload,
  executeInlineIssueUpdate,
  isConcurrentModificationError,
} from '../features/issues/utils/inlineUpdate';

describe('inlineUpdate', () => {
  it('buildInlineUpdatePayload sends only changed fields and version', () => {
    expect(buildInlineUpdatePayload({ type: 'BUG' }, 3)).toEqual({
      type: 'BUG',
      version: 3,
    });

    expect(buildInlineUpdatePayload({ assigneeId: null, dueDate: null }, 2)).toEqual({
      assigneeId: null,
      clearAssignee: true,
      dueDate: null,
      clearDueDate: true,
      version: 2,
    });
  });

  it('isConcurrentModificationError distinguishes version conflict from other 409 errors', () => {
    expect(
      isConcurrentModificationError({
        errorCode: 'CONCURRENT_MODIFICATION',
        response: { status: 409, data: { errorCode: 'CONCURRENT_MODIFICATION' } },
      }),
    ).toBe(true);

    expect(
      isConcurrentModificationError({
        errorCode: 'PROJECT_CLOSED',
        response: { status: 409, data: { errorCode: 'PROJECT_CLOSED' } },
      }),
    ).toBe(false);

    expect(
      isConcurrentModificationError({
        response: { status: 409, data: { message: 'Thao tác xung đột với dữ liệu hiện có.' } },
      }),
    ).toBe(false);
  });

  it('executeInlineIssueUpdate retries once with latest version when stale version causes CONCURRENT_MODIFICATION', async () => {
    const updateFn = vi
      .fn()
      .mockRejectedValueOnce({
        errorCode: 'CONCURRENT_MODIFICATION',
        response: { status: 409, data: { errorCode: 'CONCURRENT_MODIFICATION' } },
      })
      .mockResolvedValueOnce({ data: { key: 'TTT-4', type: 'BUG', version: 5 } });

    const fetchLatestFn = vi.fn().mockResolvedValue({ key: 'TTT-4', version: 4 });

    const res = await executeInlineIssueUpdate({
      issueKey: 'TTT-4',
      currentVersion: 2,
      updates: { type: 'BUG' },
      updateFn,
      fetchLatestFn,
    });

    expect(updateFn).toHaveBeenCalledTimes(2);
    expect(updateFn).toHaveBeenNthCalledWith(1, 'TTT-4', { type: 'BUG', version: 2 }, 2);
    expect(fetchLatestFn).toHaveBeenCalledWith('TTT-4');
    expect(updateFn).toHaveBeenNthCalledWith(2, 'TTT-4', { type: 'BUG', version: 4 }, 4);
    expect(res.data.type).toBe('BUG');
  });

  it('executeInlineIssueUpdate does not retry non-concurrent errors like PROJECT_CLOSED', async () => {
    const updateFn = vi.fn().mockRejectedValueOnce({
      errorCode: 'PROJECT_CLOSED',
      response: { status: 409, data: { errorCode: 'PROJECT_CLOSED', message: 'Project closed' } },
    });
    const fetchLatestFn = vi.fn();

    await expect(
      executeInlineIssueUpdate({
        issueKey: 'TTT-4',
        currentVersion: 2,
        updates: { type: 'BUG' },
        updateFn,
        fetchLatestFn,
      }),
    ).rejects.toMatchObject({ errorCode: 'PROJECT_CLOSED' });

    expect(fetchLatestFn).not.toHaveBeenCalled();
  });
});
