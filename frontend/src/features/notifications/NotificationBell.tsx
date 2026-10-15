import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import type { NotificationItem as NotificationModel } from '../../types';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationBellProps {
  notifications: NotificationModel[];
  onRead: (id: string) => void;
  onReadAll: () => void;
  onViewAll?: () => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onRead,
  onReadAll,
  onViewAll,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#F7F7F8] rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E53E3E] rounded-full ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 z-50">
          <NotificationDropdown
            notifications={notifications}
            onRead={onRead}
            onReadAll={onReadAll}
            onViewAll={onViewAll}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
