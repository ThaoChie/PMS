package com.pms.backend.dto;
import java.util.Map;
public class ReportResponse {
    private Map<String, Integer> issueCountByStatus;
    private Map<String, Integer> issueCountByAssignee;
    // Getters and Setters
    public Map<String, Integer> getIssueCountByStatus() { return issueCountByStatus; }
    public void setIssueCountByStatus(Map<String, Integer> issueCountByStatus) { this.issueCountByStatus = issueCountByStatus; }
    public Map<String, Integer> getIssueCountByAssignee() { return issueCountByAssignee; }
    public void setIssueCountByAssignee(Map<String, Integer> issueCountByAssignee) { this.issueCountByAssignee = issueCountByAssignee; }
}
