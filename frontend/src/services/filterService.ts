import axiosClient from '../api/axiosClient';
import type { ApiResponse, SavedFilter } from '../types';

export const filterService = {
  async getSavedFilters(): Promise<ApiResponse<SavedFilter[]>> {
    return axiosClient.get('/filters');
  },

  async createFilter(data: {
    name: string;
    filters: SavedFilter['filters'];
    sharedWithUserIds?: string[];
    emailSubscription?: boolean;
    frequency?: 'daily' | 'weekly';
  }): Promise<ApiResponse<SavedFilter>> {
    return axiosClient.post('/filters', data);
  },

  async updateFilter(id: string, data: Partial<SavedFilter>): Promise<ApiResponse<SavedFilter>> {
    return axiosClient.put(`/filters/${id}`, data);
  },

  async deleteFilter(id: string): Promise<ApiResponse<void>> {
    return axiosClient.delete(`/filters/${id}`);
  },

  async shareFilter(id: string, userIds: string[]): Promise<ApiResponse<void>> {
    return axiosClient.post(`/filters/${id}/share`, { userIds });
  },

  async updateSubscription(
    id: string,
    enabled: boolean,
    frequency?: 'daily' | 'weekly',
  ): Promise<ApiResponse<void>> {
    if (!enabled) {
      return axiosClient.delete(`/filters/${id}/subscription`);
    }
    return axiosClient.put(`/filters/${id}/subscription`, { frequency });
  },
};
