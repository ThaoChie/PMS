package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;
import com.pms.backend.enu.ApprovalApproverRole;
import com.pms.backend.enu.ApprovalStepStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "approval_steps")
public class ApprovalStep extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private ApprovalRequest request;

    @Column(nullable = false)
    private Integer level;

    @Enumerated(EnumType.STRING)
    @Column(name = "approver_role", nullable = false, length = 10)
    private ApprovalApproverRole approverRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApprovalStepStatus status = ApprovalStepStatus.WAITING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by")
    private User decidedBy;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "reminder_count", nullable = false)
    private Integer reminderCount = 0;

    public ApprovalRequest getRequest() { return request; }
    public void setRequest(ApprovalRequest request) { this.request = request; }
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    public ApprovalApproverRole getApproverRole() { return approverRole; }
    public void setApproverRole(ApprovalApproverRole approverRole) { this.approverRole = approverRole; }
    public ApprovalStepStatus getStatus() { return status; }
    public void setStatus(ApprovalStepStatus status) { this.status = status; }
    public User getDecidedBy() { return decidedBy; }
    public void setDecidedBy(User decidedBy) { this.decidedBy = decidedBy; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public LocalDateTime getDecidedAt() { return decidedAt; }
    public void setDecidedAt(LocalDateTime decidedAt) { this.decidedAt = decidedAt; }
    public Integer getReminderCount() { return reminderCount; }
    public void setReminderCount(Integer reminderCount) { this.reminderCount = reminderCount; }
}
