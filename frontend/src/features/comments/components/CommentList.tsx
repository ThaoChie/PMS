import React, { useState } from 'react';
import { Clock, Pencil, Trash2, X, Check } from 'lucide-react';
import type { Comment, User } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';
import { formatDateTime } from '../../../utils/date';
import { MESSAGES } from '../../../constants/messages';

interface CommentListProps {
  comments: Comment[];
  /** Thành viên dự án — dùng để tô đậm phần @mention trong nội dung */
  members?: User[];
  /** Trả về true nếu người đang đăng nhập được sửa/xóa bình luận này */
  canModify?: (comment: Comment) => boolean;
  onEdit?: (commentId: string, content: string) => void | Promise<void>;
  onDelete?: (commentId: string) => void;
  submitting?: boolean;
}

/** Tô đậm phần @Tên người được nhắc trong nội dung bình luận */
function renderContent(content: string, members: User[]): React.ReactNode {
  const names = members
    .map((m) => m.name)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (names.length === 0) return content;

  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`@(${escaped.join('|')})`, 'g');

  return content.split(regex).map((part, idx) =>
    idx % 2 === 1 ? (
      <span key={idx} className="text-[#E53E3E] font-medium">
        @{part}
      </span>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    ),
  );
}

export default function CommentList({
  comments,
  members = [],
  canModify,
  onEdit,
  onDelete,
  submitting = false,
}: CommentListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  if (comments.length === 0) {
    return <p className="text-xs text-[#9B9B9F] text-center py-4">{MESSAGES.COMMENT.EMPTY}</p>;
  }

  function startEdit(c: Comment) {
    setEditingId(c.id);
    setEditingText(c.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText('');
  }

  async function saveEdit(commentId: string) {
    if (!editingText.trim()) return;
    await onEdit?.(commentId, editingText.trim());
    cancelEdit();
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => {
        const editable = !!canModify?.(c) && (!!onEdit || !!onDelete);

        return (
          <div key={c.id} className="flex gap-3 group">
            <UserAvatar
              initials={c.author?.initials}
              name={c.author?.name}
              avatarUrl={c.author?.avatarUrl}
              size="xs"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-[#1A1A1A]">{c.author?.name}</span>
                <span className="text-[10px] text-[#9B9B9F]">{formatDateTime(c.createdAt)}</span>
                {c.updatedAt && (
                  <span className="text-[10px] text-[#9B9B9F] italic">
                    ({MESSAGES.COMMENT.EDITED_LABEL})
                  </span>
                )}
                {c.type === 'log-work' && (
                  <span className="text-[10px] text-[#6B6B70] bg-[#F7F7F8] border border-[#E5E5E7] rounded px-1 py-0.5 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> Đã ghi nhận {c.loggedTime}
                  </span>
                )}
                {editable && editingId !== c.id && (
                  <span className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {onEdit && (
                      <button
                        type="button"
                        title="Sửa bình luận"
                        onClick={() => startEdit(c)}
                        className="p-1 rounded text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#F7F7F8]"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        title="Xóa bình luận"
                        onClick={() => onDelete(c.id)}
                        className="p-1 rounded text-[#6B6B70] hover:text-[#E53E3E] hover:bg-[#FDECEC]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                )}
              </div>

              {editingId === c.id ? (
                <div className="space-y-1.5">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    rows={3}
                    className="w-full text-xs border border-[#E5E5E7] rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#1A1A1A] resize-none"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex items-center gap-1 px-2.5 py-1 border border-[#E5E5E7] text-[10px] text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8]"
                    >
                      <X className="w-3 h-3" /> {MESSAGES.COMMON.CANCEL}
                    </button>
                    <button
                      type="button"
                      disabled={submitting || !editingText.trim()}
                      onClick={() => saveEdit(c.id)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#1A1A1A] text-white text-[10px] font-medium rounded-lg hover:bg-black disabled:opacity-40"
                    >
                      <Check className="w-3 h-3" /> Lưu
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#1A1A1A] leading-relaxed whitespace-pre-wrap break-words">
                  {renderContent(c.content, members)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
