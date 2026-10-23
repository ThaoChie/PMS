import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Share2,
  Trash2,
  ExternalLink,
  ChevronDown,
  Pencil,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useProjectStore } from '../../../store/projectStore';
import { issueService } from '../../../services/issueService';
import { workflowService } from '../../../services/workflowService';
import { memberService } from '../../../services/memberService';
import type { Issue, Role } from '../../../types';
import AttributesPanel from '../components/AttributesPanel';
import SubtaskSection from '../components/SubtaskSection';
import LinkedIssuesSection from '../components/LinkedIssuesSection';
import ActivityTimeline from '../components/ActivityTimeline';
import ShareIssueModal from '../components/ShareIssueModal';

interface IssueDetailPageProps {
  issueKey: string;
  role?: Role;
  onBack?: () => void;
  onSelectSubtask?: (key: string) => void;
}

export default function IssueDetailPage({
  issueKey,
  role = 'pm',
  onBack,
  onSelectSubtask,
}: IssueDetailPageProps) {
  const { currentProject } = useProjectStore();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [projectMembers, setProjectMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [transitions, setTransitions] = useState<any[]>([]);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isSubtask = issue?.type?.toUpperCase() === 'SUB_TASK' || issue?.type === 'Sub-task' || !!issue?.parentId;
  const isPmOrAdmin = role === 'pm' || role === 'admin';
  const canDelete =
    isPmOrAdmin ||
    (isSubtask
      ? Boolean(currentProject?.allowMemberDeleteSubtask)
      : Boolean(currentProject?.allowMemberDeleteIssue));

  async function handleDelete() {
    if (!issue) return;
    if (confirm(`Bạn có chắc chắn muốn xóa ${isSubtask ? 'subtask' : 'công việc'} "${issue.summary}"?`)) {
      try {
        await issueService.deleteIssue(issue.key);
        onBack?.();
      } catch (err: any) {
        setErrorMessage(err?.response?.data?.message || err?.message || 'Xóa công việc thất bại');
      }
    }
  }

  // Inline editing
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryValue, setSummaryValue] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');

  const fetchDetail = useCallback(async () => {
    if (!issueKey) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await issueService.getIssue(issueKey);
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
        updatedAt: raw.updatedAt || '',
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

      const transRes = await workflowService.getTransitions(loaded.key);
      setTransitions(transRes?.data || []);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Không thể tải chi tiết công việc');
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

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

  function handleCopyLink() {
    const url = `${window.location.origin}/issues/${issueKey}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  async function handleInlineUpdate(updates: any) {
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
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Cập nhật công việc thất bại');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatusTransition(targetStatus: string) {
    if (!issue) return;
    setActionLoading(true);
    try {
      await workflowService.transition(issue.key, targetStatus);
      setShowStatusMenu(false);
      await fetchDetail();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Không thể chuyển trạng thái');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdateField(field: string, value: any) {
    if (field === 'customFields') {
      await handleInlineUpdate({ customFields: value });
    } else {
      await handleInlineUpdate({ [field]: value });
    }
  }

  if (loading && !issue) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-xs text-[#9B9B9F] gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#1A1A1A]" />
        <span>Đang tải thông tin công việc {issueKey}…</span>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-1">Không tìm thấy công việc</h2>
        <p className="text-xs text-[#6B6B70] mb-4">{errorMessage || `Không tồn tại công việc với mã ${issueKey}`}</p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#E5E5E7] rounded-lg text-xs font-medium text-[#1A1A1A] hover:bg-[#F7F7F8]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#F7F7F8]">
      {/* Top Bar / Breadcrumb */}
      <div className="bg-white border-b border-[#E5E5E7] px-8 py-3.5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-lg border border-[#E5E5E7] text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
                title="Quay lại danh sách"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2 text-xs text-[#6B6B70]">
              <span>Dự án</span>
              <span>/</span>
              <span className="font-medium text-[#1A1A1A]">
                {currentProject?.name || issue.projectId}
              </span>
              <span>/</span>
              <span className="font-mono font-semibold text-[#1A1A1A] bg-[#F0F0F1] px-1.5 py-0.5 rounded">
                {issue.key}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shadow-sm ${
                copiedLink
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-[#E5E5E7] text-[#1A1A1A] hover:bg-[#F7F7F8]'
              }`}
              title="Sao chép liên kết công việc"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã sao chép link</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#6B6B70]" />
                  <span>Sao chép link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="p-1.5 border border-[#E5E5E7] text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#F7F7F8] rounded-lg transition-colors"
              title="Chia sẻ issue"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 border border-[#E5E5E7] text-[#9B9B9F] hover:text-[#E53E3E] hover:bg-red-50 rounded-lg transition-colors"
                title={isSubtask ? "Xóa subtask" : "Xóa công việc"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-8 py-6">
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#E5E5E7] rounded-xl p-6 shadow-sm">
              {/* Type and Key */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-mono font-semibold text-[#9B9B9F]">{issue.key}</span>

                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setShowTypeMenu((s) => !s)}
                    className="text-xs font-medium px-2 py-0.5 rounded border border-[#E5E5E7] flex items-center gap-1.5 hover:border-[#1A1A1A] bg-[#F7F7F8]"
                  >
                    <span>{issue.type}</span>
                    <ChevronDown className="w-3 h-3 text-[#9B9B9F]" />
                  </button>

                  {showTypeMenu && (
                    <div className="absolute top-7 left-0 bg-white border border-[#E5E5E7] rounded-lg shadow-lg z-30 py-1 min-w-[130px]">
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
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#F7F7F8] ${
                            issue.type === t ? 'font-semibold text-[#1A1A1A] bg-[#F0F0F1]' : 'text-[#6B6B70]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Workflow status transition badge */}
                <div className="relative inline-block ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowStatusMenu((s) => !s)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#F0F0F1] hover:bg-[#E5E5E7] text-xs font-semibold text-[#1A1A1A] rounded-lg border border-[#E5E5E7] transition-colors"
                  >
                    <span>{issue.status}</span>
                    <ChevronDown className="w-3 h-3 text-[#6B6B70]" />
                  </button>

                  {showStatusMenu && transitions.length > 0 && (
                    <div className="absolute top-8 right-0 bg-white border border-[#E5E5E7] rounded-lg shadow-lg z-30 py-1 min-w-[150px]">
                      {transitions.map((t: any) => (
                        <button
                          key={t.id || t.toStatus}
                          type="button"
                          onClick={() => handleStatusTransition(t.toStatus || t.name)}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#F7F7F8] text-[#1A1A1A]"
                        >
                          &rarr; Chuyển sang {t.toStatus || t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              {editingSummary ? (
                <input
                  type="text"
                  autoFocus
                  value={summaryValue}
                  onChange={(e) => setSummaryValue(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      setEditingSummary(false);
                      if (summaryValue.trim() && summaryValue.trim() !== issue.summary) {
                        await handleInlineUpdate({ summary: summaryValue.trim() });
                      }
                    } else if (e.key === 'Escape') {
                      setSummaryValue(issue.summary);
                      setEditingSummary(false);
                    }
                  }}
                  onBlur={async () => {
                    setEditingSummary(false);
                    if (summaryValue.trim() && summaryValue.trim() !== issue.summary) {
                      await handleInlineUpdate({ summary: summaryValue.trim() });
                    }
                  }}
                  className="text-lg font-bold text-[#1A1A1A] w-full border border-[#1A1A1A] rounded-lg px-3 py-1.5 focus:outline-none mb-4"
                />
              ) : (
                <h1
                  onClick={() => setEditingSummary(true)}
                  className="text-lg font-bold text-[#1A1A1A] hover:bg-[#F0F0F1] -mx-2 px-2 py-1 rounded-lg cursor-pointer transition-colors group flex items-start justify-between gap-2 mb-4"
                  title="Nhấp để sửa tóm tắt"
                >
                  <span className="flex-1">{issue.summary}</span>
                  <Pencil className="w-4 h-4 text-[#9B9B9F] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </h1>
              )}

              {/* Description */}
              <div className="pt-3 border-t border-[#F0F0F1]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-[#9B9B9F] uppercase tracking-wider">
                    Mô tả chi tiết
                  </h3>
                  {!editingDescription && (
                    <button
                      type="button"
                      onClick={() => setEditingDescription(true)}
                      className="text-xs text-[#0052CC] hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Chỉnh sửa</span>
                    </button>
                  )}
                </div>

                {editingDescription ? (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      autoFocus
                      value={descriptionValue}
                      onChange={(e) => setDescriptionValue(e.target.value)}
                      placeholder="Mô tả chi tiết yêu cầu, các bước tái hiện, tiêu chí nghiệm thu..."
                      className="w-full p-3 border border-[#1A1A1A] rounded-lg text-xs text-[#1A1A1A] focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDescriptionValue(issue.description || '');
                          setEditingDescription(false);
                        }}
                        className="px-3 py-1 text-xs border border-[#E5E5E7] rounded-md text-[#6B6B70] hover:bg-[#F7F7F8]"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={async () => {
                          setEditingDescription(false);
                          if (descriptionValue !== (issue.description || '')) {
                            await handleInlineUpdate({ description: descriptionValue });
                          }
                        }}
                        className="px-3.5 py-1 text-xs bg-[#1A1A1A] text-white rounded-md font-medium hover:bg-black"
                      >
                        Lưu mô tả
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingDescription(true)}
                    className="p-3 bg-[#FAF9F8] hover:bg-[#F0F0F1] rounded-lg border border-[#E5E5E7] cursor-pointer transition-colors text-xs text-[#1A1A1A] min-h-[60px]"
                  >
                    {issue.description ? (
                      <p className="whitespace-pre-wrap">{issue.description}</p>
                    ) : (
                      <span className="text-[#9B9B9F] italic">+ Thêm mô tả chi tiết cho công việc này…</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Subtasks Section */}
            <div className="bg-white border border-[#E5E5E7] rounded-xl p-6 shadow-sm">
              <SubtaskSection
                subtasks={issue.subtasks}
                issueKey={issue.key}
                issueType={issue.type}
                projectMembers={projectMembers}
                canEdit={true}
                canDeleteSubtask={isPmOrAdmin || Boolean(currentProject?.allowMemberDeleteSubtask)}
                onSelectSubtask={onSelectSubtask}
                onSubtaskCreated={fetchDetail}
              />
            </div>

            {/* Linked Issues Section */}
            <div className="bg-white border border-[#E5E5E7] rounded-xl p-6 shadow-sm">
              <LinkedIssuesSection
                linkedIssues={issue.linkedIssues}
                onSelectIssue={onSelectSubtask}
              />
            </div>

            {/* Comments & Activity Timeline */}
            <div className="bg-white border border-[#E5E5E7] rounded-xl p-6 shadow-sm">
              <ActivityTimeline comments={issue.comments} status={issue.status} />
            </div>
          </div>

          {/* Right Column (Attributes / Custom Fields Panel) */}
          <div className="space-y-6">
            <div className="bg-white border border-[#E5E5E7] rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-[#9B9B9F] uppercase tracking-wider mb-3">
                Chi tiết công việc
              </h3>
              <AttributesPanel
                issue={issue}
                projectMembers={projectMembers}
                canEdit={true}
                onUpdateField={handleUpdateField}
              />
            </div>
          </div>
        </div>
      </div>

      {showShareModal && (
        <ShareIssueModal
          issueKey={issue.key}
          issueSummary={issue.summary}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
