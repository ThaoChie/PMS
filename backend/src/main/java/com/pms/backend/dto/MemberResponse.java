package com.pms.backend.dto;

import com.pms.backend.model.ProjectMember;

import java.time.LocalDateTime;

public class MemberResponse {
    private Long id;
    private Long userId;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String role;
    private LocalDateTime joinedAt;

    public MemberResponse() {}

    public static MemberResponse from(ProjectMember pm) {
        if (pm == null) return null;
        MemberResponse res = new MemberResponse();
        res.setId(pm.getId());
        if (pm.getUser() != null) {
            res.setUserId(pm.getUser().getId());
            res.setEmail(pm.getUser().getEmail());
            res.setFullName(pm.getUser().getFullName());
            res.setAvatarUrl(pm.getUser().getAvatarUrl());
        }
        res.setRole(pm.getRole() != null ? pm.getRole().name() : "MEMBER");
        res.setJoinedAt(pm.getCreatedAt());
        return res;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
}
