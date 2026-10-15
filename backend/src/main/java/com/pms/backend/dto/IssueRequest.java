package com.pms.backend.dto;

import com.pms.backend.enu.IssueType;
import com.pms.backend.enu.Priority;

public class IssueRequest {
    private String summary;
    private String description;
    private IssueType type;
    private Priority priority;
    private Long projectId;

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public IssueType getType() { return type; }
    public void setType(IssueType type) { this.type = type; }
    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
}
