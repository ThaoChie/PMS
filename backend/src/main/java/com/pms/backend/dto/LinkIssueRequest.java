package com.pms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class LinkIssueRequest {

    @NotBlank(message = "Target issue key is required")
    private String targetKey;

    @NotNull(message = "Relation is required")
    private String relation;

    public String getTargetKey() { return targetKey; }
    public void setTargetKey(String targetKey) { this.targetKey = targetKey; }

    public String getRelation() { return relation; }
    public void setRelation(String relation) { this.relation = relation; }
}
