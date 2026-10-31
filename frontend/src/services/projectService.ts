import axiosClient from '../api/axiosClient';
import type { ApiResponse, PageWrapper, Project } from '../types';

export const projectService = {
  async getProjects(params?: {
    q?: string;
    sort?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageWrapper<Project>>> {
    const page0 = params?.page ? Math.max(0, params.page - 1) : 0;
    const res = await axiosClient.get<any, ApiResponse<PageWrapper<Project>>>('/projects', {
      params: {
        ...params,
        page: page0,
      },
    });

    if (res?.data?.page !== undefined) {
      res.data.page += 1;
    }
    return res;
  },

  async getProject(id: string): Promise<ApiResponse<Project>> {
    return axiosClient.get<any, ApiResponse<Project>>(`/projects/${id}`);
  },

  async createProject(data: {
    name: string;
    key?: string;
    projectKey?: string;
    description?: string;
    color?: string;
    icon?: string;
    initialInvites?: string[];
    initialEmails?: string[];
  }): Promise<ApiResponse<any>> {
    const payload = {
      name: data.name,
      projectKey: data.projectKey || data.key,
      description: data.description,
      color: data.color,
      icon: data.icon,
      initialEmails: data.initialEmails || data.initialInvites || [],
    };
    return axiosClient.post<any, ApiResponse<any>>('/projects', payload);
  },

  async updateProject(id: string, data: Partial<Project>): Promise<ApiResponse<Project>> {
    return axiosClient.put<any, ApiResponse<Project>>(`/projects/${id}`, data);
  },

  async updateProjectPermissions(
    id: string,
    permissions: {
      allowMemberDeleteIssue?: boolean;
      allowMemberDeleteSubtask?: boolean;
      allowMemberConvertSubtask?: boolean;
      allowMemberManageCustomFields?: boolean;
    }
  ): Promise<ApiResponse<Project>> {
    return axiosClient.put<any, ApiResponse<Project>>(`/projects/${id}/permissions`, permissions);
  },

  async closeProject(id: string): Promise<ApiResponse<Project>> {
    return axiosClient.post<any, ApiResponse<Project>>(`/projects/${id}/close`);
  },

  async suggestProjectKey(name: string): Promise<ApiResponse<{ suggestedKey: string }>> {
    return axiosClient.get('/projects/suggest-key', { params: { name } });
  },

  async checkProjectKey(key: string): Promise<ApiResponse<{ available: boolean; suggestedKey: string }>> {
    return axiosClient.get('/projects/check-key', { params: { key } });
  },
};
