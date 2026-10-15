import type { IssueStatus } from './issue';

export type StatusCategory = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface WorkflowStatus {
  id: string;
  name: IssueStatus | string;
  category: StatusCategory;
  position: number;
  isInitial: boolean;
}

export interface WorkflowTransition {
  id: string;
  name?: string;
  from: IssueStatus;
  to: IssueStatus;
  requiresField?: string;
  isApprovalStep: boolean;
}
