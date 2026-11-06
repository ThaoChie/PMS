package com.pms.backend.controller;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.dto.ApprovalPolicyResponse;
import com.pms.backend.config.ApprovalProperties;
import com.pms.backend.config.CamundaProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/approval-requests")
public class ApprovalPolicyController {

    private final CamundaProperties camundaProperties;
    private final ApprovalProperties approvalProperties;

    public ApprovalPolicyController(CamundaProperties camundaProperties, ApprovalProperties approvalProperties) {
        this.camundaProperties = camundaProperties;
        this.approvalProperties = approvalProperties;
    }

    @GetMapping("/policy")
    public ApiResponse<ApprovalPolicyResponse> getPolicy() {
        boolean enabled = camundaProperties.isEnabled();
        return ApiResponse.success(new ApprovalPolicyResponse(
                enabled,
                enabled && approvalProperties.isProjectCloseEnabled(),
                enabled && approvalProperties.isWorkflowChangeEnabled()
        ));
    }
}
