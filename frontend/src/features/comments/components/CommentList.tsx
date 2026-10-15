import React from 'react';
import type { Comment } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';
import { formatDateTime } from '../../../utils/date';
import { Clock } from 'lucide-react';

interface CommentListProps {
  comments: Comment[];
}

export default function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return <p className="text-xs text-[#9B9B9F] text-center py-4">Chưa có bình luận nào</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-3">
          <UserAvatar initials={c.author.initials} size="xs" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-[#1A1A1A]">{c.author.name}</span>
              <span className="text-[10px] text-[#9B9B9F]">{formatDateTime(c.createdAt)}</span>
              {c.type === 'log-work' && (
                <span className="text-[10px] text-[#6B6B70] bg-[#F7F7F8] border border-[#E5E5E7] rounded px-1 py-0.5 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> Logged {c.loggedTime}
                </span>
              )}
            </div>
            <p className="text-xs text-[#1A1A1A] leading-relaxed">{c.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
