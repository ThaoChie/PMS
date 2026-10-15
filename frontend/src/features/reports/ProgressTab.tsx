import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export const progressData = [
  { day: 'Mar 1', remaining: 48, completed: 2, ideal: 50 },
  { day: 'Mar 3', remaining: 44, completed: 6, ideal: 44 },
  { day: 'Mar 5', remaining: 40, completed: 10, ideal: 38 },
  { day: 'Mar 7', remaining: 38, completed: 12, ideal: 32 },
  { day: 'Mar 9', remaining: 32, completed: 18, ideal: 26 },
  { day: 'Mar 11', remaining: 30, completed: 20, ideal: 20 },
  { day: 'Mar 13', remaining: 28, completed: 22, ideal: 14 },
  { day: 'Mar 15', remaining: 24, completed: 26, ideal: 8 },
  { day: 'Mar 17', remaining: null, completed: null, ideal: 2 },
  { day: 'Mar 19', remaining: null, completed: null, ideal: 0 },
];

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
  const isAtRisk = progressData[5].remaining! > progressData[5].ideal!;

  return (
    <div>
      {/* Status summary row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Tổng số công việc', value: '50', sub: 'Phạm vi Sprint' },
          { label: 'Đã hoàn thành', value: '20', sub: 'Đạt 40%' },
          { label: 'Còn lại', value: '30', sub: isAtRisk ? '⚠ Có nguy cơ trễ' : '✓ Đúng tiến độ', atRisk: isAtRisk },
        ].map(stat => (
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
          <LineChart data={progressData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
