import React, { useState, useEffect } from 'react';
import { useApprovalStore } from '../store/approvalStore';
import { ApprovalStatusBadge, ApprovalApplyBadge } from '../components/ApprovalBadge';
import { ApprovalDetailDrawer } from '../components/ApprovalDetailDrawer';
import { CreateApprovalModal } from '../components/CreateApprovalModal';
import { useProjectStore } from '../../../store/projectStore';
import type { ApprovalRequest, ApprovalRequestStatus, ApprovalRequestType } from '../types';
import {
  FileCheck,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FolderGit2,
  Calendar,
  ChevronRight,
  Inbox,
  Send,
} from 'lucide-react';

export default function ApprovalsPage() {
  const {
    pendingForMe,
    projectRequests,
    fetchPendingForMe,
    fetchProjectRequests,
    isLoading,
  } = useApprovalStore();

  const { projects, currentProject } = useProjectStore();

  const [activeTab, setActiveTab] = useState<'pending' | 'my-requests'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const activeProjectId = currentProject?.id ? Number(currentProject.id) : (projects[0]?.id ? Number(projects[0].id) : 1);

  const loadData = () => {
    fetchPendingForMe();
    if (activeProjectId) {
      fetchProjectRequests(activeProjectId);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProjectId]);

  const rawList = activeTab === 'pending' ? pendingForMe : projectRequests;

  const filteredList = rawList.filter((req) => {
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && req.type !== typeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchReason = req.reason?.toLowerCase().includes(q);
      const matchProject = req.project?.name?.toLowerCase().includes(q) || req.project?.key?.toLowerCase().includes(q);
      const matchRequester = req.requester?.fullName?.toLowerCase().includes(q);
      const matchId = String(req.id).includes(q);
      return matchReason || matchProject || matchRequester || matchId;
    }
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-[#F7F7F8] overflow-y-auto">
      {/* Top Header */}
      <div className="bg-white border-b border-[#E5E5E7] px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1A1A1A]">Quản lý yêu cầu phê duyệt</h1>
              <p className="text-xs text-[#6B6B70] mt-0.5">
                Theo dõi tiến trình phê duyệt nhiều cấp cho việc đóng dự án và cập nhật quy trình
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="p-2 bg-white border border-[#E5E5E7] hover:bg-gray-50 text-[#6B6B70] hover:text-[#1A1A1A] rounded-xl transition-colors shadow-2xs"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Gửi yêu cầu duyệt
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-6 mt-6 border-b border-[#E5E5E7]">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
              activeTab === 'pending'
                ? 'text-[#1A1A1A] border-b-2 border-black'
                : 'text-[#6B6B70] hover:text-[#1A1A1A]'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Chờ tôi duyệt
            {pendingForMe.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-[#E53E3E] text-white">
                {pendingForMe.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my-requests')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
              activeTab === 'my-requests'
                ? 'text-[#1A1A1A] border-b-2 border-black'
                : 'text-[#6B6B70] hover:text-[#1A1A1A]'
            }`}
          >
            <Send className="w-4 h-4" />
            Yêu cầu trong dự án ({projectRequests.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E5E7] shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9B9B9F] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm theo mã yêu cầu, lý do, người gửi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-[#E5E5E7] rounded-lg bg-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6B6B70] font-medium">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-[#E5E5E7] rounded-lg bg-white focus:outline-none"
              >
                <option value="ALL">Tất cả</option>
                <option value="PENDING">Đang chờ duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Bị từ chối</option>
                <option value="CANCELLED">Đã hủy</option>
                <option value="EXPIRED">Hết hạn</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6B6B70] font-medium">Loại:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-[#E5E5E7] rounded-lg bg-white focus:outline-none"
              >
                <option value="ALL">Tất cả</option>
                <option value="PROJECT_CLOSE">Đóng dự án</option>
                <option value="WORKFLOW_CONFIG_CHANGE">Đổi Workflow</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests List */}
        {isLoading && rawList.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-[#E5E5E7]">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#6B6B70]">Đang tải danh sách yêu cầu phê duyệt...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-[#E5E5E7] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F7F7F8] flex items-center justify-center text-[#9B9B9F] mx-auto">
              <FileCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#1A1A1A]">
              {activeTab === 'pending'
                ? 'Không có yêu cầu nào đang chờ bạn phê duyệt'
                : 'Chưa có yêu cầu phê duyệt nào phù hợp'}
            </p>
            <p className="text-xs text-[#6B6B70] max-w-sm mx-auto">
              {activeTab === 'pending'
                ? 'Khi có yêu cầu đóng dự án hoặc thay đổi workflow cần bạn duyệt ở vai trò PM hoặc Admin, chúng sẽ hiển thị tại đây.'
                : 'Bạn có thể bấm "Gửi yêu cầu duyệt" ở góc trên bên phải để tạo yêu cầu mới.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((req) => (
              <div
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className="p-5 bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs hover:border-black/30 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="flex items-start gap-4 flex-1 min-w-[280px]">
                  <div className="w-9 h-9 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7] flex items-center justify-center shrink-0 mt-0.5 text-[#1A1A1A]">
                    <span className="font-bold text-xs">#{req.id}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#1A1A1A]">
                        {req.type === 'PROJECT_CLOSE' ? 'Đóng dự án' : 'Đổi cấu hình Workflow'}
                      </span>
                      <ApprovalStatusBadge status={req.status} />
                      <ApprovalApplyBadge status={req.applyStatus} />
                      {req.canIDecide && req.status === 'PENDING' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white uppercase animate-pulse">
                          Cần bạn duyệt
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B6B70] line-clamp-1">{req.reason}</p>
                    <div className="flex items-center gap-4 text-[11px] text-[#9B9B9F] pt-1">
                      <span className="flex items-center gap-1">
                        <FolderGit2 className="w-3.5 h-3.5" /> {req.project.name} ({req.project.key})
                      </span>
                      <span>•</span>
                      <span>Người gửi: {req.requester.fullName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#1A1A1A] hover:underline flex items-center gap-1">
                    Chi tiết <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedRequest && (
        <ApprovalDetailDrawer
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={loadData}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateApprovalModal
          projects={projects}
          defaultProjectId={activeProjectId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
