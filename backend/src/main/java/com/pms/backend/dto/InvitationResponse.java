package com.pms.backend.dto;

import com.pms.backend.model.Invitation;

import java.time.LocalDateTime;

public class InvitationResponse {
    private Long id;
    private Long projectId;
    private String projectName;
    private String projectKey;
    private String email;
    private String role;
    private String status;
    private LocalDateTime expiresAt;
    private String inviterName;

    public InvitationResponse() {}

    public static InvitationResponse from(Invitation invitation) {
        if (invitation == null) return null;
        InvitationResponse res = new InvitationResponse();
        res.setId(invitation.getId());
        if (invitation.getProject() != null) {
            res.setProjectId(invitation.getProject().getId());
            res.setProjectName(invitation.getProject().getName());
            res.setProjectKey(invitation.getProject().getProjectKey());
        }
        res.setEmail(invitation.getEmail());
        res.setRole(invitation.getRole() != null ? invitation.getRole().name() : "MEMBER");
        res.setStatus(invitation.getStatus() != null ? invitation.getStatus().name() : "PENDING");
        res.setExpiresAt(invitation.getExpiresAt());
        if (invitation.getInvitedBy() != null) {
            res.setInviterName(invitation.getInvitedBy().getFullName());
        }
        return res;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getProjectKey() { return projectKey; }
    public void setProjectKey(String projectKey) { this.projectKey = projectKey; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public String getInviterName() { return inviterName; }
    public void setInviterName(String inviterName) { this.inviterName = inviterName; }
}
