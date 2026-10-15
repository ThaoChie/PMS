import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { can, type PermissionAction } from '../utils/permission';

export function usePermission() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const currentProject = useProjectStore((s) => s.currentProject);

  const checkPermission = (
    action: PermissionAction,
    context?: { isReporter?: boolean; isAssignee?: boolean },
  ) => {
    const isClosed = currentProject?.status === 'Closed';
    return can(user, role, action, { ...context, isClosed });
  };

  return {
    can: checkPermission,
    role,
    user,
    isProjectClosed: currentProject?.status === 'Closed',
  };
}
