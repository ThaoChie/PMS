package com.pms.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ApprovalRequestResponse {

    private Long id;
    private String type;
    private String status;
    private String applyStatus;
    private ProjectSummary project;
    private UserSummary requester;
    private String reason;
    private Object payload;
    private List<ApprovalStepResponse> steps;
    private Integer currentLevel;
    private boolean canIDecide;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    public static class ProjectSummary {
        private Long id;
        private String key;
        private String name;

        public ProjectSummary(Long id, String key, String name) {
            this.id = id; this.key = key; this.name = name;
        }

        public Long getId() { return id; }
        public String getKey() { return key; }
        public String getName() { return name; }
    }

    public static class UserSummary {
        private Long id;
        private String fullName;
        private String email;
        private String avatarUrl;

        public UserSummary(Long id, String fullName, String email, String avatarUrl) {
            this.id = id; this.fullName = fullName; this.email = email; this.avatarUrl = avatarUrl;
        }

        public Long getId() { return id; }
        public String getFullName() { return fullName; }
        public String getEmail() { return email; }
        public String getAvatarUrl() { return avatarUrl; }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getApplyStatus() { return applyStatus; }
    public void setApplyStatus(String applyStatus) { this.applyStatus = applyStatus; }
    public ProjectSummary getProject() { return project; }
    public void setProject(ProjectSummary project) { this.project = project; }
    public UserSummary getRequester() { return requester; }
    public void setRequester(UserSummary requester) { this.requester = requester; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }
    public List<ApprovalStepResponse> getSteps() { return steps; }
    public void setSteps(List<ApprovalStepResponse> steps) { this.steps = steps; }
    public Integer getCurrentLevel() { return currentLevel; }
    public void setCurrentLevel(Integer currentLevel) { this.currentLevel = currentLevel; }
    public boolean isCanIDecide() { return canIDecide; }
    public void setCanIDecide(boolean canIDecide) { this.canIDecide = canIDecide; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
