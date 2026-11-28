import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Save, GitBranch, Shield, ArrowRight, Sliders, Lock } from 'lucide-react';
import { useProjectStore } from '../../../store/projectStore';
import { useAuthStore } from '../../../store/authStore';
import { workflowService } from '../../../services/workflowService';
import type { IssueStatus, StatusCategory, WorkflowStatus, WorkflowTransition } from '../../../types';
import TransitionEditor from '../components/TransitionEditor';
import StatusEditor from '../components/StatusEditor';
import { computeWorkflowWarnings } from '../utils/workflowWarnings';
import { formatWorkflowErrorMessage } from '../utils/workflowErrors';
import { computeWorkflowPermissions } from '../utils/workflowPermission';
import {
  NODE_Y,
  NODE_W,
  NODE_H,
  getDisplayStatusName,
  computeWorkflowCanvasLayout,
} from '../utils/workflowCanvas';

const DEFAULT_WORKFLOW_STATUSES: WorkflowStatus[] = [
  { id: 'default-1', name: 'To Do', category: 'TODO', position: 0, isInitial: true },
  { id: 'default-2', name: 'In Progress', category: 'IN_PROGRESS', position: 1, isInitial: false },
  { id: 'default-3', name: 'Pending Approval', category: 'IN_PROGRESS', position: 2, isInitial: false },
  { id: 'default-4', name: 'Done', category: 'DONE', position: 3, isInitial: false },
];

const DEFAULT_WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  { id: 'default-t1', from: 'To Do' as IssueStatus, to: 'In Progress' as IssueStatus, name: 'Chuyển sang In Progress', type: 'NORMAL', isApprovalStep: false },
  { id: 'default-t2', from: 'In Progress' as IssueStatus, to: 'Pending Approval' as IssueStatus, name: 'Chuyển sang Pending Approval', type: 'NORMAL', isApprovalStep: false },
  { id: 'default-t3', from: 'Pending Approval' as IssueStatus, to: 'Done' as IssueStatus, name: 'Chuyển sang Done', type: 'APPROVE', isApprovalStep: true },
  { id: 'default-t4', from: 'Pending Approval' as IssueStatus, to: 'In Progress' as IssueStatus, name: 'Chuyển sang In Progress', type: 'REJECT', isApprovalStep: true },
  { id: 'default-t5', from: 'Done' as IssueStatus, to: 'To Do' as IssueStatus, name: 'Chuyển sang To Do', type: 'NORMAL', isApprovalStep: false },
];

interface ArrowProps {
  startX: number;
  endX: number;
  isApproval: boolean;
  requiresField?: string | null;
  isSelected: boolean;
  onClick: () => void;
}

function Arrow({ startX, endX, isApproval, requiresField, isSelected, onClick }: ArrowProps) {
  const isForward = endX > startX;
  const sy = isForward ? NODE_Y + NODE_H : NODE_Y;
  const ey = isForward ? NODE_Y + NODE_H : NODE_Y;
  const midY = isForward ? sy + 32 : sy - 32;

  const d = `M ${startX} ${sy} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${ey}`;
  const color = isApproval ? '#E53E3E' : '#C5C5C8';
  const selectedColor = '#1A1A1A';

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <path
        d={d}
        fill="none"
        stroke={isSelected ? selectedColor : color}
        strokeWidth={isSelected ? 2 : 1.5}
        strokeDasharray={requiresField ? '4 2' : undefined}
      />
      <polygon
        points={`${endX},${ey} ${endX - 5},${ey + (isForward ? -8 : 8)} ${endX + 5},${
          ey + (isForward ? -8 : 8)
        }`}
        fill={isSelected ? selectedColor : color}
      />
    </g>
  );
}

