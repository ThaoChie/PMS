package com.pms.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class ConvertToSubtaskRequest {
    @NotBlank(message = "Parent key is required")
    private String parentKey;

    public ConvertToSubtaskRequest() {}

    public ConvertToSubtaskRequest(String parentKey) {
        this.parentKey = parentKey;
    }

    public String getParentKey() { return parentKey; }
    public void setParentKey(String parentKey) { this.parentKey = parentKey; }
}
