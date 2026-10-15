import axiosClient from '../api/axiosClient';
import type { ApiResponse, User } from '../types';

export const userService = {
  async getMe(): Promise<ApiResponse<User>> {
    return axiosClient.get<any, ApiResponse<User>>('/users/me');
  },

  async updateMe(data: Partial<User> & { fullName?: string }): Promise<ApiResponse<User>> {
    const payload = {
      ...data,
      fullName: data.name || data.fullName,
    };
    return axiosClient.put<any, ApiResponse<User>>('/users/me', payload);
  },

  async updateAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);
    return axiosClient.post<any, ApiResponse<{ avatarUrl: string }>>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return axiosClient.put<any, ApiResponse<void>>('/users/me/password', {
      currentPassword,
      newPassword,
    });
  },

  async searchUsers(query: string, projectId?: string): Promise<ApiResponse<User[]>> {
    return axiosClient.get<any, ApiResponse<User[]>>('/users/search', {
      params: { q: query, projectId },
    });
  },
};
