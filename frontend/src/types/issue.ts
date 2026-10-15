import type { User } from './auth';

export type IssueType = 'Story' | 'Bug' | 'Task' | 'Epic' | 'Sub-task';
export type IssueStatus = 'To Do' | 'In Progress' | 'Pending Approval' | 'Done';
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface SubTask {
  id: string;
  key: string;
  summary: string;
  status: IssueStatus;
  assignee?: User;
}

export interface LinkedIssue {
  id: string;
  key: string;
  summary: string;
  relation: 'blocks' | 'is blocked by' | 'relates to' | 'duplicates';
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: string;
  type: 'comment' | 'log-work' | 'status-change' | 'assignment';
  loggedTime?: string;
}

export interface Worklog {
  id: string;
  author: User;
  timeSpent: string;
  timeSpentMinutes: number;
  date: string;
  comment?: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  key: string;
  summary: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: Priority;
  assignee?: User;
  reporter: User;
  labels: string[];
  estimates?: string;
  dueDate?: string;
  environment?: string;
  attachments: string[];
  subtasks: SubTask[];
  linkedIssues: LinkedIssue[];
  comments: Comment[];
  projectId: string;
  epicLink?: string;
  createdAt: string;
  updatedAt: string;
  version?: number;
}
