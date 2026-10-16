package com.pms.backend.dto;

public class MemberProductivityDto {
    private Long userId;
    private String fullName;
    private String email;
    private String avatarUrl;
    private int completedIssues;
    private int inProgressIssues;
    private Double avgResolutionTimeHours;
    private Double totalLoggedHours;
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

    public int getCompletedIssues() { return completedIssues; }
    public void setCompletedIssues(int completedIssues) { this.completedIssues = completedIssues; this.velocity = completedIssues; }

    public int getInProgressIssues() { return inProgressIssues; }
    public void setInProgressIssues(int inProgressIssues) { this.inProgressIssues = inProgressIssues; }

    public Double getAvgResolutionTimeHours() { return avgResolutionTimeHours; }
    public void setAvgResolutionTimeHours(Double avgResolutionTimeHours) { this.avgResolutionTimeHours = avgResolutionTimeHours; }

    public Double getTotalLoggedHours() { return totalLoggedHours; }
    public void setTotalLoggedHours(Double totalLoggedHours) { this.totalLoggedHours = totalLoggedHours; }

    public int getVelocity() { return velocity; }
    public void setVelocity(int velocity) { this.velocity = velocity; }
}
