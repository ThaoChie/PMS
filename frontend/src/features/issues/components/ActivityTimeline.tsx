import React, { useState } from 'react';
import { Clock, Send } from 'lucide-react';
import type { Comment } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';
import { formatDateTime } from '../../../utils/date';

interface ActivityTimelineProps {
  comments: Comment[];
  status: string;
  onAddComment?: (text: string) => void;
  onLogWork?: (timeSpent: string) => void;
}

export default function ActivityTimeline({
  comments,
  status,
  onAddComment,
  onLogWork,
}: ActivityTimelineProps) {
  const [commentText, setCommentText] = useState('');
  const [logTime, setLogTime] = useState('');
  const [showLogTime, setShowLogTime] = useState(false);

  function handleSendComment() {
    if (!commentText.trim()) return;
    onAddComment?.(commentText);
    setCommentText('');
  }

  function handleSendLogWork() {
    if (!logTime.trim()) return;
    onLogWork?.(logTime);
    setLogTime('');
    setShowLogTime(false);
  }

  return (
    <div className="mb-5">
      <h4 className="text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider mb-2">
        Activity
      </h4>

      <div className="space-y-3 mb-3">
        {comments.length === 0 && (
          <p className="text-xs text-[#9B9B9F] text-center py-4">No activity yet</p>
        )}
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
              {c.type === 'status-change' ? (
                <p className="text-xs text-[#6B6B70] italic">
                  Changed status to <strong>{status}</strong>
                </p>
              ) : (
                <p className="text-xs text-[#1A1A1A] leading-relaxed">{c.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Comment input */}
      <div className="flex gap-2.5">
        <UserAvatar initials="AC" size="xs" />
        <div className="flex-1 border border-[#E5E5E7] rounded-lg overflow-hidden focus-within:border-[#1A1A1A] transition-colors bg-white">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment or @mention a teammate…"
            rows={2}
            className="w-full px-3 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9F] focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between px-2 pb-2 gap-2">
            <button
              type="button"
              onClick={() => setShowLogTime((s) => !s)}
              className="flex items-center gap-1 text-[10px] text-[#6B6B70] hover:text-[#1A1A1A] transition-colors"
            >
              <Clock className="w-3 h-3" /> Log work
            </button>
            <button
              type="button"
              disabled={!commentText.trim()}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#E53E3E] text-white text-[10px] font-medium rounded disabled:opacity-40 hover:bg-[#C53030] transition-colors disabled:cursor-not-allowed"
              onClick={handleSendComment}
            >
              <Send className="w-2.5 h-2.5" /> Comment
            </button>
          </div>
          {showLogTime && (
            <div className="flex items-center gap-2 px-2 pb-2 border-t border-[#F0F0F1] pt-2">
              <input
                value={logTime}
                onChange={(e) => setLogTime(e.target.value)}
                placeholder="e.g. 2h 30m"
                className="flex-1 px-2 py-1 text-[10px] border border-[#E5E5E7] rounded focus:outline-none focus:border-[#1A1A1A]"
              />
              <button
                type="button"
                disabled={!logTime.trim()}
                className="px-2 py-1 bg-[#1A1A1A] text-white text-[10px] rounded disabled:opacity-40 hover:bg-[#333] transition-colors"
                onClick={handleSendLogWork}
              >
                Log
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
