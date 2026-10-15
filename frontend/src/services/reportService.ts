import axiosClient from '../api/axiosClient';
import type { ApiResponse, ProgressPoint, ProductivityPoint, BugReportItem } from '../types';

export const reportService = {
  async getProgressReport(projectId: string): Promise<ApiResponse<ProgressPoint[]>> {
    return axiosClient.get(`/projects/${projectId}/reports/progress`);
  },

  async getProductivityReport(projectId: string): Promise<ApiResponse<ProductivityPoint[]>> {
    return axiosClient.get(`/projects/${projectId}/reports/productivity`);
  },

  async getBugReport(projectId: string): Promise<ApiResponse<BugReportItem[]>> {
    return axiosClient.get(`/projects/${projectId}/reports/bugs`);
  },
};
