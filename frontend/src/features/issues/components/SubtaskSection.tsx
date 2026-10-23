import React, { useState } from 'react';
import { CheckSquare, Plus, Loader2, UserMinus } from 'lucide-react';
import type { SubTask } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';
import { issueService } from '../../../services/issueService';

interface SubtaskSectionProps {
  subtasks?: SubTask[];
  issueKey: string;
  issueType?: string;
  projectMembers?: Array<{ id: string; name: string }>;
  canEdit?: boolean;
  onSelectSubtask?: (key: string) => void;
  onSubtaskCreated?: () => void;
}

export default function SubtaskSection({
  subtasks = [],
  issueKey,
  issueType,
  projectMembers = [],
  canEdit = true,
  onSelectSubtask,
  onSubtaskCreated,
}: SubtaskSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [summary, setSummary] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubtask = issueType?.toUpperCase() === 'SUB_TASK' || issueType === 'Sub-task';

  // Subtasks cannot have nested subtasks
  if (isSubtask && (!subtasks || subtasks.length === 0)) {
    return null;
  }

  async function handleCreate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = summary.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      await issueService.createSubtask(issueKey, {
        summary: trimmed,
        assigneeId: assigneeId ? assigneeId : undefined,
      });
      setSummary('');
      setAssigneeId('');
      setIsAdding(false);
      onSubtaskCreated?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tạo công việc con');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
          Công việc phụ / Tác vụ con ({subtasks.length})
        </h4>
        {!isSubtask && canEdit && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-[11px] text-[#1A1A1A] hover:text-[#0052CC] font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm công việc con</span>
          </button>
        )}
      </div>

      {/* Subtasks list */}
      {subtasks.length > 0 && (
        <div className="border border-[#E5E5E7] rounded-lg overflow-hidden divide-y divide-[#F0F0F1] bg-white mb-2">
          {subtasks.map((st) => (
            <div
              key={st.id}
              onClick={() => onSelectSubtask?.(st.key)}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F7F7F8] cursor-pointer transition-colors"
            >
              <CheckSquare
                className={`w-3.5 h-3.5 shrink-0 ${
                  st.status === 'Done' ? 'text-[#107C41]' : 'text-[#C5C5C8]'
                }`}
              />
              <span className="text-[11px] font-mono text-[#9B9B9F] shrink-0">{st.key}</span>
              <span
                className={`text-xs flex-1 truncate ${
                  st.status === 'Done' ? 'text-[#9B9B9F] line-through' : 'text-[#1A1A1A]'
                }`}
              >
                {st.summary}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F7F7F8] border border-[#E5E5E7] text-[#6B6B70] shrink-0">
                {st.status}
              </span>
              {st.assignee && (
                <div title={st.assignee.name || st.assignee.email}>
                  <UserAvatar initials={st.assignee.initials} size="xs" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inline Create Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-3 bg-[#FAF9F8] border border-[#E5E5E7] rounded-lg space-y-2.5 animate-in fade-in duration-150"
        >
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-600 rounded text-xs">
              {error}
            </div>
          )}
          <input
            type="text"
            autoFocus
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Nhập tiêu đề công việc con..."
            className="w-full px-2.5 py-1.5 bg-white border border-[#E5E5E7] rounded-md text-xs text-[#1A1A1A] placeholder:text-[#9B9B9F] focus:outline-none focus:border-[#1A1A1A]"
          />
          <div className="flex items-center gap-2">
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="text-xs bg-white border border-[#E5E5E7] rounded-md px-2 py-1 text-[#1A1A1A] focus:outline-none"
            >
              <option value="">-- Chưa phân công --</option>
              {projectMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setSummary('');
                setError(null);
              }}
              className="px-2.5 py-1 text-xs text-[#6B6B70] hover:text-[#1A1A1A] rounded-md hover:bg-[#F0F0F1] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !summary.trim()}
              className="flex items-center gap-1 px-3 py-1 bg-[#1A1A1A] hover:bg-[#333333] disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
            >
              {loading && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Tạo</span>
            </button>
          </div>
        </form>
      )}

      {/* Empty State when no subtasks and not adding */}
      {subtasks.length === 0 && !isAdding && !isSubtask && (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full py-2 px-3 border border-dashed border-[#E5E5E7] rounded-lg text-xs text-[#9B9B9F] hover:text-[#1A1A1A] hover:border-[#C5C5C8] transition-colors flex items-center justify-center gap-1.5 bg-white"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm công việc con đầu tiên</span>
        </button>
      )}
    </div>
  );
}
