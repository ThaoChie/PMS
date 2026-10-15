import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronDown, AlertTriangle, Share2, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { issueService } from '../../../services/issueService';
import { workflowService } from '../../../services/workflowService';
import type { Role, Issue, WorkflowTransition } from '../../../types';
import AttributesPanel from './AttributesPanel';
import SubtaskSection from './SubtaskSection';
import LinkedIssuesSection from './LinkedIssuesSection';
import ActivityTimeline from './ActivityTimeline';
import ShareIssueModal from './ShareIssueModal';

const STATUS_BADGE: Record<string, string> = {
  'To Do': 'text-[#6B6B70] bg-[#F7F7F8] border-[#E5E5E7]',
  'In Progress': 'text-[#1A1A1A] bg-[#EBEBEC] border-[#DCDCDE]',
  'Pending Approval': 'text-[#6B6B70] bg-[#F0F0F1] border-[#E0E0E2]',
  'Done': 'text-[#9B9B9F] bg-[#F7F7F8] border-[#E5E5E7]',
};

interface IssueDetailDrawerProps {
  issueId: string;
  role: Role;
  onClose: () => void;
  onSelectSubtask?: (key: string) => void;
}

export default function IssueDetailDrawer({
  issueId,
  role,
  onClose,
  onSelectSubtask,
}: IssueDetailDrawerProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitions, setTransitions] = useState<any[]>([]);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [concurrentConflict, setConcurrentConflict] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!issueId) return;
    setLoading(true);
    setErrorMessage(null);
    setConcurrentConflict(false);

    try {
      const res = await issueService.getIssue(issueId);
      const raw = res?.data as any;
      if (!raw) return;

      const loaded: Issue = {
        id: String(raw.id),
        key: raw.key || raw.issueKey || '',
        summary: raw.summary || '',
        description: raw.description || '',
        type: raw.type,
        status: raw.status,
        priority: raw.priority,
        assignee: raw.assignee ? {
          id: String(raw.assignee.id),
          name: raw.assignee.fullName || raw.assignee.name || raw.assignee.email,
          email: raw.assignee.email,
          avatarUrl: raw.assignee.avatarUrl,
          role: 'member'
        } : undefined,
        reporter: raw.reporter ? {
          id: String(raw.reporter.id),
          name: raw.reporter.fullName || raw.reporter.name || raw.reporter.email,
          email: raw.reporter.email,
          avatarUrl: raw.reporter.avatarUrl,
          role: 'member'
        } : { id: '0', name: 'Unknown', email: '', role: 'member' },
        labels: raw.labels || [],
        estimates: raw.estimates,
        dueDate: raw.dueDate,
        environment: raw.environment,
        attachments: raw.attachments || [],
        subtasks: raw.subtasks || [],
        linkedIssues: raw.linkedIssues || [],
        comments: raw.comments || [],
        projectId: String(raw.projectId || ''),
        createdAt: raw.createdAt || '',
        updatedAt: raw.updatedAt || '',
        version: raw.version,
      };

      setIssue(loaded);

      // Load available transitions
      const transRes = await workflowService.getTransitions(loaded.key);
      setTransitions(transRes?.data || []);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể tải chi tiết công việc');
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (!issue && loading) {
    return (
      <div className="fixed right-0 top-14 bottom-0 w-[440px] bg-white border-l border-[#E5E5E7] z-40 flex items-center justify-center shadow-xl">
        <RefreshCw className="w-5 h-5 animate-spin text-[#6B6B70]" />
      </div>
    );
  }

  if (!issue) return null;

  const isPendingApproval = issue.status === 'Pending Approval' || issue.status === 'Chờ xác nhận';
  const canApprove = (role === 'pm' || role === 'admin') && isPendingApproval;

  async function handleExecuteTransition(transition: any) {
    if (!issue) return;
    setActionLoading(true);
    setShowStatusMenu(false);
    try {
      await workflowService.executeTransition(issue.key, String(transition.id));
      await fetchDetail();
    } catch (err: any) {
      if (err?.status === 409 || err?.response?.status === 409) {
        setConcurrentConflict(true);
      } else {
        setErrorMessage(err?.response?.data?.message || err?.message || 'Chuyển trạng thái thất bại');
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove() {
    if (!issue) return;
    setActionLoading(true);
    try {
      await workflowService.approveIssue(issue.key);
      await fetchDetail();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Phê duyệt thất bại');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!issue || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await workflowService.rejectIssue(issue.key, rejectReason.trim());
      setShowRejectForm(false);
      setRejectReason('');
      await fetchDetail();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Từ chối thất bại');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!issue) return;
    setActionLoading(true);
    try {
      await issueService.deleteIssue(issue.key);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Xóa công việc thất bại');
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-30" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-14 bottom-0 w-[440px] bg-white border-l border-[#E5E5E7] z-40 flex flex-col issue-drawer shadow-xl">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#E5E5E7] flex items-start gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono text-[#9B9B9F] font-semibold">{issue.key}</span>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                  issue.type === 'Bug' || issue.type === 'BUG'
                    ? 'text-[#E53E3E] bg-[#FDECEC] border-[#E53E3E]/20'
                    : 'text-[#6B6B70] bg-[#F7F7F8] border-[#E5E5E7]'
                }`}
              >
                {issue.type}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-[#1A1A1A] leading-snug">{issue.summary}</h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="text-[#9B9B9F] hover:text-[#1A1A1A] p-1 rounded hover:bg-[#F7F7F8] transition-colors"
              title="Chia sẻ issue"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-[#9B9B9F] hover:text-[#E53E3E] p-1 rounded hover:bg-[#F7F7F8] transition-colors"
              title="Xóa công việc"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-[#9B9B9F] hover:text-[#1A1A1A] p-1 rounded hover:bg-[#F7F7F8] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optimistic locking conflict warning */}
        {concurrentConflict && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại!</span>
            </div>
            <button
              type="button"
              onClick={fetchDetail}
              className="px-2 py-1 bg-amber-600 text-white rounded text-[11px] font-medium"
            >
              Tải lại
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-red-600 font-bold ml-2">
              ×
            </button>
          </div>
        )}

        {/* Status bar & Workflow Transitions */}
        <div className="px-5 py-2.5 border-b border-[#E5E5E7] flex items-center gap-3 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusMenu((s) => !s)}
              disabled={actionLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                STATUS_BADGE[issue.status] || 'text-[#1A1A1A] bg-[#F7F7F8] border-[#E5E5E7]'
              }`}
            >
              {issue.status}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showStatusMenu && (
              <div className="absolute top-9 left-0 bg-white border border-[#E5E5E7] rounded-lg shadow-lg z-20 overflow-hidden min-w-[180px] py-1">
                <div className="px-3 py-1 text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
                  Chuyển trạng thái
                </div>
                {transitions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-[#9B9B9F]">Không có luồng chuyển tiếp</div>
                ) : (
                  transitions.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs hover:bg-[#F7F7F8] text-[#1A1A1A] flex items-center justify-between transition-colors"
                      onClick={() => handleExecuteTransition(t)}
                    >
                      <span>{t.name || t.toStatusName || t.to}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {canApprove && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                disabled={actionLoading}
                className="px-3 py-1.5 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition-colors flex items-center gap-1.5"
                onClick={handleApprove}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>Phê duyệt</span>
              </button>
              <button
                type="button"
                disabled={actionLoading}
                className="px-3 py-1.5 border border-[#E53E3E] text-[#E53E3E] text-xs font-medium rounded-lg hover:bg-[#E53E3E] hover:text-white transition-colors"
                onClick={() => setShowRejectForm(true)}
              >
                Từ chối
              </button>
            </div>
          )}
        </div>

        {/* Reject form */}
        {showRejectForm && (
          <div className="px-5 py-3 border-b border-[#E5E5E7] bg-[#FDECEC] shrink-0">
            <p className="text-xs font-medium text-[#E53E3E] mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Lý do từ chối (bắt buộc)
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Giải thích lý do công việc này bị từ chối…"
              rows={2}
              className="w-full px-3 py-2 border border-[#E53E3E]/30 rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#E53E3E] resize-none bg-white transition-colors"
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="px-3 py-1.5 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-white transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading || !rejectReason.trim()}
                onClick={handleReject}
                className="px-3 py-1.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? 'Đang gửi…' : 'Từ chối & Trả lại'}
              </button>
            </div>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Description */}
          <div>
            <h4 className="text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider mb-2">
              Mô tả
            </h4>
            <div className="text-xs text-[#1A1A1A] leading-relaxed whitespace-pre-wrap bg-[#F7F7F8] rounded-lg p-3 border border-[#E5E5E7]">
              {issue.description || (
                <span className="text-[#9B9B9F] italic">Chưa có thông tin mô tả.</span>
              )}
            </div>
          </div>

          {/* Details / Attributes */}
          <div>
            <h4 className="text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider mb-2">
              Chi tiết công việc
            </h4>
            <AttributesPanel issue={issue} />
          </div>

          {/* Subtasks */}
          <SubtaskSection subtasks={issue.subtasks} onSelectSubtask={onSelectSubtask} />

          {/* Linked issues */}
          <LinkedIssuesSection
            linkedIssues={issue.linkedIssues}
            onSelectIssue={onSelectSubtask}
          />

          {/* Comments & Activity Timeline */}
          <ActivityTimeline comments={issue.comments} status={issue.status} />
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareIssueModal
          issueKey={issue.key}
          issueSummary={issue.summary}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-xl p-5 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">Xác nhận xóa công việc</h3>
            <p className="text-xs text-[#6B6B70] leading-relaxed mb-4">
              Bạn có chắc chắn muốn xóa công việc <span className="font-semibold text-[#1A1A1A]">{issue.key}</span>?
              Mọi công việc con (sub-tasks) liên quan cũng sẽ được xóa mềm.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8]"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDelete}
                className="px-3 py-1.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030]"
              >
                {actionLoading ? 'Đang xóa…' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
