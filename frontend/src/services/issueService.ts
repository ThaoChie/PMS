import axiosClient from '../api/axiosClient';
import type { ApiResponse, PageWrapper, Issue, IssueType, Priority, SubTask } from '../types';

export const issueService = {
  async getIssues(
    projectId: string,
    params?: {
      page?: number;
      size?: number;
      sort?: string;
      type?: IssueType;
      priority?: Priority;
      status?: string;
      assigneeId?: string;
    },
  ): Promise<ApiResponse<PageWrapper<Issue>>> {
    const page0 = params?.page ? Math.max(0, params.page - 1) : 0;
    const normalizedSort = params?.sort?.replace(/^key,/, 'issueKey,');
    const res = await axiosClient.get<any, ApiResponse<PageWrapper<Issue>>>(
      `/projects/${projectId}/issues`,
      {
        params: {
          ...params,
          ...(normalizedSort ? { sort: normalizedSort } : {}),
          page: page0,
        },
      },
    );
    if (res?.data?.page !== undefined) {
      res.data.page += 1;
    }
    return res;
  },

  async getIssue(issueKey: string): Promise<ApiResponse<Issue>> {
    return axiosClient.get<any, ApiResponse<Issue>>(`/issues/${issueKey}`);
  },

  async createIssue(
    projectId: string,
    data: {
      summary: string;
      description?: string;
      type: IssueType;
      priority?: Priority;
      assigneeId?: string;
      labels?: string[];
      estimates?: string;
      dueDate?: string;
      environment?: string;
    },
  ): Promise<ApiResponse<Issue>> {
    return axiosClient.post<any, ApiResponse<Issue>>(`/projects/${projectId}/issues`, data);
  },

  async updateIssue(
    issueKey: string,
    data: Partial<Issue>,
    version?: number,
  ): Promise<ApiResponse<Issue>> {
    return axiosClient.put<any, ApiResponse<Issue>>(`/issues/${issueKey}`, {
      ...data,
      version,
    });
  },

  async deleteIssue(issueKey: string): Promise<ApiResponse<void>> {
    return axiosClient.delete<any, ApiResponse<void>>(`/issues/${issueKey}`);
  },

  async assignIssue(issueKey: string, assigneeId: string | null): Promise<ApiResponse<void>> {
    return axiosClient.put<any, ApiResponse<void>>(`/issues/${issueKey}/assignee`, { assigneeId });
  },

  async linkIssue(
    issueKey: string,
    targetKey: string,
    relation: string,
  ): Promise<ApiResponse<void>> {
    return axiosClient.post<any, ApiResponse<void>>(`/issues/${issueKey}/links`, {
      targetKey,
      relation,
    });
  },

  async removeLink(issueKey: string, linkId: string): Promise<ApiResponse<void>> {
    return axiosClient.delete<any, ApiResponse<void>>(`/issues/${issueKey}/links/${linkId}`);
  },

  async setEpic(issueKey: string, epicKey: string | null): Promise<ApiResponse<void>> {
    return axiosClient.put<any, ApiResponse<void>>(`/issues/${issueKey}/epic`, { epicKey });
  },

  async createSubtask(
    issueKey: string,
    data: { summary: string; assigneeId?: string },
  ): Promise<ApiResponse<SubTask>> {
    return axiosClient.post<any, ApiResponse<SubTask>>(`/issues/${issueKey}/subtasks`, data);
  },

  async convertToSubtask(issueKey: string, parentKey: string): Promise<ApiResponse<void>> {
    return axiosClient.post<any, ApiResponse<void>>(`/issues/${issueKey}/convert-to-subtask`, {
      parentKey,
    });
  },

  async uploadAttachment(issueKey: string, file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post(`/issues/${issueKey}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async deleteAttachment(issueKey: string, attachmentId: string): Promise<ApiResponse<void>> {
    return axiosClient.delete(`/issues/${issueKey}/attachments/${attachmentId}`);
  },

  async watchIssue(issueKey: string): Promise<ApiResponse<void>> {
    return axiosClient.post(`/issues/${issueKey}/watch`);
  },

  async unwatchIssue(issueKey: string): Promise<ApiResponse<void>> {
    return axiosClient.delete(`/issues/${issueKey}/watch`);
  },

  async shareIssue(
    issueKey: string,
    recipients: string[],
    note?: string,
  ): Promise<ApiResponse<void>> {
    return axiosClient.post(`/issues/${issueKey}/share`, { recipients, note });
  },
};
