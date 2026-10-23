import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronDown, AlertTriangle, Share2, Trash2, CheckCircle2, RefreshCw, Pencil, Copy, Check, ExternalLink } from 'lucide-react';
import { issueService } from '../../../services/issueService';
import { workflowService } from '../../../services/workflowService';
import { memberService } from '../../../services/memberService';
import { useProjectStore } from '../../../store/projectStore';
import type { Role, Issue } from '../../../types';
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
  onUpdated?: () => void;
}

export default function IssueDetailDrawer({
  issueId,
  role,
  onClose,
  onSelectSubtask,
  onUpdated,
}: IssueDetailDrawerProps) {
  const { currentProject } = useProjectStore();
  // All hooks must be declared before any conditional return statements!
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
  const [copiedLink, setCopiedLink] = useState(false);

  const isSubtask = issue?.type?.toUpperCase() === 'SUB_TASK' || issue?.type === 'Sub-task' || !!issue?.parentId;
  const isPmOrAdmin = role === 'pm' || role === 'admin';
  const canDelete =
    isPmOrAdmin ||
    (isSubtask
      ? Boolean(currentProject?.allowMemberDeleteSubtask)
      : Boolean(currentProject?.allowMemberDeleteIssue));

  // Edit form state (for full form toggle)
  const [isEditing, setIsEditing] = useState(false);
  const [projectMembers, setProjectMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [editForm, setEditForm] = useState({
    summary: '',
    description: '',
    type: 'TASK' as any,
    priority: 'MEDIUM' as any,
    assigneeId: '',
    dueDate: '',
    estimates: '',
    environment: '',
  });

  // Direct inline editing states
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryValue, setSummaryValue] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [showTypeMenu, setShowTypeMenu] = useState(false);

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
        assignee: raw.assignee
          ? {
              id: String(raw.assignee.id),
              name: raw.assignee.fullName || raw.assignee.name || raw.assignee.email,
              email: raw.assignee.email,
              avatarUrl: raw.assignee.avatarUrl,
              role: 'member',
            }
          : undefined,
        reporter: raw.reporter
          ? {
              id: String(raw.reporter.id),
              name: raw.reporter.fullName || raw.reporter.name || raw.reporter.email,
              email: raw.reporter.email,
              avatarUrl: raw.reporter.avatarUrl,
              role: 'member',
            }
          : { id: '0', name: 'Unknown', email: '', role: 'member' },
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
        version: raw.version,
        customFields: (raw.customFields || []).map((cf: any) => ({
          id: cf.id || cf.fieldId,
          fieldId: cf.fieldId || cf.id,
          fieldKey: cf.fieldKey,
          name: cf.name || cf.fieldName || cf.fieldKey,
          fieldName: cf.fieldName || cf.name || cf.fieldKey,
          type: cf.type,
          required: cf.required,
          options: cf.options,
          value: cf.value,
        })),
      };

      setIssue(loaded);
      setSummaryValue(loaded.summary);
      setDescriptionValue(loaded.description || '');

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

  useEffect(() => {
    if (issue?.projectId) {
      memberService
        .getMembers(issue.projectId)
        .then((res) => {
          const raw = res?.data || [];
          const list = Array.isArray(raw) ? raw : (raw as any).content || [];
          setProjectMembers(
            list.map((m: any) => ({
              id: String(m.user?.id || m.userId || m.id),
              name: m.user?.fullName || m.fullName || m.user?.email || m.email || 'Thành viên',
            }))
          );
        })
        .catch(() => setProjectMembers([]));
    }
  }, [issue?.projectId]);

  // Loading spinner view
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

  async function handleInlineUpdate(
    updates: Partial<{
      summary: string;
      description: string;
      type: any;
      priority: any;
      assigneeId: number | null;
      dueDate: string | null;
      estimates: string | null;
      environment: string | null;
      customFields: Record<string, string>;
    }>
  ) {
    if (!issue) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const payload: any = {
        summary: updates.summary !== undefined ? updates.summary : issue.summary,
        description: updates.description !== undefined ? updates.description : (issue.description || ''),
        type: updates.type !== undefined ? updates.type : issue.type,
        priority: updates.priority !== undefined ? updates.priority : issue.priority,
        assigneeId:
          updates.assigneeId !== undefined
            ? updates.assigneeId
            : issue.assignee?.id
            ? Number(issue.assignee.id)
            : null,
        dueDate: updates.dueDate !== undefined ? updates.dueDate : (issue.dueDate || null),
        environment: updates.environment !== undefined ? updates.environment : (issue.environment || null),
        estimates: updates.estimates !== undefined ? updates.estimates : (issue.estimates || null),
        version: issue.version,
      };

      if (updates.assigneeId === null) {
        payload.clearAssignee = true;
      }
      if (updates.dueDate === null) {
        payload.clearDueDate = true;
      }
      if (updates.customFields !== undefined) {
        payload.customFields = updates.customFields;
      }

      await issueService.updateIssue(issue.key, payload, issue.version);
      await fetchDetail();
      onUpdated?.();
    } catch (err: any) {
      if (err?.status === 409 || err?.response?.status === 409) {
        setConcurrentConflict(true);
      } else {
        setErrorMessage(err?.response?.data?.message || err?.message || 'Cập nhật công việc thất bại');
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSaveSummary() {
    setEditingSummary(false);
    if (!issue || !summaryValue.trim() || summaryValue.trim() === issue.summary) {
      setSummaryValue(issue?.summary || '');
      return;
    }
    await handleInlineUpdate({ summary: summaryValue.trim() });
  }

  async function handleSaveDescription() {
    setEditingDescription(false);
    if (!issue || descriptionValue === (issue.description || '')) {
      return;
    }
    await handleInlineUpdate({ description: descriptionValue });
  }

  async function handleUpdateField(field: string, value: any) {
    if (field === 'customFields') {
      await handleInlineUpdate({ customFields: value });
    } else {
      await handleInlineUpdate({ [field]: value });
    }
  }

  function handleStartEdit() {
    if (!issue) return;
    setEditForm({
      summary: issue.summary || '',
      description: issue.description || '',
      type: issue.type || 'TASK',
      priority: issue.priority || 'MEDIUM',
      assigneeId: issue.assignee?.id || '',
      dueDate: issue.dueDate || '',
      estimates: issue.estimates || '',
      environment: issue.environment || '',
    });
    setIsEditing(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!issue || !editForm.summary.trim()) return;

    setActionLoading(true);
    setErrorMessage(null);
    try {
      const payload: any = {
        summary: editForm.summary.trim(),
        description: editForm.description || '',
        type: editForm.type,
        priority: editForm.priority,
        assigneeId: editForm.assigneeId ? Number(editForm.assigneeId) : null,
        clearAssignee: !editForm.assigneeId,
        dueDate: editForm.dueDate || null,
        clearDueDate: !editForm.dueDate,
        environment: editForm.environment ? editForm.environment.trim() : null,
        estimates: editForm.estimates ? editForm.estimates.trim() : null,
        version: issue.version,
      };

      await issueService.updateIssue(issue.key, payload, issue.version);
      setIsEditing(false);
      await fetchDetail();
      onUpdated?.();
    } catch (err: any) {
      if (err?.status === 409 || err?.response?.status === 409) {
        setConcurrentConflict(true);
      } else {
        setErrorMessage(err?.response?.data?.message || err?.message || 'Cập nhật công việc thất bại');
      }
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
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono text-[#9B9B9F] font-semibold">{issue.key}</span>

              {/* Interactive Type Selector */}
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setShowTypeMenu((s) => !s)}
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded border flex items-center gap-1 transition-colors cursor-pointer hover:border-[#1A1A1A] ${
                    issue.type === 'Bug' || issue.type === 'BUG'
                      ? 'text-[#E53E3E] bg-[#FDECEC] border-[#E53E3E]/20'
                      : 'text-[#6B6B70] bg-[#F7F7F8] border-[#E5E5E7]'
                  }`}
                  title="Nhấp để đổi loại công việc"
                >
                  <span>{issue.type}</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                </button>

                {showTypeMenu && (
                  <div className="absolute top-6 left-0 bg-white border border-[#E5E5E7] rounded-lg shadow-lg z-30 py-1 min-w-[120px]">
                    {(['TASK', 'BUG', 'STORY', 'EPIC'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={async () => {
                          setShowTypeMenu(false);
                          if (t !== issue.type) {
                            await handleInlineUpdate({ type: t });
                          }
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#F7F7F8] transition-colors ${
                          issue.type === t ? 'font-semibold text-[#1A1A1A] bg-[#F0F0F1]' : 'text-[#6B6B70]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Summary Input / Display */}
            {editingSummary ? (
              <input
                type="text"
                autoFocus
                value={summaryValue}
                onChange={(e) => setSummaryValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveSummary();
                  } else if (e.key === 'Escape') {
                    setSummaryValue(issue.summary);
                    setEditingSummary(false);
                  }
                }}
                onBlur={handleSaveSummary}
                className="text-sm font-semibold text-[#1A1A1A] w-full border border-[#1A1A1A] rounded px-2 py-1 focus:outline-none bg-white shadow-inner"
              />
            ) : (
              <h3
                onClick={() => {
                  setSummaryValue(issue.summary);
                  setEditingSummary(true);
                }}
                className="text-sm font-semibold text-[#1A1A1A] leading-snug hover:bg-[#F0F0F1] -mx-1 px-1 py-0.5 rounded cursor-pointer transition-colors group flex items-start justify-between gap-2"
                title="Nhấp để sửa tóm tắt công việc"
              >
                <span className="flex-1">{issue.summary}</span>
                <Pencil className="w-3.5 h-3.5 text-[#9B9B9F] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
              </h3>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            <button
              type="button"
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                } else {
                  handleStartEdit();
                }
              }}
              className={`p-1 rounded transition-colors ${
                isEditing ? 'bg-[#1A1A1A] text-white' : 'text-[#9B9B9F] hover:text-[#1A1A1A] hover:bg-[#F7F7F8]'
              }`}
              title={isEditing ? 'Hủy chỉnh sửa đầy đủ' : 'Mở biểu mẫu chỉnh sửa đầy đủ'}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/issues/${issue.key}`;
                navigator.clipboard.writeText(url);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className={`p-1 rounded transition-colors ${
                copiedLink
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-[#9B9B9F] hover:text-[#1A1A1A] hover:bg-[#F7F7F8]'
              }`}
              title={copiedLink ? 'Đã sao chép liên kết!' : 'Sao chép liên kết công việc'}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                window.open(`/issues/${issue.key}`, '_blank');
              }}
              className="text-[#9B9B9F] hover:text-[#1A1A1A] p-1 rounded hover:bg-[#F7F7F8] transition-colors"
              title="Mở trong trang riêng"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="text-[#9B9B9F] hover:text-[#1A1A1A] p-1 rounded hover:bg-[#F7F7F8] transition-colors"
              title="Chia sẻ issue"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[#9B9B9F] hover:text-[#E53E3E] p-1 rounded hover:bg-[#F7F7F8] transition-colors"
                title={isSubtask ? "Xóa subtask" : "Xóa công việc"}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
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
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                Tóm tắt công việc <span className="text-[#E53E3E] font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={editForm.summary}
                onChange={(e) => setEditForm((f) => ({ ...f, summary: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Mô tả</label>
              <textarea
                rows={4}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] resize-y"
                placeholder="Nhập mô tả chi tiết công việc..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Loại công việc
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A]"
                >
                  <option value="TASK">Task</option>
                  <option value="BUG">Bug</option>
                  <option value="STORY">Story</option>
                  <option value="EPIC">Epic</option>
                  <option value="SUB_TASK">Sub-task</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Mức ưu tiên
                </label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A]"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Người thực hiện
                </label>
                <select
                  value={editForm.assigneeId}
                  onChange={(e) => setEditForm((f) => ({ ...f, assigneeId: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A]"
                >
                  <option value="">Chưa phân công</option>
                  {projectMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Hạn chót
                </label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Ước tính
                </label>
                <input
                  type="text"
                  value={editForm.estimates}
                  onChange={(e) => setEditForm((f) => ({ ...f, estimates: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                  placeholder="2d 4h, 30m..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Môi trường
                </label>
                <input
                  type="text"
                  value={editForm.environment}
                  onChange={(e) => setEditForm((f) => ({ ...f, environment: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                  placeholder="Staging, Production..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E5E5E7]">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 border border-[#E5E5E7] rounded-lg text-xs text-[#6B6B70] hover:bg-[#F7F7F8]"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-1.5 bg-[#1A1A1A] text-white rounded-lg text-xs font-medium hover:bg-black transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Description (Interactive Click-to-Edit) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
                  Mô tả
                </h4>
                {!editingDescription && (
                  <button
                    type="button"
                    onClick={() => {
                      setDescriptionValue(issue.description || '');
                      setEditingDescription(true);
                    }}
                    className="text-[11px] text-[#6B6B70] hover:text-[#1A1A1A] flex items-center gap-1 hover:underline"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Chỉnh sửa</span>
                  </button>
                )}
              </div>

              {editingDescription ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    rows={5}
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        handleSaveDescription();
                      } else if (e.key === 'Escape') {
                        setEditingDescription(false);
                      }
                    }}
                    placeholder="Nhập mô tả chi tiết công việc..."
                    className="w-full text-xs text-[#1A1A1A] leading-relaxed p-3 border border-[#1A1A1A] rounded-lg focus:outline-none bg-white resize-y shadow-inner"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingDescription(false)}
                      className="px-3 py-1 border border-[#E5E5E7] rounded-lg text-xs text-[#6B6B70] hover:bg-[#F7F7F8]"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleSaveDescription}
                      className="px-3.5 py-1 bg-[#1A1A1A] text-white rounded-lg text-xs font-medium hover:bg-black transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Đang lưu…' : 'Lưu mô tả'}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setDescriptionValue(issue.description || '');
                    setEditingDescription(true);
                  }}
                  className="text-xs text-[#1A1A1A] leading-relaxed whitespace-pre-wrap bg-[#F7F7F8] hover:bg-[#F0F0F1] cursor-pointer rounded-lg p-3 border border-[#E5E5E7] transition-colors"
                  title="Nhấp để chỉnh sửa mô tả"
                >
                  {issue.description ? (
                    issue.description
                  ) : (
                    <span className="text-[#9B9B9F] italic">+ Thêm mô tả chi tiết cho công việc này...</span>
                  )}
                </div>
              )}
            </div>

            {/* Details / Attributes (Interactive Panel) */}
            <div>
              <h4 className="text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider mb-2">
                Chi tiết công việc
              </h4>
              <AttributesPanel
                issue={issue}
                projectMembers={projectMembers}
                canEdit={true}
                onUpdateField={handleUpdateField}
              />
            </div>

            {/* Subtasks */}
            <SubtaskSection
              subtasks={issue.subtasks}
              issueKey={issue.key}
              issueType={issue.type}
              projectMembers={projectMembers}
              canEdit={true}
              canDeleteSubtask={isPmOrAdmin || Boolean(currentProject?.allowMemberDeleteSubtask)}
              onSelectSubtask={onSelectSubtask}
              onSubtaskCreated={async () => {
                await fetchDetail();
                onUpdated?.();
              }}
            />

            {/* Linked issues */}
            <LinkedIssuesSection
              linkedIssues={issue.linkedIssues}
              onSelectIssue={onSelectSubtask}
            />

            {/* Comments & Activity Timeline */}
            <ActivityTimeline comments={issue.comments} status={issue.status} />
          </div>
        )}
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
