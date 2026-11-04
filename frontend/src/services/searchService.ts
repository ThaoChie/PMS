import axiosClient from '../api/axiosClient';
import type { ApiResponse, PageWrapper, Issue, QuickFilter } from '../types';

/**
 * Tiêu chí tìm kiếm — khớp đúng `IssueSearchRequest` của backend
 * (xem API_DOCUMENTATION.md mục 14.1). Mọi field đều optional, kết hợp AND.
 */
export interface IssueSearchCriteria {
  projectIds?: Array<string | number>;
  projectId?: string | number;
  keyword?: string;
  /** EPIC | TASK | BUG | SUB_TASK */
  types?: string[];
  /** HIGHEST | HIGH | MEDIUM | LOW | LOWEST */
  priorities?: string[];
  /** Lọc theo id trạng thái trong workflow của dự án */
  statusIds?: Array<string | number>;
  /** Lọc theo tên trạng thái (dùng khi không có id) */
  statuses?: string[];
  assigneeIds?: Array<string | number>;
  reporterIds?: Array<string | number>;
  labels?: string[];
  /** Ngày tạo từ (yyyy-MM-dd) */
  fromDate?: string;
  /** Ngày tạo đến (yyyy-MM-dd) */
  toDate?: string;
  quick?: QuickFilter;
}

export const searchService = {
  async searchIssues(
    criteria: IssueSearchCriteria,
    page: number = 1,
    size: number = 20,
  ): Promise<ApiResponse<PageWrapper<Issue>>> {
    const page0 = Math.max(0, page - 1);
    const res = await axiosClient.post<any, ApiResponse<PageWrapper<Issue>>>(
      '/issues/search',
      criteria,
      { params: { page: page0, size } },
    );
    if (res?.data?.page !== undefined) {
      res.data.page += 1;
    }
    return res;
  },

  async quickSearch(keyword: string): Promise<ApiResponse<PageWrapper<Issue>>> {
    return axiosClient.post<any, ApiResponse<PageWrapper<Issue>>>(
      '/issues/search',
      { keyword },
      { params: { page: 0, size: 10 } },
    );
  },
};
