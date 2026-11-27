import { describe, expect, it } from 'vitest';
import { canShowApprovalFeedbackEmail } from '../features/workflow/components/TransitionModal';

describe('canShowApprovalFeedbackEmail', () => {
  it('returns true only when PM/Admin executes APPROVE or REJECT transition', () => {
    expect(canShowApprovalFeedbackEmail({ type: 'APPROVE' }, true)).toBe(true);
    expect(canShowApprovalFeedbackEmail({ type: 'REJECT' }, true)).toBe(true);
    expect(canShowApprovalFeedbackEmail({ type: 'approve' }, true)).toBe(true);
  });

  it('returns false for NORMAL transitions even for PM/Admin', () => {
    expect(canShowApprovalFeedbackEmail({ type: 'NORMAL' }, true)).toBe(false);
    expect(canShowApprovalFeedbackEmail({}, true)).toBe(false);
  });

  it('returns false when user is Member/QA even if transition is APPROVE/REJECT', () => {
    expect(canShowApprovalFeedbackEmail({ type: 'APPROVE' }, false)).toBe(false);
    expect(canShowApprovalFeedbackEmail({ type: 'REJECT' }, false)).toBe(false);
    expect(canShowApprovalFeedbackEmail({ type: 'NORMAL' }, false)).toBe(false);
    expect(canShowApprovalFeedbackEmail({ type: 'APPROVE' }, undefined)).toBe(false);
  });
});
