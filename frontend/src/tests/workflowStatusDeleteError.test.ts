import { describe, it, expect } from 'vitest';
import { formatWorkflowErrorMessage } from '../features/workflow/utils/workflowErrors';

describe('workflowStatusDeleteError', () => {
  it('translates referenced in issue history error into friendly Vietnamese', () => {
    const raw = "Cannot delete status 'In Progress' because it is referenced in issue history";
    expect(formatWorkflowErrorMessage(raw)).toBe(
      "Không thể xóa trạng thái 'In Progress' vì đã có dữ liệu trong lịch sử công việc."
    );
  });

  it('translates active issues error into friendly Vietnamese', () => {
    const raw = "Cannot delete status 'In Progress' because it has 2 active issue(s)";
    expect(formatWorkflowErrorMessage(raw)).toBe(
      "Không thể xóa trạng thái 'In Progress' vì đang có công việc thuộc trạng thái này."
    );
  });

  it('preserves Vietnamese backend message directly', () => {
    const raw = "Không thể xóa trạng thái 'In Progress' vì trạng thái này đã được ghi nhận trong lịch sử công việc";
    expect(formatWorkflowErrorMessage(raw)).toBe(raw);
  });

  it('falls back to default message if empty', () => {
    expect(formatWorkflowErrorMessage('')).toBe('Lỗi khi lưu quy trình');
  });
});
