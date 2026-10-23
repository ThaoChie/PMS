package com.pms.backend.service.interfaces;

import com.pms.backend.dto.*;
import com.pms.backend.enu.IssueType;
import com.pms.backend.enu.Priority;
import com.pms.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IIssueService {
    IssueResponse createIssue(Long projectId, CreateIssueRequest request, User currentUser);
    Page<IssueResponse> getProjectIssues(Long projectId, IssueType type, Priority priority, Long statusId, Long assigneeId, Pageable pageable);
    IssueResponse getIssueDetail(String issueKey, User currentUser);
    IssueResponse updateIssue(String issueKey, UpdateIssueRequest request, User currentUser);
    void deleteIssue(String issueKey, User currentUser);
    void assignIssue(String issueKey, Long assigneeId, User currentUser);
    void linkIssue(String issueKey, String targetKey, String relation, User currentUser);
    void removeLink(String issueKey, Long linkId, User currentUser);
    void setEpic(String issueKey, String epicKey, User currentUser);
    SubtaskResponse createSubtask(String issueKey, String summary, Long assigneeId, User currentUser);
    AttachmentResponse uploadAttachment(String issueKey, MultipartFile file, User currentUser);
    void deleteAttachment(String issueKey, Long attachmentId, User currentUser);
    List<IssueStatusHistoryResponse> getIssueHistory(String issueKey);
    void convertToSubtask(String issueKey, String parentKey, User currentUser);
    ShareIssueResponse shareIssue(String issueKey, ShareIssueRequest request, User currentUser);
}
