package com.pms.backend.dto;

import com.pms.backend.model.ProjectCustomField;

import java.time.LocalDateTime;

public class CustomFieldDto {
    private Long id;
    private Long projectId;
    private String name;
    private String fieldKey;
    private String type;
    private Boolean required;
    private String options;
    private String defaultValue;
    private String description;
    private Integer position;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CustomFieldDto() {}

    public static CustomFieldDto from(ProjectCustomField field) {
        if (field == null) return null;
        CustomFieldDto dto = new CustomFieldDto();
        dto.setId(field.getId());
        if (field.getProject() != null) {
            dto.setProjectId(field.getProject().getId());
        }
        dto.setName(field.getName());
        dto.setFieldKey(field.getFieldKey());
        dto.setType(field.getType());
        dto.setRequired(field.getRequired());
        dto.setOptions(field.getOptions());
        dto.setDefaultValue(field.getDefaultValue());
        dto.setDescription(field.getDescription());
        dto.setPosition(field.getPosition());
        dto.setCreatedAt(field.getCreatedAt());
        dto.setUpdatedAt(field.getUpdatedAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getFieldKey() { return fieldKey; }
    public void setFieldKey(String fieldKey) { this.fieldKey = fieldKey; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
