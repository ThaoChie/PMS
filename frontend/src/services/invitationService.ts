import axiosClient from '../api/axiosClient';
import type { ApiResponse, ProjectInvitation, Role } from '../types';

export const invitationService = {
  async getInvitations(projectId: string): Promise<ApiResponse<ProjectInvitation[]>> {
    return axiosClient.get<any, ApiResponse<ProjectInvitation[]>>(`/projects/${projectId}/invitations`);
  },

  async inviteMember(
    projectId: string,
    email: string,
    role: Role,
  ): Promise<ApiResponse<ProjectInvitation>> {
    return axiosClient.post<any, ApiResponse<ProjectInvitation>>(
      `/projects/${projectId}/invitations`,
      { email, role: role ? (role.toUpperCase() as any) : 'MEMBER' },
    );
  },

  async getMyInvitations(): Promise<ApiResponse<ProjectInvitation[]>> {
    return axiosClient.get<any, ApiResponse<ProjectInvitation[]>>('/invitations/mine');
  },

  async acceptInvitation(invitationId: string): Promise<ApiResponse<void>> {
    return axiosClient.post<any, ApiResponse<void>>(`/invitations/${invitationId}/accept`);
  },

  async declineInvitation(invitationId: string): Promise<ApiResponse<void>> {
    return axiosClient.post<any, ApiResponse<void>>(`/invitations/${invitationId}/decline`);
  },
};
