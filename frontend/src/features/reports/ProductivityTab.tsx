import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { Role } from '../../types';
import { useProjectStore } from '../../store/projectStore';
import { reportService } from '../../services/reportService';
import { CustomTooltip } from './ProgressTab';

interface ProductivityTabProps {
  role: Role;
}

export const ProductivityTab: React.FC<ProductivityTabProps> = ({ role }) => {
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
      .getProductivityReport(currentProject.id)
      .then((res) => {
        const list = res?.data || (res as any) || [];
        setData(Array.isArray(list) ? list : []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [currentProject?.id]);

  const isMemberRole = role === 'member';

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#9B9B9F]">
        Đang tải dữ liệu năng suất…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-20 text-center border border-[#E5E5E7] rounded-xl p-8">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Chưa có dữ liệu năng suất</h3>
        <p className="text-xs text-[#6B6B70]">
          Chưa có công việc nào được phân công hoặc hoàn thành bởi các thành viên trong dự án này.
        </p>
      </div>
    );
  }

  const totalCompleted = data.reduce((a, b) => a + (b.completed || 0), 0);
  const totalInProgress = data.reduce((a, b) => a + (b.inProgress || 0), 0);

  return (
    <div>
      {isMemberRole ? (
        <div className="border border-[#E5E5E7] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Tóm tắt cấp độ dự án</h3>
          <p className="text-xs text-[#6B6B70] mb-5">
            Chi tiết năng suất từng thành viên hiển thị cho Quản lý dự án (PM) và Quản trị viên.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-[#E5E5E7] rounded-xl p-5">
              <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">
                Công việc đã hoàn thành
              </p>
              <p className="text-3xl font-bold text-[#1A1A1A]">{totalCompleted}</p>
            </div>
            <div className="border border-[#E5E5E7] rounded-xl p-5">
              <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">
                Đang thực hiện
              </p>
              <p className="text-3xl font-bold text-[#1A1A1A]">{totalInProgress}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-[#E5E5E7] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-5">Công việc theo từng thành viên</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F1" vertical={false} />
              <XAxis dataKey="member" tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#6B6B70' }} />
              <Bar dataKey="completed" name="Đã hoàn thành" fill="#1A1A1A" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="inProgress" name="Đang thực hiện" fill="#E5E5E7" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
