package com.pms.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public class UpdateProfileRequest {

    @JsonAlias({"name"})
    private String fullName;

    private String name;

    @JsonAlias({"phone"})
    private String phoneNumber;

    private String avatarUrl;

    public String getFullName() {
        if (fullName != null && !fullName.isBlank()) {
            return fullName;
        }
        return name;
    }

    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
