export const ISSUE_CHANGED_EVENT = 'epms:issues-changed';

export interface IssueEventDetail {
  projectId?: string;
  issueKey?: string;
  issueId?: string;
  action?: 'create' | 'update' | 'delete' | 'assign' | 'status_change';
  issue?: any;
}

/**
 * Phát sự kiện khi công việc được tạo mới, cập nhật hoặc xóa
 * để tất cả các màn hình (Danh sách công việc, Bảng Kanban, Dashboard)
 * tự động đồng bộ thời gian thực mà người dùng không cần bấm nút refresh.
 */
export function notifyIssueChanged(detail?: IssueEventDetail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ISSUE_CHANGED_EVENT, { detail: detail || {} }));
  }
}
