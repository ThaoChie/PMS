package com.pms.backend.service.interfaces;

import com.pms.backend.dto.CommentResponse;
import com.pms.backend.dto.CreateCommentRequest;
import com.pms.backend.dto.UpdateCommentRequest;
import com.pms.backend.dto.UserResponse;
import com.pms.backend.model.User;

import java.util.List;

public interface ICommentService {
    List<CommentResponse> getComments(String issueKey);
    CommentResponse createComment(String issueKey, CreateCommentRequest request, User currentUser);
    CommentResponse updateComment(String issueKey, Long commentId, UpdateCommentRequest request, User currentUser);
    void deleteComment(String issueKey, Long commentId, User currentUser);
    List<UserResponse> searchProjectUsers(Long projectId, String query, User currentUser);
}
