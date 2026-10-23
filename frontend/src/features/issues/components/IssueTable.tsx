import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Plus, CornerDownRight, X, Loader2 } from 'lucide-react';
import type { Issue, IssueType } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';
import { issueService } from '../../../services/issueService';

const PRIORITY_BADGE: Record<string, string> = {
  Critical: 'text-[#E53E3E] bg-[#FDECEC]',
  CRITICAL: 'text-[#E53E3E] bg-[#FDECEC]',
  HIGHEST: 'text-[#E53E3E] bg-[#FDECEC]',
  High: 'text-[#1A1A1A] bg-[#F7F7F8]',
  HIGH: 'text-[#1A1A1A] bg-[#F7F7F8]',
  Medium: 'text-[#6B6B70] bg-[#F7F7F8]',
  MEDIUM: 'text-[#6B6B70] bg-[#F7F7F8]',
  Low: 'text-[#9B9B9F] bg-[#F7F7F8]',
  LOW: 'text-[#9B9B9F] bg-[#F7F7F8]',
  LOWEST: 'text-[#9B9B9F] bg-[#F7F7F8]',
};

const STATUS_BADGE: Record<string, string> = {
  'To Do': 'text-[#6B6B70] bg-[#F7F7F8]',
  'In Progress': 'text-[#1A1A1A] bg-[#EBEBEC]',
  'Pending Approval': 'text-[#6B6B70] bg-[#F0F0F1]',
  Done: 'text-[#9B9B9F] bg-[#F7F7F8]',
};

const TYPE_BADGE: Record<string, string> = {
  Story: 'text-[#6B6B70] bg-[#F7F7F8]',
  Bug: 'text-[#E53E3E] bg-[#FDECEC]',
  BUG: 'text-[#E53E3E] bg-[#FDECEC]',
  Task: 'text-[#6B6B70] bg-[#F7F7F8]',
  TASK: 'text-[#6B6B70] bg-[#F7F7F8]',
  Epic: 'text-[#1A1A1A] bg-[#EBEBEC]',
  EPIC: 'text-[#1A1A1A] bg-[#EBEBEC]',
  'Sub-task': 'text-[#9B9B9F] bg-[#F7F7F8]',
  SUB_TASK: 'text-[#9B9B9F] bg-[#F7F7F8]',
};

export type SortField = 'key' | 'summary' | 'status' | 'priority' | 'dueDate';
export type SortDir = 'asc' | 'desc';

