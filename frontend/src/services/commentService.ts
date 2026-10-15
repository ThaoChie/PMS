import axiosClient from '../api/axiosClient';
import type { ApiResponse, Comment } from '../types';

export const commentService = {
  async getComments(issueKey: string): Promise<ApiResponse<Comment[]>> {
    return axiosClient.get(`/issues/${issueKey}/comments`);
  },

  async createComment(
    issueKey: string,
    content: string,
    mentionedUserIds?: string[],
  ): Promise<ApiResponse<Comment>> {
    return axiosClient.post(`/issues/${issueKey}/comments`, { content, mentionedUserIds });
  },

  async updateComment(
    issueKey: string,
    commentId: string,
    content: string,
  ): Promise<ApiResponse<Comment>> {
    return axiosClient.put(`/issues/${issueKey}/comments/${commentId}`, { content });
  },

  async deleteComment(issueKey: string, commentId: string): Promise<ApiResponse<void>> {
    return axiosClient.delete(`/issues/${issueKey}/comments/${commentId}`);
  },
};
