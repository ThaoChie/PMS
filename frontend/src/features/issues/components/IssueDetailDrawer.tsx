import React, { useState } from 'react';
import { X, ChevronDown, AlertTriangle, Share2 } from 'lucide-react';
import { issues } from '../../../data/mockData';
import type { Role, IssueStatus } from '../../../types';
import AttributesPanel from './AttributesPanel';
import SubtaskSection from './SubtaskSection';
import LinkedIssuesSection from './LinkedIssuesSection';
import ActivityTimeline from './ActivityTimeline';
import ShareIssueModal from './ShareIssueModal';

const STATUS_OPTIONS: IssueStatus[] = ['To Do', 'In Progress', 'Pending Approval', 'Done'];

const STATUS_BADGE: Record<string, string> = {
  'To Do': 'text-[#6B6B70] bg-[#F7F7F8] border-[#E5E5E7]',
  'In Progress': 'text-[#1A1A1A] bg-[#EBEBEC] border-[#DCDCDE]',
  'Pending Approval': 'text-[#6B6B70] bg-[#F0F0F1] border-[#E0E0E2]',
  Done: 'text-[#9B9B9F] bg-[#F7F7F8] border-[#E5E5E7]',
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
  const issue = issues.find((i) => i.id === issueId);
  const [status, setStatus] = useState<IssueStatus>(issue?.status ?? 'To Do');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  if (!issue) return null;

  const isPendingApproval = status === 'Pending Approval';
  const canApprove = (role === 'pm' || role === 'admin') && isPendingApproval;

  function handleStatusChange(s: IssueStatus) {
    setStatus(s);
    setShowStatusMenu(false);
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
              <span className="text-[11px] font-mono text-[#9B9B9F]">{issue.key}</span>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                  issue.type === 'Bug'
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
              onClick={onClose}
              className="text-[#9B9B9F] hover:text-[#1A1A1A] p-1 rounded hover:bg-[#F7F7F8] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="px-5 py-2.5 border-b border-[#E5E5E7] flex items-center gap-3 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusMenu((s) => !s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${STATUS_BADGE[status]}`}
            >
              {status}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showStatusMenu && (
              <div className="absolute top-9 left-0 bg-white border border-[#E5E5E7] rounded-lg shadow-sm z-10 overflow-hidden min-w-[160px] fade-in">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F7F7F8] transition-colors ${
                      s === status ? 'font-medium text-[#1A1A1A]' : 'text-[#6B6B70]'
                    }`}
                    onClick={() => handleStatusChange(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {canApprove && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                className="px-3 py-1.5 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition-colors"
                onClick={() => handleStatusChange('Done')}
              >
                Phê duyệt
              </button>
              <button
                type="button"
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
                disabled={!rejectReason.trim()}
                onClick={() => {
                  handleStatusChange('In Progress');
                  setShowRejectForm(false);
                  setRejectReason('');
                }}
                className="px-3 py-1.5 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Từ chối &amp; Trả lại
              </button>
            </div>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Description */}
          <div className="mb-5">
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
          <div className="mb-5">
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
          <ActivityTimeline comments={issue.comments} status={status} />
        </div>
      </div>

      {showShareModal && (
        <ShareIssueModal
          issueKey={issue.key}
          issueSummary={issue.summary}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}