export default function WorkflowSettings() {
  const { currentProject, myProjectRole } = useProjectStore();
  const { user, role: globalRole } = useAuthStore();

  const { isReadOnly, isProjectClosed, isPmOrAdmin, effectiveRole } = computeWorkflowPermissions(
    currentProject,
    user,
    globalRole,
    myProjectRole
  );

  const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [selectedTransition, setSelectedTransition] = useState<WorkflowTransition | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const warnings = useMemo(
    () => computeWorkflowWarnings(statuses, transitions),
    [statuses, transitions],
  );

  const currentSelectedTransition = useMemo(() => {
    if (!selectedTransition) return null;
    return (
      transitions.find(
        (t) =>
          (t.id && selectedTransition.id && String(t.id) === String(selectedTransition.id)) ||
          (t.from &&
            t.to &&
            selectedTransition.from &&
            selectedTransition.to &&
            t.from.trim().toLowerCase() === selectedTransition.from.trim().toLowerCase() &&
            t.to.trim().toLowerCase() === selectedTransition.to.trim().toLowerCase())
      ) || null
    );
  }, [selectedTransition, transitions]);

  const loadWorkflow = useCallback(async (preserveErrorMessage = false) => {
    if (!currentProject) return;
    setLoading(true);
    if (!preserveErrorMessage) {
      setErrorMessage(null);
    }
    try {
      const res = await workflowService.getWorkflow(currentProject.id);
      const data = (res as any)?.data?.statuses !== undefined
        ? (res as any).data
        : (res as any)?.statuses !== undefined
        ? res
        : (res as any)?.data || res;

      const rawStatuses = data?.statuses;
      const hasValidStatuses = Array.isArray(rawStatuses) && rawStatuses.length > 0;
      const sourceStatuses: WorkflowStatus[] = hasValidStatuses ? rawStatuses : DEFAULT_WORKFLOW_STATUSES;

      const sorted = sourceStatuses.slice().sort((a, b) => a.position - b.position);
      const seen = new Set<string>();
      const deduped: WorkflowStatus[] = [];
      for (const st of sorted) {
        const key = (st.name || '').trim().toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          deduped.push({ ...st, position: deduped.length });
        }
      }
      setStatuses(deduped);

      const validStatusNames = new Set(deduped.map((s) => (s.name || '').trim().toLowerCase()));
      const rawTransitions = hasValidStatuses && Array.isArray(data?.transitions) ? data.transitions : DEFAULT_WORKFLOW_TRANSITIONS;
      const cleanTransitions = rawTransitions.filter(
        (t: any) =>
          t &&
          t.from &&
          t.to &&
          validStatusNames.has(t.from.trim().toLowerCase()) &&
          validStatusNames.has(t.to.trim().toLowerCase())
      );
      const seenTrans = new Set<string>();
      const dedupedTrans: WorkflowTransition[] = [];
      for (const t of cleanTransitions) {
        const pairKey = `${t.from.trim().toLowerCase()}->${t.to.trim().toLowerCase()}`;
        if (!seenTrans.has(pairKey)) {
          seenTrans.add(pairKey);
          dedupedTrans.push(t);
        }
      }
      setTransitions(dedupedTrans);
    } catch (err: any) {
      if (!preserveErrorMessage) {
        setErrorMessage(err?.response?.data?.message || err?.message || 'Không thể tải quy trình');
      }
      // If error or network problem, still provide default workflow so the screen is not empty
      setStatuses(DEFAULT_WORKFLOW_STATUSES);
      setTransitions(DEFAULT_WORKFLOW_TRANSITIONS);
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    loadWorkflow();
  }, [loadWorkflow]);

  function handleSaveTransition(requiresField?: string, isApprovalStep?: boolean) {
    if (isReadOnly) return;
    const activeTrans = currentSelectedTransition || selectedTransition;
    if (!activeTrans) return;
    const cleanField = requiresField && requiresField.trim() ? requiresField.trim() : undefined;
    const approval = !!isApprovalStep;
    setTransitions((ts) =>
      ts.map((t) => {
        const matches =
          (t.id && activeTrans.id && String(t.id) === String(activeTrans.id)) ||
          (t.from && t.to && activeTrans.from && activeTrans.to &&
           t.from.trim().toLowerCase() === activeTrans.from.trim().toLowerCase() &&
           t.to.trim().toLowerCase() === activeTrans.to.trim().toLowerCase());
        if (!matches) return t;
        return {
          ...t,
          requiresField: cleanField,
          requiredFields: cleanField,
          isApprovalStep: approval,
          type: approval ? (t.type === 'REJECT' ? 'REJECT' : 'APPROVE') : 'NORMAL',
        };
      })
    );
    setSelectedTransition(null);
  }

  function handleAddStatus(name: string, category: StatusCategory = 'IN_PROGRESS') {
    if (isReadOnly) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (statuses.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage(`Trạng thái "${trimmed}" đã tồn tại!`);
      return;
    }
    const newStatus: WorkflowStatus = {
      id: String(Date.now()),
      name: trimmed,
      category,
      position: statuses.length,
      isInitial: false,
    };
    setStatuses((prev) => [...prev, newStatus]);
  }

  function handleRemoveStatus(name: string) {
    if (isReadOnly) return;
    setStatuses((prev) => {
      const filtered = prev.filter((s) => s.name.toLowerCase() !== name.toLowerCase());
      return filtered.map((s, idx) => ({ ...s, position: idx }));
    });
    setTransitions((prev) => prev.filter((t) => t.from.toLowerCase() !== name.toLowerCase() && t.to.toLowerCase() !== name.toLowerCase()));
    if (selectedTransition?.from.toLowerCase() === name.toLowerCase() || selectedTransition?.to.toLowerCase() === name.toLowerCase()) {
      setSelectedTransition(null);
    }
  }

  function handleMoveStatus(index: number, direction: 'left' | 'right') {
    if (isReadOnly) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= statuses.length) return;
    const copy = [...statuses];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    const reindexed = copy.map((s, idx) => ({ ...s, position: idx }));
    setStatuses(reindexed);
  }

  function handleReorderStatuses(newStatuses: WorkflowStatus[]) {
    if (isReadOnly) return;
    const reindexed = newStatuses.map((s, idx) => ({ ...s, position: idx }));
    setStatuses(reindexed);
  }

  function handleToggleMatrixTransition(from: string, to: string, allowed: boolean) {
    if (isReadOnly) return;
    const fromClean = from.trim();
    const toClean = to.trim();
    if (allowed) {
      // Add transition
      const isApproval = toClean.toLowerCase() === 'done' || fromClean.toLowerCase() === 'pending approval';
      const newTrans: WorkflowTransition = {
        id: `trans_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        from: fromClean as IssueStatus,
        to: toClean as IssueStatus,
        name: `Chuyển sang ${toClean}`,
        isApprovalStep: isApproval,
        type: isApproval ? 'APPROVE' : 'NORMAL',
      };
      setTransitions((prev) => [...prev, newTrans]);
    } else {
      // Remove transition
      setTransitions((prev) =>
        prev.filter((t) => !(t.from && t.to && t.from.trim().toLowerCase() === fromClean.toLowerCase() && t.to.trim().toLowerCase() === toClean.toLowerCase()))
      );
      if (
        selectedTransition?.from &&
        selectedTransition?.to &&
        selectedTransition.from.trim().toLowerCase() === fromClean.toLowerCase() &&
        selectedTransition.to.trim().toLowerCase() === toClean.toLowerCase()
      ) {
        setSelectedTransition(null);
      }
    }
  }

  function handleToggleApprovalMatrix(from: string, to: string) {
    if (isReadOnly) return;
    const fromClean = from.trim().toLowerCase();
    const toClean = to.trim().toLowerCase();
    setTransitions((prev) =>
      prev.map((t) => {
        if (t.from && t.to && t.from.trim().toLowerCase() === fromClean && t.to.trim().toLowerCase() === toClean) {
          const nextApproval = !t.isApprovalStep;
          return {
            ...t,
            isApprovalStep: nextApproval,
            type: nextApproval ? (t.type === 'REJECT' ? 'REJECT' : 'APPROVE') : 'NORMAL',
          };
        }
        return t;
      })
    );
    setSelectedTransition((prev) => {
      if (
        prev &&
        prev.from &&
        prev.to &&
        prev.from.trim().toLowerCase() === fromClean &&
        prev.to.trim().toLowerCase() === toClean
      ) {
        const nextApproval = !prev.isApprovalStep;
        return {
          ...prev,
          isApprovalStep: nextApproval,
          type: nextApproval ? (prev.type === 'REJECT' ? 'REJECT' : 'APPROVE') : 'NORMAL',
        };
      }
      return prev;
    });
  }

  async function handleSaveWorkflow() {
    if (isReadOnly || !currentProject) return;
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    // Frontend validation
    const hasInitial = statuses.some((s) => s.isInitial);
    if (!hasInitial) {
      setErrorMessage('Quy trình phải có ít nhất 1 trạng thái khởi tạo (Initial)!');
      setSaving(false);
      return;
    }

    const hasDone = statuses.some((s) => s.category === 'DONE' || (s.name && s.name.trim().toLowerCase() === 'done'));
    if (!hasDone) {
      setErrorMessage('Quy trình phải có ít nhất 1 trạng thái thuộc nhóm Hoàn thành (DONE)!');
      setSaving(false);
      return;
    }

    try {
      const seenNames = new Set<string>();
      const payloadStatuses: WorkflowStatus[] = [];
      for (const s of statuses) {
        const key = (s.name || '').trim().toLowerCase();
        if (key && !seenNames.has(key)) {
          seenNames.add(key);
          payloadStatuses.push({
            ...s,
            position: payloadStatuses.length,
          });
        }
      }

      const validNames = new Set(payloadStatuses.map((s) => (s.name || '').trim().toLowerCase()));
      const seenTrans = new Set<string>();
      const payloadTransitions: any[] = [];
      for (const t of transitions) {
        if (!t?.from || !t?.to) continue;
        const fromK = t.from.trim().toLowerCase();
        const toK = t.to.trim().toLowerCase();
        if (!validNames.has(fromK) || !validNames.has(toK)) continue;
        const pairKey = `${fromK}->${toK}`;
        if (seenTrans.has(pairKey)) continue;
        seenTrans.add(pairKey);

        const cleanField = t.requiresField && t.requiresField.trim() ? t.requiresField.trim() : null;
        const approval = Boolean(t.isApprovalStep);
        payloadTransitions.push({
          ...t,
          requiresField: cleanField,
          requiredFields: cleanField,
          isApprovalStep: approval,
          type: approval ? (t.type === 'REJECT' ? 'REJECT' : 'APPROVE') : 'NORMAL',
        });
      }

      await workflowService.updateWorkflow(currentProject.id, {
        statuses: payloadStatuses,
        transitions: payloadTransitions,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      await loadWorkflow();
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message || err?.message || 'Lỗi khi lưu quy trình';
      const friendlyMsg = formatWorkflowErrorMessage(rawMsg);

      setErrorMessage(friendlyMsg);
      setSelectedTransition(null);
      // Tự động khôi phục lại dữ liệu hiện tại từ máy chủ để UI không bị lệch
      await loadWorkflow(true);
      setErrorMessage(friendlyMsg);
    } finally {
      setSaving(false);
    }
  }

  const { svgW, svgH, getNodeX } = computeWorkflowCanvasLayout(statuses.length);

  return (
    <div className="h-full overflow-y-auto bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] flex flex-wrap items-center gap-2">
              <GitBranch className="w-5 h-5 text-[#1A1A1A] shrink-0" />
              <span>Cấu hình quy trình làm việc</span>
              {isProjectClosed ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  <Lock className="w-3 h-3 text-amber-700" />
                  Dự án đã đóng (Chỉ xem)
                </span>
              ) : !isPmOrAdmin ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                  <Lock className="w-3 h-3 text-gray-600" />
                  Chế độ chỉ xem
                </span>
              ) : null}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6B70] mt-1 leading-relaxed">
              Định nghĩa vòng đời trạng thái, ma trận chuyển tiếp hợp lệ và bước duyệt bắt buộc cho dự án{' '}
              <span className="font-semibold text-[#1A1A1A]">{currentProject?.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              id="btn-save-workflow"
              type="button"
              disabled={isReadOnly || saving}
              onClick={handleSaveWorkflow}
              title={
                isProjectClosed
                  ? 'Dự án đã đóng (CLOSED), không thể lưu thay đổi'
                  : !isPmOrAdmin
                  ? 'Bạn không có quyền PM/Admin để chỉnh sửa quy trình'
                  : undefined
              }
              className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-xs ${
                isReadOnly
                  ? 'bg-[#E5E5E7] text-[#8E8E93] cursor-not-allowed border border-[#D1D1D6]'
                  : 'bg-[#1A1A1A] hover:bg-black text-white disabled:opacity-50'
              }`}
            >
              {isReadOnly ? <Lock className="w-4 h-4 text-[#8E8E93]" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Đang lưu…' : isReadOnly ? 'Chế độ chỉ xem' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </div>

        {/* Closed Project Alert */}
        {isProjectClosed && (
          <div id="workflow-closed-alert" className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 shadow-xs">
            <Lock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-900">Dự án đã đóng (CLOSED) - Chế độ chỉ xem</div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Dự án này hiện đã ở trạng thái Đóng (CLOSED). Toàn bộ quy trình làm việc đang bị khóa ở chế độ chỉ xem; không thể tạo mới, xóa trạng thái, đổi thứ tự cột hoặc thay đổi ma trận bước chuyển.
              </p>
            </div>
          </div>
        )}

        {/* Non-PM/Admin Read-only Alert */}
        {!isProjectClosed && !isPmOrAdmin && (
          <div id="workflow-readonly-alert" className="mb-4 p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900 shadow-xs">
            <Shield className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <div className="font-semibold text-blue-900">Chế độ chỉ xem (Không có quyền cấu hình)</div>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Bạn đang xem quy trình với vai trò {effectiveRole ? effectiveRole.toUpperCase() : 'THÀNH VIÊN'}. Chỉ Quản lý dự án (PM) và Quản trị viên (Admin) mới có quyền chỉnh sửa cấu hình quy trình làm việc của dự án này.
              </p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {saveSuccess && (
          <div id="workflow-save-success" className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">Quy trình làm việc đã được cập nhật thành công vào cơ sở dữ liệu!</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div id="workflow-error-alert" className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
            <button type="button" onClick={() => setErrorMessage(null)} className="font-bold text-red-500 hover:text-red-700">
              ×
            </button>
          </div>
        )}

        {/* Warnings Banner */}
        {warnings.length > 0 && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1.5 shadow-xs">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Cảnh báo quy trình (vẫn cho phép lưu):</span>
            </div>
            <ul className="list-disc list-inside pl-1 text-[11px] space-y-0.5">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Grid: Visual Canvas & Transition Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Visual editor */}
          <div className="lg:col-span-2 border border-[#E5E5E7] rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="px-5 py-3 border-b border-[#E5E5E7] bg-[#F7F7F8] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1A1A1A]">Sơ đồ quy trình trực quan</span>
              <div className="flex items-center gap-4 text-[10px] text-[#6B6B70]">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-[#C5C5C8]" />
                  <span>Bước chuyển</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-[#E53E3E]" />
                  <span>Cổng duyệt (PM)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 border-t border-dashed border-[#C5C5C8]" />
                  <span>Trường bắt buộc</span>
                </div>
              </div>
            </div>
            <div className="p-5 overflow-x-auto">
              <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="min-w-[600px]">
                {/* Transitions */}
                {transitions.map((t) => {
                  if (!t?.from || !t?.to) return null;
                  const fromIdx = statuses.findIndex((s) => (s.name || '').trim().toLowerCase() === t.from.trim().toLowerCase());
                  const toIdx = statuses.findIndex((s) => (s.name || '').trim().toLowerCase() === t.to.trim().toLowerCase());
                  if (fromIdx < 0 || toIdx < 0) return null;

                  const startX = getNodeX(fromIdx) + NODE_W / 2;
                  const endX = getNodeX(toIdx) + NODE_W / 2;

                  return (
                    <Arrow
                      key={t.id}
                      startX={startX}
                      endX={endX}
                      isApproval={t.isApprovalStep}
                      requiresField={t.requiresField}
                      isSelected={
                        Boolean(
                          currentSelectedTransition &&
                            ((t.id && currentSelectedTransition.id && String(t.id) === String(currentSelectedTransition.id)) ||
                              (t.from && t.to && currentSelectedTransition.from && currentSelectedTransition.to &&
                               t.from.trim().toLowerCase() === currentSelectedTransition.from.trim().toLowerCase() &&
                               t.to.trim().toLowerCase() === currentSelectedTransition.to.trim().toLowerCase()))
                        )
                      }
                      onClick={() => setSelectedTransition(t)}
                    />
                  );
                })}

                {/* Status nodes */}
                {statuses.map((status, idx) => {
                  const x = getNodeX(idx);
                  const displayName = getDisplayStatusName(status.name, 12);
                  const textCenterX = x + 28 + (NODE_W - 36) / 2;

                  return (
                    <g key={status.id || status.name} className="cursor-default">
                      <title>{status.name}</title>
                      <rect
                        x={x}
                        y={NODE_Y}
                        width={NODE_W}
                        height={NODE_H}
                        rx={8}
                        fill="white"
                        stroke={status.isInitial ? '#1A1A1A' : '#E5E5E7'}
                        strokeWidth={status.isInitial ? 2 : 1.5}
                      />
                      {/* Step index badge */}
                      <circle
                        cx={x + 16}
                        cy={NODE_Y + NODE_H / 2}
                        r={8.5}
                        fill="#F0F0F1"
                      />
                      <text
                        x={x + 16}
                        y={NODE_Y + NODE_H / 2 + 3}
                        textAnchor="middle"
                        fontSize={9}
                        fontFamily="Inter, sans-serif"
                        fontWeight={700}
                        fill="#6B6B70"
                      >
                        {idx + 1}
                      </text>
                      <text
                        x={textCenterX}
                        y={NODE_Y + NODE_H / 2 + 4}
                        textAnchor="middle"
                        fontSize={10.5}
                        fontFamily="Inter, sans-serif"
                        fontWeight={600}
                        fill="#1A1A1A"
                      >
                        {displayName}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="px-5 pb-4 border-t border-[#E5E5E7] pt-4">
              <div className="text-xs font-semibold text-[#1A1A1A] mb-2">Quản lý trạng thái dự án:</div>
              <StatusEditor
                statuses={statuses}
                readOnly={isReadOnly}
                onAddStatus={handleAddStatus}
                onRemoveStatus={handleRemoveStatus}
                onMoveStatus={handleMoveStatus}
                onReorderStatuses={handleReorderStatuses}
              />
            </div>
          </div>

          {/* Transition config panel */}
          <div className="border border-[#E5E5E7] rounded-xl overflow-hidden flex flex-col bg-white shadow-xs">
            <div className="px-4 py-3 border-b border-[#E5E5E7] bg-[#F7F7F8]">
              <span className="text-xs font-semibold text-[#1A1A1A]">Chi tiết bước chuyển</span>
            </div>

            <TransitionEditor
              transition={currentSelectedTransition}
              readOnly={isReadOnly}
              onSave={handleSaveTransition}
              onCancel={() => setSelectedTransition(null)}
            />
          </div>
        </div>

        {/* All Transitions list */}
        <div className="mt-6 border border-[#E5E5E7] rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="px-5 py-3 border-b border-[#E5E5E7] bg-[#F7F7F8]">
            <span className="text-xs font-semibold text-[#1A1A1A]">Danh sách tất cả bước chuyển ({transitions.length} luồng)</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F0F0F1]">
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
                  Từ trạng thái
                </th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
                  Đến trạng thái
                </th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
                  Yêu cầu trường dữ liệu
                </th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
                  Cần phê duyệt (PM)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F1]">
              {transitions.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-[#F7F7F8] cursor-pointer transition-colors"
                  onClick={() => setSelectedTransition(t)}
                >
                  <td className="px-5 py-2.5">
                    <span className="text-xs font-medium text-[#1A1A1A]">{t.from}</span>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="text-xs font-medium text-[#1A1A1A]">{t.to}</span>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="text-xs text-[#6B6B70]">
                      {(t.requiresField && t.requiresField.trim())
                        ? t.requiresField.trim()
                        : ((t as any).requiredFields && (t as any).requiredFields.trim())
                        ? (t as any).requiredFields.trim()
                        : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    {t.isApprovalStep ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#FDECEC] text-[#E53E3E] border border-[#E53E3E]/20 inline-flex items-center gap-1">
                        <Shield className="w-3 h-3 text-[#E53E3E]" />
                        Duyệt PM
                      </span>
                    ) : (
                      <span className="text-xs text-[#9B9B9F]">Không</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MA TRẬN CÁC BƯỚC CHUYỂN TIẾP HỢP LỆ (TRANSITION MATRIX) */}
        <div className="mt-6 border border-[#E5E5E7] rounded-xl overflow-hidden bg-white shadow-xs" id="transition-matrix-section">
          <div className="px-5 py-3.5 border-b border-[#E5E5E7] bg-[#F7F7F8] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#1A1A1A]" />
                Ma trận các bước chuyển tiếp hợp lệ (Transition Matrix)
              </span>
              <p className="text-[11px] text-[#6B6B70] mt-0.5">
                Cấu hình ma trận các bước chuyển trạng thái hợp lệ. Đánh dấu để cho phép chuyển đổi từ trạng thái hàng (Từ) sang trạng thái cột (Đến).
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#6B6B70]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#1A1A1A] inline-block" /> Cho phép chuyển
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#E53E3E] inline-block" /> Duyệt PM
              </span>
            </div>
          </div>
          {statuses.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B6B70]">
              {loading ? 'Đang tải cấu hình quy trình làm việc…' : 'Chưa có trạng thái nào trong quy trình.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs" id="transition-matrix-table">
                <thead>
                  <tr className="border-b border-[#E5E5E7] bg-[#FAFAFA]">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-[#6B6B70] bg-[#F0F0F1] sticky left-0 z-10 w-48">
                      Từ \ Đến
                    </th>
                    {statuses.map((toSt) => (
                      <th key={toSt.id || toSt.name} className="px-3 py-2.5 font-semibold text-[#1A1A1A] min-w-[120px]">
                        <div className="truncate font-medium">{toSt.name}</div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-medium ${
                          toSt.category === 'TODO' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                          toSt.category === 'DONE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {toSt.category}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E7]">
                  {statuses.map((fromSt) => (
                    <tr key={fromSt.id || fromSt.name} className="hover:bg-[#F9FAFB]">
                      <td className="px-4 py-3 text-left font-semibold text-[#1A1A1A] bg-[#FAFAFA] sticky left-0 z-10 border-r border-[#E5E5E7]">
                        <div className="truncate">{fromSt.name}</div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-medium ${
                          fromSt.category === 'TODO' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                          fromSt.category === 'DONE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {fromSt.category}
                        </span>
                      </td>
                      {statuses.map((toSt) => {
                        const fromName = (fromSt.name || '').trim();
                        const toName = (toSt.name || '').trim();
                        const isSelf = fromName.toLowerCase() === toName.toLowerCase();
                        const trans = transitions.find(
                          (t) =>
                            t?.from &&
                            t?.to &&
                            t.from.trim().toLowerCase() === fromName.toLowerCase() &&
                            t.to.trim().toLowerCase() === toName.toLowerCase()
                        );
                        const isAllowed = Boolean(trans);

                        if (isSelf) {
                          return (
                            <td key={toSt.id || toSt.name} className="px-3 py-3 bg-[#F2F2F3] text-[#A0A0A5] select-none">
                              —
                            </td>
                          );
                        }

                        return (
                          <td key={toSt.id || toSt.name} className="px-3 py-3 transition-colors">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <input
                                type="checkbox"
                                data-from={fromName}
                                data-to={toName}
                                id={`matrix-check-${fromName.replace(/\s+/g, '-')}-to-${toName.replace(/\s+/g, '-')}`}
                                checked={isAllowed}
                                disabled={isReadOnly}
                                onChange={(e) => handleToggleMatrixTransition(fromName, toName, e.target.checked)}
                                className={`w-4 h-4 rounded border-[#C5C5C8] text-[#1A1A1A] focus:ring-0 ${
                                  isReadOnly ? 'cursor-not-allowed opacity-50 bg-[#F2F2F3]' : 'cursor-pointer'
                                }`}
                              />
                              {isAllowed && (
                                <button
                                  type="button"
                                  disabled={isReadOnly}
                                  title={
                                    isReadOnly
                                      ? 'Chế độ chỉ xem: không thể thay đổi loại bước chuyển'
                                      : trans?.isApprovalStep
                                      ? 'Bước duyệt bắt buộc: Cần phê duyệt (PM)'
                                      : 'Click để đặt làm bước duyệt bắt buộc (PM)'
                                  }
                                  onClick={() => handleToggleApprovalMatrix(fromName, toName)}
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium transition-all flex items-center gap-0.5 ${
                                    isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                                  } ${
                                    trans?.isApprovalStep
                                      ? 'bg-[#FDECEC] text-[#E53E3E] border border-[#E53E3E]/30 font-semibold'
                                      : 'bg-[#F0F0F1] text-[#9B9B9F] hover:text-[#1A1A1A]'
                                  }`}
                                >
                                  {trans?.isApprovalStep && <Shield className="w-2.5 h-2.5 text-[#E53E3E]" />}
                                  {trans?.isApprovalStep ? 'Duyệt PM' : 'Thường'}
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
