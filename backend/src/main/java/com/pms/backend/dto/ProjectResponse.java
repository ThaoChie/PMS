package com.pms.backend.dto;

import com.pms.backend.model.Project;

import java.time.LocalDateTime;
import java.util.Map;

public class ProjectResponse {
    private Long id;
    private String name;
    private String projectKey;
    private String description;
    private String status;
    private int openIssuesCount = 0;
    private int memberCount = 0;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Map<String, String> inviteResults;

    public ProjectResponse() {}

    public static ProjectResponse from(Project project) {
        if (project == null) return null;
        ProjectResponse res = new ProjectResponse();
        res.setId(project.getId());
        res.setName(project.getName());
        res.setProjectKey(project.getProjectKey());
        res.setDescription(project.getDescription());
        res.setStatus(project.getStatus() != null ? project.getStatus().name() : "ACTIVE");
        res.setCreatedAt(project.getCreatedAt());
        res.setUpdatedAt(project.getUpdatedAt());
        return res;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getProjectKey() { return projectKey; }
    public void setProjectKey(String projectKey) { this.projectKey = projectKey; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getOpenIssuesCount() { return openIssuesCount; }
    public void setOpenIssuesCount(int openIssuesCount) { this.openIssuesCount = openIssuesCount; }
    public int getMemberCount() { return memberCount; }
    public void setMemberCount(int memberCount) { this.memberCount = memberCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Map<String, String> getInviteResults() { return inviteResults; }
    public void setInviteResults(Map<String, String> inviteResults) { this.inviteResults = inviteResults; }
}
