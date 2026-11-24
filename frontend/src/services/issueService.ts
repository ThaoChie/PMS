import axiosClient from '../api/axiosClient';
import type { ApiResponse, PageWrapper, Issue, IssueType, Priority, SubTask } from '../types';
import { notifyIssueChanged } from '../utils/issueEvents';

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
      parentId?: number | string;
      epicId?: number | string;
    },
  ): Promise<ApiResponse<Issue>> {
    const res = await axiosClient.post<any, ApiResponse<Issue>>(`/projects/${projectId}/issues`, data);
    notifyIssueChanged({ projectId, action: 'create', issue: res?.data });
    return res;
  },

  async updateIssue(
    issueKey: string,
    data: Partial<Issue>,
    version?: number,
  ): Promise<ApiResponse<Issue>> {
    const res = await axiosClient.put<any, ApiResponse<Issue>>(`/issues/${issueKey}`, {
      ...data,
      version,
    });
    notifyIssueChanged({ issueKey, action: 'update', issue: res?.data });
    return res;
  },

  async deleteIssue(issueKey: string): Promise<ApiResponse<void>> {
    const res = await axiosClient.delete<any, ApiResponse<void>>(`/issues/${issueKey}`);
    notifyIssueChanged({ issueKey, action: 'delete' });
    return res;
  },

  async assignIssue(issueKey: string, assigneeId: string | null): Promise<ApiResponse<void>> {
    const res = await axiosClient.put<any, ApiResponse<void>>(`/issues/${issueKey}/assignee`, { assigneeId });
    notifyIssueChanged({ issueKey, action: 'assign' });
    return res;
  },

  async linkIssue(
    issueKey: string,
    targetKey: string,
    relation: string,
  ): Promise<ApiResponse<void>> {
    const res = await axiosClient.post<any, ApiResponse<void>>(`/issues/${issueKey}/links`, {
      targetKey,
      relation,
    });
    notifyIssueChanged({ issueKey, action: 'update' });
    return res;
  },

  async removeLink(issueKey: string, linkId: string): Promise<ApiResponse<void>> {
    const res = await axiosClient.delete<any, ApiResponse<void>>(`/issues/${issueKey}/links/${linkId}`);
    notifyIssueChanged({ issueKey, action: 'update' });
    return res;
  },

  async setEpic(issueKey: string, epicKey: string | null): Promise<ApiResponse<void>> {
    const res = await axiosClient.put<any, ApiResponse<void>>(`/issues/${issueKey}/epic`, { epicKey });
    notifyIssueChanged({ issueKey, action: 'update' });
    return res;
  },

  async createSubtask(
    issueKey: string,
    data: { summary: string; assigneeId?: string },
  ): Promise<ApiResponse<SubTask>> {
    const res = await axiosClient.post<any, ApiResponse<SubTask>>(`/issues/${issueKey}/subtasks`, data);
    notifyIssueChanged({ issueKey, action: 'update' });
    return res;
  },

  async convertToSubtask(issueKey: string, parentKey: string): Promise<ApiResponse<void>> {
    const res = await axiosClient.post<any, ApiResponse<void>>(`/issues/${issueKey}/convert-to-subtask`, {
      parentKey,
    });
    notifyIssueChanged({ issueKey, action: 'update' });
    return res;
  },

  async convertToIssue(issueKey: string, targetType: string = 'Task'): Promise<ApiResponse<void>> {
    const res = await axiosClient.post<any, ApiResponse<void>>(`/issues/${issueKey}/convert-to-issue?targetType=${targetType.toUpperCase()}`);
    notifyIssueChanged({ issueKey, action: 'update' });
    return res;
  },

  async uploadAttachment(issueKey: string, file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosClient.post(`/issues/${issueKey}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    notifyIssueChanged({ issueKey, action: 'update' });
    return res;
  },

  async deleteAttachment(issueKey: string, attachmentId: string): Promise<ApiResponse<void>> {
    const res = await axiosClient.delete(`/issues/${issueKey}/attachments/${attachmentId}`);
    notifyIssueChanged({ issueKey, action: 'update' });
    return res;
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