interface IssueTableProps {
  issues: Issue[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onSelectIssue: (id: string) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  projectId?: string;
  members?: Array<{ id: string; name: string }>;
  onRefresh?: () => void;
}

export default function IssueTable({
  issues,
  sortField,
  sortDir,
  onSort,
  onSelectIssue,
  hasFilters = false,
  onClearFilters,
  projectId,
  members = [],
  onRefresh,
}: IssueTableProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);
  const [subtaskSummary, setSubtaskSummary] = useState('');
  const [subtaskType, setSubtaskType] = useState<'Sub-task' | 'Bug' | 'Task'>('Sub-task');
  const [subtaskAssignee, setSubtaskAssignee] = useState('');
  const [creating, setCreating] = useState(false);

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 text-[#D1D1D3]" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-[#1A1A1A]" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[#1A1A1A]" />
    );
  }

  function toggleExpand(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function startAddingSubtask(issue: Issue) {
    const key = issue.key || issue.id;
    setExpandedKeys((prev) => new Set(prev).add(key));
    setAddingSubtaskFor(key);
    setSubtaskSummary('');
    setSubtaskType('Sub-task');
    setSubtaskAssignee('');
  }

  async function handleCreateSubtask(parentIssue: Issue) {
    if (!subtaskSummary.trim() || !projectId) return;
    setCreating(true);
    try {
      const isEpic = parentIssue.type?.toUpperCase() === 'EPIC';
      if (subtaskType === 'Sub-task') {
        await issueService.createSubtask(parentIssue.key || parentIssue.id, {
          summary: subtaskSummary.trim(),
          assigneeId: subtaskAssignee || undefined,
        });
      } else {
        const typeToSend: IssueType = subtaskType === 'Bug' ? 'BUG' : 'TASK';
        await issueService.createIssue(projectId, {
          summary: subtaskSummary.trim(),
          type: typeToSend,
          priority: 'MEDIUM',
          assigneeId: subtaskAssignee || undefined,
          epicId: isEpic ? Number(parentIssue.id) : undefined,
          parentId: !isEpic ? Number(parentIssue.id) : undefined,
        });
      }

      setSubtaskSummary('');
      setAddingSubtaskFor(null);
      setExpandedKeys((prev) => new Set(prev).add(parentIssue.key || parentIssue.id));
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to create subtask', err);
    } finally {
      setCreating(false);
    }
  }

  function getChildIssues(parent: Issue, allIssues: Issue[]) {
    const map = new Map<string, any>();

    // 1. From parent.subtasks
    (parent.subtasks || []).forEach((st) => {
      map.set(st.key || String(st.id), {
        id: String(st.id),
        key: st.key,
        summary: st.summary,
        type: 'Sub-task',
        status: st.status || 'To Do',
        assignee: st.assignee
          ? {
              name: st.assignee.name || st.assignee.email,
              avatarUrl: st.assignee.avatarUrl,
              initials: st.assignee.initials,
            }
          : undefined,
        priority: 'Medium',
        dueDate: undefined,
      });
    });

    // 2. From allIssues (matching epicId/epicLink or parentId/parentKey)
    const isEpic = parent.type?.toUpperCase() === 'EPIC';
    allIssues.forEach((item) => {
      if (item.id === parent.id || item.key === parent.key) return;

      const matchesParent =
        (item.parentId && String(item.parentId) === String(parent.id)) ||
        (item.parentKey && item.parentKey === parent.key);

      const matchesEpic =
        isEpic &&
        ((item.epicId && String(item.epicId) === String(parent.id)) ||
          (item.epicLink && item.epicLink === parent.key));

      if (matchesParent || matchesEpic) {
        map.set(item.key || String(item.id), {
          id: String(item.id),
          key: item.key,
          summary: item.summary,
          type: item.type,
          status: item.status,
          assignee: item.assignee
            ? {
                name: item.assignee.name || item.assignee.email,
                avatarUrl: item.assignee.avatarUrl,
                initials: item.assignee.initials,
              }
            : undefined,
          priority: item.priority,
          dueDate: item.dueDate,
        });
      }
    });

    return Array.from(map.values());
  }

  // Filter top level issues: subtasks whose parent is present in the table will be rendered nested under parent
  const topLevelIssues = issues.filter((issue) => {
    const isSubtask = issue.type?.toUpperCase() === 'SUB_TASK' || issue.type === 'Sub-task';
    if (isSubtask && (issue.parentId || issue.parentKey || issue.epicId || issue.epicLink)) {
      const parentInList = issues.some(
        (p) =>
          (issue.parentId && String(p.id) === String(issue.parentId)) ||
          (issue.parentKey && p.key === issue.parentKey) ||
          (issue.epicId && String(p.id) === String(issue.epicId)) ||
          (issue.epicLink && p.key === issue.epicLink)
      );
      if (parentInList) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-auto bg-white">
      <table className="w-full">
        <thead className="sticky top-0 bg-[#F7F7F8] border-b border-[#E5E5E7] z-10">
          <tr>
            {[
              { field: 'key' as SortField, label: 'Mã', w: 'w-36' },
              { field: 'summary' as SortField, label: 'Tóm tắt nội dung', w: 'w-auto' },
              { field: null, label: 'Loại', w: 'w-24' },
              { field: 'status' as SortField, label: 'Trạng thái', w: 'w-36' },
              { field: null, label: 'Người thực hiện', w: 'w-32' },
              { field: 'priority' as SortField, label: 'Ưu tiên', w: 'w-24' },
              { field: 'dueDate' as SortField, label: 'Hạn chót', w: 'w-28' },
            ].map((col) => (
              <th
                key={col.label}
                className={`${col.w} px-4 py-2.5 text-left text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider ${
                  col.field ? 'cursor-pointer hover:text-[#6B6B70] select-none' : ''
                }`}
                onClick={() => col.field && onSort(col.field)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.field && <SortIcon field={col.field} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0F0F1]">
          {topLevelIssues.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-16 text-center">
                <p className="text-sm text-[#6B6B70]">Không có công việc nào khớp với bộ lọc</p>
                {hasFilters && onClearFilters && (
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="mt-2 text-xs text-[#E53E3E] hover:text-[#C53030]"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </td>
            </tr>
          ) : (
            topLevelIssues.map((issue) => {
              const issueKey = issue.key || issue.id;
              const isEpic = issue.type?.toUpperCase() === 'EPIC';
              const canHaveSubtasks =
                isEpic ||
                issue.type?.toUpperCase() === 'TASK' ||
                issue.type?.toUpperCase() === 'STORY' ||
                issue.type === 'Task' ||
                issue.type === 'Story';
              const children = getChildIssues(issue, issues);
              const isExpanded = expandedKeys.has(issueKey);
              const canExpand = isEpic || children.length > 0 || addingSubtaskFor === issueKey;

              return (
                <React.Fragment key={issue.id}>
                  {/* Parent Row */}
                  <tr
                    className="hover:bg-[#F7F7F8] cursor-pointer transition-colors group"
                    onClick={() => onSelectIssue(issue.key || issue.id)}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Expand/Collapse Toggle Button ("^ ngược" / Chevron) */}
                        {canExpand ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(issueKey);
                            }}
                            className="p-1 -ml-1 text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#EBEBEC] rounded transition-colors"
                            title={isExpanded ? 'Thu gọn subtask' : 'Xổ ra xem subtask'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[#1A1A1A]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#6B6B70]" />
                            )}
                          </button>
                        ) : (
                          <span className="w-5 shrink-0" />
                        )}

                        <span className="text-[11px] font-mono text-[#9B9B9F] font-medium">
                          {issue.key}
                        </span>

                        {/* Count badge */}
                        {children.length > 0 && (
                          <span
                            className="text-[10px] px-1.5 py-0.2 bg-[#F0F0F1] text-[#6B6B70] rounded-full font-mono font-medium"
                            title={`${children.length} công việc con`}
                          >
                            {children.length}
                          </span>
                        )}

                        {/* Quick add "+" button */}
                        {canHaveSubtasks && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startAddingSubtask(issue);
                            }}
                            className="p-1 text-[#9B9B9F] hover:text-[#1A1A1A] hover:bg-[#EBEBEC] rounded transition-colors ml-auto opacity-70 group-hover:opacity-100"
                            title="Tạo nhanh subtask / bug"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#1A1A1A] group-hover:text-[#E53E3E] transition-colors line-clamp-1">
                        {issue.summary}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          TYPE_BADGE[issue.type] || TYPE_BADGE['Task']
                        }`}
                      >
                        {issue.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                          STATUS_BADGE[issue.status] || 'text-[#6B6B70] bg-[#F7F7F8]'
                        }`}
                      >
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {issue.assignee ? (
                        <div className="flex items-center gap-1.5">
                          <UserAvatar initials={issue.assignee.initials || issue.assignee.name?.[0]} size="xs" />
                          <span className="text-xs text-[#6B6B70] truncate">
                            {issue.assignee.name.split(' ')[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#C5C5C8]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          PRIORITY_BADGE[issue.priority] || PRIORITY_BADGE['Medium']
                        }`}
                      >
                        {issue.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {issue.dueDate ? (
                        <span
                          className={`text-xs ${
                            new Date(issue.dueDate) < new Date()
                              ? 'text-[#E53E3E] font-medium'
                              : 'text-[#6B6B70]'
                          }`}
                        >
                          {issue.dueDate}
                        </span>
                      ) : (
                        <span className="text-xs text-[#C5C5C8]">—</span>
                      )}
                    </td>
                  </tr>

                  {/* Inline Quick Add Form */}
                  {addingSubtaskFor === issueKey && (
                    <tr key={`quick-add-${issueKey}`} className="bg-[#F8F9FA] border-y border-[#E5E5E7]">
                      <td colSpan={7} className="px-6 py-3">
                        <div className="flex flex-col gap-2.5 max-w-3xl ml-6 pl-3 border-l-2 border-[#1A1A1A]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                              <CornerDownRight className="w-3.5 h-3.5 text-[#6B6B70]" />
                              Tạo nhanh công việc con cho <span className="font-mono text-[#E53E3E]">{issue.key}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setAddingSubtaskFor(null)}
                              className="text-xs text-[#9B9B9F] hover:text-[#1A1A1A]"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <select
                              value={subtaskType}
                              onChange={(e) => setSubtaskType(e.target.value as any)}
                              className="px-2 py-1.5 border border-[#D1D1D3] rounded text-xs bg-white text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                            >
                              <option value="Sub-task">Sub-task (Tác vụ con)</option>
                              <option value="Bug">Bug (Lỗi)</option>
                              {isEpic && <option value="Task">Task (Tác vụ)</option>}
                            </select>

                            <input
                              type="text"
                              autoFocus
                              value={subtaskSummary}
                              onChange={(e) => setSubtaskSummary(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCreateSubtask(issue);
                                }
                                if (e.key === 'Escape') {
                                  setAddingSubtaskFor(null);
                                }
                              }}
                              placeholder="Nhập tóm tắt công việc con / bug mới..."
                              className="flex-1 min-w-[220px] px-3 py-1.5 border border-[#D1D1D3] rounded text-xs text-[#1A1A1A] placeholder:text-[#9B9B9F] focus:outline-none focus:border-[#1A1A1A]"
                            />

                            <select
                              value={subtaskAssignee}
                              onChange={(e) => setSubtaskAssignee(e.target.value)}
                              className="px-2 py-1.5 border border-[#D1D1D3] rounded text-xs bg-white text-[#6B6B70] focus:outline-none focus:border-[#1A1A1A]"
                            >
                              <option value="">Chưa phân công</option>
                              {members.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              disabled={!subtaskSummary.trim() || creating}
                              onClick={() => handleCreateSubtask(issue)}
                              className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] disabled:opacity-50 text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                            >
                              {creating && <Loader2 className="w-3 h-3 animate-spin" />}
                              <span>{creating ? 'Đang tạo…' : 'Tạo'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setAddingSubtaskFor(null)}
                              className="px-3 py-1.5 border border-[#D1D1D3] hover:bg-white text-[#6B6B70] rounded text-xs transition-colors"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Expanded Children / Subtasks Rows */}
                  {isExpanded &&
                    children.map((child: any) => (
                      <tr
                        key={`child-${child.key || child.id}`}
                        className="bg-[#FAFAFB] hover:bg-[#F2F2F5] border-t border-[#F0F0F1] cursor-pointer transition-colors group"
                        onClick={() => onSelectIssue(child.key || String(child.id))}
                      >
                        <td className="px-3 py-2.5 pl-8">
                          <div className="flex items-center gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5 text-[#9B9B9F] shrink-0" />
                            <span className="text-[11px] font-mono text-[#6B6B70] font-medium">
                              {child.key}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs text-[#1A1A1A] group-hover:text-[#E53E3E] transition-colors line-clamp-1">
                            {child.summary}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              TYPE_BADGE[child.type] || TYPE_BADGE['Sub-task']
                            }`}
                          >
                            {child.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                              STATUS_BADGE[child.status] || 'text-[#6B6B70] bg-[#F7F7F8]'
                            }`}
                          >
                            {child.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {child.assignee ? (
                            <div className="flex items-center gap-1.5">
                              <UserAvatar initials={child.assignee.initials || child.assignee.name?.[0]} size="xs" />
                              <span className="text-xs text-[#6B6B70] truncate">
                                {child.assignee.name.split(' ')[0]}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-[#C5C5C8]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              PRIORITY_BADGE[child.priority] || PRIORITY_BADGE['Medium']
                            }`}
                          >
                            {child.priority}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {child.dueDate ? (
                            <span
                              className={`text-xs ${
                                new Date(child.dueDate) < new Date()
                                  ? 'text-[#E53E3E] font-medium'
                                  : 'text-[#6B6B70]'
                              }`}
                            >
                              {child.dueDate}
                            </span>
                          ) : (
                            <span className="text-xs text-[#C5C5C8]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}

                  {/* Empty state when expanded but has 0 subtasks */}
                  {isExpanded && children.length === 0 && addingSubtaskFor !== issueKey && (
                    <tr key={`empty-${issueKey}`} className="bg-[#FAFAFB] border-t border-[#F0F0F1]">
                      <td colSpan={7} className="px-8 py-2.5 text-xs text-[#9B9B9F] italic">
                        <div className="flex items-center gap-2">
                          <CornerDownRight className="w-3.5 h-3.5 text-[#C5C5C8]" />
                          <span>Chưa có công việc con nào. Nhấn nút</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startAddingSubtask(issue);
                            }}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-[#1A1A1A] bg-[#EBEBEC] hover:bg-[#DCDCE0] rounded transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Tạo nhanh
                          </button>
                          <span>để thêm mới.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
