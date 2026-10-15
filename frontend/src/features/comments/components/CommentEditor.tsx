import React, { useState } from 'react';
import { Send } from 'lucide-react';
import type { User } from '../../../types';
import MentionInput from '../../../components/common/MentionInput';
import UserAvatar from '../../../components/common/UserAvatar';

interface CommentEditorProps {
  currentUser?: User;
  members?: User[];
  onSubmit: (content: string, mentions?: string[]) => void;
  placeholder?: string;
}

export default function CommentEditor({
  currentUser,
  members = [],
  onSubmit,
  placeholder = 'Add a comment or @mention a teammate…',
}: CommentEditorProps) {
  const [content, setContent] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);

  function handleSubmit() {
    if (!content.trim()) return;
    onSubmit(content, mentions);
    setContent('');
    setMentions([]);
  }

  return (
    <div className="flex gap-2.5">
      <UserAvatar initials={currentUser?.initials || 'ME'} size="xs" />
      <div className="flex-1 space-y-2">
        <MentionInput
          value={content}
          onChange={(val, m) => {
            setContent(val);
            if (m) setMentions(m);
          }}
          members={members}
          placeholder={placeholder}
        />
        <div className="flex justify-end">
          <button
            type="button"
            disabled={!content.trim()}
            onClick={handleSubmit}
            className="flex items-center gap-1 px-3 py-1 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3 h-3" /> Comment
          </button>
        </div>
      </div>
    </div>
  );
}
