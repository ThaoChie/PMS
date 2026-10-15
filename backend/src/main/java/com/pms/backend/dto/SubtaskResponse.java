package com.pms.backend.dto;

import com.pms.backend.model.Issue;

public class SubtaskResponse {
    private Long id;
    private String key;
    private String summary;
    private String status;
    private UserResponse assignee;

    public static SubtaskResponse from(Issue subtask) {
        if (subtask == null) return null;
        SubtaskResponse res = new SubtaskResponse();
        res.setId(subtask.getId());
        res.setKey(subtask.getIssueKey());
        res.setSummary(subtask.getSummary());
        res.setStatus(subtask.getStatus() != null ? subtask.getStatus().getName() : "");
        res.setAssignee(UserResponse.from(subtask.getAssignee()));
        return res;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UserResponse getAssignee() { return assignee; }
    public void setAssignee(UserResponse assignee) { this.assignee = assignee; }
}
