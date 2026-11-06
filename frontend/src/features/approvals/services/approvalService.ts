import axiosClient from '../../../api/axiosClient';
import type {
  ApprovalPolicy,
  ApprovalRequest,
  CreateApprovalRequestPayload,
  ApprovalDecisionPayload,
} from '../types';

export const approvalService = {
  async getPolicy(): Promise<ApprovalPolicy> {
    const res: any = await axiosClient.get('/approval-requests/policy');
    return res?.data || { enabled: false, closeRequiresApproval: false, workflowChangeRequiresApproval: false };
  },

  async getPendingForMe(): Promise<ApprovalRequest[]> {
    const res: any = await axiosClient.get('/approval-requests/pending-for-me');
    return res?.data || [];
  },

  async getByProject(
    projectId: number,
    params?: { status?: string; type?: string; page?: number; size?: number },
  ): Promise<{ content: ApprovalRequest[]; totalElements: number }> {
    const res: any = await axiosClient.get(`/projects/${projectId}/approval-requests`, { params });
    return res?.data || { content: [], totalElements: 0 };
  },

  async getById(id: number): Promise<ApprovalRequest> {
    const res: any = await axiosClient.get(`/approval-requests/${id}`);
    return res?.data;
  },

  async create(projectId: number, payload: CreateApprovalRequestPayload): Promise<ApprovalRequest> {
    const res: any = await axiosClient.post(`/projects/${projectId}/approval-requests`, payload);
    return res?.data;
  },

  async approve(id: number, decision?: ApprovalDecisionPayload): Promise<ApprovalRequest> {
    const res: any = await axiosClient.post(`/approval-requests/${id}/approve`, decision || {});
    return res?.data;
  },

  async reject(id: number, decision: { comment: string }): Promise<ApprovalRequest> {
    const res: any = await axiosClient.post(`/approval-requests/${id}/reject`, decision);
    return res?.data;
  },

  async cancel(id: number): Promise<ApprovalRequest> {
    const res: any = await axiosClient.post(`/approval-requests/${id}/cancel`);
    return res?.data;
  },
};
