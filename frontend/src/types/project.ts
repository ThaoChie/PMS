import type { User, Role } from './auth';

export type ProjectStatus = 'Active' | 'Closed';

export interface ProjectMember {
  id: string;
  user: User;
  role: Role;
  joinedAt: string;
}

export interface ProjectInvitation {
  id: string;
  projectId?: string;
  projectName?: string;
  projectKey?: string;
  email: string;
  role: Role;
  inviter?: User;
  inviterName?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  createdAt?: string;
  expiresAt?: string;
}

export interface ProjectPermissions {
  allowMemberDeleteIssue?: boolean;
  allowMemberDeleteSubtask?: boolean;
  allowMemberConvertSubtask?: boolean;
  allowMemberManageCustomFields?: boolean;
}

export interface Project extends ProjectPermissions {
  id: string;
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  color?: string;
  icon?: string;
  openIssues: number;
  memberCount?: number;
  members: any[];
  createdAt: string;
  myRole?: Role;
}
