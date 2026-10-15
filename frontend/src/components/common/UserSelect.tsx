import React from 'react';
import type { User } from '../../types';
import UserAvatar from './UserAvatar';

interface UserSelectProps {
  users: User[];
  value?: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  className?: string;
}

export default function UserSelect({
  users,
  value,
  onChange,
  placeholder = 'Chọn thành viên',
  className = '',
}: UserSelectProps) {
  const selectedUser = users.find((u) => u.id === value);

  return (
    <div className={`relative ${className}`}>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs border border-[#E5E5E7] rounded-lg px-3 py-2 bg-white appearance-none focus:outline-none focus:border-[#1A1A1A] cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.email})
          </option>
        ))}
      </select>
    </div>
  );
}
