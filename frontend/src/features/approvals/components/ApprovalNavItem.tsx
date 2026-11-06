import React from 'react';
import { FileCheck } from 'lucide-react';
import { useApprovalPolicy } from '../hooks/useApprovalPolicy';
import type { Screen } from '../../../types';

interface ApprovalNavItemProps {
  currentScreen: Screen | string;
  isCollapsed?: boolean;
  onNavigate: (screen: Screen) => void;
}

export const ApprovalNavItem: React.FC<ApprovalNavItemProps> = ({
  currentScreen,
  isCollapsed = false,
  onNavigate,
}) => {
  const { policy, loading } = useApprovalPolicy();

  // Khi chính sách tắt hoặc đang tải mà cờ tắt: không render gì cả
  if (loading || !policy?.enabled) {
    return null;
  }

  const isActive = currentScreen === 'approvals';

  return (
    <button
      type="button"
      title={isCollapsed ? 'Yêu cầu duyệt' : undefined}
      className={`w-full flex items-center rounded-lg text-sm transition-colors text-left ${
        isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2'
      } ${
        isActive
          ? 'bg-white text-[#1A1A1A] font-medium border border-[#E5E5E7] shadow-2xs'
          : 'text-[#6B6B70] hover:bg-white/60 hover:text-[#1A1A1A]'
      }`}
      onClick={() => onNavigate('approvals' as Screen)}
    >
      <FileCheck className="w-4 h-4 shrink-0 text-amber-600" />
      {!isCollapsed && <span className="truncate">Yêu cầu duyệt</span>}
    </button>
  );
};

export default ApprovalNavItem;
