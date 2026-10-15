import axiosClient from '../api/axiosClient';
import type { ApiResponse, PageWrapper, Notification } from '../types';

export const notificationService = {
  async getNotifications(params?: {
    group?: string;
    unread?: boolean;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageWrapper<Notification>>> {
    const page0 = params?.page ? Math.max(0, params.page - 1) : 0;
    const res = await axiosClient.get<any, ApiResponse<PageWrapper<Notification>>>('/notifications', {
      params: { ...params, page: page0 },
    });
    if (res?.data?.page !== undefined) {
      res.data.page += 1;
    }
    return res;
  },

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return axiosClient.get('/notifications/unread-count');
  },

  async markAsRead(id: string): Promise<ApiResponse<void>> {
    return axiosClient.post(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<ApiResponse<void>> {
    return axiosClient.post('/notifications/read-all');
  },
};
