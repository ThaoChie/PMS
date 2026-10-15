import React from 'react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import type { Role } from '../types';

interface ProjectRoleRouteProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProjectRoleRoute: React.FC<ProjectRoleRouteProps> = ({
  allowedRoles,
  children,
  fallback,
}) => {
  const { myProjectRole } = useProjectStore();
  const { role } = useAuthStore();

  const effectiveRole = myProjectRole || role;
  const isAllowed = allowedRoles.includes(effectiveRole);

  if (!isAllowed) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Access Restricted</h2>
        <p className="text-sm text-[#6B6B70] max-w-md">
          You do not have the required role permissions to view this section.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProjectRoleRoute;
