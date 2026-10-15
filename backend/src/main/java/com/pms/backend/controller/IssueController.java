package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.*;
import com.pms.backend.enu.IssueType;
import com.pms.backend.enu.Priority;
import com.pms.backend.model.Issue;
import com.pms.backend.model.User;
import com.pms.backend.service.IssueService;
import com.pms.backend.service.UserService;
import com.pms.backend.service.WorkflowService;
import com.pms.backend.wrapper.PageWrapper;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
public class IssueController {

    private final IssueService issueService;
    private final WorkflowService workflowService;
    private final UserService userService;

    public IssueController(IssueService issueService,
                           WorkflowService workflowService,
                           UserService userService) {
        this.issueService = issueService;
        this.workflowService = workflowService;
        this.userService = userService;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByEmail(auth.getName());
    }

    // --- Project-level endpoints ---

    @PostMapping({"/api/projects/{projectId}/issues", "/projects/{projectId}/issues"})
    @PreAuthorize("@projectSecurity.isMember(#projectId)")
    public ApiResponse<IssueResponse> createIssue(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateIssueRequest request
    ) {
        return ApiResponse.success(issueService.createIssue(projectId, request, getCurrentUser()));
    }

    @GetMapping({"/api/projects/{projectId}/issues", "/projects/{projectId}/issues"})
    @PreAuthorize("@projectSecurity.isMember(#projectId)")
    public ApiResponse<PageWrapper<IssueResponse>> getProjectIssues(
            @PathVariable Long projectId,
            @RequestParam(required = false) IssueType type,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) Long statusId,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "updatedAt,desc") String sort
    ) {
        String[] sortParts = sort.split(",");
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortProp = sortParts[0];

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortProp));
        Page<IssueResponse> resultPage = issueService.getProjectIssues(projectId, type, priority, statusId, assigneeId, pageable);
        return ApiResponse.success(PageWrapper.from(resultPage));
    }

    // --- Issue-level endpoints ---

    @GetMapping({"/api/issues/{issueKey}", "/issues/{issueKey}"})
    @PreAuthorize("@issueSecurity.canView(#issueKey)")
    public ApiResponse<IssueResponse> getIssueDetail(@PathVariable String issueKey) {
        return ApiResponse.success(issueService.getIssueDetail(issueKey, getCurrentUser()));
    }

    @PutMapping({"/api/issues/{issueKey}", "/issues/{issueKey}"})
    @PreAuthorize("@issueSecurity.canEdit(#issueKey)")
    public ApiResponse<IssueResponse> updateIssue(
            @PathVariable String issueKey,
            @RequestBody UpdateIssueRequest request
    ) {
        return ApiResponse.success(issueService.updateIssue(issueKey, request, getCurrentUser()));
    }

    @DeleteMapping({"/api/issues/{issueKey}", "/issues/{issueKey}"})
    @PreAuthorize("@issueSecurity.canDelete(#issueKey)")
    public ApiResponse<Void> deleteIssue(@PathVariable String issueKey) {
        issueService.deleteIssue(issueKey, getCurrentUser());
        return ApiResponse.success(null);
    }

    @PutMapping({"/api/issues/{issueKey}/assignee", "/issues/{issueKey}/assignee"})
    @PreAuthorize("@issueSecurity.canAssign(#issueKey)")
    public ApiResponse<Void> assignIssue(
            @PathVariable String issueKey,
            @RequestBody AssignIssueRequest request
    ) {
        issueService.assignIssue(issueKey, request.getAssigneeId(), getCurrentUser());
        return ApiResponse.success(null);
    }

    @PostMapping({"/api/issues/{issueKey}/links", "/issues/{issueKey}/links"})
    @PreAuthorize("@issueSecurity.canEdit(#issueKey)")
    public ApiResponse<Void> linkIssue(
            @PathVariable String issueKey,
            @Valid @RequestBody LinkIssueRequest request
    ) {
        issueService.linkIssue(issueKey, request.getTargetKey(), request.getRelation(), getCurrentUser());
        return ApiResponse.success(null);
    }

    @DeleteMapping({"/api/issues/{issueKey}/links/{linkId}", "/issues/{issueKey}/links/{linkId}"})
    @PreAuthorize("@issueSecurity.canEdit(#issueKey)")
    public ApiResponse<Void> removeLink(
            @PathVariable String issueKey,
            @PathVariable Long linkId
    ) {
        issueService.removeLink(issueKey, linkId, getCurrentUser());
        return ApiResponse.success(null);
    }

    @PutMapping({"/api/issues/{issueKey}/epic", "/issues/{issueKey}/epic"})
    @PreAuthorize("@issueSecurity.canEdit(#issueKey)")
    public ApiResponse<Void> setEpic(
            @PathVariable String issueKey,
            @RequestBody SetEpicRequest request
    ) {
        issueService.setEpic(issueKey, request.getEpicKey(), getCurrentUser());
        return ApiResponse.success(null);
    }

    @PostMapping({"/api/issues/{issueKey}/subtasks", "/issues/{issueKey}/subtasks"})
    @PreAuthorize("@issueSecurity.canEdit(#issueKey)")
    public ApiResponse<SubtaskResponse> createSubtask(
            @PathVariable String issueKey,
            @RequestBody CreateIssueRequest request
    ) {
        return ApiResponse.success(issueService.createSubtask(issueKey, request.getSummary(), request.getAssigneeId(), getCurrentUser()));
    }

    @PostMapping({"/api/issues/{issueKey}/attachments", "/issues/{issueKey}/attachments"})
    @PreAuthorize("@issueSecurity.canEdit(#issueKey)")
    public ApiResponse<AttachmentResponse> uploadAttachment(
            @PathVariable String issueKey,
            @RequestParam("file") MultipartFile file
    ) {
        return ApiResponse.success(issueService.uploadAttachment(issueKey, file, getCurrentUser()));
    }

    @DeleteMapping({"/api/issues/{issueKey}/attachments/{attachmentId}", "/issues/{issueKey}/attachments/{attachmentId}"})
    @PreAuthorize("@issueSecurity.canEdit(#issueKey)")
    public ApiResponse<Void> deleteAttachment(
            @PathVariable String issueKey,
            @PathVariable Long attachmentId
    ) {
        issueService.deleteAttachment(issueKey, attachmentId, getCurrentUser());
        return ApiResponse.success(null);
    }

    @GetMapping({"/api/issues/{issueKey}/history", "/issues/{issueKey}/history"})
    @PreAuthorize("@issueSecurity.canView(#issueKey)")
    public ApiResponse<List<IssueStatusHistoryResponse>> getIssueHistory(@PathVariable String issueKey) {
        return ApiResponse.success(issueService.getIssueHistory(issueKey));
    }

    @GetMapping({"/api/issues/{issueKey}/transitions", "/issues/{issueKey}/transitions"})
    @PreAuthorize("@issueSecurity.canView(#issueKey)")
    public ApiResponse<List<TransitionOptionResponse>> getAvailableTransitions(@PathVariable String issueKey) {
        return ApiResponse.success(workflowService.getTransitionsForIssue(issueKey, getCurrentUser()));
    }

    @PostMapping({"/api/issues/{issueKey}/transitions", "/issues/{issueKey}/transitions"})
    @PreAuthorize("@issueSecurity.canView(#issueKey)")
    public ApiResponse<IssueResponse> executeTransition(
            @PathVariable String issueKey,
            @Valid @RequestBody TransitionRequest request
    ) {
        Issue updated = workflowService.executeTransition(
                issueKey, request.getTransitionId(), request.getFields(), request.getComment(), getCurrentUser());
        return ApiResponse.success(IssueResponse.from(updated));
    }

    @PostMapping({"/api/issues/{issueKey}/approve", "/issues/{issueKey}/approve"})
    @PreAuthorize("@issueSecurity.canApprove(#issueKey)")
    public ApiResponse<IssueResponse> approveIssue(
            @PathVariable String issueKey,
            @RequestBody(required = false) TransitionRequest request
    ) {
        String comment = request != null ? request.getComment() : null;
        Issue updated = workflowService.approveIssue(issueKey, comment, getCurrentUser());
        return ApiResponse.success(IssueResponse.from(updated));
    }

    @PostMapping({"/api/issues/{issueKey}/reject", "/issues/{issueKey}/reject"})
    @PreAuthorize("@issueSecurity.canApprove(#issueKey)")
    public ApiResponse<IssueResponse> rejectIssue(
            @PathVariable String issueKey,
            @Valid @RequestBody RejectIssueRequest request
    ) {
        Issue updated = workflowService.rejectIssue(issueKey, request.getReason(), getCurrentUser());
        return ApiResponse.success(IssueResponse.from(updated));
    }
}
