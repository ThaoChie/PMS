import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useProjectStore } from '../../store/projectStore';
import { reportService } from '../../services/reportService';
import type { ProgressPoint } from '../../types';

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

export const ProgressTab: React.FC = () => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentProject?.id) {
      setData([]);
      return;
    }

    setLoading(true);
    reportService
      .getProgressReport(currentProject.id)
      .then((res) => {
        const list = res?.data || (res as any) || [];
        setData(Array.isArray(list) ? list : []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [currentProject?.id]);

  const lastPoint = data.length > 0 ? data[data.length - 1] : null;
  const firstPoint = data.length > 0 ? data[0] : null;
  const totalIssues = firstPoint ? (firstPoint.remaining ?? firstPoint.actualRemaining ?? 0) + (firstPoint.completed ?? 0) : 0;
  const completedIssues = lastPoint ? (lastPoint.completed ?? 0) : 0;
  const remainingIssues = lastPoint ? (lastPoint.remaining ?? lastPoint.actualRemaining ?? 0) : 0;
  const isAtRisk = lastPoint && remainingIssues > (lastPoint.ideal ?? lastPoint.idealRemaining ?? 0);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#9B9B9F]">
        Đang tải dữ liệu tiến độ…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-20 text-center border border-[#E5E5E7] rounded-xl p-8">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Chưa có đủ dữ liệu tiến độ</h3>
        <p className="text-xs text-[#6B6B70]">
          Dự án chưa có công việc nào hoặc mới khởi tạo. Hãy tạo và cập nhật công việc để hệ thống vẽ biểu đồ Burn-down.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Status summary row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Tổng số công việc', value: totalIssues, sub: 'Phạm vi dự án' },
          { label: 'Đã hoàn thành', value: completedIssues, sub: totalIssues > 0 ? `Đạt ${Math.round((completedIssues / totalIssues) * 100)}%` : '0%' },
          { label: 'Còn lại', value: remainingIssues, sub: isAtRisk ? '⚠ Có nguy cơ trễ' : '✓ Đúng tiến độ', atRisk: isAtRisk },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`border rounded-xl p-5 ${
              stat.atRisk ? 'border-[#E53E3E]/30 bg-[#FDECEC]' : 'border-[#E5E5E7] bg-white'
            }`}
          >
            <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className={`text-3xl font-bold mb-0.5 ${stat.atRisk ? 'text-[#E53E3E]' : 'text-[#1A1A1A]'}`}>
              {stat.value}
            </p>
            <p className={`text-xs ${stat.atRisk ? 'text-[#E53E3E]' : 'text-[#6B6B70]'}`}>
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Burndown chart */}
      <div className="border border-[#E5E5E7] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-5">Biểu đồ tiến độ (Burn-down chart)</h3>
        <ResponsiveContainer width="100%" height={280}>
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
              stroke="#1A1A1A"
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
