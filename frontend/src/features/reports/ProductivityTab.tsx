import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { Role } from '../../types';
import { CustomTooltip } from './ProgressTab';

export const productivityData = [
  { member: 'Marcus J.', completed: 8, inProgress: 2 },
  { member: 'Priya P.', completed: 6, inProgress: 3 },
  { member: 'Tom W.', completed: 5, inProgress: 1 },
  { member: 'Nina R.', completed: 4, inProgress: 2 },
  { member: 'Alex C.', completed: 3, inProgress: 1 },
  { member: 'Sarah K.', completed: 2, inProgress: 0 },
];

interface ProductivityTabProps {
  role: Role;
}

export const ProductivityTab: React.FC<ProductivityTabProps> = ({ role }) => {
  const isMemberRole = role === 'member';

  return (
    <div>
      {isMemberRole ? (
        <div className="border border-[#E5E5E7] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Project-level summary</h3>
          <p className="text-xs text-[#6B6B70] mb-5">
            Detailed per-member breakdown is available to Project Managers and Admins.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-[#E5E5E7] rounded-xl p-5">
              <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">
                Issues completed this sprint
              </p>
              <p className="text-3xl font-bold text-[#1A1A1A]">
                {productivityData.reduce((a, b) => a + b.completed, 0)}
              </p>
            </div>
            <div className="border border-[#E5E5E7] rounded-xl p-5">
              <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">
                In progress
              </p>
              <p className="text-3xl font-bold text-[#1A1A1A]">
                {productivityData.reduce((a, b) => a + b.inProgress, 0)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-[#E5E5E7] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-5">Issues completed per member</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={productivityData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F1" vertical={false} />
              <XAxis dataKey="member" tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#6B6B70' }} />
              <Bar dataKey="completed" name="Completed" fill="#1A1A1A" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="inProgress" name="In Progress" fill="#E5E5E7" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
