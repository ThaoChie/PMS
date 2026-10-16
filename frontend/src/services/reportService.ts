import axiosClient from '../api/axiosClient';
import type {
  ApiResponse,
  ProgressReportResponse,
  ProductivityReportResponse,
  BugReportResponse,
} from '../types';

export const reportService = {
  async getProgressReport(
    projectId: string | number,
    from?: string,
    to?: string,
    metric?: string
  ): Promise<ApiResponse<ProgressReportResponse>> {
    return axiosClient.get(`/projects/${projectId}/reports/progress`, {
      params: { from, to, metric },
    });
  },

  async getProductivityReport(
    projectId: string | number,
    from?: string,
    to?: string
  ): Promise<ApiResponse<ProductivityReportResponse>> {
    return axiosClient.get(`/projects/${projectId}/reports/productivity`, {
      params: { from, to },
    });
  },

  async getBugReport(
    projectId: string | number,
    from?: string,
    to?: string
  ): Promise<ApiResponse<BugReportResponse>> {
    return axiosClient.get(`/projects/${projectId}/reports/bugs`, {
      params: { from, to },
    });
  },
};
