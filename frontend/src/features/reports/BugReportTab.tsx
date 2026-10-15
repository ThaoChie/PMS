import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { CustomTooltip } from './ProgressTab';

export const bugData = [
  { priority: 'Critical', resolved: 3, unresolved: 2 },
  { priority: 'High', resolved: 7, unresolved: 4 },
  { priority: 'Medium', resolved: 12, unresolved: 3 },
  { priority: 'Low', resolved: 8, unresolved: 1 },
];

export const BugReportTab: React.FC = () => {
  const totalBugs = bugData.reduce((a, b) => a + b.resolved + b.unresolved, 0);
  const totalResolved = bugData.reduce((a, b) => a + b.resolved, 0);
  const resolutionRate = Math.round((totalResolved / totalBugs) * 100);

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-[#E5E5E7] rounded-xl p-5">
          <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">Total bugs</p>
          <p className="text-3xl font-bold text-[#1A1A1A]">{totalBugs}</p>
        </div>
        <div className="border border-[#E5E5E7] rounded-xl p-5">
          <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">Resolved</p>
          <p className="text-3xl font-bold text-[#1A1A1A]">{totalResolved}</p>
        </div>
        <div className="border border-[#E5E5E7] rounded-xl p-5">
          <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">Resolution rate</p>
          <p className="text-3xl font-bold text-[#1A1A1A]">{resolutionRate}%</p>
        </div>
      </div>

      {/* Bug chart */}
      <div className="border border-[#E5E5E7] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-5">Bugs by priority</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={bugData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F1" vertical={false} />
            <XAxis dataKey="priority" tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#6B6B70' }} />
            <Bar dataKey="resolved" name="Resolved" fill="#C5C5C8" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="unresolved" name="Unresolved" fill="#E53E3E" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
