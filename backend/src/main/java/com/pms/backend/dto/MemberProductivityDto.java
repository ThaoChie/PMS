package com.pms.backend.dto;

import com.pms.backend.enu.WorkloadLevel;

public class MemberProductivityDto {
    private Long userId;
    private String fullName;
    private String email;
    private String avatarUrl;
    private String projectRole;

    private int assignedIssues;
    private int completedIssues;
    private int inProgressIssues;
    private int todoIssues;

    private int onTimeCompletedCount;
    private Double onTimeRate; // 0.0 to 100.0
    private int overdueIssues;

    private Double estimatedHours;
    private Double totalLoggedHours;
    private Double variancePercentage; // ((logged - estimated) / estimated) * 100
    private Double avgResolutionTimeHours;

    private int bugsAssigned;
    private int bugsResolved;
    private int bugsReopened;

    private WorkloadLevel workloadLevel;
    private Double workloadRatio;
    private int velocity;

    public MemberProductivityDto() {}

    public MemberProductivityDto(Long userId, String fullName, String email, String avatarUrl,
                                 int completedIssues, int inProgressIssues,
                                 Double avgResolutionTimeHours, Double totalLoggedHours) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.avatarUrl = avatarUrl;
        this.completedIssues = completedIssues;
        this.inProgressIssues = inProgressIssues;
        this.avgResolutionTimeHours = avgResolutionTimeHours;
        this.totalLoggedHours = totalLoggedHours;
        this.velocity = completedIssues;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getProjectRole() { return projectRole; }
    public void setProjectRole(String projectRole) { this.projectRole = projectRole; }

    public int getAssignedIssues() { return assignedIssues; }
    public void setAssignedIssues(int assignedIssues) { this.assignedIssues = assignedIssues; }

    public int getCompletedIssues() { return completedIssues; }
    public void setCompletedIssues(int completedIssues) {
        this.completedIssues = completedIssues;
        this.velocity = completedIssues;
    }

    public int getInProgressIssues() { return inProgressIssues; }
    public void setInProgressIssues(int inProgressIssues) { this.inProgressIssues = inProgressIssues; }

    public int getTodoIssues() { return todoIssues; }
    public void setTodoIssues(int todoIssues) { this.todoIssues = todoIssues; }

    public int getOnTimeCompletedCount() { return onTimeCompletedCount; }
    public void setOnTimeCompletedCount(int onTimeCompletedCount) { this.onTimeCompletedCount = onTimeCompletedCount; }

    public Double getOnTimeRate() { return onTimeRate; }
    public void setOnTimeRate(Double onTimeRate) { this.onTimeRate = onTimeRate; }

    public int getOverdueIssues() { return overdueIssues; }
    public void setOverdueIssues(int overdueIssues) { this.overdueIssues = overdueIssues; }

    public Double getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(Double estimatedHours) { this.estimatedHours = estimatedHours; }

    public Double getTotalLoggedHours() { return totalLoggedHours; }
    public void setTotalLoggedHours(Double totalLoggedHours) { this.totalLoggedHours = totalLoggedHours; }

    public Double getVariancePercentage() { return variancePercentage; }
    public void setVariancePercentage(Double variancePercentage) { this.variancePercentage = variancePercentage; }

    public Double getAvgResolutionTimeHours() { return avgResolutionTimeHours; }
    public void setAvgResolutionTimeHours(Double avgResolutionTimeHours) { this.avgResolutionTimeHours = avgResolutionTimeHours; }

    public int getBugsAssigned() { return bugsAssigned; }
    public void setBugsAssigned(int bugsAssigned) { this.bugsAssigned = bugsAssigned; }

    public int getBugsResolved() { return bugsResolved; }
    public void setBugsResolved(int bugsResolved) { this.bugsResolved = bugsResolved; }

    public int getBugsReopened() { return bugsReopened; }
    public void setBugsReopened(int bugsReopened) { this.bugsReopened = bugsReopened; }

    public WorkloadLevel getWorkloadLevel() { return workloadLevel; }
    public void setWorkloadLevel(WorkloadLevel workloadLevel) { this.workloadLevel = workloadLevel; }

    public Double getWorkloadRatio() { return workloadRatio; }
    public void setWorkloadRatio(Double workloadRatio) { this.workloadRatio = workloadRatio; }

    public int getVelocity() { return velocity; }
    public void setVelocity(int velocity) { this.velocity = velocity; }
}
