export * from './api';
export * from './auth';
export * from './project';
export * from './issue';
export * from './workflow';
export * from './notification';
export * from './report';

// App specific navigation types
export type Screen =
  | 'board'
  | 'issues'
  | 'saved-filters'
  | 'reports'
  | 'profile'
  | 'notifications'
  | 'projects'
  | 'project-settings'
  | 'custom-fields'
  | 'members-roles'
  | 'workflow'
  | 'dashboard'
  | 'invitations'
  | 'issue-detail';

/**
 * Tiêu chí lọc của một bộ lọc đã lưu.
 * Các khóa số nhiều (types, statuses, priorities…) khớp đúng `IssueSearchRequest` của backend.
 * Các khóa số ít được giữ lại ở dạng optional để tương thích dữ liệu cũ.
 */
export interface SavedFilterCriteria {
  projectIds?: Array<string | number>;
  keyword?: string;
  types?: string[];
  statuses?: string[];
  statusIds?: Array<string | number>;
  priorities?: string[];
  assigneeIds?: Array<string | number>;
  reporterIds?: Array<string | number>;
  labels?: string[];
  fromDate?: string;
  toDate?: string;
  quick?: string;
  type?: import('./issue').IssueType[];
  status?: import('./issue').IssueStatus[];
  priority?: import('./issue').Priority[];
  assignee?: string[];
}

export interface SavedFilter {
  id: string;
  name: string;
  owner: import('./auth').User;
  sharedWith: import('./auth').User[];
  emailSubscription: boolean;
  frequency?: 'daily' | 'weekly';
  filters: SavedFilterCriteria;
  /** true nếu bộ lọc đang được chia sẻ cho thành viên dự án */
  isShared?: boolean;
  projectId?: string | null;
}
