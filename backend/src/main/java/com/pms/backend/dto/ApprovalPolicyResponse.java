package com.pms.backend.dto;

public class ApprovalPolicyResponse {

    private boolean enabled;
    private boolean closeRequiresApproval;
    private boolean workflowChangeRequiresApproval;

    public ApprovalPolicyResponse(boolean enabled, boolean closeRequiresApproval, boolean workflowChangeRequiresApproval) {
        this.enabled = enabled;
        this.closeRequiresApproval = closeRequiresApproval;
        this.workflowChangeRequiresApproval = workflowChangeRequiresApproval;
    }

    public boolean isEnabled() { return enabled; }
    public boolean isCloseRequiresApproval() { return closeRequiresApproval; }
    public boolean isWorkflowChangeRequiresApproval() { return workflowChangeRequiresApproval; }
}
