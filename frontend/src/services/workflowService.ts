import axiosClient from '../api/axiosClient';
import type { ApiResponse, WorkflowStatus, WorkflowTransition } from '../types';

export const workflowService = {
  async getWorkflow(projectId: string): Promise<ApiResponse<{
    statuses: WorkflowStatus[];
    transitions: WorkflowTransition[];
    warnings?: string[];
  }>> {
    return axiosClient.get(`/projects/${projectId}/workflow`);
  },

  async updateWorkflow(
    projectId: string,
    data: {
      statuses: WorkflowStatus[];
      transitions: WorkflowTransition[];
    },
  ): Promise<ApiResponse<{ warnings?: string[] }>> {
    const payload = {
      statuses: data.statuses.map((s) => ({
        ...s,
        id: typeof s.id === 'number' || (typeof s.id === 'string' && /^\d+$/.test(s.id) && Number(s.id) < 1000000000) ? Number(s.id) : undefined,
      })),
      transitions: data.transitions.map((t) => ({
        ...t,
        id: typeof t.id === 'number' || (typeof t.id === 'string' && /^\d+$/.test(t.id) && Number(t.id) < 1000000000) ? Number(t.id) : undefined,
      })),
    };
    return axiosClient.put(`/projects/${projectId}/workflow`, payload);
  },

  async getTransitions(issueKey: string): Promise<ApiResponse<WorkflowTransition[]>> {
    return axiosClient.get(`/issues/${issueKey}/transitions`);
  },

  async executeTransition(
    issueKey: string,
    transitionId: string,
    fields?: Record<string, any>,
    comment?: string,
  ): Promise<ApiResponse<void>> {
    return axiosClient.post(`/issues/${issueKey}/transitions`, {
      transitionId,
      fields,
      comment,
    });
  },

  async approveIssue(issueKey: string, comment?: string): Promise<ApiResponse<void>> {
    return axiosClient.post(`/issues/${issueKey}/approve`, { comment });
  },

  async rejectIssue(issueKey: string, reason: string): Promise<ApiResponse<void>> {
    return axiosClient.post(`/issues/${issueKey}/reject`, { reason });
  },
};
