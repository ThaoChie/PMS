import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ISSUE_CHANGED_EVENT, notifyIssueChanged, type IssueEventDetail } from '../utils/issueEvents';

describe('issueEvents', () => {
  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    const target = new EventTarget();
    (globalThis as any).window = {
      addEventListener: target.addEventListener.bind(target),
      removeEventListener: target.removeEventListener.bind(target),
      dispatchEvent: target.dispatchEvent.bind(target),
    };
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  it('dispatches ISSUE_CHANGED_EVENT with proper detail when notifyIssueChanged is called', () => {
    const handler = vi.fn();
    (globalThis as any).window.addEventListener(ISSUE_CHANGED_EVENT, handler);

    const detail: IssueEventDetail = {
      projectId: 'proj-123',
      issueKey: 'PROJ-1',
      action: 'create',
      issue: { id: '1', key: 'PROJ-1', summary: 'Test task' },
    };

    notifyIssueChanged(detail);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<IssueEventDetail>;
    expect(event.type).toBe(ISSUE_CHANGED_EVENT);
    expect(event.detail).toEqual(detail);

    (globalThis as any).window.removeEventListener(ISSUE_CHANGED_EVENT, handler);
  });

  it('handles notifyIssueChanged without arguments safely', () => {
    const handler = vi.fn();
    (globalThis as any).window.addEventListener(ISSUE_CHANGED_EVENT, handler);

    notifyIssueChanged();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<IssueEventDetail>;
    expect(event.detail).toEqual({});

    (globalThis as any).window.removeEventListener(ISSUE_CHANGED_EVENT, handler);
  });

  it('does not throw when window is undefined', () => {
    delete (globalThis as any).window;
    expect(() => notifyIssueChanged()).not.toThrow();
  });
});
