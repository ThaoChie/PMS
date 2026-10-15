import axiosClient from '../api/axiosClient';
import type { ApiResponse, ProjectMember, Role } from '../types';

export const memberService = {
  async getMembers(projectId: string): Promise<ApiResponse<ProjectMember[]>> {
    return axiosClient.get<any, ApiResponse<ProjectMember[]>>(`/projects/${projectId}/members`);
  },

  async updateMemberRole(
    projectId: string,
    userId: string,
    role: Role,
  ): Promise<ApiResponse<ProjectMember>> {
    return axiosClient.put<any, ApiResponse<ProjectMember>>(
      `/projects/${projectId}/members/${userId}/role`,
      { role: role ? (role.toUpperCase() as any) : 'MEMBER' },
    );
  },

  async removeMember(projectId: string, userId: string): Promise<ApiResponse<void>> {
    return axiosClient.delete<any, ApiResponse<void>>(`/projects/${projectId}/members/${userId}`);
  },
};
