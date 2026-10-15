package com.pms.backend.dto;

import com.pms.backend.model.User;

public class UserResponse {
    private Long id;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String systemRole;
    private String authProvider;
    private String status;

    public UserResponse() {}

    public static UserResponse from(User user) {
        if (user == null) return null;
        UserResponse res = new UserResponse();
        res.setId(user.getId());
        res.setEmail(user.getEmail());
        res.setFullName(user.getFullName());
        res.setAvatarUrl(user.getAvatarUrl());
        res.setSystemRole(user.getSystemRole() != null ? user.getSystemRole().name() : "MEMBER");
        res.setAuthProvider(user.getProvider() != null ? user.getProvider().name() : "LOCAL");
        res.setStatus(user.getStatus() != null ? user.getStatus().name() : "ACTIVE");
        return res;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getSystemRole() { return systemRole; }
    public void setSystemRole(String systemRole) { this.systemRole = systemRole; }
    public String getAuthProvider() { return authProvider; }
    public void setAuthProvider(String authProvider) { this.authProvider = authProvider; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
