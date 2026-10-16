import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { Role, ProductivityPoint, MemberProductivity, ProductivityReportResponse } from '../../types';
import { useProjectStore } from '../../store/projectStore';
import { reportService } from '../../services/reportService';
import { CustomTooltip } from './ProgressTab';

interface ProductivityTabProps {
  role: Role;
  from?: string;
  to?: string;
}

export const ProductivityTab: React.FC<ProductivityTabProps> = ({ role, from, to }) => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [data, setData] = useState<ProductivityPoint[]>([]);
  const [members, setMembers] = useState<MemberProductivity[]>([]);
  const [report, setReport] = useState<ProductivityReportResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentProject?.id) {
      setData([]);
      setMembers([]);
      setReport(null);
      return;
    }

    setLoading(true);
    reportService
      .getProductivityReport(currentProject.id, from, to)
      .then((res: any) => {
        const payload = res?.data || res;
        if (payload && (Array.isArray(payload.points) || Array.isArray(payload.members))) {
          setReport(payload);
          setData(payload.points || []);
          setMembers(payload.members || []);
        } else if (Array.isArray(payload)) {
          setData(payload);
          setMembers([]);
        } else {
          setData([]);
          setMembers([]);
        }
      })
      .catch(() => {
        setData([]);
        setMembers([]);
      })
      .finally(() => setLoading(false));
  }, [currentProject?.id, from, to]);

  const isMemberRole = role === 'member' || report?.scope === 'PROJECT_SUMMARY';

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#9B9B9F]">
        Đang tải dữ liệu năng suất thực tế…
      </div>
    );
  }

  const totalCompleted = report?.totalCompleted ?? data.reduce((a, b) => a + (b.completed || 0), 0);
  const totalInProgress = report?.totalInProgress ?? data.reduce((a, b) => a + (b.inProgress || 0), 0);
  const avgResolutionTime = report?.avgResolutionTimeHours;
  const totalLoggedHours = report?.totalLoggedHours;

  const hasData = totalCompleted > 0 || totalInProgress > 0 || (totalLoggedHours != null && totalLoggedHours > 0) || data.length > 0;

  if (!hasData) {
    return (
      <div className="py-20 text-center border border-[#E5E5E7] rounded-xl p-8 bg-white">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Chưa có dữ liệu năng suất</h3>
        <p className="text-xs text-[#6B6B70] max-w-md mx-auto">
          Chưa có công việc nào được phân công hoặc hoàn thành bởi các thành viên trong khoảng thời gian này.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border border-[#E5E5E7] rounded-xl p-4 bg-white">
          <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">
            Đã hoàn thành
          </p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{totalCompleted}</p>
          <p className="text-xs text-[#6B6B70] mt-0.5">Trạng thái DONE</p>
        </div>
        <div className="border border-[#E5E5E7] rounded-xl p-4 bg-white">
          <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">
            Đang thực hiện
          </p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{totalInProgress}</p>
          <p className="text-xs text-[#6B6B70] mt-0.5">Chưa hoàn tất</p>
        </div>
        <div className="border border-[#E5E5E7] rounded-xl p-4 bg-white">
          <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">
            Thời gian xử lý TB
          </p>
          <p className="text-2xl font-bold text-[#1A1A1A]">
            {avgResolutionTime != null ? `${avgResolutionTime}h` : '—'}
          </p>
          <p className="text-xs text-[#6B6B70] mt-0.5">Tạo đến khi xong</p>
        </div>
        <div className="border border-[#E5E5E7] rounded-xl p-4 bg-white">
          <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-1">
            Tổng giờ đã log
          </p>
          <p className="text-2xl font-bold text-[#1A1A1A]">
            {totalLoggedHours != null ? `${totalLoggedHours}h` : '0h'}
          </p>
          <p className="text-xs text-[#6B6B70] mt-0.5">Thời gian ghi nhận</p>
        </div>
      </div>

      {isMemberRole ? (
        <div className="border border-[#E5E5E7] rounded-xl p-6 bg-white">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Tóm tắt cấp độ dự án</h3>
          <p className="text-xs text-[#6B6B70]">
            Theo quy định bảo mật (BR-RPT-02), chi tiết phân bổ công việc từng cá nhân chỉ hiển thị cho Quản lý dự án (PM) và Quản trị viên.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Chart */}
          {data.length > 0 && (
            <div className="border border-[#E5E5E7] rounded-xl p-5 bg-white">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">Khối lượng công việc theo thành viên</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F1" vertical={false} />
                  <XAxis dataKey="member" tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#6B6B70' }} />
                  <Bar dataKey="completed" name="Đã hoàn thành" fill="#1A1A1A" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="inProgress" name="Đang thực hiện" fill="#E5E5E7" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Members Breakdown Table */}
          {members.length > 0 && (
            <div className="border border-[#E5E5E7] rounded-xl p-5 bg-white">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Chi tiết năng suất từng thành viên</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#E5E5E7] text-[#9B9B9F] font-medium uppercase tracking-wider">
                      <th className="py-2.5 px-3">Thành viên</th>
                      <th className="py-2.5 px-3 text-right">Đã hoàn thành</th>
                      <th className="py-2.5 px-3 text-right">Đang làm</th>
                      <th className="py-2.5 px-3 text-right">Thời gian xử lý TB</th>
                      <th className="py-2.5 px-3 text-right">Tổng giờ đã log</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0F1]">
                    {members.map((m) => (
                      <tr key={m.userId} className="hover:bg-[#F9F9FB] transition-colors">
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-[#1A1A1A]">{m.fullName}</p>
                          <p className="text-[11px] text-[#6B6B70]">{m.email}</p>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-[#1A1A1A]">
                          {m.completedIssues}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#6B6B70]">
                          {m.inProgressIssues}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#6B6B70]">
                          {m.avgResolutionTimeHours != null ? `${m.avgResolutionTimeHours}h` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-[#1A1A1A]">
                          {m.totalLoggedHours != null ? `${m.totalLoggedHours}h` : '0h'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
