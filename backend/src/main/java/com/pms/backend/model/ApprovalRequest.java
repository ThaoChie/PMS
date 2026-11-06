package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;
import com.pms.backend.enu.ApprovalApplyStatus;
import com.pms.backend.enu.ApprovalRequestStatus;
import com.pms.backend.enu.ApprovalRequestType;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "approval_requests")
public class ApprovalRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ApprovalRequestType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApprovalRequestStatus status = ApprovalRequestStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "apply_status", nullable = false, length = 20)
    private ApprovalApplyStatus applyStatus = ApprovalApplyStatus.NOT_APPLIED;

    @Column(name = "apply_error")
    private String applyError;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "payload_json", columnDefinition = "jsonb")
    private String payloadJson;

    @Column(name = "process_instance_key")
    private String processInstanceKey;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @OrderBy("level ASC")
    private List<ApprovalStep> steps = new ArrayList<>();

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public ApprovalRequestType getType() { return type; }
    public void setType(ApprovalRequestType type) { this.type = type; }
    public ApprovalRequestStatus getStatus() { return status; }
    public void setStatus(ApprovalRequestStatus status) { this.status = status; }
    public ApprovalApplyStatus getApplyStatus() { return applyStatus; }
    public void setApplyStatus(ApprovalApplyStatus applyStatus) { this.applyStatus = applyStatus; }
    public String getApplyError() { return applyError; }
    public void setApplyError(String applyError) { this.applyError = applyError; }
    public User getRequester() { return requester; }
    public void setRequester(User requester) { this.requester = requester; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getPayloadJson() { return payloadJson; }
    public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }
    public String getProcessInstanceKey() { return processInstanceKey; }
    public void setProcessInstanceKey(String processInstanceKey) { this.processInstanceKey = processInstanceKey; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public List<ApprovalStep> getSteps() { return steps; }
    public void setSteps(List<ApprovalStep> steps) { this.steps = steps; }
}
