import React, { useState } from 'react';
import { Link as LinkIcon, Plus, Trash2, X, Loader2 } from 'lucide-react';
import type { LinkedIssue } from '../../../types';
import { issueService } from '../../../services/issueService';
import { toast } from '../../../store/toastStore';

interface LinkedIssuesSectionProps {
  issueKey: string;
  linkedIssues: LinkedIssue[];
  canEdit?: boolean;
  onSelectIssue?: (key: string) => void;
  onChanged?: () => void;
}

const RELATION_OPTIONS = [
  { value: 'relates to', label: 'Liên quan đến (relates to)' },
  { value: 'blocks', label: 'Chặn (blocks)' },
  { value: 'is blocked by', label: 'Bị chặn bởi (is blocked by)' },
  { value: 'duplicates', label: 'Trùng lặp với (duplicates)' },
];

export default function LinkedIssuesSection({
  issueKey,
  linkedIssues = [],
  canEdit = true,
  onSelectIssue,
  onChanged,
}: LinkedIssuesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [relation, setRelation] = useState('relates to');
  const [targetKey, setTargetKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  async function handleCreateLink(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTarget = targetKey.trim().toUpperCase();
    if (!trimmedTarget) return;

    if (trimmedTarget === issueKey.toUpperCase()) {
      toast.error('Không thể liên kết công việc với chính nó');
      return;
    }

    setSubmitting(true);
    try {
      await issueService.linkIssue(issueKey, trimmedTarget, relation);
      toast.success(`Đã liên kết với công việc ${trimmedTarget}`);
      setTargetKey('');
      setIsAdding(false);
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể tạo liên kết công việc');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveLink(linkId: string | number, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingId(linkId);
    try {
      await issueService.removeLink(issueKey, String(linkId));
      toast.success('Đã gỡ liên kết công việc');
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể gỡ liên kết công việc');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <LinkIcon className="w-3.5 h-3.5 text-[#6B6B70]" />
          <h4 className="text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
            Công việc liên kết ({linkedIssues.length})
          </h4>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setIsAdding((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 border border-[#E5E5E7] text-[10px] font-medium text-[#1A1A1A] rounded-lg hover:bg-[#F7F7F8] transition-colors"
          >
            {isAdding ? <X className="w-3 h-3 text-[#6B6B70]" /> : <Plus className="w-3 h-3 text-[#6B6B70]" />}
            <span>{isAdding ? 'Đóng' : 'Thêm liên kết'}</span>
          </button>
        )}
      </div>

      {/* Form thêm liên kết */}
      {isAdding && (
        <form onSubmit={handleCreateLink} className="p-3 bg-[#F9FAFB] border border-[#E5E5E7] rounded-xl mb-3 space-y-2.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-[#6B6B70] mb-1">Loại liên kết</label>
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              >
                {RELATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#6B6B70] mb-1">Mã công việc đích (ví dụ: PROJ-12)</label>
              <input
                type="text"
                placeholder="PROJ-12"
                value={targetKey}
                onChange={(e) => setTargetKey(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 bg-white border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] uppercase focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2.5 py-1 text-xs text-[#6B6B70] hover:text-[#1A1A1A]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !targetKey.trim()}
              className="px-3 py-1 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-black disabled:opacity-50 flex items-center gap-1"
            >
              {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Liên kết</span>
            </button>
          </div>
        </form>
      )}

      {/* Danh sách liên kết */}
      {linkedIssues.length === 0 ? (
        !isAdding && (
          <div className="border border-dashed border-[#E5E5E7] rounded-xl p-3 text-center bg-[#FAF9F6]">
            <p className="text-xs text-[#9B9B9F]">Chưa có liên kết với công việc nào</p>
          </div>
        )
      ) : (
        <div className="border border-[#E5E5E7] rounded-lg overflow-hidden divide-y divide-[#F0F0F1] bg-white">
          {linkedIssues.map((li) => (
            <div
              key={li.id}
              onClick={() => onSelectIssue?.(li.key)}
              className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-[#F7F7F8] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2.5 truncate min-w-0">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  {li.relation}
                </span>
                <span className="text-[11px] font-mono text-[#1A1A1A] font-semibold shrink-0">{li.key}</span>
                <span className="text-xs text-[#4B5563] truncate flex-1">{li.summary}</span>
              </div>

              {canEdit && (
                <button
                  type="button"
                  disabled={deletingId === li.id}
                  onClick={(e) => handleRemoveLink(li.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-[#9B9B9F] hover:text-[#E53E3E] p-1 rounded transition-all shrink-0"
                  title="Gỡ liên kết"
                >
                  {deletingId === li.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E53E3E]" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
