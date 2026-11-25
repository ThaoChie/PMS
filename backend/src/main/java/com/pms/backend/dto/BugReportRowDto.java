package com.pms.backend.dto;

import java.time.LocalDateTime;

/** Một dòng trong danh sách chi tiết của báo cáo lỗi (dùng cho file xuất Excel/CSV). */
public class BugReportRowDto {
    private String issueKey;
    private String summary;
    private String priority;
    private String statusName;
    private boolean resolved;
    private String assigneeName;
    private String reporterName;
    private LocalDateTime createdAt;
    /** Lần đầu chuyển sang trạng thái DONE (null nếu chưa khắc phục). */
    private LocalDateTime resolvedAt;
    /** Số giờ từ lúc tạo đến lúc khắc phục (null nếu chưa khắc phục). */
    private Double closingHours;

    public BugReportRowDto() {}

    public BugReportRowDto(String issueKey, String summary, String priority, String statusName, boolean resolved,
                           String assigneeName, String reporterName, LocalDateTime createdAt,
                           LocalDateTime resolvedAt, Double closingHours) {
        this.issueKey = issueKey;
        this.summary = summary;
        this.priority = priority;
        this.statusName = statusName;
        this.resolved = resolved;
        this.assigneeName = assigneeName;
        this.reporterName = reporterName;
        this.createdAt = createdAt;
        this.resolvedAt = resolvedAt;
        this.closingHours = closingHours;
    }

    public String getIssueKey() { return issueKey; }
    public String getSummary() { return summary; }
    public String getPriority() { return priority; }
    public String getStatusName() { return statusName; }
    public boolean isResolved() { return resolved; }
    public String getAssigneeName() { return assigneeName; }
    public String getReporterName() { return reporterName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public Double getClosingHours() { return closingHours; }
}
