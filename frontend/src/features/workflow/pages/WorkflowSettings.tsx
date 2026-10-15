import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Save, RefreshCw } from 'lucide-react';
import { useProjectStore } from '../../../store/projectStore';
import { workflowService } from '../../../services/workflowService';
import type { IssueStatus, WorkflowStatus, WorkflowTransition } from '../../../types';
import TransitionEditor from '../components/TransitionEditor';
import StatusEditor from '../components/StatusEditor';

const STATUS_X: Record<string, number> = {
  'To Do': 80,
  'In Progress': 260,
  'Pending Approval': 440,
  Done: 620,
};
const NODE_Y = 100;
const NODE_W = 130;
const NODE_H = 44;

interface ArrowProps {
  from: string;
  to: string;
  isApproval: boolean;
  requiresField?: string;
  isSelected: boolean;
  onClick: () => void;
}

function Arrow({ from, to, isApproval, requiresField, isSelected, onClick }: ArrowProps) {
  const fromX = STATUS_X[from] || 80;
  const toX = STATUS_X[to] || 260;
  const isForward = toX > fromX;
  const sy = isForward ? NODE_Y + NODE_H : NODE_Y;
  const ey = isForward ? NODE_Y + NODE_H : NODE_Y;
  const startX = fromX + NODE_W / 2;
  const endX = toX + NODE_W / 2;
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
  const { currentProject } = useProjectStore();

  const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedTransition, setSelectedTransition] = useState<WorkflowTransition | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadWorkflow = useCallback(async () => {
    if (!currentProject) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await workflowService.getWorkflow(currentProject.id);
      const data = res?.data;
      if (data) {
        setStatuses(data.statuses || []);
        setTransitions(data.transitions || []);
        setWarnings(data.warnings || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Không thể tải quy trình');
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    loadWorkflow();
  }, [loadWorkflow]);

  function handleSaveTransition(requiresField?: string, isApprovalStep?: boolean) {
    if (!selectedTransition) return;
    setTransitions((ts) =>
      ts.map((t) =>
        t.id === selectedTransition.id
          ? { ...t, requiresField, isApprovalStep: !!isApprovalStep }
          : t,
      ),
    );
    setSelectedTransition(null);
  }

  function handleAddStatus(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (statuses.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage(`Trạng thái "${trimmed}" đã tồn tại!`);
      return;
    }
    const newStatus: WorkflowStatus = {
      id: String(Date.now()),
      name: trimmed,
      category: 'IN_PROGRESS',
      position: statuses.length,
      isInitial: false,
    };
    setStatuses((prev) => [...prev, newStatus]);
  }

  function handleRemoveStatus(name: string) {
    setStatuses((prev) => prev.filter((s) => s.name !== name));
    setTransitions((prev) => prev.filter((t) => t.from !== name && t.to !== name));
  }

  async function handleSaveWorkflow() {
    if (!currentProject) return;
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

    const hasDone = statuses.some((s) => s.category === 'DONE' || s.name.toLowerCase() === 'done');
    if (!hasDone) {
      setErrorMessage('Quy trình phải có ít nhất 1 trạng thái thuộc nhóm Hoàn thành (DONE)!');
      setSaving(false);
      return;
    }

    try {
      const res = await workflowService.updateWorkflow(currentProject.id, {
        statuses,
        transitions,
      });
      setWarnings(res?.data?.warnings || []);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      await loadWorkflow();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Lỗi khi lưu quy trình');
    } finally {
      setSaving(false);
    }
  }

  const svgH = 240;
  const svgW = 760;

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Cấu hình quy trình làm việc</h1>
            <p className="text-sm text-[#6B6B70] mt-0.5">
              Định nghĩa các bước chuyển trạng thái và cổng phê duyệt cho công việc trong dự án{' '}
              <span className="font-semibold text-[#1A1A1A]">{currentProject?.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadWorkflow}
              className="p-2 border border-[#E5E5E7] text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8]"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveWorkflow}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-700">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
            <span>Quy trình làm việc đã được cập nhật thành công!</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
            <button type="button" onClick={() => setErrorMessage(null)} className="font-bold">
              ×
            </button>
          </div>
        )}

        {/* Warnings Banner */}
        {warnings.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Visual editor */}
          <div className="lg:col-span-2 border border-[#E5E5E7] rounded-xl overflow-hidden bg-white">
            <div className="px-5 py-3 border-b border-[#E5E5E7] bg-[#F7F7F8] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1A1A1A]">Sơ đồ quy trình trực quan</span>
              <div className="flex items-center gap-4 text-[10px] text-[#9B9B9F]">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-0.5 bg-[#C5C5C8]" />
                  <span>Bước chuyển</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-0.5 bg-[#E53E3E]" />
                  <span>Cổng phê duyệt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 border-t border-dashed border-[#C5C5C8]" />
                  <span>Yêu cầu trường dữ liệu</span>
                </div>
              </div>
            </div>
            <div className="p-5 overflow-x-auto">
              <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="min-w-[600px]">
                {/* Transitions */}
                {transitions.map((t) => (
                  <Arrow
                    key={t.id}
                    from={t.from}
                    to={t.to}
                    isApproval={t.isApprovalStep}
                    requiresField={t.requiresField}
                    isSelected={selectedTransition?.id === t.id}
                    onClick={() => setSelectedTransition(t)}
                  />
                ))}

                {/* Status nodes */}
                {statuses.map((status) => {
                  const x = STATUS_X[status.name] || 80;
                  return (
                    <g key={status.id || status.name}>
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
                      <text
                        x={x + NODE_W / 2}
                        y={NODE_Y + NODE_H / 2 + 5}
                        textAnchor="middle"
                        fontSize={11}
                        fontFamily="Inter, sans-serif"
                        fontWeight={500}
                        fill="#1A1A1A"
                      >
                        {status.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="px-5 pb-4">
              <StatusEditor
                statuses={statuses.map((s) => s.name as IssueStatus)}
                onAddStatus={handleAddStatus}
                onRemoveStatus={handleRemoveStatus}
              />
            </div>
          </div>

          {/* Transition config panel */}
          <div className="border border-[#E5E5E7] rounded-xl overflow-hidden flex flex-col bg-white">
            <div className="px-4 py-3 border-b border-[#E5E5E7] bg-[#F7F7F8]">
              <span className="text-xs font-semibold text-[#1A1A1A]">Cài đặt bước chuyển</span>
            </div>

            <TransitionEditor
              transition={selectedTransition}
              onSave={handleSaveTransition}
              onCancel={() => setSelectedTransition(null)}
            />
          </div>
        </div>

        {/* All Transitions list */}
        <div className="mt-5 border border-[#E5E5E7] rounded-xl overflow-hidden bg-white">
          <div className="px-5 py-3 border-b border-[#E5E5E7] bg-[#F7F7F8]">
            <span className="text-xs font-semibold text-[#1A1A1A]">Danh sách tất cả bước chuyển</span>
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
                  Cần phê duyệt
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
                    <span className="text-xs text-[#6B6B70]">{t.requiresField ?? '—'}</span>
                  </td>
                  <td className="px-5 py-2.5">
                    {t.isApprovalStep ? (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#FDECEC] text-[#E53E3E] border border-[#E53E3E]/20">
                        Có
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
      </div>
    </div>
  );
}
