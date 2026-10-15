import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';

export function useProjectRole() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const role = useAuthStore((s) => s.role);
  const setRole = useAuthStore((s) => s.setRole);

  const isPM = role === 'pm';
  const isAdmin = role === 'admin';
  const isMember = role === 'member';
  const canManageSettings = isPM || isAdmin;

  return {
    role,
    setRole,
    currentProject,
    isPM,
    isAdmin,
    isMember,
    canManageSettings,
  };
}
