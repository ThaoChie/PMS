export enum SystemRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

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
