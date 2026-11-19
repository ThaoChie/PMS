package com.pms.backend.dto;

import java.time.Instant;
import java.time.LocalDate;

public class MemberProductivityWorklogDto {
    private Long id;
    private Long issueId;
    private String issueKey;
    private String issueSummary;
    private LocalDate workDate;
    private Integer timeSpentMin;
    private Double timeSpentHours;
    private String comment;
    private Instant createdAt;

    public MemberProductivityWorklogDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIssueId() { return issueId; }
    public void setIssueId(Long issueId) { this.issueId = issueId; }

    public String getIssueKey() { return issueKey; }
    public void setIssueKey(String issueKey) { this.issueKey = issueKey; }

    public String getIssueSummary() { return issueSummary; }
    public void setIssueSummary(String issueSummary) { this.issueSummary = issueSummary; }

    public LocalDate getWorkDate() { return workDate; }
    public void setWorkDate(LocalDate workDate) { this.workDate = workDate; }

    public Integer getTimeSpentMin() { return timeSpentMin; }
    public void setTimeSpentMin(Integer timeSpentMin) {
        this.timeSpentMin = timeSpentMin;
        this.timeSpentHours = timeSpentMin != null ? Math.round((timeSpentMin / 60.0) * 100.0) / 100.0 : 0.0;
    }

    public Double getTimeSpentHours() { return timeSpentHours; }
    public void setTimeSpentHours(Double timeSpentHours) { this.timeSpentHours = timeSpentHours; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
