import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useProjectStore } from '../../store/projectStore';
import { reportService } from '../../services/reportService';
import type { BugReportItem, BugReportResponse } from '../../types';
import { CustomTooltip } from './ProgressTab';

interface BugReportTabProps {
  from?: string;
  to?: string;
}

export const BugReportTab: React.FC<BugReportTabProps> = ({ from, to }) => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [data, setData] = useState<BugReportItem[]>([]);
  const [report, setReport] = useState<BugReportResponse | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentProject?.id) {
      setData([]);
      setReport(null);
      setForbidden(false);
      return;
    }

    setLoading(true);
    setForbidden(false);
    reportService
      .getBugReport(currentProject.id, from, to)
      .then((res: any) => {
        const payload = res?.data || res;
        if (payload && Array.isArray(payload.byPriority)) {
          setReport(payload);
          setData(payload.byPriority);
        } else if (Array.isArray(payload)) {
          setData(payload);
        } else {
          setData([]);
        }
      })
      .catch((err: any) => {
        if (err?.response?.status === 403) {
          setForbidden(true);
        }
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [currentProject?.id, from, to]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#9B9B9F]">
        Đang tải báo cáo lỗi (Bug) thực tế…
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="py-20 text-center border border-[#E5E5E7] rounded-xl p-8 bg-white">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Không có quyền truy cập báo cáo lỗi</h3>
        <p className="text-xs text-[#6B6B70] max-w-md mx-auto">
          Theo ma trận phân quyền (FR-RPT-03), báo cáo thống kê lỗi (Bug) chỉ dành riêng cho Quản lý dự án (PM), kiểm thử viên (QA) và Quản trị viên.
        </p>
      </div>
    );
  }

  const totalBugs = report?.totalBugs ?? data.reduce((a, b) => a + (b.resolved || 0) + (b.unresolved || 0), 0);
  const totalResolved = report?.resolvedBugs ?? data.reduce((a, b) => a + (b.resolved || 0), 0);
  const totalUnresolved = report?.unresolvedBugs ?? (totalBugs - totalResolved);
  const resolutionRate = report?.resolutionRate ?? (totalBugs > 0 ? Math.round((totalResolved / totalBugs) * 100) : 0);
  const avgClosingTime = report?.avgClosingTimeHours;

  if (totalBugs === 0) {
    return (
      <div className="py-20 text-center border border-[#E5E5E7] rounded-xl p-8 bg-white">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Dự án không có lỗi (Bug) nào</h3>
        <p className="text-xs text-[#6B6B70] max-w-md mx-auto">
          Hiện tại chưa có công việc loại Bug nào được tạo trong dự án này trong khoảng thời gian đã chọn.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="border border-[#E5E5E7] rounded-xl p-4 bg-white">
          <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">Tổng số lỗi</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{totalBugs}</p>
          <p className="text-xs text-[#6B6B70] mt-0.5">Phát sinh</p>
        </div>
        <div className="border border-[#E5E5E7] rounded-xl p-4 bg-white">
          <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">Đã khắc phục</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{totalResolved}</p>
          <p className="text-xs text-[#6B6B70] mt-0.5">Trạng thái DONE</p>
        </div>
        <div className="border border-[#E5E5E7] rounded-xl p-4 bg-white">
          <p className="text-[10px] font-medium text-[#E53E3E] uppercase tracking-wider mb-1">Chưa khắc phục</p>
          <p className="text-2xl font-bold text-[#E53E3E]">{totalUnresolved}</p>
          <p className="text-xs text-[#E53E3E] mt-0.5">Cần xử lý</p>
        </div>
        <div className="border border-[#E5E5E7] rounded-xl p-4 bg-white">
          <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">Tỷ lệ xử lý</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{resolutionRate}%</p>
          <p className="text-xs text-[#6B6B70] mt-0.5">Tỷ lệ thành công</p>
        </div>
        <div className="border border-[#E5E5E7] rounded-xl p-4 bg-white">
          <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">Thời gian đóng TB</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">
            {avgClosingTime != null ? `${avgClosingTime}h` : '—'}
          </p>
          <p className="text-xs text-[#6B6B70] mt-0.5">Từ lúc tạo đến DONE</p>
        </div>
      </div>

      {/* Bug chart */}
      <div className="border border-[#E5E5E7] rounded-xl p-5 bg-white">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Lỗi theo mức độ ưu tiên (Priority)</h3>
        <p className="text-xs text-[#6B6B70] mb-5">
          Phần màu đỏ biểu thị các lỗi chưa được khắc phục (cần giải quyết)
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F1" vertical={false} />
            <XAxis dataKey="priority" tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#6B6B70' }} />
            <Bar dataKey="resolved" name="Đã khắc phục" fill="#C5C5C8" radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Bar dataKey="unresolved" name="Chưa khắc phục" fill="#E53E3E" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
