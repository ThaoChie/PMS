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
            onClick={() => {
              setIsAdding((prev) => !prev);
              setTargetKey('');
            }}
            className="flex items-center gap-1 text-[11px] font-medium text-[#1A1A1A] hover:text-[#C5221F] transition-colors"
          >
            {isAdding ? (
              <>
                <X className="w-3.5 h-3.5 text-[#6B6B70]" />
                <span className="text-[#6B6B70]">Đóng</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 text-[#6B6B70]" />
                <span>Thêm liên kết</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Form thêm liên kết */}
      {isAdding && (
        <form
          onSubmit={handleCreateLink}
          className="p-3.5 bg-[#FAF9F8] border border-[#E5E5E7] rounded-xl mb-3 space-y-3 animate-in fade-in duration-150"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1.5">
                Loại liên kết
              </label>
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full h-8 px-2.5 py-1 bg-white border border-[#D1D5DB] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:border-[#C5221F] focus:ring-1 focus:ring-[#C5221F] transition-all cursor-pointer"
              >
                {RELATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1.5">
                Mã công việc đích
              </label>
              <input
                type="text"
                placeholder="Ví dụ: PROJ-12"
                value={targetKey}
                onChange={(e) => setTargetKey(e.target.value)}
                required
                className="w-full h-8 px-2.5 py-1 bg-white border border-[#D1D5DB] rounded-lg text-xs text-[#1E293B] font-mono uppercase placeholder:font-sans placeholder:normal-case placeholder:text-[#94A3B8] focus:outline-none focus:border-[#C5221F] focus:ring-1 focus:ring-[#C5221F] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E5E5E7]/60">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setTargetKey('');
              }}
              className="px-3 py-1.5 text-xs text-[#6B6B70] hover:text-[#1A1A1A] rounded-lg hover:bg-[#F0F0F1] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !targetKey.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all shadow-xs"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LinkIcon className="w-3.5 h-3.5" />
              )}
              <span>Liên kết</span>
            </button>
          </div>
        </form>
      )}

      {/* Danh sách liên kết */}
      {linkedIssues.length === 0 ? (
        !isAdding && (
          canEdit ? (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full border border-dashed border-[#E5E5E7] hover:border-[#C5C5C8] rounded-xl py-2 px-3 text-xs text-[#9B9B9F] hover:text-[#1A1A1A] transition-colors text-center flex items-center justify-center gap-1 bg-[#FAF9F6] hover:bg-[#F5F5F7]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm liên kết công việc đầu tiên</span>
            </button>
          ) : (
            <div className="border border-dashed border-[#E5E5E7] rounded-xl p-3 text-center bg-[#FAF9F6]">
              <p className="text-xs text-[#9B9B9F]">Chưa có liên kết với công việc nào</p>
            </div>
          )
        )
      ) : (
        <div className="border border-[#E5E5E7] rounded-xl overflow-hidden divide-y divide-[#F0F0F1] bg-white shadow-2xs">
          {linkedIssues.map((li) => {
            const rel = li.relation.toLowerCase();
            const badgeClass = rel.includes('block')
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : rel.includes('duplicate')
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-blue-50 text-blue-700 border-blue-200';

            return (
              <div
                key={li.id}
                onClick={() => onSelectIssue?.(li.key)}
                className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-[#F7F7F8] cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-2.5 truncate min-w-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${badgeClass}`}>
                    {li.relation}
                  </span>
                  <span className="text-[11px] font-mono text-[#1A1A1A] font-semibold shrink-0">
                    {li.key}
                  </span>
                  <span className="text-xs text-[#4B5563] truncate flex-1">
                    {li.summary}
                  </span>
                </div>

                {canEdit && (
                  <button
                    type="button"
                    disabled={deletingId === li.id}
                    onClick={(e) => handleRemoveLink(li.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-[#9B9B9F] hover:text-[#E53E3E] p-1 rounded-md hover:bg-red-50 transition-all shrink-0"
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
            );
          })}
        </div>
      )}
    </div>
  );
}
