export type ApprovalRequestType = 'PROJECT_CLOSE' | 'WORKFLOW_CONFIG_CHANGE';
export type ApprovalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
export type ApprovalStepStatus = 'WAITING' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
export type ApprovalApplyStatus = 'NOT_APPLIED' | 'APPLIED' | 'FAILED';
export type ApprovalApproverRole = 'PM' | 'ADMIN';

export interface UserSummary {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface ProjectSummary {
  id: number;
  key: string;
  name: string;
}

export interface ApprovalStep {
  level: number;
  approverRole: ApprovalApproverRole;
  status: ApprovalStepStatus;
  decidedBy?: UserSummary | null;
  comment?: string | null;
  decidedAt?: string | null;
}

export interface ApprovalRequest {
  id: number;
  type: ApprovalRequestType;
  status: ApprovalRequestStatus;
  applyStatus: ApprovalApplyStatus;
  project: ProjectSummary;
  requester: UserSummary;
  reason: string;
  payload?: any | null;
  steps: ApprovalStep[];
  currentLevel?: number | null;
  canIDecide: boolean;
  createdAt: string;
  completedAt?: string | null;
}

export interface ApprovalPolicy {
  enabled: boolean;
  closeRequiresApproval: boolean;
  workflowChangeRequiresApproval: boolean;
}

export interface CreateApprovalRequestPayload {
  projectId?: number;
  type: ApprovalRequestType;
  reason: string;
  payload?: any;
}

export interface ApprovalDecisionPayload {
  comment?: string;
}
