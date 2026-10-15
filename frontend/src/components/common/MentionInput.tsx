import React, { useState } from 'react';
import type { User } from '../../types';
import UserAvatar from './UserAvatar';

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions?: string[]) => void;
  members: User[];
  placeholder?: string;
  className?: string;
}

export default function MentionInput({
  value,
  onChange,
  members,
  placeholder = 'Nhập nội dung, dùng @ để nhắc tên...',
  className = '',
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [query, setQuery] = useState('');

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    onChange(val);

    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1 && lastAt === val.length - 1) {
      setShowSuggestions(true);
      setQuery('');
    } else if (lastAt !== -1 && val.slice(lastAt).indexOf(' ') === -1) {
      setShowSuggestions(true);
      setQuery(val.slice(lastAt + 1).toLowerCase());
    } else {
      setShowSuggestions(false);
    }
  }

  function handleSelectMember(member: User) {
    const lastAt = value.lastIndexOf('@');
    const newValue = value.slice(0, lastAt) + `@${member.name} `;
    onChange(newValue, [member.id]);
    setShowSuggestions(false);
  }

  const filteredMembers = members.filter(
    (m) => m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query),
  );

  return (
    <div className={`relative ${className}`}>
      <textarea
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        rows={3}
        className="w-full text-xs border border-[#E5E5E7] rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#1A1A1A] resize-none"
      />
      {showSuggestions && filteredMembers.length > 0 && (
        <div className="absolute left-0 bottom-full mb-1 w-60 bg-white border border-[#E5E5E7] rounded-lg shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
          {filteredMembers.map((m) => (
            <button
              key={m.id}
              type="button"
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-[#F7F7F8] transition-colors"
              onClick={() => handleSelectMember(m)}
            >
              <UserAvatar initials={m.initials} size="xs" />
              <div className="min-w-0 flex-1 truncate">
                <p className="font-medium text-[#1A1A1A] truncate">{m.name}</p>
                <p className="text-[10px] text-[#6B6B70] truncate">{m.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
