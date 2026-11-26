import axiosClient from '../api/axiosClient';
import { downloadBlob } from '../utils/download';
import type {
  ApiResponse,
  ProgressReportResponse,
  ProductivityReportResponse,
  ProductivityFilter,
  MemberDetailProductivityResponse,
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
    filterOrFrom?: ProductivityFilter | string,
    to?: string
  ): Promise<ApiResponse<ProductivityReportResponse>> {
    let params: any = {};
    if (typeof filterOrFrom === 'object') {
      const f = filterOrFrom || {};
      params = {
        ...f,
        memberIds: f.memberIds && f.memberIds.length > 0 ? f.memberIds.join(',') : undefined,
        roles: f.roles && f.roles.length > 0 ? f.roles.join(',') : undefined,
        issueTypes: f.issueTypes && f.issueTypes.length > 0 ? f.issueTypes.join(',') : undefined,
        priorities: f.priorities && f.priorities.length > 0 ? f.priorities.join(',') : undefined,
        statuses: f.statuses && f.statuses.length > 0 ? f.statuses.join(',') : undefined,
      };
    } else {
      params = { from: filterOrFrom, to };
    }
    return axiosClient.get(`/projects/${projectId}/reports/productivity`, { params });
  },

  async getMemberProductivityDetail(
    projectId: string | number,
    userId: number,
    filter?: ProductivityFilter
  ): Promise<ApiResponse<MemberDetailProductivityResponse>> {
    const f = filter || {};
    const params = {
      ...f,
      memberIds: f.memberIds && f.memberIds.length > 0 ? f.memberIds.join(',') : undefined,
      roles: f.roles && f.roles.length > 0 ? f.roles.join(',') : undefined,
      issueTypes: f.issueTypes && f.issueTypes.length > 0 ? f.issueTypes.join(',') : undefined,
      priorities: f.priorities && f.priorities.length > 0 ? f.priorities.join(',') : undefined,
      statuses: f.statuses && f.statuses.length > 0 ? f.statuses.join(',') : undefined,
    };
    return axiosClient.get(`/projects/${projectId}/reports/productivity/members/${userId}`, {
      params,
    });
  },

  async exportProductivityReport(
    projectId: string | number,
    filter?: ProductivityFilter
  ): Promise<void> {
    const f = filter || {};
    const params = {
      ...f,
      memberIds: f.memberIds && f.memberIds.length > 0 ? f.memberIds.join(',') : undefined,
      roles: f.roles && f.roles.length > 0 ? f.roles.join(',') : undefined,
      issueTypes: f.issueTypes && f.issueTypes.length > 0 ? f.issueTypes.join(',') : undefined,
      priorities: f.priorities && f.priorities.length > 0 ? f.priorities.join(',') : undefined,
      statuses: f.statuses && f.statuses.length > 0 ? f.statuses.join(',') : undefined,
    };
    const response = await axiosClient.get(`/projects/${projectId}/reports/productivity/export`, {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response as any], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const filename = `productivity-report-${projectId}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    downloadBlob(blob, filename);
  },

  /**
   * Xuất NỘI DUNG BÁO CÁO LỖI (chỉ số tổng hợp, lỗi theo mức ưu tiên, danh sách lỗi) ra .xlsx / .csv.
   * Trước đây tab Báo cáo lỗi dùng chung API xuất danh sách công việc nên ra cùng file với tab Tiến độ.
   */
  async exportBugReport(
    projectId: string | number,
    from: string | undefined,
    to: string | undefined,
    format: 'xlsx' | 'csv'
  ): Promise<void> {
    const response = await axiosClient.get(`/projects/${projectId}/reports/bugs/export`, {
      params: { from, to, format },
      responseType: 'blob',
    });
    const mimeType =
      format === 'csv'
        ? 'text/csv;charset=utf-8'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const blob =
      response instanceof Blob
        ? response
        : new Blob([response as any], { type: mimeType });
    downloadBlob(blob, `bug-report-${projectId}-${new Date().toISOString().slice(0, 10)}.${format}`);
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
