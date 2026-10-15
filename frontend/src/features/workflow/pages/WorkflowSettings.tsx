import React, { useState } from 'react';
import { workflowTransitions } from '../../../data/mockData';
import type { IssueStatus, WorkflowTransition } from '../../../types';
import TransitionEditor from '../components/TransitionEditor';
import StatusEditor from '../components/StatusEditor';

const STATUSES: IssueStatus[] = ['To Do', 'In Progress', 'Pending Approval', 'Done'];

const STATUS_X: Record<IssueStatus, number> = {
  'To Do': 80,
  'In Progress': 260,
  'Pending Approval': 440,
  Done: 620,
};
const NODE_Y = 100;
const NODE_W = 130;
const NODE_H = 44;

function getNodeCenter(status: IssueStatus) {
  return {
    x: STATUS_X[status] + NODE_W / 2,
    y: NODE_Y + NODE_H / 2,
  };
}

interface ArrowProps {
  from: IssueStatus;
  to: IssueStatus;
  isApproval: boolean;
  requiresField?: string;
  isSelected: boolean;
  onClick: () => void;
}

function Arrow({ from, to, isApproval, requiresField, isSelected, onClick }: ArrowProps) {
  const isForward = STATUS_X[to] > STATUS_X[from];
  const sy = isForward ? NODE_Y + NODE_H : NODE_Y;
  const ey = isForward ? NODE_Y + NODE_H : NODE_Y;
  const startX = STATUS_X[from] + NODE_W / 2;
  const endX = STATUS_X[to] + NODE_W / 2;
  const midY = isForward ? sy + 32 : sy - 32;

  const d = `M ${startX} ${sy} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${ey}`;
  const color = isApproval ? '#E53E3E' : '#C5C5C8';
  const selectedColor = '#1A1A1A';
  const midX = (startX + endX) / 2;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <path
        d={d}
        fill="none"
        stroke={isSelected ? selectedColor : color}
        strokeWidth={isSelected ? 2 : 1.5}
        strokeDasharray={requiresField ? '4 2' : undefined}
      />
      {/* Arrow head */}
      <polygon
        points={`${endX},${ey} ${endX - 5},${ey + (isForward ? -8 : 8)} ${endX + 5},${
          ey + (isForward ? -8 : 8)
        }`}
        fill={isSelected ? selectedColor : color}
      />
      {/* Click target */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={12} />
      {/* Label dot */}
      <circle
        cx={midX}
        cy={midY}
        r={isApproval || requiresField ? 6 : 0}
        fill={isSelected ? selectedColor : color}
        opacity={0.7}
      />
    </g>
  );
}

export default function WorkflowSettings() {
  const [statuses, setStatuses] = useState<IssueStatus[]>(STATUSES);
  const [transitions, setTransitions] = useState(workflowTransitions);
  const [selectedTransition, setSelectedTransition] = useState<WorkflowTransition | null>(null);

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

  const svgH = 240;
  const svgW = 760;

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Cấu hình quy trình làm việc</h1>
          <p className="text-sm text-[#6B6B70] mt-0.5">
            Định nghĩa các bước chuyển trạng thái và cổng phê duyệt cho công việc trong dự án
          </p>
        </div>

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
                {statuses.map((status) => (
                  <g key={status}>
                    <rect
                      x={STATUS_X[status] || 80}
                      y={NODE_Y}
                      width={NODE_W}
                      height={NODE_H}
                      rx={8}
                      fill="white"
                      stroke="#E5E5E7"
                      strokeWidth={1.5}
                    />
                    <text
                      x={(STATUS_X[status] || 80) + NODE_W / 2}
                      y={NODE_Y + NODE_H / 2 + 5}
                      textAnchor="middle"
                      fontSize={11}
                      fontFamily="Inter, sans-serif"
                      fontWeight={500}
                      fill="#1A1A1A"
                    >
                      {status}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <div className="px-5 pb-4">
              <StatusEditor
                statuses={statuses}
                onAddStatus={(name) => setStatuses((prev) => [...prev, name as IssueStatus])}
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
