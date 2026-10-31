import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  AtSign,
  User as UserIcon,
  CheckCircle2,
  FolderKanban,
  AlertCircle,
  Check,
  Menu,
} from 'lucide-react';
import type { Role, Screen, User, Notification } from '../../types';
import UserAvatar from '../common/UserAvatar';
import { formatRelativeTime } from '../../utils/date';
import { useNotificationStore } from '../../store/notificationStore';
import { useUIStore } from '../../store/uiStore';

interface TopbarProps {
  role?: Role;
  user: User;
  notifications: Notification[];
  onRoleChange?: (role: Role) => void;
  onSearch: () => void;
  onCreateIssue: () => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

export default function Topbar({
  role,
  user,
  notifications,
  onRoleChange,
  onSearch,
  onCreateIssue,
  onNavigate,
  onLogout,
}: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { markAsRead, markAllAsRead } = useNotificationStore();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function renderNotifIcon(type: string) {
    if (type === 'mention') return <AtSign className="w-3.5 h-3.5 text-[#6B6B70]" />;
    if (type === 'assignment') return <UserIcon className="w-3.5 h-3.5 text-[#6B6B70]" />;
    if (type === 'approval') return <CheckCircle2 className="w-3.5 h-3.5 text-[#6B6B70]" />;
    if (type === 'invite') return <FolderKanban className="w-3.5 h-3.5 text-[#6B6B70]" />;
    return <AlertCircle className="w-3.5 h-3.5 text-[#6B6B70]" />;
  }

  return (
    <header
      className="h-14 border-b border-[#E5E5E7] flex items-center gap-3 px-5 bg-white shrink-0"
      onClick={(e) => {
        e.stopPropagation();
        setNotifOpen(false);
        setUserDropdownOpen(false);
      }}
    >
      {/* Toggle sidebar button for tablet & desktop */}
      <button
        type="button"
        title="Thu gọn / Mở rộng menu"
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F7F7F8] text-[#6B6B70] transition-colors shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          toggleSidebar();
        }}
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Search trigger */}
      <button
        type="button"
        className="flex-1 max-w-xs flex items-center gap-2 px-3 py-2 bg-[#F7F7F8] border border-[#E5E5E7] rounded-lg text-sm text-[#6B6B70] hover:border-[#C5C5C8] transition-colors"
        onClick={onSearch}
      >
        <Search className="w-3.5 h-3.5" />
        <span className="text-xs">Tìm kiếm công việc, dự án…</span>
        <kbd className="ml-auto text-[10px] text-[#9B9B9F] border border-[#E5E5E7] rounded px-1 py-0.5">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notification bell */}
        <div className="relative">
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F7F7F8] transition-colors relative"
            onClick={(e) => {
              e.stopPropagation();
              setNotifOpen((o) => !o);
              setUserDropdownOpen(false);
            }}
          >
            <Bell className="w-4 h-4 text-[#6B6B70]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#E53E3E] rounded-full" />
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-10 w-96 bg-white border border-[#E5E5E7] rounded-xl shadow-lg z-50 overflow-hidden fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5E7]">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#1A1A1A]">Thông báo</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#E53E3E] text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="text-[11px] text-[#6B6B70] hover:text-[#1A1A1A] flex items-center gap-1"
                      onClick={() => markAllAsRead()}
                    >
                      <Check className="w-3 h-3" /> Đã đọc hết
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-[11px] text-[#E53E3E] hover:text-[#C53030] font-medium"
                    onClick={() => {
                      onNavigate('notifications');
                      setNotifOpen(false);
                    }}
                  >
                    Xem tất cả
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-[#F0F0F1]">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#9B9B9F]">
                    Không có thông báo nào
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-[#F7F7F8] cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-[#FAFAFA]' : ''
                      }`}
                      onClick={() => {
                        markAsRead(n.id);
                        setNotifOpen(false);
                        if (n.type === 'invite') {
                          onNavigate('invitations');
                        } else if (n.sourceId) {
                          onNavigate('board');
                        }
                      }}
                    >
                      <div className="w-7 h-7 rounded-full bg-[#F7F7F8] border border-[#E5E5E7] flex items-center justify-center shrink-0 mt-0.5">
                        {renderNotifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${!n.isRead ? 'font-semibold text-[#1A1A1A]' : 'text-[#1A1A1A]'} truncate`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-[#6B6B70] mt-0.5 line-clamp-2">
                          {n.description}
                        </p>
                        <p className="text-[10px] text-[#9B9B9F] mt-1">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="w-2 h-2 bg-[#E53E3E] rounded-full shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Create Issue */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] transition-colors"
          onClick={onCreateIssue}
        >
          <Plus className="w-3.5 h-3.5" />
          Tạo công việc
        </button>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#F7F7F8] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setUserDropdownOpen((o) => !o);
              setNotifOpen(false);
            }}
          >
            <UserAvatar initials={user.initials} name={user.name} avatarUrl={user.avatarUrl} size="sm" />
          </button>

          {userDropdownOpen && (
            <div
              className="absolute right-0 top-10 w-52 bg-white border border-[#E5E5E7] rounded-xl shadow-lg z-50 overflow-hidden fade-in py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2 border-b border-[#E5E5E7]">
                <p className="text-xs font-semibold text-[#1A1A1A] truncate">{user.name}</p>
                <p className="text-[10px] text-[#9B9B9F] truncate">{user.email}</p>
              </div>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
                onClick={() => {
                  onNavigate('profile');
                  setUserDropdownOpen(false);
                }}
              >
                Hồ sơ cá nhân
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
                onClick={() => {
                  onNavigate('invitations');
                  setUserDropdownOpen(false);
                }}
              >
                Lời mời dự án
              </button>
              <div className="border-t border-[#E5E5E7] my-1" />
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-[#E53E3E] hover:bg-[#FDECEC] transition-colors"
                onClick={onLogout}
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
