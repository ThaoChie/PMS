import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useProjectStore } from '../../store/projectStore';
import { reportService } from '../../services/reportService';
import type { ProgressPoint, ProgressReportResponse } from '../../types';

export const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E5E7] rounded-lg px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-[#1A1A1A] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-medium">{p.value ?? '—'}</span>
        </p>
      ))}
    </div>
  );
};

interface ProgressTabProps {
  from?: string;
  to?: string;
  metric?: string;
}

export const ProgressTab: React.FC<ProgressTabProps> = ({ from, to, metric = 'issues' }) => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [data, setData] = useState<ProgressPoint[]>([]);
  const [report, setReport] = useState<ProgressReportResponse | null>(null);
  const [hasEnoughData, setHasEnoughData] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentProject?.id) {
      setData([]);
      setReport(null);
      setHasEnoughData(false);
      return;
    }

    setLoading(true);
    reportService
      .getProgressReport(currentProject.id, from, to, metric)
      .then((res: any) => {
        const payload = res?.data || res;
        if (payload && Array.isArray(payload.series)) {
          setReport(payload);
          setData(payload.series);
          setHasEnoughData(payload.hasEnoughData ?? (payload.series.length > 0));
        } else if (Array.isArray(payload)) {
          setData(payload);
          setHasEnoughData(payload.length > 0);
        } else {
          setData([]);
          setHasEnoughData(false);
        }
      })
      .catch(() => {
        setData([]);
        setHasEnoughData(false);
      })
      .finally(() => setLoading(false));
  }, [currentProject?.id, from, to, metric]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#9B9B9F]">
        Đang tải dữ liệu tiến độ thực tế…
      </div>
    );
  }

  if (!hasEnoughData || data.length === 0) {
    return (
      <div className="py-20 text-center border border-[#E5E5E7] rounded-xl p-8 bg-white">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Chưa có đủ dữ liệu tiến độ</h3>
        <p className="text-xs text-[#6B6B70] max-w-md mx-auto">
          Dự án chưa có công việc nào trong khoảng thời gian này hoặc mới khởi tạo. Hãy tạo và cập nhật trạng thái công việc để hệ thống dựng biểu đồ Burn-down thực tế.
        </p>
      </div>
    );
  }

  const lastPoint = data[data.length - 1];
  const firstPoint = data[0];
  const totalScope = report?.totalScope ?? (firstPoint ? ((firstPoint.remaining ?? firstPoint.actualRemaining ?? 0) + (firstPoint.completed ?? 0)) : 0);
  const completedIssues = report?.currentCompleted ?? (lastPoint?.completed ?? 0);
  const remainingIssues = report?.currentRemaining ?? (lastPoint?.remaining ?? lastPoint?.actualRemaining ?? 0);
  const isAtRisk = report?.isAtRisk ?? (lastPoint && remainingIssues > (lastPoint.ideal ?? lastPoint.idealRemaining ?? 0));
  const completionPercentage = totalScope > 0 ? Math.round((completedIssues / totalScope) * 100) : 0;

  const unitLabel = metric === 'hours' ? 'giờ' : 'công việc';

  return (
    <div>
      {/* Status summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: `Tổng phạm vi (${unitLabel})`,
            value: totalScope,
            sub: `Khoảng thời gian ${from || '30 ngày qua'}`,
          },
          {
            label: `Đã hoàn thành`,
            value: completedIssues,
            sub: `Đạt ${completionPercentage}% tổng khối lượng`,
          },
          {
            label: `Còn lại`,
            value: remainingIssues,
            sub: isAtRisk ? '⚠ Có nguy cơ trễ tiến độ' : '✓ Đúng tiến độ dự kiến',
            atRisk: isAtRisk,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`border rounded-xl p-5 transition-all ${
              stat.atRisk ? 'border-[#E53E3E]/40 bg-[#FDECEC]' : 'border-[#E5E5E7] bg-white'
            }`}
          >
            <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className={`text-3xl font-bold mb-0.5 ${stat.atRisk ? 'text-[#E53E3E]' : 'text-[#1A1A1A]'}`}>
              {stat.value}
            </p>
            <p className={`text-xs ${stat.atRisk ? 'text-[#E53E3E] font-medium' : 'text-[#6B6B70]'}`}>
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Burndown chart */}
      <div className="border border-[#E5E5E7] rounded-xl p-6 bg-white">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Biểu đồ tiến độ (Burn-down chart)</h3>
            <p className="text-xs text-[#6B6B70] mt-0.5">
              Dựng từ lịch sử chuyển trạng thái thực tế ({metric === 'hours' ? 'Đơn vị: giờ' : 'Đơn vị: số lượng công việc'})
            </p>
          </div>
          {isAtRisk && (
            <span className="text-xs px-2.5 py-1 rounded bg-[#E53E3E]/10 text-[#E53E3E] font-medium">
              Chậm hơn đường lý tưởng
            </span>
          )}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F1" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#6B6B70' }} />
            <Line
              type="monotone"
              dataKey="ideal"
              name="Lý tưởng (Ideal)"
              stroke="#D1D1D3"
              strokeDasharray="4 2"
              dot={false}
              strokeWidth={1.5}
            />
            <Line
              type="monotone"
              dataKey="remaining"
              name="Còn lại (Remaining)"
              stroke={isAtRisk ? '#E53E3E' : '#1A1A1A'}
              dot={false}
              strokeWidth={2}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="completed"
              name="Đã hoàn thành"
              stroke="#6B6B70"
              dot={false}
              strokeWidth={1.5}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
