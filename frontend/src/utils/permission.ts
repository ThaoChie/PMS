import type { Role, User } from '../types';

export type PermissionAction =
  | 'project:settings'
  | 'project:close'
  | 'project:create'
  | 'members:manage'
  | 'members:invite'
  | 'workflow:config'
  | 'workflow:approve'
  | 'workflow:reject'
  | 'issue:create'
  | 'issue:edit'
  | 'issue:delete'
  | 'issue:assign'
  | 'issue:logwork'
  | 'issue:comment'
  | 'issue:export';

/**
 * Checks if a user with a given project role has permission to perform an action.
 * Maps directly to the RBAC matrix in context.md.
 */
export function can(
  user: User | null,
  role: Role | string,
  action: PermissionAction,
  context?: { isReporter?: boolean; isAssignee?: boolean; isClosed?: boolean }
): boolean {
  if (!user && role !== 'admin') return false;

  // Project closed check
  if (context?.isClosed && action !== 'project:settings' && action !== 'issue:export') {
    return false;
  }

  // System/Project Admin has full permissions
  if (role === 'admin' || user?.role === 'admin') {
    return true;
  }

  switch (action) {
    case 'project:settings':
    case 'project:close':
    case 'members:manage':
    case 'members:invite':
    case 'workflow:config':
    case 'workflow:approve':
    case 'workflow:reject':
      return role === 'pm';

    case 'project:create':
      return role === 'pm' || role === 'admin';

    case 'issue:create':
    case 'issue:comment':
    case 'issue:export':
      return true; // Any project member

    case 'issue:edit':
      // PM, Reporter or Assignee can edit
      if (role === 'pm') return true;
      return !!(context?.isReporter || context?.isAssignee);

    case 'issue:delete':
      // PM or Reporter can delete
      if (role === 'pm') return true;
      return !!context?.isReporter;

    case 'issue:assign':
      // PM or current Assignee can reassign
      if (role === 'pm') return true;
      return !!context?.isAssignee;

    case 'issue:logwork':
      // Assignee or PM can log work
      if (role === 'pm') return true;
      return !!context?.isAssignee;

    default:
      return false;
  }
}
