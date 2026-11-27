import React, { useEffect, useState } from 'react';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface UserAvatarProps {
  initials: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  avatarUrl?: string;
  className?: string;
}

const SIZES = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

export default function UserAvatar({
  initials,
  name,
  size = 'sm',
  avatarUrl,
  className = '',
}: UserAvatarProps) {
  const safeInitials = (initials || (name ? name.slice(0, 2) : 'U')).toUpperCase();
  const resolvedUrl = resolveMediaUrl(avatarUrl);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [resolvedUrl]);

  if (resolvedUrl && !imgError) {
    return (
      <img
        src={resolvedUrl}
        alt={name || safeInitials}
        onError={() => setImgError(true)}
        className={`${SIZES[size]} rounded-full object-cover shrink-0 select-none border border-[#E5E5E7] ${className}`}
      />
    );
  }

  return (
    <div
      title={name}
      className={`${SIZES[size]} rounded-full bg-[#1A1A1A] text-white font-medium flex items-center justify-center shrink-0 select-none ${className}`}
    >
      {safeInitials}
    </div>
  );
}

export { UserAvatar as Avatar };
