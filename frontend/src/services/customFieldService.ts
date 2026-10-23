import axiosClient from '../api/axiosClient';
import type { ApiResponse, CustomField, CustomFieldType } from '../types';

export interface CreateCustomFieldPayload {
  name: string;
  fieldKey?: string;
  type: CustomFieldType;
  required?: boolean;
  options?: string;
  defaultValue?: string;
  description?: string;
  position?: number;
}

export interface UpdateCustomFieldPayload {
  name: string;
  type?: CustomFieldType;
  required?: boolean;
  options?: string;
  defaultValue?: string;
  description?: string;
  position?: number;
}

export const customFieldService = {
  async getCustomFields(projectId: string | number): Promise<ApiResponse<CustomField[]>> {
    return axiosClient.get(`/projects/${projectId}/custom-fields`);
  },

  async createCustomField(
    projectId: string | number,
    data: CreateCustomFieldPayload,
  ): Promise<ApiResponse<CustomField>> {
    return axiosClient.post(`/projects/${projectId}/custom-fields`, data);
  },

  async updateCustomField(
    projectId: string | number,
    fieldId: number,
    data: UpdateCustomFieldPayload,
  ): Promise<ApiResponse<CustomField>> {
    return axiosClient.put(`/projects/${projectId}/custom-fields/${fieldId}`, data);
  },

  async deleteCustomField(
    projectId: string | number,
    fieldId: number,
  ): Promise<ApiResponse<void>> {
    return axiosClient.delete(`/projects/${projectId}/custom-fields/${fieldId}`);
  },
};
