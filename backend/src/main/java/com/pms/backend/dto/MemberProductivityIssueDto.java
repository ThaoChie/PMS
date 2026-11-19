package com.pms.backend.dto;

import java.time.Instant;
import java.time.LocalDate;

public class MemberProductivityIssueDto {
    private Long id;
    private String key;
    private String summary;
    private String type;
    private String priority;
    private String status;
    private String statusCategory;
    private LocalDate dueDate;
    private boolean overdue;
    private Integer originalEstimateMin;
    private Double estimatedHours;
    private Integer timeSpentMin;
    private Double loggedHours;
    private Double variancePercentage;
    private Instant createdAt;
    private Instant completedAt;
    private Boolean onTime;

    public MemberProductivityIssueDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getStatusCategory() { return statusCategory; }
    public void setStatusCategory(String statusCategory) { this.statusCategory = statusCategory; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public boolean isOverdue() { return overdue; }
    public void setOverdue(boolean overdue) { this.overdue = overdue; }

    public Integer getOriginalEstimateMin() { return originalEstimateMin; }
    public void setOriginalEstimateMin(Integer originalEstimateMin) {
        this.originalEstimateMin = originalEstimateMin;
        this.estimatedHours = originalEstimateMin != null ? Math.round((originalEstimateMin / 60.0) * 100.0) / 100.0 : 0.0;
    }

    public Double getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(Double estimatedHours) { this.estimatedHours = estimatedHours; }

    public Integer getTimeSpentMin() { return timeSpentMin; }
    public void setTimeSpentMin(Integer timeSpentMin) {
        this.timeSpentMin = timeSpentMin;
        this.loggedHours = timeSpentMin != null ? Math.round((timeSpentMin / 60.0) * 100.0) / 100.0 : 0.0;
    }

    public Double getLoggedHours() { return loggedHours; }
    public void setLoggedHours(Double loggedHours) { this.loggedHours = loggedHours; }

    public Double getVariancePercentage() { return variancePercentage; }
    public void setVariancePercentage(Double variancePercentage) { this.variancePercentage = variancePercentage; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Boolean getOnTime() { return onTime; }
    public void setOnTime(Boolean onTime) { this.onTime = onTime; }
}
