package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.SaveWorkflowRequest;
import com.pms.backend.dto.WorkflowResponse;
import com.pms.backend.service.interfaces.IWorkflowService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/projects/{projectId}/workflow", "/projects/{projectId}/workflow"})
public class WorkflowController {

    private final IWorkflowService workflowService;

    public WorkflowController(IWorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping
    @PreAuthorize("@projectSecurity.isMember(#projectId)")
    public ApiResponse<WorkflowResponse> getWorkflow(@PathVariable Long projectId) {
        return ApiResponse.success(workflowService.getWorkflow(projectId));
    }

    @PutMapping
    @PreAuthorize("@projectSecurity.isPmOrAdmin(#projectId)")
    public ApiResponse<WorkflowResponse> updateWorkflow(
            @PathVariable Long projectId,
            @Valid @RequestBody SaveWorkflowRequest request) {
        return ApiResponse.success(workflowService.updateWorkflow(projectId, request));
    }
}
