package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.ApprovalDecisionRequest;
import com.pms.backend.dto.ApprovalRequestResponse;
import com.pms.backend.dto.CreateApprovalRequestRequest;
import com.pms.backend.service.interfaces.IApprovalRequestService;
import com.pms.backend.wrapper.PageWrapper;
import jakarta.validation.Valid;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@ConditionalOnProperty(name = "camunda.enabled", havingValue = "true")
public class ApprovalRequestController {

    private final IApprovalRequestService approvalService;

    public ApprovalRequestController(IApprovalRequestService approvalService) {
        this.approvalService = approvalService;
    }

    @PostMapping("/api/projects/{projectId}/approval-requests")
    public ApiResponse<ApprovalRequestResponse> create(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateApprovalRequestRequest request) {
        return ApiResponse.success(approvalService.create(projectId, request));
    }

    @GetMapping("/api/projects/{projectId}/approval-requests")
    public ApiResponse<PageWrapper<ApprovalRequestResponse>> listByProject(
            @PathVariable Long projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(approvalService.findByProject(projectId, status, type, page, size));
    }

    @GetMapping("/api/approval-requests/pending-for-me")
    public ApiResponse<List<ApprovalRequestResponse>> pendingForMe() {
        return ApiResponse.success(approvalService.findPendingForMe());
    }

    @GetMapping("/api/approval-requests/{id}")
    public ApiResponse<ApprovalRequestResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(approvalService.getById(id));
    }

    @PutMapping("/api/approval-requests/{id}/approve")
    public ApiResponse<ApprovalRequestResponse> approve(
            @PathVariable Long id,
            @RequestBody(required = false) ApprovalDecisionRequest decision) {
        if (decision == null) decision = new ApprovalDecisionRequest();
        return ApiResponse.success(approvalService.approve(id, decision));
    }

    @PutMapping("/api/approval-requests/{id}/reject")
    public ApiResponse<ApprovalRequestResponse> reject(
            @PathVariable Long id,
            @RequestBody ApprovalDecisionRequest decision) {
        return ApiResponse.success(approvalService.reject(id, decision));
    }

    @PutMapping("/api/approval-requests/{id}/cancel")
    public ApiResponse<ApprovalRequestResponse> cancel(@PathVariable Long id) {
        return ApiResponse.success(approvalService.cancel(id));
    }
}
