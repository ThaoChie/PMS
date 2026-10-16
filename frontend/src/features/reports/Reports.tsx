import React, { useState } from 'react';
import type { Role } from '../../types';
import { useProjectStore } from '../../store/projectStore';
import { ProgressTab } from './ProgressTab';
import { ProductivityTab } from './ProductivityTab';
import { BugReportTab } from './BugReportTab';

interface ReportsProps {
  role: Role;
}

export default function Reports({ role }: ReportsProps) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [activeTab, setActiveTab] = useState<'progress' | 'productivity' | 'bugs'>('progress');

  // Date range state (default 30 days)
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [metric, setMetric] = useState<'issues' | 'hours'>('issues');

  const computeDates = (days: number) => {
    const to = new Date().toISOString().split('T')[0];
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const from = fromDate.toISOString().split('T')[0];
    return { from, to };
  };

  const { from, to } = computeDates(rangeDays);

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8 sm:py-10">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Báo cáo & Thống kê</h1>
          <p className="text-sm text-[#6B6B70] mt-0.5">
            {currentProject
              ? `Tiến độ và hiệu suất công việc trong dự án: ${currentProject.name} (${currentProject.key})`
              : 'Tiến độ và hiệu suất công việc trong dự án'}
          </p>
        </div>

        {!currentProject ? (
          <div className="py-20 text-center border border-[#E5E5E7] rounded-xl p-8">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Chưa chọn dự án</h3>
            <p className="text-xs text-[#6B6B70]">
              Vui lòng chọn một dự án từ menu dự án ở góc trên bên trái để xem báo cáo thống kê tương ứng.
            </p>
          </div>
        ) : (
          <>
            {/* Filter bar: Tabs + Date preset + Metric toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E5E5E7] mb-8 pb-2 gap-4">
              {/* Tabs */}
              <div className="flex -mb-2 space-x-1">
                {[
                  { id: 'progress' as const, label: 'Tiến độ (Burn-down)' },
                  { id: 'productivity' as const, label: 'Năng suất' },
                  { id: 'bugs' as const, label: 'Báo cáo lỗi (Bugs)' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === t.id
                        ? 'border-[#1A1A1A] text-[#1A1A1A]'
                        : 'border-transparent text-[#6B6B70] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Metric toggle (only on progress tab) */}
                {activeTab === 'progress' && (
                  <div className="flex items-center border border-[#E5E5E7] rounded-lg p-0.5 text-xs bg-[#F9F9FB]">
                    <button
                      type="button"
                      onClick={() => setMetric('issues')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        metric === 'issues'
                          ? 'bg-white font-medium text-[#1A1A1A] shadow-xs'
                          : 'text-[#6B6B70] hover:text-[#1A1A1A]'
                      }`}
                    >
                      Số Issue
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetric('hours')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        metric === 'hours'
                          ? 'bg-white font-medium text-[#1A1A1A] shadow-xs'
                          : 'text-[#6B6B70] hover:text-[#1A1A1A]'
                      }`}
                    >
                      Giờ làm
                    </button>
                  </div>
                )}

                {/* Date range presets */}
                <div className="flex items-center border border-[#E5E5E7] rounded-lg p-0.5 text-xs bg-[#F9F9FB]">
                  {[
                    { label: '7 ngày', days: 7 },
                    { label: '14 ngày', days: 14 },
                    { label: '30 ngày', days: 30 },
                    { label: '90 ngày', days: 90 },
                  ].map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setRangeDays(preset.days)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        rangeDays === preset.days
                          ? 'bg-white font-medium text-[#1A1A1A] shadow-xs'
                          : 'text-[#6B6B70] hover:text-[#1A1A1A]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeTab === 'progress' && <ProgressTab from={from} to={to} metric={metric} />}
            {activeTab === 'productivity' && <ProductivityTab role={role} from={from} to={to} />}
            {activeTab === 'bugs' && <BugReportTab from={from} to={to} />}
          </>
        )}
      </div>
    </div>
  );
}
