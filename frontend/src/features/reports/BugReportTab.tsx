import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useProjectStore } from '../../store/projectStore';
import { reportService } from '../../services/reportService';
import { CustomTooltip } from './ProgressTab';

export const BugReportTab: React.FC = () => {
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
      .getBugReport(currentProject.id)
      .then((res) => {
        const list = res?.data || (res as any) || [];
        setData(Array.isArray(list) ? list : []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [currentProject?.id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#9B9B9F]">
        Đang tải báo cáo lỗi (Bug)…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-20 text-center border border-[#E5E5E7] rounded-xl p-8">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Dự án không có lỗi (Bug) nào</h3>
        <p className="text-xs text-[#6B6B70]">
          Hiện tại chưa có công việc loại Bug nào được tạo trong dự án này.
        </p>
      </div>
    );
  }

  const totalBugs = data.reduce((a, b) => a + (b.resolved || 0) + (b.unresolved || 0), 0);
  const totalResolved = data.reduce((a, b) => a + (b.resolved || 0), 0);
  const resolutionRate = totalBugs > 0 ? Math.round((totalResolved / totalBugs) * 100) : 0;

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-[#E5E5E7] rounded-xl p-5">
          <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">Tổng số lỗi (Bugs)</p>
          <p className="text-3xl font-bold text-[#1A1A1A]">{totalBugs}</p>
        </div>
        <div className="border border-[#E5E5E7] rounded-xl p-5">
          <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">Đã khắc phục</p>
          <p className="text-3xl font-bold text-[#1A1A1A]">{totalResolved}</p>
        </div>
        <div className="border border-[#E5E5E7] rounded-xl p-5">
          <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">Tỷ lệ xử lý thành công</p>
          <p className="text-3xl font-bold text-[#1A1A1A]">{resolutionRate}%</p>
        </div>
      </div>

      {/* Bug chart */}
      <div className="border border-[#E5E5E7] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-5">Lỗi theo mức độ ưu tiên</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F1" vertical={false} />
            <XAxis dataKey="priority" tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#6B6B70' }} />
            <Bar dataKey="resolved" name="Đã khắc phục" fill="#C5C5C8" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="unresolved" name="Chưa khắc phục" fill="#E53E3E" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
