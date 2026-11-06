import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Save, RefreshCw, GitBranch, Shield, ArrowRight, Sliders } from 'lucide-react';
import { useProjectStore } from '../../../store/projectStore';
import { workflowService } from '../../../services/workflowService';
import type { IssueStatus, StatusCategory, WorkflowStatus, WorkflowTransition } from '../../../types';
import TransitionEditor from '../components/TransitionEditor';
import StatusEditor from '../components/StatusEditor';

const NODE_Y = 100;
const NODE_W = 125;
const NODE_H = 44;

interface ArrowProps {
  startX: number;
  endX: number;
  isApproval: boolean;
  requiresField?: string;
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

  function handleAddStatus(name: string, category: StatusCategory = 'IN_PROGRESS') {
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
    setStatuses((prev) => prev.filter((s) => s.name !== name));
    setTransitions((prev) => prev.filter((t) => t.from !== name && t.to !== name));
    if (selectedTransition?.from === name || selectedTransition?.to === name) {
      setSelectedTransition(null);
    }
  }

  function handleToggleMatrixTransition(from: string, to: string, allowed: boolean) {
    if (allowed) {
      // Add transition
      const newTrans: WorkflowTransition = {
        id: `trans_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        from: from as IssueStatus,
        to: to as IssueStatus,
        name: `Chuyển sang ${to}`,
        isApprovalStep: to.toLowerCase() === 'done' || from.toLowerCase() === 'pending approval',
      };
      setTransitions((prev) => [...prev, newTrans]);
    } else {
      // Remove transition
      setTransitions((prev) =>
        prev.filter((t) => !(t.from.toLowerCase() === from.toLowerCase() && t.to.toLowerCase() === to.toLowerCase()))
      );
      if (selectedTransition?.from.toLowerCase() === from.toLowerCase() && selectedTransition?.to.toLowerCase() === to.toLowerCase()) {
        setSelectedTransition(null);
      }
    }
  }

  function handleToggleApprovalMatrix(from: string, to: string) {
    setTransitions((prev) =>
      prev.map((t) => {
        if (t.from.toLowerCase() === from.toLowerCase() && t.to.toLowerCase() === to.toLowerCase()) {
          return { ...t, isApprovalStep: !t.isApprovalStep };
        }
        return t;
      })
    );
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
  const svgW = Math.max(760, statuses.length * 160);

  const getNodeX = (index: number) => {
    if (statuses.length <= 1) return 80;
    const totalW = svgW - 160;
    const step = totalW / (statuses.length - 1);
    return 60 + index * step;
  };

  return (
    <div className="h-full overflow-y-auto bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-[#1A1A1A]" />
              Cấu hình quy trình làm việc (Workflow Engine)
            </h1>
            <p className="text-xs text-[#6B6B70] mt-1">
              Định nghĩa vòng đời trạng thái, ma trận chuyển tiếp hợp lệ và bước duyệt bắt buộc cho dự án{' '}
              <span className="font-semibold text-[#1A1A1A]">{currentProject?.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-refresh-workflow"
              type="button"
              onClick={loadWorkflow}
              className="p-2 border border-[#E5E5E7] text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8] transition-colors"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="btn-save-workflow"
              type="button"
              disabled={saving}
              onClick={handleSaveWorkflow}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] hover:bg-black text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </div>

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
                  <span>Cổng duyệt PM/QA</span>
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
                  const fromIdx = statuses.findIndex((s) => s.name.toLowerCase() === t.from.toLowerCase());
                  const toIdx = statuses.findIndex((s) => s.name.toLowerCase() === t.to.toLowerCase());
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
                      isSelected={selectedTransition?.id === t.id}
                      onClick={() => setSelectedTransition(t)}
                    />
                  );
                })}

                {/* Status nodes */}
                {statuses.map((status, idx) => {
                  const x = getNodeX(idx);
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
                        y={NODE_Y + NODE_H / 2 + 4}
                        textAnchor="middle"
                        fontSize={11}
                        fontFamily="Inter, sans-serif"
                        fontWeight={600}
                        fill="#1A1A1A"
                      >
                        {status.name}
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
                onAddStatus={handleAddStatus}
                onRemoveStatus={handleRemoveStatus}
              />
            </div>
          </div>

          {/* Transition config panel */}
          <div className="border border-[#E5E5E7] rounded-xl overflow-hidden flex flex-col bg-white shadow-xs">
            <div className="px-4 py-3 border-b border-[#E5E5E7] bg-[#F7F7F8]">
              <span className="text-xs font-semibold text-[#1A1A1A]">Chi tiết bước chuyển</span>
            </div>

            <TransitionEditor
              transition={selectedTransition}
              onSave={handleSaveTransition}
              onCancel={() => setSelectedTransition(null)}
            />
          </div>
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
                <span className="w-2.5 h-2.5 rounded-sm bg-[#E53E3E] inline-block" /> Duyệt PM/QA
              </span>
            </div>
          </div>
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
                      const isSelf = fromSt.name.toLowerCase() === toSt.name.toLowerCase();
                      const trans = transitions.find(
                        (t) => t.from.toLowerCase() === fromSt.name.toLowerCase() && t.to.toLowerCase() === toSt.name.toLowerCase()
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
                              data-from={fromSt.name}
                              data-to={toSt.name}
                              id={`matrix-check-${fromSt.name.replace(/\s+/g, '-')}-to-${toSt.name.replace(/\s+/g, '-')}`}
                              checked={isAllowed}
                              onChange={(e) => handleToggleMatrixTransition(fromSt.name, toSt.name, e.target.checked)}
                              className="w-4 h-4 rounded border-[#C5C5C8] text-[#1A1A1A] focus:ring-0 cursor-pointer"
                            />
                            {isAllowed && (
                              <button
                                type="button"
                                title={trans?.isApprovalStep ? "Bước duyệt bắt buộc: Cần phê duyệt PM/QA" : "Click để đặt làm bước duyệt bắt buộc PM/QA"}
                                onClick={() => handleToggleApprovalMatrix(fromSt.name, toSt.name)}
                                className={`text-[9px] px-1.5 py-0.5 rounded font-medium transition-all flex items-center gap-0.5 ${
                                  trans?.isApprovalStep
                                    ? 'bg-[#FDECEC] text-[#E53E3E] border border-[#E53E3E]/30 font-semibold'
                                    : 'bg-[#F0F0F1] text-[#9B9B9F] hover:text-[#1A1A1A]'
                                }`}
                              >
                                {trans?.isApprovalStep && <Shield className="w-2.5 h-2.5 text-[#E53E3E]" />}
                                {trans?.isApprovalStep ? 'Duyệt PM/QA' : 'Thường'}
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
                  Cần phê duyệt PM/QA
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
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#FDECEC] text-[#E53E3E] border border-[#E53E3E]/20 inline-flex items-center gap-1">
                        <Shield className="w-3 h-3 text-[#E53E3E]" />
                        Bắt buộc duyệt
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
