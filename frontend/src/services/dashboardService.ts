import axiosClient from '../api/axiosClient';
import type { ApiResponse } from '../types';

/** Một dòng trong "Hoạt động gần đây" (lấy từ audit_logs — giả định A-08) */
export interface DashboardActivity {
  id: string;
  action: string;
  actor: string;
  issueKey: string;
  issueSummary: string;
  timestamp: string;
}

/**
 * Dữ liệu thô của GET /dashboard (DashboardResponse phía backend).
 * Issue/SavedFilter ở đây là DTO gốc của backend, component tự map sang type của FE.
 */
export interface DashboardData {
  assignedIssues: any[];
  watchingIssues: any[];
  recentActivities: DashboardActivity[];
  savedFilters: any[];
}

export const dashboardService = {
  async getDashboardData(): Promise<ApiResponse<DashboardData>> {
    return axiosClient.get('/dashboard');
  },
};
