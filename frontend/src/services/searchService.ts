import axiosClient from '../api/axiosClient';
import type { ApiResponse, PageWrapper, Issue, QuickFilter } from '../types';

export interface IssueSearchCriteria {
  projectIds?: string[];
  types?: string[];
  statuses?: string[];
  priorities?: string[];
  assigneeId?: string;
  reporterId?: string;
  keyword?: string;
  labels?: string[];
  quick?: QuickFilter;
}

export const searchService = {
  async searchIssues(
    criteria: IssueSearchCriteria,
    page: number = 1,
    size: number = 20,
  ): Promise<ApiResponse<PageWrapper<Issue>>> {
    const page0 = Math.max(0, page - 1);
    const res = await axiosClient.post<any, ApiResponse<PageWrapper<Issue>>>('/issues/search', criteria, {
      params: { page: page0, size },
    });
    if (res?.data?.page !== undefined) {
      res.data.page += 1;
    }
    return res;
  },

  async quickSearch(keyword: string): Promise<ApiResponse<Issue[]>> {
    return axiosClient.post<any, ApiResponse<Issue[]>>('/issues/search', { keyword }, {
      params: { page: 0, size: 10 },
    });
  },
};
