import axiosClient from '../api/axiosClient';
import type { ApiResponse, Worklog } from '../types';

export const worklogService = {
  async getWorklogs(issueKey: string): Promise<ApiResponse<Worklog[]>> {
    return axiosClient.get(`/issues/${issueKey}/worklogs`);
  },

  async createWorklog(
    issueKey: string,
    data: {
      timeSpent: string;
      date: string;
      comment?: string;
    },
  ): Promise<ApiResponse<Worklog>> {
    return axiosClient.post(`/issues/${issueKey}/worklogs`, data);
  },
};
