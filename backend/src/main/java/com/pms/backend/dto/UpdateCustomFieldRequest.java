package com.pms.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateCustomFieldRequest {
    @NotBlank(message = "Tên trường không được để trống")
    private String name;

    private String type = "TEXT";
    private Boolean required = false;
    private String options;
    private String defaultValue;
    private String description;
    private Integer position = 0;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Boolean getRequired() { return required; }
    public void setRequired(Boolean required) { this.required = required; }

    public String getOptions() { return options; }
    public void setOptions(String options) { this.options = options; }

    public String getDefaultValue() { return defaultValue; }
    public void setDefaultValue(String defaultValue) { this.defaultValue = defaultValue; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}
