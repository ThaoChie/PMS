package com.pms.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.pms.backend.enu.IssueType;
import com.pms.backend.enu.Priority;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class IssueSearchRequest {
    @JsonAlias({"projectIds"})
    private List<Long> projectIds = new ArrayList<>();
    private Long projectId;

    private String keyword;

    private List<IssueType> types = new ArrayList<>();
    private List<Priority> priorities = new ArrayList<>();

    @JsonAlias({"statuses"})
    private List<String> statuses = new ArrayList<>();
    private List<Long> statusIds = new ArrayList<>();

    private Long assigneeId;
    @JsonAlias({"assignees"})
    private List<Long> assigneeIds = new ArrayList<>();

    private Long reporterId;
    @JsonAlias({"reporters"})
    private List<Long> reporterIds = new ArrayList<>();

    private List<String> labels = new ArrayList<>();

    private LocalDate fromDate;
    private LocalDate toDate;

    private String quick;

    public IssueSearchRequest() {}

    public List<Long> getProjectIds() {
        if (projectIds == null) projectIds = new ArrayList<>();
        if (projectId != null && !projectIds.contains(projectId)) {
            projectIds.add(projectId);
        }
        return projectIds;
    }
    public void setProjectIds(List<Long> projectIds) { this.projectIds = projectIds; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) {
        this.projectId = projectId;
        if (projectId != null) {
            if (projectIds == null) projectIds = new ArrayList<>();
            if (!projectIds.contains(projectId)) projectIds.add(projectId);
        }
    }

    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }

    public List<IssueType> getTypes() { return types; }
    public void setTypes(List<IssueType> types) { this.types = types; }

    public List<Priority> getPriorities() { return priorities; }
    public void setPriorities(List<Priority> priorities) { this.priorities = priorities; }

    public List<String> getStatuses() { return statuses; }
    public void setStatuses(List<String> statuses) { this.statuses = statuses; }

    public List<Long> getStatusIds() { return statusIds; }
    public void setStatusIds(List<Long> statusIds) { this.statusIds = statusIds; }

    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) {
        this.assigneeId = assigneeId;
        if (assigneeId != null) {
            if (assigneeIds == null) assigneeIds = new ArrayList<>();
            if (!assigneeIds.contains(assigneeId)) assigneeIds.add(assigneeId);
        }
    }

    public List<Long> getAssigneeIds() {
        if (assigneeIds == null) assigneeIds = new ArrayList<>();
        if (assigneeId != null && !assigneeIds.contains(assigneeId)) {
            assigneeIds.add(assigneeId);
        }
        return assigneeIds;
    }
    public void setAssigneeIds(List<Long> assigneeIds) { this.assigneeIds = assigneeIds; }

    public Long getReporterId() { return reporterId; }
    public void setReporterId(Long reporterId) {
        this.reporterId = reporterId;
        if (reporterId != null) {
            if (reporterIds == null) reporterIds = new ArrayList<>();
            if (!reporterIds.contains(reporterId)) reporterIds.add(reporterId);
        }
    }

    public List<Long> getReporterIds() {
        if (reporterIds == null) reporterIds = new ArrayList<>();
        if (reporterId != null && !reporterIds.contains(reporterId)) {
            reporterIds.add(reporterId);
        }
        return reporterIds;
    }
    public void setReporterIds(List<Long> reporterIds) { this.reporterIds = reporterIds; }

    public List<String> getLabels() { return labels; }
    public void setLabels(List<String> labels) { this.labels = labels; }

    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }

    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }

    public String getQuick() { return quick; }
    public void setQuick(String quick) { this.quick = quick; }
}
