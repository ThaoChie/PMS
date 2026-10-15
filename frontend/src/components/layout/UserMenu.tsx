import React, { useState } from 'react';
import { User as UserIcon, LogOut, Mail } from 'lucide-react';
import type { User } from '../../types';
import UserAvatar from '../common/UserAvatar';

interface UserMenuProps {
  user: User;
  onNavigateProfile: () => void;
  onNavigateInvitations?: () => void;
  onLogout: () => void;
}

export default function UserMenu({
  user,
  onNavigateProfile,
  onNavigateInvitations,
  onLogout,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/60 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((o) => !o);
        }}
      >
        <UserAvatar initials={user.initials} size="sm" />
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-medium text-[#1A1A1A] truncate">{user.name}</p>
          <p className="text-[10px] text-[#6B6B70] truncate">{user.email}</p>
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute bottom-14 left-0 w-52 bg-white border border-[#E5E5E7] rounded-lg shadow-sm z-50 overflow-hidden fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
            onClick={() => {
              onNavigateProfile();
              setIsOpen(false);
            }}
          >
            <UserIcon className="w-4 h-4 text-[#6B6B70]" /> Profile
          </button>
          {onNavigateInvitations && (
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
              onClick={() => {
                onNavigateInvitations();
                setIsOpen(false);
              }}
            >
              <Mail className="w-4 h-4 text-[#6B6B70]" /> Invitations
            </button>
          )}
          <div className="border-t border-[#E5E5E7]" />
          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#E53E3E] hover:bg-[#F7F7F8] transition-colors"
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
