import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BarChartCardProps {
  title: string;
  data: any[];
  dataKey: string;
  xKey: string;
  color?: string;
  height?: number;
  className?: string;
}

export default function BarChartCard({
  title,
  data,
  dataKey,
  xKey,
  color = '#E53E3E',
  height = 240,
  className = '',
}: BarChartCardProps) {
  return (
    <div className={`p-4 bg-white border border-[#E5E5E7] rounded-xl ${className}`}>
      <h3 className="text-xs font-semibold text-[#1A1A1A] mb-4">{title}</h3>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E7" vertical={false} />
            <XAxis dataKey={xKey} stroke="#9B9B9F" fontSize={11} tickLine={false} />
            <YAxis stroke="#9B9B9F" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E5E7',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
