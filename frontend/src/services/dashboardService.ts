import axiosClient from '../api/axiosClient';
import type { ApiResponse, Issue, SavedFilter } from '../types';

export interface DashboardData {
  assignedIssues: Issue[];
  watchingIssues: Issue[];
  recentActivities: Array<{
    id: string;
    action: string;
    actor: string;
    issueKey: string;
    issueSummary: string;
    timestamp: string;
  }>;
  savedFilters: SavedFilter[];
}

export const dashboardService = {
  async getDashboardData(): Promise<ApiResponse<DashboardData>> {
    return axiosClient.get('/dashboard');
  },
};
