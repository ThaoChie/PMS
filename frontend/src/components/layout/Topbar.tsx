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
import { useNow } from '../../hooks/useNow';
import { useUIStore } from '../../store/uiStore';
import {
  resolveNotificationTarget,
  executeNotificationNavigation,
} from '../../utils/notificationNavigation';

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
  // Nhịp đồng hồ 30 giây: nhãn "x phút trước" trong chuông thông báo tự chạy
  const now = useNow(30000);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);

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
      className="h-14 border-b border-[#E5E5E7] flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-5 bg-white shrink-0 w-full relative z-20"
      onClick={(e) => {
        e.stopPropagation();
        setNotifOpen(false);
        setUserDropdownOpen(false);
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Toggle sidebar button: mobile opens mobile drawer, desktop toggles collapse */}
        <button
          type="button"
          title="Thu gọn / Mở rộng menu"
          className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-[#F7F7F8] text-[#6B6B70] transition-colors shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              toggleMobileSidebar();
            } else {
              toggleSidebar();
            }
          }}
        >
          <Menu className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>

        {/* Mobile search trigger icon */}
        <button
          type="button"
          aria-label="Tìm kiếm công việc, dự án"
          className="sm:hidden w-11 h-11 flex items-center justify-center rounded-lg hover:bg-[#F7F7F8] text-[#6B6B70] border border-[#E5E5E7] transition-colors shrink-0"
          onClick={onSearch}
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Tablet & Desktop search bar trigger */}
        <button
          type="button"
          className="hidden sm:flex flex-1 max-w-xs items-center gap-2 px-3 py-2 bg-[#F7F7F8] border border-[#E5E5E7] rounded-lg text-sm text-[#6B6B70] hover:border-[#C5C5C8] transition-colors"
          onClick={onSearch}
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs truncate">Tìm kiếm công việc, dự án…</span>
          <kbd className="ml-auto text-[10px] text-[#9B9B9F] border border-[#E5E5E7] rounded px-1 py-0.5 shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Notification bell */}
        <div className="relative">
          <button
            type="button"
            aria-label="Thông báo"
            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-[#F7F7F8] transition-colors relative"
            onClick={(e) => {
              e.stopPropagation();
              setNotifOpen((o) => !o);
              setUserDropdownOpen(false);
            }}
          >
            <Bell className="w-5 h-5 sm:w-4 sm:h-4 text-[#6B6B70]" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#E53E3E] rounded-full" />
            )}
          </button>

          {notifOpen && (
            <div
              className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 w-auto sm:w-96 max-w-sm bg-white border border-[#E5E5E7] rounded-xl shadow-2xl z-50 overflow-hidden fade-in"
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
                      className="text-[11px] text-[#6B6B70] hover:text-[#1A1A1A] flex items-center gap-1 py-1"
                      onClick={() => markAllAsRead()}
                    >
                      <Check className="w-3 h-3" /> Đã đọc hết
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-[11px] text-[#E53E3E] hover:text-[#C53030] font-medium py-1"
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
                        const target = resolveNotificationTarget(n, 'bell');
                        void executeNotificationNavigation(target, onNavigate);
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
                          {formatRelativeTime(n.createdAt, now)}
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

        {/* Create Issue button */}
        <button
          id="topbar-create-issue-btn"
          type="button"
          aria-label="Tạo công việc"
          className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 bg-[#E53E3E] text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-[#C53030] transition-colors shrink-0"
          onClick={onCreateIssue}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Tạo công việc</span>
        </button>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            type="button"
            aria-label="Menu cá nhân"
            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-[#F7F7F8] transition-colors"
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
              className="absolute right-0 top-12 w-52 bg-white border border-[#E5E5E7] rounded-xl shadow-xl z-50 overflow-hidden fade-in py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2 border-b border-[#E5E5E7]">
                <p className="text-xs font-semibold text-[#1A1A1A] truncate">{user.name}</p>
                <p className="text-[10px] text-[#9B9B9F] truncate">{user.email}</p>
              </div>
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 text-xs sm:text-sm text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
                onClick={() => {
                  onNavigate('profile');
                  setUserDropdownOpen(false);
                }}
              >
                Hồ sơ cá nhân
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 text-xs sm:text-sm text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
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
                className="w-full text-left px-3 py-2.5 text-xs sm:text-sm text-[#E53E3E] hover:bg-[#FDECEC] transition-colors font-medium"
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
