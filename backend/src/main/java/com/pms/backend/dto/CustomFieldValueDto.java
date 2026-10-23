package com.pms.backend.dto;

public class CustomFieldValueDto {
    private Long fieldId;
    private String fieldKey;
    private String fieldName;
    private String type;
    private Boolean required;
    private String options;
    private String value;

    public CustomFieldValueDto() {}

    public CustomFieldValueDto(Long fieldId, String fieldKey, String fieldName, String type, Boolean required, String options, String value) {
        this.fieldId = fieldId;
        this.fieldKey = fieldKey;
        this.fieldName = fieldName;
        this.type = type;
        this.required = required;
        this.options = options;
        this.value = value;
    }

    public Long getFieldId() { return fieldId; }
    public void setFieldId(Long fieldId) { this.fieldId = fieldId; }

    public String getFieldKey() { return fieldKey; }
    public void setFieldKey(String fieldKey) { this.fieldKey = fieldKey; }

    public String getFieldName() { return fieldName; }
    public void setFieldName(String fieldName) { this.fieldName = fieldName; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Boolean getRequired() { return required; }
    public void setRequired(Boolean required) { this.required = required; }

    public String getOptions() { return options; }
    public void setOptions(String options) { this.options = options; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getName() { return fieldName; }
    public void setName(String name) { this.fieldName = name; }

    public Long getId() { return fieldId; }
    public void setId(Long id) { this.fieldId = id; }
}
