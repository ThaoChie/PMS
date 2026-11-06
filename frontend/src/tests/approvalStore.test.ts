import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useApprovalStore } from '../features/approvals/store/approvalStore';
import { approvalService } from '../features/approvals/services/approvalService';
import type { ApprovalRequest } from '../features/approvals/types';

vi.mock('../features/approvals/services/approvalService');

const mockRequest: ApprovalRequest = {
  id: 101,
  type: 'PROJECT_CLOSE',
  status: 'PENDING',
  applyStatus: 'NOT_APPLIED',
  project: { id: 1, key: 'PRJ', name: 'Project Alpha' },
  requester: { id: 2, fullName: 'Alex Chen', email: 'pm@epms.com' },
  reason: 'Test closing project',
  payload: null,
  steps: [
    { level: 1, approverRole: 'PM', status: 'PENDING' },
    { level: 2, approverRole: 'ADMIN', status: 'WAITING' },
  ],
  currentLevel: 1,
  canIDecide: true,
  createdAt: '2026-11-06T10:00:00Z',
  completedAt: null,
};

describe('ApprovalStore (Zustand)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useApprovalStore.setState({
      policy: null,
      pendingForMe: [],
      projectRequests: [],
      totalProjectRequests: 0,
      selectedRequest: null,
      isLoading: false,
      isSubmitting: false,
      error: null,
    });
  });

  it('fetchPolicy: coi lỗi hoặc 404 là tắt chính sách (enabled=false)', async () => {
    vi.mocked(approvalService.getPolicy).mockRejectedValueOnce(new Error('Network / 404 error'));

    const policy = await useApprovalStore.getState().fetchPolicy();

    expect(policy.enabled).toBe(false);
    expect(policy.closeRequiresApproval).toBe(false);
    expect(useApprovalStore.getState().policy?.enabled).toBe(false);
  });

  it('fetchPendingForMe: nạp danh sách yêu cầu chờ duyệt thành công', async () => {
    vi.mocked(approvalService.getPendingForMe).mockResolvedValueOnce([mockRequest]);

    await useApprovalStore.getState().fetchPendingForMe();

    expect(useApprovalStore.getState().pendingForMe).toHaveLength(1);
    expect(useApprovalStore.getState().pendingForMe[0].id).toBe(101);
    expect(useApprovalStore.getState().isLoading).toBe(false);
  });

  it('approveRequest: phê duyệt và cập nhật danh sách pending/project', async () => {
    useApprovalStore.setState({
      pendingForMe: [mockRequest],
      projectRequests: [mockRequest],
      selectedRequest: mockRequest,
    });

    const approvedRequest: ApprovalRequest = {
      ...mockRequest,
      status: 'APPROVED',
      applyStatus: 'APPLIED',
      steps: [
        { level: 1, approverRole: 'PM', status: 'APPROVED' },
        { level: 2, approverRole: 'ADMIN', status: 'APPROVED' },
      ],
      currentLevel: null,
      canIDecide: false,
    };

    vi.mocked(approvalService.approve).mockResolvedValueOnce(approvedRequest);

    const result = await useApprovalStore.getState().approveRequest(101, { comment: 'OK' });

    expect(result.status).toBe('APPROVED');
    // Đã được xóa khỏi danh sách Chờ tôi duyệt
    expect(useApprovalStore.getState().pendingForMe).toHaveLength(0);
    // Danh sách dự án được cập nhật
    expect(useApprovalStore.getState().projectRequests[0].status).toBe('APPROVED');
  });

  it('rejectRequest: từ chối và cập nhật trạng thái REJECTED', async () => {
    useApprovalStore.setState({
      pendingForMe: [mockRequest],
      projectRequests: [mockRequest],
    });

    const rejectedRequest: ApprovalRequest = {
      ...mockRequest,
      status: 'REJECTED',
      steps: [{ level: 1, approverRole: 'PM', status: 'REJECTED', comment: 'Không đủ điều kiện' }],
    };

    vi.mocked(approvalService.reject).mockResolvedValueOnce(rejectedRequest);

    const result = await useApprovalStore.getState().rejectRequest(101, 'Không đủ điều kiện');

    expect(result.status).toBe('REJECTED');
    expect(useApprovalStore.getState().pendingForMe).toHaveLength(0);
    expect(useApprovalStore.getState().projectRequests[0].status).toBe('REJECTED');
  });

  it('cancelRequest: người tạo hủy yêu cầu thành công', async () => {
    useApprovalStore.setState({
      projectRequests: [mockRequest],
    });

    const cancelledRequest: ApprovalRequest = {
      ...mockRequest,
      status: 'CANCELLED',
    };

    vi.mocked(approvalService.cancel).mockResolvedValueOnce(cancelledRequest);

    const result = await useApprovalStore.getState().cancelRequest(101);

    expect(result.status).toBe('CANCELLED');
    expect(useApprovalStore.getState().projectRequests[0].status).toBe('CANCELLED');
  });
});
