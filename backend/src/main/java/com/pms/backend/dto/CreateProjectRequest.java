package com.pms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class CreateProjectRequest {

    @NotBlank(message = "Tên dự án không được để trống")
    @Size(max = 100, message = "Tên dự án không được vượt quá 100 ký tự")
    private String name;

    @NotBlank(message = "Mã dự án (key) không được để trống")
    @Pattern(regexp = "^[A-Za-z0-9]{2,10}$", message = "Mã dự án phải gồm 2-10 ký tự chữ và số")
    private String projectKey;

    private String description;

    @Size(max = 30, message = "Mã màu không được vượt quá 30 ký tự")
    private String color;

    @Size(max = 50, message = "Tên icon không được vượt quá 50 ký tự")
    private String icon;

    private List<String> initialEmails = new ArrayList<>();

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getProjectKey() { return projectKey != null ? projectKey.toUpperCase().trim() : null; }
    public void setProjectKey(String projectKey) { this.projectKey = projectKey != null ? projectKey.toUpperCase().trim() : null; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getColor() { return color != null ? color : "#1A1A1A"; }
    public void setColor(String color) { this.color = color; }
    public String getIcon() { return icon != null ? icon : "folder"; }
    public void setIcon(String icon) { this.icon = icon; }
    public List<String> getInitialEmails() { return initialEmails; }
    public void setInitialEmails(List<String> initialEmails) { this.initialEmails = initialEmails != null ? initialEmails : new ArrayList<>(); }
}
