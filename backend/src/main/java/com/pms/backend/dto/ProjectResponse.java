package com.pms.backend.dto;

import com.pms.backend.model.Project;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ProjectResponse {
    private Long id;
    private String name;
    private String projectKey;
    private String description;
    private String status;
    private String color = "#1A1A1A";
    private String icon = "folder";
    private int openIssuesCount = 0;
    private int memberCount = 0;
    private List<MemberResponse> members = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Map<String, String> inviteResults;
    private String myRole;
    private Boolean allowMemberDeleteIssue = false;
    private Boolean allowMemberDeleteSubtask = false;
    private Boolean allowMemberConvertSubtask = true;
    private Boolean allowMemberManageCustomFields = false;

    public ProjectResponse() {}

    public static ProjectResponse from(Project project) {
        if (project == null) return null;
        ProjectResponse res = new ProjectResponse();
        res.setId(project.getId());
        res.setName(project.getName());
        res.setProjectKey(project.getProjectKey());
        res.setDescription(project.getDescription());
        res.setStatus(project.getStatus() != null ? project.getStatus().name() : "ACTIVE");
        res.setColor(project.getColor() != null ? project.getColor() : "#1A1A1A");
        res.setIcon(project.getIcon() != null ? project.getIcon() : "folder");
        res.setCreatedAt(project.getCreatedAt());
        res.setUpdatedAt(project.getUpdatedAt());
        res.setAllowMemberDeleteIssue(project.getAllowMemberDeleteIssue() != null ? project.getAllowMemberDeleteIssue() : false);
        res.setAllowMemberDeleteSubtask(project.getAllowMemberDeleteSubtask() != null ? project.getAllowMemberDeleteSubtask() : false);
        res.setAllowMemberConvertSubtask(project.getAllowMemberConvertSubtask() != null ? project.getAllowMemberConvertSubtask() : true);
        res.setAllowMemberManageCustomFields(project.getAllowMemberManageCustomFields() != null ? project.getAllowMemberManageCustomFields() : false);
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
    public String getColor() { return color != null ? color : "#1A1A1A"; }
    public void setColor(String color) { this.color = color; }
    public String getIcon() { return icon != null ? icon : "folder"; }
    public void setIcon(String icon) { this.icon = icon; }
    public int getOpenIssuesCount() { return openIssuesCount; }
    public void setOpenIssuesCount(int openIssuesCount) { this.openIssuesCount = openIssuesCount; }
    public int getMemberCount() { return memberCount; }
    public void setMemberCount(int memberCount) { this.memberCount = memberCount; }
    public List<MemberResponse> getMembers() { return members != null ? members : new ArrayList<>(); }
    public void setMembers(List<MemberResponse> members) { this.members = members != null ? members : new ArrayList<>(); }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Map<String, String> getInviteResults() { return inviteResults; }
    public void setInviteResults(Map<String, String> inviteResults) { this.inviteResults = inviteResults; }
    public String getMyRole() { return myRole; }
    public void setMyRole(String myRole) { this.myRole = myRole; }
    public Boolean getAllowMemberDeleteIssue() { return allowMemberDeleteIssue; }
    public void setAllowMemberDeleteIssue(Boolean allowMemberDeleteIssue) { this.allowMemberDeleteIssue = allowMemberDeleteIssue; }
    public Boolean getAllowMemberDeleteSubtask() { return allowMemberDeleteSubtask; }
    public void setAllowMemberDeleteSubtask(Boolean allowMemberDeleteSubtask) { this.allowMemberDeleteSubtask = allowMemberDeleteSubtask; }
    public Boolean getAllowMemberConvertSubtask() { return allowMemberConvertSubtask; }
    public void setAllowMemberConvertSubtask(Boolean allowMemberConvertSubtask) { this.allowMemberConvertSubtask = allowMemberConvertSubtask; }
    public Boolean getAllowMemberManageCustomFields() { return allowMemberManageCustomFields; }
    public void setAllowMemberManageCustomFields(Boolean allowMemberManageCustomFields) { this.allowMemberManageCustomFields = allowMemberManageCustomFields; }
}
