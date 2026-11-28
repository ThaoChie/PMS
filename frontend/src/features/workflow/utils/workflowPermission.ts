import type { Project, User } from '../../../types';

export interface WorkflowPermissionResult {
  isReadOnly: boolean;
  isProjectClosed: boolean;
  isPmOrAdmin: boolean;
  effectiveRole: string;
}

export function computeWorkflowPermissions(
  currentProject: Project | null,
  user: User | null,
  globalRole: string = '',
  myProjectRole: string = '',
): WorkflowPermissionResult {
  const isProjectClosed = Boolean(
    currentProject?.status === 'Closed' || (currentProject as any)?.status === 'CLOSED'
  );

  const memberInProject = currentProject?.members?.find(
    (m) => String(m.id || m.userId) === String(user?.id)
  );

  const effectiveRole = (
    currentProject?.myRole ||
    memberInProject?.role ||
    (user?.role === 'admin' ? 'admin' : myProjectRole) ||
    globalRole ||
    user?.role ||
    ''
  ).toLowerCase();

  const isPmOrAdmin = effectiveRole === 'pm' || effectiveRole === 'admin' || user?.role === 'admin';
  const isReadOnly = Boolean(isProjectClosed || !isPmOrAdmin);

  return {
    isReadOnly,
    isProjectClosed,
    isPmOrAdmin,
    effectiveRole,
  };
}
