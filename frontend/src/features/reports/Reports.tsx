import React, { useState } from 'react';
import type { Role } from '../../types';
import { ProgressTab } from './ProgressTab';
import { ProductivityTab } from './ProductivityTab';
import { BugReportTab } from './BugReportTab';

interface ReportsProps {
  role: Role;
}

export default function Reports({ role }: ReportsProps) {
  const [activeTab, setActiveTab] = useState<'progress' | 'productivity' | 'bugs'>('progress');

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Báo cáo & Thống kê</h1>
          <p className="text-sm text-[#6B6B70] mt-0.5">Tiến độ và hiệu suất công việc trong dự án</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E5E5E7] mb-8">
          {[
            { id: 'progress' as const, label: 'Tiến độ' },
            { id: 'productivity' as const, label: 'Năng suất' },
            { id: 'bugs' as const, label: 'Báo cáo lỗi (Bugs)' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === t.id
                  ? 'border-[#1A1A1A] text-[#1A1A1A]'
                  : 'border-transparent text-[#6B6B70] hover:text-[#1A1A1A]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'progress' && <ProgressTab />}
        {activeTab === 'productivity' && <ProductivityTab role={role} />}
        {activeTab === 'bugs' && <BugReportTab />}
      </div>
    </div>
  );
}
