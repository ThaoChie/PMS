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
    return axiosClient.put(`/projects/${projectId}/workflow`, data);
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
