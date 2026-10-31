import React from 'react';
import { getProjectIconComponent } from '../constants/projectBranding';

interface ProjectBadgeProps {
  color?: string;
  icon?: string;
  projectKey?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function ProjectBadge({
  color = '#1A1A1A',
  icon = 'folder',
  projectKey = 'PR',
  size = 'md',
  className = '',
}: ProjectBadgeProps) {
  const IconComponent = getProjectIconComponent(icon);

  const sizeClasses = {
    xs: 'w-5 h-5 rounded text-[9px]',
    sm: 'w-7 h-7 rounded-md text-[10px]',
    md: 'w-8 h-8 rounded-lg text-xs',
    lg: 'w-10 h-10 rounded-xl text-sm',
    xl: 'w-12 h-12 rounded-xl text-base',
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  }[size];

  const initials = (projectKey || 'PR').slice(0, 2).toUpperCase();

  return (
    <div
      style={{ backgroundColor: color || '#1A1A1A' }}
      className={`${sizeClasses} flex items-center justify-center text-white font-bold shrink-0 shadow-xs transition-transform ${className}`}
    >
      {IconComponent ? (
        <IconComponent className={`${iconSizes} text-white stroke-[2.2]`} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
