package com.pms.backend.model;

import com.pms.backend.common.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "project_custom_fields", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"project_id", "field_key"})
})
public class ProjectCustomField extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "field_key", nullable = false, length = 50)
    private String fieldKey;

    @Column(nullable = false, length = 30)
    private String type = "TEXT";

    @Column(nullable = false)
    private Boolean required = false;

    @Column(columnDefinition = "TEXT")
    private String options;

    @Column(name = "default_value", columnDefinition = "TEXT")
    private String defaultValue;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    private Integer position = 0;

    public ProjectCustomField() {}

    public ProjectCustomField(Project project, String name, String fieldKey, String type, Boolean required, String options, String defaultValue, String description, Integer position) {
        this.project = project;
        this.name = name;
        this.fieldKey = fieldKey;
        this.type = type != null ? type : "TEXT";
        this.required = required != null ? required : false;
        this.options = options;
        this.defaultValue = defaultValue;
        this.description = description;
        this.position = position != null ? position : 0;
    }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

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
}
