package com.pms.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public class RegisterRequest {
    private String email;
    private String password;

    @JsonAlias({"name"})
    private String fullName;

    private String name;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() {
        if (fullName != null && !fullName.isBlank()) {
            return fullName;
        }
        return name;
    }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
