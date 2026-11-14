import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import type { Comment, Role, User } from '../../../types';
import { commentService } from '../../../services/commentService';
import { memberService } from '../../../services/memberService';
import { mapUserResponseToUser, useAuthStore } from '../../../store/authStore';
import { collectMentionIds, mapMemberToUser } from '../../../utils/member';
import { toast } from '../../../store/toastStore';
import { MESSAGES } from '../../../constants/messages';
import LoadingSkeleton from '../../../components/common/LoadingSkeleton';
import ErrorState from '../../../components/common/ErrorState';
import ConfirmModal from '../../../components/common/ConfirmModal';
import CommentEditor from './CommentEditor';
import CommentList from './CommentList';

interface CommentSectionProps {
  /** Mã công việc, ví dụ "EPMS-12" */
  issueKey: string;
  /** Id dự án — dùng để lấy danh sách thành viên cho @mention */
  projectId?: string;
  /** Vai trò của người đang đăng nhập trong dự án hiện tại */
  role?: Role;
  /** Gọi lại sau khi thêm/sửa/xóa bình luận */
  onChanged?: () => void;
}

function mapComment(raw: any): Comment {
  return {
    id: String(raw?.id ?? ''),
    author: mapUserResponseToUser(raw?.author),
    content: raw?.content || '',
    createdAt: raw?.createdAt || '',
    updatedAt: raw?.updatedAt || null,
    type: (raw?.type as Comment['type']) || 'comment',
    mentionedUserIds: Array.isArray(raw?.mentionedUserIds)
      ? raw.mentionedUserIds.map((id: any) => String(id))
      : [],
  };
}

export default function CommentSection({
  issueKey,
  projectId,
  role,
  onChanged,
}: CommentSectionProps) {
  const currentUser = useAuthStore((s) => s.user);

  const [comments, setComments] = useState<Comment[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isPmOrAdmin = role === 'pm' || role === 'admin';

  const fetchComments = useCallback(async () => {
    if (!issueKey) return;
    setLoading(true);
    setLoadFailed(false);
    try {
      const res = await commentService.getComments(issueKey);
      const raw: any = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : raw?.content || [];
      setComments(list.map(mapComment));
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (!projectId) {
      setMembers([]);
      return;
    }
    let active = true;
    memberService
      .getMembers(projectId)
      .then((res) => {
        if (!active) return;
        const raw: any = res?.data;
        const list: any[] = Array.isArray(raw) ? raw : raw?.content || [];
        // Dùng mã NGƯỜI DÙNG (userId), không phải mã thành viên dự án (id)
        setMembers(list.map(mapMemberToUser));
      })
      .catch(() => {
        if (active) setMembers([]);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  function canModify(comment: Comment): boolean {
    if (isPmOrAdmin) return true;
    return !!currentUser?.id && String(comment.author?.id) === String(currentUser.id);
  }

  async function handleCreate(content: string, mentions?: string[]) {
    if (!content.trim()) {
      toast.error(MESSAGES.COMMENT.CONTENT_REQUIRED);
      return;
    }
    setSubmitting(true);
    try {
      // Người được chọn từ gợi ý + người được gõ tay "@Tên"; chỉ giữ thành viên dự án (BR-COL-02)
      const validMentions = collectMentionIds(content, members, mentions || []);
      await commentService.createComment(issueKey, content.trim(), validMentions);
      toast.success(MESSAGES.COMMENT.CREATE_SUCCESS);
      await fetchComments();
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || MESSAGES.COMMON.ACTION_FAILED);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(commentId: string, content: string) {
    setSubmitting(true);
    try {
      await commentService.updateComment(issueKey, commentId, content);
      toast.success(MESSAGES.COMMENT.UPDATE_SUCCESS);
      await fetchComments();
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || MESSAGES.COMMON.ACTION_FAILED);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      await commentService.deleteComment(issueKey, deletingId);
      toast.success(MESSAGES.COMMENT.DELETE_SUCCESS);
      setDeletingId(null);
      await fetchComments();
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || MESSAGES.COMMON.ACTION_FAILED);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-2">
        <MessageSquare className="w-3.5 h-3.5 text-[#6B6B70]" />
        <h4 className="text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
          {MESSAGES.COMMENT.SECTION_TITLE}
          {comments.length > 0 && ` (${comments.length})`}
        </h4>
      </div>

      {loading && <LoadingSkeleton lines={3} className="mb-3" />}

      {!loading && loadFailed && (
        <ErrorState
          title={MESSAGES.COMMENT.LOAD_FAILED}
          message={MESSAGES.COMMON.NETWORK_ERROR}
          onRetry={fetchComments}
          className="mb-3"
        />
      )}

      {!loading && !loadFailed && (
        <div className="mb-3">
          <CommentList
            comments={comments}
            members={members}
            canModify={canModify}
            onEdit={handleEdit}
            onDelete={(id) => setDeletingId(id)}
            submitting={submitting}
          />
        </div>
      )}

      <CommentEditor
        currentUser={currentUser || undefined}
        members={members}
        onSubmit={handleCreate}
        placeholder={MESSAGES.COMMENT.PLACEHOLDER}
      />

      <ConfirmModal
        isOpen={!!deletingId}
        title={MESSAGES.COMMENT.SECTION_TITLE}
        message={MESSAGES.COMMENT.DELETE_CONFIRM}
        confirmLabel="Xóa"
        isDanger
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
