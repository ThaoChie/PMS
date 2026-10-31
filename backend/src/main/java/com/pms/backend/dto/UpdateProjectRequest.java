package com.pms.backend.dto;

import jakarta.validation.constraints.Size;

public class UpdateProjectRequest {

    @Size(max = 100, message = "Tên dự án không được vượt quá 100 ký tự")
    private String name;

    private String description;

    @Size(max = 30, message = "Mã màu không được vượt quá 30 ký tự")
    private String color;

    @Size(max = 50, message = "Tên icon không được vượt quá 50 ký tự")
    private String icon;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
}
