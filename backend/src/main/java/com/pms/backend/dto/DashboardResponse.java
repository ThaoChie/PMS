package com.pms.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class DashboardResponse {
    private List<IssueResponse> assignedIssues = new ArrayList<>();
    private List<IssueResponse> watchingIssues = new ArrayList<>();
    private List<DashboardActivityDto> recentActivities = new ArrayList<>();
    private List<SavedFilterResponse> savedFilters = new ArrayList<>();

    public DashboardResponse() {}

    public List<IssueResponse> getAssignedIssues() { return assignedIssues; }
    public void setAssignedIssues(List<IssueResponse> assignedIssues) { this.assignedIssues = assignedIssues; }

    public List<IssueResponse> getWatchingIssues() { return watchingIssues; }
    public void setWatchingIssues(List<IssueResponse> watchingIssues) { this.watchingIssues = watchingIssues; }

    public List<DashboardActivityDto> getRecentActivities() { return recentActivities; }
    public void setRecentActivities(List<DashboardActivityDto> recentActivities) { this.recentActivities = recentActivities; }

    public List<SavedFilterResponse> getSavedFilters() { return savedFilters; }
    public void setSavedFilters(List<SavedFilterResponse> savedFilters) { this.savedFilters = savedFilters; }

    public static class DashboardActivityDto {
        private String id;
        private String action;
        private String actor;
        private String issueKey;
        private String issueSummary;
        private String timestamp;

        public DashboardActivityDto() {}

        public DashboardActivityDto(String id, String action, String actor, String issueKey, String issueSummary, String timestamp) {
            this.id = id;
            this.action = action;
            this.actor = actor;
            this.issueKey = issueKey;
            this.issueSummary = issueSummary;
            this.timestamp = timestamp;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }

        public String getActor() { return actor; }
        public void setActor(String actor) { this.actor = actor; }

        public String getIssueKey() { return issueKey; }
        public void setIssueKey(String issueKey) { this.issueKey = issueKey; }

        public String getIssueSummary() { return issueSummary; }
        public void setIssueSummary(String issueSummary) { this.issueSummary = issueSummary; }

        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }
}
