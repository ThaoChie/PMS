package com.pms.backend.dto;

import java.time.LocalDateTime;

public class ApprovalStepResponse {

    private Integer level;
    private String approverRole;
    private String status;
    private ApprovalRequestResponse.UserSummary decidedBy;
    private String comment;
    private LocalDateTime decidedAt;

    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    public String getApproverRole() { return approverRole; }
    public void setApproverRole(String approverRole) { this.approverRole = approverRole; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public ApprovalRequestResponse.UserSummary getDecidedBy() { return decidedBy; }
    public void setDecidedBy(ApprovalRequestResponse.UserSummary decidedBy) { this.decidedBy = decidedBy; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public LocalDateTime getDecidedAt() { return decidedAt; }
    public void setDecidedAt(LocalDateTime decidedAt) { this.decidedAt = decidedAt; }
}
