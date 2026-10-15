package com.pms.backend.dto;

import jakarta.validation.constraints.Size;

public class UpdateProjectRequest {

    @Size(max = 100, message = "Tên dự án không được vượt quá 100 ký tự")
    private String name;

    private String description;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
