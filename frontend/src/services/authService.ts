import axiosClient, { setAuthToken } from '../api/axiosClient';
import type { ApiResponse, TokenResponse, User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<ApiResponse<TokenResponse>> {
    const res = await axiosClient.post<any, ApiResponse<TokenResponse>>('/auth/login', {
      email,
      password,
    });
    if (res?.data?.accessToken) {
      setAuthToken(res.data.accessToken);
    }
    return res;
  },

  async googleLogin(idToken: string): Promise<ApiResponse<TokenResponse>> {
    const res = await axiosClient.post<any, ApiResponse<TokenResponse>>('/auth/google', {
      idToken,
    });
    if (res?.data?.accessToken) {
      setAuthToken(res.data.accessToken);
    }
    return res;
  },

  async register(data: { name: string; email: string; password: string }): Promise<ApiResponse<User>> {
    return axiosClient.post<any, ApiResponse<User>>('/auth/register', data);
  },

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return axiosClient.post<any, ApiResponse<void>>('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    return axiosClient.post<any, ApiResponse<void>>('/auth/reset-password', {
      token,
      newPassword,
    });
  },

  async refreshToken(): Promise<ApiResponse<TokenResponse>> {
    const res = await axiosClient.post<any, ApiResponse<TokenResponse>>('/auth/refresh');
    if (res?.data?.accessToken) {
      setAuthToken(res.data.accessToken);
    }
    return res;
  },

  async logout(): Promise<ApiResponse<void>> {
    try {
      return await axiosClient.post<any, ApiResponse<void>>('/auth/logout');
    } finally {
      setAuthToken(null);
    }
  },
};
