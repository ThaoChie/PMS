package com.pms.backend.dto;

import com.pms.backend.enu.IssueType;
import com.pms.backend.enu.Priority;
import java.util.List;

public class IssueSearchRequest {
    private Long projectId;
    private String keyword;
    private List<IssueType> types;
    private List<Priority> priorities;
    private List<Long> assigneeIds;
    private List<Long> statusIds;

    // Getters and Setters
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }
    public List<IssueType> getTypes() { return types; }
    public void setTypes(List<IssueType> types) { this.types = types; }
    public List<Priority> getPriorities() { return priorities; }
    public void setPriorities(List<Priority> priorities) { this.priorities = priorities; }
    public List<Long> getAssigneeIds() { return assigneeIds; }
    public void setAssigneeIds(List<Long> assigneeIds) { this.assigneeIds = assigneeIds; }
    public List<Long> getStatusIds() { return statusIds; }
    public void setStatusIds(List<Long> statusIds) { this.statusIds = statusIds; }
}
