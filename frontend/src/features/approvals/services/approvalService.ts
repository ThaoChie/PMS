import axiosClient from '../../../api/axiosClient';
import type {
  ApprovalPolicy,
  ApprovalRequest,
  CreateApprovalRequestPayload,
  ApprovalDecisionPayload,
} from '../types';

export const approvalService = {
  async getPolicy(): Promise<ApprovalPolicy> {
    const res = await axiosClient.get('/api/approval-requests/policy');
    return res.data?.data || { enabled: false, closeRequiresApproval: false, workflowChangeRequiresApproval: false };
  },

  async getPendingForMe(): Promise<ApprovalRequest[]> {
    const res = await axiosClient.get('/api/approval-requests/pending-for-me');
    return res.data?.data || [];
  },

  async getByProject(
    projectId: number,
    params?: { status?: string; type?: string; page?: number; size?: number },
  ): Promise<{ content: ApprovalRequest[]; totalElements: number }> {
    const res = await axiosClient.get(`/api/projects/${projectId}/approval-requests`, { params });
    return res.data?.data || { content: [], totalElements: 0 };
  },

  async getById(id: number): Promise<ApprovalRequest> {
    const res = await axiosClient.get(`/api/approval-requests/${id}`);
    return res.data?.data;
  },

  async create(projectId: number, payload: CreateApprovalRequestPayload): Promise<ApprovalRequest> {
    const res = await axiosClient.post(`/api/projects/${projectId}/approval-requests`, payload);
    return res.data?.data;
  },

  async approve(id: number, decision?: ApprovalDecisionPayload): Promise<ApprovalRequest> {
    const res = await axiosClient.post(`/api/approval-requests/${id}/approve`, decision || {});
    return res.data?.data;
  },

  async reject(id: number, decision: { comment: string }): Promise<ApprovalRequest> {
    const res = await axiosClient.post(`/api/approval-requests/${id}/reject`, decision);
    return res.data?.data;
  },

  async cancel(id: number): Promise<ApprovalRequest> {
    const res = await axiosClient.post(`/api/approval-requests/${id}/cancel`);
    return res.data?.data;
  },
};
