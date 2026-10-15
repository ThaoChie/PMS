import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BurndownDataPoint {
  day: string;
  ideal: number;
  actual: number;
}

interface BurndownChartProps {
  data: BurndownDataPoint[];
  height?: number;
}

export default function BurndownChart({ data, height = 260 }: BurndownChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E7" />
          <XAxis dataKey="day" stroke="#9B9B9F" fontSize={11} tickLine={false} />
          <YAxis stroke="#9B9B9F" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E5E7',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="#9B9B9F"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            name="Lý tưởng"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#E53E3E"
            strokeWidth={2}
            name="Thực tế"
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
