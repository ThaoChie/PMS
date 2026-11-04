export enum ProjectRole {
  ADMIN = 'ADMIN',
  PM = 'PM',
  DEVELOPER = 'DEVELOPER',
  QA = 'QA',
}

export enum IssueType {
  STORY = 'Story',
  BUG = 'Bug',
  TASK = 'Task',
  EPIC = 'Epic',
  SUB_TASK = 'Sub-task',
}

export enum Priority {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum IssueStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  PENDING_APPROVAL = 'Pending Approval',
  DONE = 'Done',
}

export enum StatusCategory {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum NotificationGroup {
  MENTION = 'mention',
  ASSIGNMENT = 'assignment',
  WORKFLOW = 'workflow',
  APPROVAL = 'approval',
  INVITE = 'invite',
}

export enum QuickFilter {
  MY_OPEN = 'MY_OPEN',
  REPORTED_BY_ME = 'REPORTED_BY_ME',
  OPEN = 'OPEN',
  DONE = 'DONE',
  RECENTLY_VIEWED = 'RECENTLY_VIEWED',
  RECENTLY_CREATED = 'RECENTLY_CREATED',
  RECENTLY_UPDATED = 'RECENTLY_UPDATED',
}

export enum ExportFormat {
  XLSX = 'xlsx',
  CSV = 'csv',
}

/**
 * Giá trị enum ĐÚNG theo hợp đồng API (API_DOCUMENTATION.md mục 1) kèm nhãn tiếng Việt.
 * Dùng cho mọi bộ lọc/tìm kiếm gửi lên backend — không dùng chuỗi hiển thị ('Story', 'Critical'…).
 */
export const ISSUE_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'EPIC', label: 'Epic (Tính năng lớn)' },
  { value: 'TASK', label: 'Task (Tác vụ)' },
  { value: 'BUG', label: 'Bug (Lỗi)' },
  { value: 'SUB_TASK', label: 'Sub-task (Tác vụ con)' },
];

export const PRIORITY_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'HIGHEST', label: 'Khẩn cấp nhất' },
  { value: 'HIGH', label: 'Cao' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'LOW', label: 'Thấp' },
  { value: 'LOWEST', label: 'Rất thấp' },
];

/** Bộ lọc nhanh — giá trị khớp `quick` mà IssueSearchDao của backend hiểu được */
export const QUICK_FILTER_OPTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'MY_OPEN', label: 'Việc của tôi đang mở' },
  { id: 'REPORTED_BY_ME', label: 'Tôi đã báo cáo' },
  { id: 'OPEN', label: 'Chưa hoàn thành' },
  { id: 'DONE', label: 'Đã hoàn thành' },
  { id: 'CRITICAL', label: 'Khẩn cấp nhất' },
  { id: 'RECENTLY_UPDATED', label: 'Vừa cập nhật' },
];
