import { create } from 'zustand';
import { approvalService } from '../services/approvalService';
import type {
  ApprovalPolicy,
  ApprovalRequest,
  CreateApprovalRequestPayload,
  ApprovalDecisionPayload,
} from '../types';

interface ApprovalState {
  policy: ApprovalPolicy | null;
  pendingForMe: ApprovalRequest[];
  projectRequests: ApprovalRequest[];
  totalProjectRequests: number;
  selectedRequest: ApprovalRequest | null;
  activeFetchProjectId: number | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  fetchPolicy: () => Promise<ApprovalPolicy>;
  fetchPendingForMe: () => Promise<void>;
  fetchProjectRequests: (
    projectId: number,
    params?: { status?: string; type?: string; page?: number; size?: number },
  ) => Promise<void>;
  fetchRequestById: (id: number) => Promise<ApprovalRequest>;
  createRequest: (projectId: number, payload: CreateApprovalRequestPayload) => Promise<ApprovalRequest>;
  approveRequest: (id: number, decision?: ApprovalDecisionPayload) => Promise<ApprovalRequest>;
  rejectRequest: (id: number, comment: string) => Promise<ApprovalRequest>;
  cancelRequest: (id: number) => Promise<ApprovalRequest>;
  setSelectedRequest: (request: ApprovalRequest | null) => void;
  clearError: () => void;
}

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  policy: null,
  pendingForMe: [],
  projectRequests: [],
  totalProjectRequests: 0,
  selectedRequest: null,
  activeFetchProjectId: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchPolicy: async () => {
    try {
      const policy = await approvalService.getPolicy();
      set({ policy });
      return policy;
    } catch {
      const disabledPolicy = { enabled: false, closeRequiresApproval: false, workflowChangeRequiresApproval: false };
      set({ policy: disabledPolicy });
      return disabledPolicy;
    }
  },

  fetchPendingForMe: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await approvalService.getPendingForMe();
      set({ pendingForMe: Array.isArray(data) ? data : [], isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || err?.response?.data?.message || 'Không thể tải danh sách yêu cầu chờ duyệt', isLoading: false });
    }
  },

  fetchProjectRequests: async (projectId, params) => {
    set({ isLoading: true, error: null, activeFetchProjectId: projectId });
    try {
      const data = await approvalService.getByProject(projectId, params);
      if (get().activeFetchProjectId === projectId) {
        set({
          projectRequests: Array.isArray(data?.content) ? data.content : [],
          totalProjectRequests: data?.totalElements || 0,
          isLoading: false,
        });
      }
    } catch (err: any) {
      if (get().activeFetchProjectId === projectId) {
        set({ error: err?.message || err?.response?.data?.message || 'Không thể tải danh sách yêu cầu của dự án', isLoading: false });
      }
    }
  },

  fetchRequestById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const req = await approvalService.getById(id);
      set({ selectedRequest: req, isLoading: false });
      return req;
    } catch (err: any) {
      set({ error: err?.message || err?.response?.data?.message || 'Không thể tải chi tiết yêu cầu', isLoading: false });
      throw err;
    }
  },

  createRequest: async (projectId: number, payload: CreateApprovalRequestPayload) => {
    set({ isSubmitting: true, error: null });
    try {
      const req = await approvalService.create(projectId, payload);
      set((state) => ({
        projectRequests: [req, ...state.projectRequests],
        totalProjectRequests: state.totalProjectRequests + 1,
        isSubmitting: false,
      }));
      return req;
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Không thể tạo yêu cầu duyệt';
      set({ error: msg, isSubmitting: false });
      throw err;
    }
  },

  approveRequest: async (id: number, decision?: ApprovalDecisionPayload) => {
    set({ isSubmitting: true, error: null });
    try {
      const updated = await approvalService.approve(id, decision);
      set((state) => ({
        pendingForMe: state.pendingForMe.filter((r) => r.id !== id),
        projectRequests: state.projectRequests.map((r) => (r.id === id ? updated : r)),
        selectedRequest: state.selectedRequest?.id === id ? updated : state.selectedRequest,
        isSubmitting: false,
      }));
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể phê duyệt yêu cầu';
      set({ error: msg, isSubmitting: false });
      throw err;
    }
  },

  rejectRequest: async (id: number, comment: string) => {
    set({ isSubmitting: true, error: null });
    try {
      const updated = await approvalService.reject(id, { comment });
      set((state) => ({
        pendingForMe: state.pendingForMe.filter((r) => r.id !== id),
        projectRequests: state.projectRequests.map((r) => (r.id === id ? updated : r)),
        selectedRequest: state.selectedRequest?.id === id ? updated : state.selectedRequest,
        isSubmitting: false,
      }));
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể từ chối yêu cầu';
      set({ error: msg, isSubmitting: false });
      throw err;
    }
  },

  cancelRequest: async (id: number) => {
    set({ isSubmitting: true, error: null });
    try {
      const updated = await approvalService.cancel(id);
      set((state) => ({
        projectRequests: state.projectRequests.map((r) => (r.id === id ? updated : r)),
        selectedRequest: state.selectedRequest?.id === id ? updated : state.selectedRequest,
        isSubmitting: false,
      }));
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể hủy yêu cầu duyệt';
      set({ error: msg, isSubmitting: false });
      throw err;
    }
  },

  setSelectedRequest: (request) => set({ selectedRequest: request }),
  clearError: () => set({ error: null }),
}));
